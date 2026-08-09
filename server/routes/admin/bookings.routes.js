import { Router } from 'express';
import { query } from '../../config/db.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { ok, ErrorCodes } from '../../utils/response.js';
import { requireFields } from '../../utils/validate.js';

const router = Router();

// GET /admin/bookings — README/4-APIDesign.md §5.1
router.get(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status, room_id, start_date, end_date } = req.query;
    const conditions = ['1 = 1'];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`b.status = $${params.length}`);
    }
    if (room_id) {
      params.push(room_id);
      conditions.push(`b.room_id = $${params.length}`);
    }
    if (start_date) {
      params.push(start_date);
      conditions.push(`b.booking_date >= $${params.length}`);
    }
    if (end_date) {
      params.push(end_date);
      conditions.push(`b.booking_date <= $${params.length}`);
    }

    const { rows } = await query(
      `SELECT b.id AS booking_id, b.room_id, b.booking_date, b.start_time, b.end_time, b.total_amount, b.status,
              u.id AS user_id, u.name AS user_name, u.email AS user_email
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.booking_date DESC, b.start_time DESC
       LIMIT 200`,
      params
    );

    ok(res, {
      bookings: rows.map((r) => ({
        booking_id: r.booking_id,
        user: { id: r.user_id, name: r.user_name, email: r.user_email },
        room_id: r.room_id,
        booking_date: r.booking_date,
        start_time: r.start_time,
        end_time: r.end_time,
        total_amount: Number(r.total_amount),
        status: r.status,
      })),
    });
  })
);

// POST /admin/bookings/{booking_id}/late-checkout — README/4-APIDesign.md §5.3
router.post(
  '/:booking_id/late-checkout',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { booking_id } = req.params;
    const { actual_checkout_time, notes } = req.body;
    requireFields(req.body, ['actual_checkout_time']);

    const { rows: bookingRows } = await query(
      `SELECT b.id, b.booking_date, b.end_time, b.total_amount, b.start_time, r.price_per_hour
       FROM bookings b JOIN rooms r ON r.id = b.room_id
       WHERE b.id = $1`,
      [booking_id]
    );
    const booking = bookingRows[0];
    if (!booking) throw ErrorCodes.NOT_FOUND('Booking tidak ditemukan.');

    const scheduledEnd = new Date(`${booking.booking_date}T${booking.end_time}Z`);
    const actualCheckout = new Date(actual_checkout_time);
    const overtimeMinutes = Math.round((actualCheckout - scheduledEnd) / 60000);

    if (overtimeMinutes <= 10) {
      throw ErrorCodes.VALIDATION_ERROR('Keterlambatan masih dalam toleransi 10 menit, tidak perlu denda.', {
        actual_checkout_time: ['Harus lebih dari 10 menit setelah jadwal selesai.'],
      });
    }

    const penaltyAmount = Math.round(Number(booking.price_per_hour) * 1.5 * (overtimeMinutes / 60));

    const { rows } = await query(
      `INSERT INTO late_checkout_logs (booking_id, operator_id, actual_checkout_time, overtime_minutes, penalty_amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [booking_id, req.user.sub, actualCheckout.toISOString(), overtimeMinutes, penaltyAmount, notes || null]
    );

    ok(res, {
      penalty_id: rows[0].id,
      booking_id,
      overtime_minutes: overtimeMinutes,
      penalty_amount: penaltyAmount,
      notes: notes || null,
    });
  })
);

export default router;

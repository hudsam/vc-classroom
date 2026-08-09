import { Router } from 'express';
import { query } from '../config/db.js';
import { redis, slotLockKey, SLOT_LOCK_TTL_SECONDS } from '../config/redis.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, ErrorCodes } from '../utils/response.js';
import { requireFields } from '../utils/validate.js';

const router = Router();

const VALID_ADD_ONS = new Set(['ai_transcription', 'live_streaming']); // README/4-APIDesign.md §7

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function generateBookingId(bookingDate) {
  const compact = bookingDate.replace(/-/g, '');
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `bkg-${compact}-${suffix}`;
}

// POST /bookings/hold — README/4-APIDesign.md §3.1
// Kunci slot 15 menit via Redis SETNX (README/3-DBSchema.md §7.1) sebelum menyimpan pending booking.
router.post(
  '/hold',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { room_id, booking_date, start_time, end_time, add_ons = [] } = req.body;
    requireFields(req.body, ['room_id', 'booking_date', 'start_time', 'end_time']);

    const durationMinutes = toMinutes(end_time) - toMinutes(start_time);
    if (durationMinutes < 60 || durationMinutes % 30 !== 0) {
      throw ErrorCodes.VALIDATION_ERROR('Durasi booking tidak valid.', {
        end_time: ['Durasi minimum 60 menit dan kelipatan 30 menit.'],
      });
    }
    const invalidAddOns = add_ons.filter((a) => !VALID_ADD_ONS.has(a));
    if (invalidAddOns.length > 0) {
      throw ErrorCodes.VALIDATION_ERROR('Add-on tidak dikenali.', { add_ons: invalidAddOns });
    }

    const { rows: roomRows } = await query(
      "SELECT id, price_per_hour FROM rooms WHERE id = $1 AND status = 'AVAILABLE'",
      [room_id]
    );
    const room = roomRows[0];
    if (!room) throw ErrorCodes.NOT_FOUND('Ruangan tidak ditemukan atau sedang tidak tersedia.');

    const lockKey = slotLockKey(room_id, booking_date, start_time, end_time);
    const lockAcquired = await redis.set(lockKey, req.user.sub, 'EX', SLOT_LOCK_TTL_SECONDS, 'NX');
    if (lockAcquired !== 'OK') {
      throw ErrorCodes.SLOT_ALREADY_LOCKED();
    }

    try {
      const addOnsAmount = add_ons.includes('ai_transcription') ? 50000 : 0; // ⚠️ Asumsi harga add-on, belum ada di PD §8
      const originalAmount = (Number(room.price_per_hour) * durationMinutes) / 60;
      const totalAmount = originalAmount + addOnsAmount;
      const bookingId = generateBookingId(booking_date);
      const lockExpiresAt = new Date(Date.now() + SLOT_LOCK_TTL_SECONDS * 1000).toISOString();

      await query(
        `INSERT INTO bookings (id, user_id, room_id, booking_date, start_time, end_time, status,
                                payment_type, original_amount, add_ons_amount, total_amount, is_ai_transcription_addon)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_PAYMENT', 'PAY_PER_USE', $7, $8, $9, $10)`,
        [
          bookingId,
          req.user.sub,
          room_id,
          booking_date,
          start_time,
          end_time,
          originalAmount,
          addOnsAmount,
          totalAmount,
          add_ons.includes('ai_transcription'),
        ]
      );

      ok(
        res,
        {
          booking_id: bookingId,
          slot_lock_expires_at: lockExpiresAt,
          total_amount: totalAmount,
          currency: 'IDR',
          status: 'PENDING_PAYMENT',
        },
        201
      );
    } catch (err) {
      await redis.del(lockKey);
      throw err;
    }
  })
);

export default router;

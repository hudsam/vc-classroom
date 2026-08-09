import { Router } from 'express';
import { query } from '../../config/db.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { ok } from '../../utils/response.js';

const router = Router();

// GET /admin/dashboard/metrics — README/4-APIBackend.md §4.2 (baru)
router.get(
  '/metrics',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const OPERATIONAL_MINUTES_PER_DAY = 15 * 60; // 07:00 - 22:00, README/4-APIDesign.md §7

    const [{ rows: roomRows }, { rows: bookedRows }, { rows: bookingCountRows }, { rows: hwRows }, { rows: lateRows }] =
      await Promise.all([
        query("SELECT COUNT(*)::INT AS total FROM rooms WHERE status = 'AVAILABLE'"),
        query(
          `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 60), 0) AS minutes
           FROM bookings
           WHERE booking_date = CURRENT_DATE AND status IN ('CONFIRMED', 'IN_ROOM', 'COMPLETED')`
        ),
        query(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'IN_ROOM') AS running,
             COUNT(*) FILTER (WHERE status = 'CONFIRMED') AS upcoming
           FROM bookings WHERE booking_date = CURRENT_DATE`
        ),
        query("SELECT COUNT(*)::INT AS total FROM iot_device_status WHERE status = 'OFFLINE'"),
        // ⚠️ Asumsi (README/4-APIBackend.md §4.2): tidak ada mekanisme flag "pending" resmi karena deteksi
        // keterlambatan checkout sengaja manual (FRD §7.3, P0-3). Proxy di bawah: booking IN_ROOM yang jam
        // selesainya sudah lewat tapi belum ada catatan di late_checkout_logs.
        query(
          `SELECT COUNT(*)::INT AS total FROM bookings b
           WHERE b.status = 'IN_ROOM'
             AND (b.booking_date + b.end_time) < NOW()
             AND NOT EXISTS (SELECT 1 FROM late_checkout_logs l WHERE l.booking_id = b.id)`
        ),
      ]);

    const totalAvailableMinutes = roomRows[0].total * OPERATIONAL_MINUTES_PER_DAY;
    const utilizationRate =
      totalAvailableMinutes > 0 ? Math.round((Number(bookedRows[0].minutes) / totalAvailableMinutes) * 1000) / 10 : 0;

    ok(res, {
      utilization_rate_percent: utilizationRate,
      bookings_today: {
        running: Number(bookingCountRows[0].running),
        upcoming: Number(bookingCountRows[0].upcoming),
      },
      hardware_incidents_count: hwRows[0].total,
      late_checkout_pending_count: lateRows[0].total,
    });
  })
);

// GET /admin/alerts — README/4-APIBackend.md §4.2 (baru)
router.get(
  '/alerts',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [{ rows: hwAlerts }, { rows: securityAlerts }] = await Promise.all([
      query(
        `SELECT ids.room_id, r.name AS room_name, ids.device_type, ids.updated_at
         FROM iot_device_status ids
         JOIN rooms r ON r.id = ids.room_id
         WHERE ids.status = 'OFFLINE'
         ORDER BY ids.updated_at DESC`
      ),
      // Ambang batas ">3x dalam 10 menit" persis sesuai README/4-APIDesign.md §8 (TOKEN_EXPIRED_OR_INVALID).
      query(
        `SELECT daa.room_id, r.name AS room_name, COUNT(*)::INT AS fail_count, MAX(daa.attempted_at) AS last_attempt
         FROM door_access_attempts daa
         JOIN rooms r ON r.id = daa.room_id
         WHERE daa.result = 'TOKEN_EXPIRED_OR_INVALID' AND daa.attempted_at > NOW() - INTERVAL '10 minutes'
         GROUP BY daa.room_id, r.name
         HAVING COUNT(*) > 3
         ORDER BY MAX(daa.attempted_at) DESC`
      ),
    ]);

    const alerts = [
      ...hwAlerts.map((a) => ({
        id: `IOT-${a.room_id}-${a.device_type}`,
        code: 'IOT_GATEWAY_OFFLINE',
        severity: 'CRITICAL',
        room_id: a.room_id,
        room_name: a.room_name,
        message: `Gateway ${a.device_type} di ${a.room_name} terputus.`,
        detected_at: a.updated_at,
        suggested_actions: ['DIAGNOSE_HARDWARE', 'MANUAL_UNLOCK'],
      })),
      ...securityAlerts.map((a) => ({
        id: `SEC-${a.room_id}`,
        code: 'TOKEN_EXPIRED_OR_INVALID',
        severity: 'WARNING',
        room_id: a.room_id,
        room_name: a.room_name,
        message: `Percobaan akses PIN/QR gagal ${a.fail_count}x pada ruangan ini dalam 10 menit terakhir.`,
        detected_at: a.last_attempt,
        suggested_actions: ['VIEW_AUDIT_LOGS'],
      })),
    ].sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));

    ok(res, { alerts });
  })
);

export default router;

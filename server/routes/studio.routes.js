import { Router } from 'express';
import { query } from '../config/db.js';
import { redis, inRoomSessionKey, iotHeartbeatKey } from '../config/redis.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, ErrorCodes } from '../utils/response.js';
import { requireFields } from '../utils/validate.js';

const router = Router();

const DEVICE_TYPES = ['SMART_LOCK', 'AI_CAMERA', 'AUDIO_ARRAY'];
const VALID_ACTIONS = new Set(['START', 'PAUSE', 'STOP']);

function generateSessionId() {
  return `rec-sess-${Math.floor(1000 + Math.random() * 9000)}`;
}

// GET /studio/session/{room_id} — README/4-APIBackend.md §4.1 (baru)
// Bootstrap in-room.html: booking aktif + sisa waktu + status IoT, sumber Redis
// README/3-DBSchema.md §7.3 (session:in-room:*) & §7.2 (iot:heartbeat:*), fallback tabel iot_device_status.
router.get(
  '/session/:room_id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { room_id } = req.params;

    const sessionRaw = await redis.get(inRoomSessionKey(room_id));
    if (!sessionRaw) throw ErrorCodes.NO_ACTIVE_SESSION();
    const session = JSON.parse(sessionRaw);

    const { rows: bookingRows } = await query(
      "SELECT booking_date, end_time FROM bookings WHERE id = $1 AND status IN ('CONFIRMED', 'IN_ROOM')",
      [session.booking_id]
    );
    const booking = bookingRows[0];
    if (!booking) throw ErrorCodes.NO_ACTIVE_SESSION();
    const sessionEndsAt = new Date(`${booking.booking_date}T${booking.end_time}Z`).toISOString();

    const iotStatus = [];
    for (const deviceType of DEVICE_TYPES) {
      const cached = await redis.get(iotHeartbeatKey(room_id, deviceType));
      if (cached) {
        const parsed = JSON.parse(cached);
        iotStatus.push({ device_type: deviceType, status: parsed.status, last_heartbeat: parsed.last_ping });
        continue;
      }
      const { rows } = await query(
        'SELECT status, last_heartbeat FROM iot_device_status WHERE room_id = $1 AND device_type = $2',
        [room_id, deviceType]
      );
      iotStatus.push({
        device_type: deviceType,
        status: rows[0]?.status || 'OFFLINE',
        last_heartbeat: rows[0]?.last_heartbeat || null,
      });
    }

    ok(res, {
      room_id,
      booking_id: session.booking_id,
      session_ends_at: sessionEndsAt,
      iot_status: iotStatus,
    });
  })
);

// POST /studio/record/action — README/4-APIDesign.md §4.1
router.post(
  '/record/action',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { booking_id, action } = req.body;
    // Catatan: `room_id` & `preset_profile` (§4.1) diterima di body tapi belum dipakai/disimpan — query
    // cukup berbasis `booking_id`, dan `recordings` (README/3-DBSchema.md §3.10) tidak punya kolom preset.
    // Perlu keputusan skema jika histori preset kamera/audio perlu diaudit ke depan.
    requireFields(req.body, ['booking_id', 'room_id', 'action']);
    if (!VALID_ACTIONS.has(action)) {
      throw ErrorCodes.VALIDATION_ERROR('Action tidak dikenali.', { action: ['Wajib START, PAUSE, atau STOP.'] });
    }

    const { rows: openRows } = await query(
      `SELECT id, session_id, started_at FROM recordings
       WHERE booking_id = $1 AND status IN ('RECORDING', 'PAUSED')
       ORDER BY created_at DESC LIMIT 1`,
      [booking_id]
    );
    const open = openRows[0];

    if (action === 'START') {
      if (open) throw ErrorCodes.VALIDATION_ERROR('Rekaman sudah berjalan untuk booking ini.');
      const sessionId = generateSessionId();
      const { rows } = await query(
        `INSERT INTO recordings (booking_id, session_id, status, started_at)
         VALUES ($1, $2, 'RECORDING', NOW())
         RETURNING session_id, started_at`,
        [booking_id, sessionId]
      );
      return ok(res, {
        session_id: rows[0].session_id,
        booking_id,
        current_status: 'RECORDING',
        started_at: rows[0].started_at,
        storage_target: `s3://vault/${booking_id}/`,
      });
    }

    if (!open) throw ErrorCodes.NOT_FOUND('Tidak ada sesi rekaman aktif untuk booking ini.');

    if (action === 'PAUSE') {
      await query("UPDATE recordings SET status = 'PAUSED', updated_at = NOW() WHERE id = $1", [open.id]);
      return ok(res, {
        session_id: open.session_id,
        booking_id,
        current_status: 'PAUSED',
        started_at: open.started_at,
        storage_target: `s3://vault/${booking_id}/`,
      });
    }

    // action === 'STOP'
    await query(
      `UPDATE recordings SET status = 'PROCESSING', stopped_at = NOW(),
              video_duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
              updated_at = NOW()
       WHERE id = $1`,
      [open.id]
    );
    ok(res, {
      session_id: open.session_id,
      booking_id,
      current_status: 'PROCESSING',
      started_at: open.started_at,
      storage_target: `s3://vault/${booking_id}/`,
    });
  })
);

export default router;

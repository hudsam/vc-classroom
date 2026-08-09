import { Router } from 'express';
import { pool, query } from '../../config/db.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { ok, ErrorCodes } from '../../utils/response.js';
import { requireFields } from '../../utils/validate.js';
import { slugifyRoomId } from '../../utils/slug.js';
import { writeAuditLog } from '../../utils/audit.js';

const router = Router();

const ACTIVE_BOOKING_STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'IN_ROOM'];

async function assertNoActiveBookings(roomId) {
  const { rows } = await query(
    `SELECT 1 FROM bookings WHERE room_id = $1 AND status = ANY($2) LIMIT 1`,
    [roomId, ACTIVE_BOOKING_STATUSES]
  );
  if (rows.length > 0) throw ErrorCodes.ROOM_HAS_ACTIVE_BOOKINGS();
}

// GET /admin/rooms — README/4-APIBackend.md §4.3 (baru). Beda dari GET /rooms publik: termasuk status MAINTENANCE.
router.get(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT r.*, COALESCE(array_agg(rf.facility_name) FILTER (WHERE rf.facility_name IS NOT NULL), '{}') AS facilities
       FROM rooms r
       LEFT JOIN room_facilities rf ON rf.room_id = r.id
       GROUP BY r.id
       ORDER BY r.name ASC`
    );
    ok(res, {
      rooms: rows.map((r) => ({
        room_id: r.id,
        name: r.name,
        location: r.location,
        capacity_tier: r.capacity_tier,
        capacity_seats: r.capacity_seats,
        price_per_hour: Number(r.price_per_hour),
        status: r.status,
        smart_lock_device_id: r.smart_lock_device_id,
        wifi_ip_address: r.wifi_ip_address,
        facilities: r.facilities,
      })),
    });
  })
);

// POST /admin/rooms — README/4-APIBackend.md §4.3 (baru)
router.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, location, capacity_tier, capacity_seats, price_per_hour, facilities = [], smart_lock_device_id, wifi_ip_address } =
      req.body;
    requireFields(req.body, ['name', 'location', 'capacity_tier', 'capacity_seats', 'price_per_hour']);

    const roomId = slugifyRoomId(name);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO rooms (id, name, location, capacity_tier, capacity_seats, price_per_hour, smart_lock_device_id, wifi_ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [roomId, name, location, capacity_tier.toUpperCase(), capacity_seats, price_per_hour, smart_lock_device_id || null, wifi_ip_address || null]
      );
      for (const facility of facilities) {
        await client.query('INSERT INTO room_facilities (room_id, facility_name) VALUES ($1, $2)', [roomId, facility.toUpperCase()]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    ok(res, { room_id: roomId, name, location, capacity_tier, capacity_seats, price_per_hour, facilities }, 201);
  })
);

// PUT /admin/rooms/{room_id} — README/4-APIBackend.md §4.3 (baru)
router.put(
  '/:room_id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { room_id } = req.params;
    const { name, location, capacity_tier, capacity_seats, price_per_hour, facilities, smart_lock_device_id, wifi_ip_address } = req.body;

    const { rows: existingRows } = await query('SELECT id FROM rooms WHERE id = $1', [room_id]);
    if (!existingRows[0]) throw ErrorCodes.NOT_FOUND('Ruangan tidak ditemukan.');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE rooms SET
           name = COALESCE($1, name),
           location = COALESCE($2, location),
           capacity_tier = COALESCE($3, capacity_tier),
           capacity_seats = COALESCE($4, capacity_seats),
           price_per_hour = COALESCE($5, price_per_hour),
           smart_lock_device_id = COALESCE($6, smart_lock_device_id),
           wifi_ip_address = COALESCE($7, wifi_ip_address),
           updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [
          name ?? null,
          location ?? null,
          capacity_tier ? capacity_tier.toUpperCase() : null,
          capacity_seats ?? null,
          price_per_hour ?? null,
          smart_lock_device_id ?? null,
          wifi_ip_address ?? null,
          room_id,
        ]
      );

      if (Array.isArray(facilities)) {
        await client.query('DELETE FROM room_facilities WHERE room_id = $1', [room_id]);
        for (const facility of facilities) {
          await client.query('INSERT INTO room_facilities (room_id, facility_name) VALUES ($1, $2)', [room_id, facility.toUpperCase()]);
        }
      }
      await client.query('COMMIT');

      ok(res, { room_id, ...rows[0], price_per_hour: Number(rows[0].price_per_hour), facilities: facilities ?? undefined });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// DELETE /admin/rooms/{room_id} — README/4-APIBackend.md §4.3 (baru)
// Diblokir jika masih ada booking aktif (PENDING_PAYMENT/CONFIRMED/IN_ROOM) — usulan aturan teknis,
// belum ada keputusan bisnis eksplisit di FRD/PRD (lihat README/4-APIBackend.md §4.3).
router.delete(
  '/:room_id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { room_id } = req.params;
    const { rows } = await query('SELECT id FROM rooms WHERE id = $1', [room_id]);
    if (!rows[0]) throw ErrorCodes.NOT_FOUND('Ruangan tidak ditemukan.');

    await assertNoActiveBookings(room_id);
    await query('DELETE FROM rooms WHERE id = $1', [room_id]);
    ok(res, { room_id, deleted: true });
  })
);

// POST /admin/rooms/{room_id}/maintenance — README/4-APIBackend.md §4.3 (baru)
router.post(
  '/:room_id/maintenance',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { room_id } = req.params;
    const { action, reason, notes } = req.body;
    requireFields(req.body, ['action']);
    if (!['ENABLE', 'DISABLE'].includes(action)) {
      throw ErrorCodes.VALIDATION_ERROR('Action tidak dikenali.', { action: ['Wajib ENABLE atau DISABLE.'] });
    }

    const { rows: roomRows } = await query('SELECT id, status FROM rooms WHERE id = $1', [room_id]);
    if (!roomRows[0]) throw ErrorCodes.NOT_FOUND('Ruangan tidak ditemukan.');

    if (action === 'ENABLE') {
      requireFields(req.body, ['reason']);
      await query("UPDATE rooms SET status = 'MAINTENANCE', updated_at = NOW() WHERE id = $1", [room_id]);
      await query(
        `INSERT INTO room_maintenance_logs (room_id, operator_id, reason, notes, started_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [room_id, req.user.sub, reason, notes || null]
      );
    } else {
      await query("UPDATE rooms SET status = 'AVAILABLE', updated_at = NOW() WHERE id = $1", [room_id]);
      await query(
        `UPDATE room_maintenance_logs SET ended_at = NOW()
         WHERE room_id = $1 AND ended_at IS NULL
         ORDER BY started_at DESC LIMIT 1`,
        [room_id]
      );
    }

    await writeAuditLog({
      actorId: req.user.sub,
      actorRole: req.user.role,
      action: action === 'ENABLE' ? 'ENABLE_MAINTENANCE' : 'DISABLE_MAINTENANCE',
      targetTable: 'rooms',
      targetId: room_id,
      changesPayload: { reason: reason || null },
      description: `${action === 'ENABLE' ? 'Mengaktifkan' : 'Menonaktifkan'} mode maintenance untuk ${room_id}`,
    });

    ok(res, { room_id, status: action === 'ENABLE' ? 'MAINTENANCE' : 'AVAILABLE' });
  })
);

// GET /admin/rooms/{room_id}/diagnostics — README/4-APIBackend.md §4.3 (baru)
router.get(
  '/:room_id/diagnostics',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { room_id } = req.params;
    const { rows } = await query(
      'SELECT device_type, status, last_heartbeat FROM iot_device_status WHERE room_id = $1',
      [room_id]
    );
    ok(res, { room_id, devices: rows });
  })
);

export default router;

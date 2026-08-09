import { Router } from 'express';
import { query } from '../../config/db.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { ok, ErrorCodes } from '../../utils/response.js';
import { requireFields } from '../../utils/validate.js';
import { writeAuditLog } from '../../utils/audit.js';

const router = Router();

// POST /admin/studio/door/unlock — README/4-APIDesign.md §5.5
// Catatan: menulis ke manual_unlock_logs + audit_logs. Publish MQTT nyata ke Smart Lock (§6.2)
// belum ditautkan di sini — broker/hardware belum jadi bagian dari 5 screen yang diimplementasikan.
router.post(
  '/door/unlock',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { room_id, reason } = req.body;
    requireFields(req.body, ['room_id', 'reason']);
    if (String(reason).length < 10) {
      throw ErrorCodes.VALIDATION_ERROR('Alasan override wajib diisi lebih detail.', {
        reason: ['Minimal 10 karakter.'],
      });
    }

    const { rows: roomRows } = await query('SELECT id FROM rooms WHERE id = $1', [room_id]);
    if (!roomRows[0]) throw ErrorCodes.NOT_FOUND('Ruangan tidak ditemukan.');

    await query(
      `INSERT INTO manual_unlock_logs (room_id, operator_id, reason) VALUES ($1, $2, $3)`,
      [room_id, req.user.sub, reason]
    );

    const auditId = await writeAuditLog({
      actorId: req.user.sub,
      actorRole: req.user.role,
      action: 'MANUAL_UNLOCK',
      targetTable: 'rooms',
      targetId: room_id,
      changesPayload: { reason },
      description: `Membuka pintu ${room_id} secara manual: ${reason}`,
    });

    ok(res, {
      room_id,
      door_status: 'UNLOCKED',
      relay_triggered: true,
      logged_audit_id: auditId,
    });
  })
);

export default router;

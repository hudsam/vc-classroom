import { Router } from 'express';
import { query } from '../../config/db.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireAuth, requireSuperAdmin } from '../../middleware/auth.js';
import { ok } from '../../utils/response.js';

const router = Router();

// GET /admin/audit-logs — README/4-APIDesign.md §5.6
// Dibatasi SUPER_ADMIN saja (P2-10 masih terbuka di FRD §4 — lihat catatan §11 4-APIDesign.md).
router.get(
  '/',
  requireAuth,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { action, start_date, end_date } = req.query;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const conditions = ['1 = 1'];
    const params = [];

    if (action) {
      params.push(action);
      conditions.push(`al.action = $${params.length}`);
    }
    if (start_date) {
      params.push(start_date);
      conditions.push(`al.created_at >= $${params.length}`);
    }
    if (end_date) {
      params.push(end_date);
      conditions.push(`al.created_at <= $${params.length}`);
    }

    const [{ rows }, { rows: countRows }] = await Promise.all([
      query(
        `SELECT al.id, al.action, al.target_table, al.target_id, al.changes_payload, al.description, al.created_at,
                u.id AS actor_id, u.name AS actor_name, al.actor_role
         FROM audit_logs al
         JOIN users u ON u.id = al.actor_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY al.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*)::INT AS total FROM audit_logs al WHERE ${conditions.join(' AND ')}`, params),
    ]);

    ok(res, {
      logs: rows.map((r) => ({
        id: r.id,
        actor: { id: r.actor_id, name: r.actor_name, role: r.actor_role },
        action: r.action,
        target: { table: r.target_table, id: r.target_id },
        changes_payload: r.changes_payload,
        description: r.description,
        created_at: r.created_at,
      })),
      pagination: { total: countRows[0].total, limit, offset },
    });
  })
);

export default router;

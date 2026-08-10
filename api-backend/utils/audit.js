import { query } from '../config/db.js';

// README/3-DBSchema.md §3.16 audit_logs — log terpusat aktivitas administratif.
export async function writeAuditLog({ actorId, actorRole, action, targetTable, targetId, changesPayload, description }) {
  const { rows } = await query(
    `INSERT INTO audit_logs (actor_id, actor_role, action, target_table, target_id, changes_payload, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [actorId, actorRole, action, targetTable, targetId, changesPayload ? JSON.stringify(changesPayload) : null, description]
  );
  return rows[0].id;
}

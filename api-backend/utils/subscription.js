import { query } from '../config/db.js';

// README/3-DBSchema.md §3.3 user_subscriptions — 1 user maksimal 1 langganan ACTIVE relevan untuk tier JWT.
export async function getActiveSubscription(userId) {
  const { rows } = await query(
    `SELECT us.*, sp.name AS plan_name, sp.monthly_hours_quota, sp.includes_ai_transcription
     FROM user_subscriptions us
     JOIN subscription_plans sp ON sp.id = us.plan_id
     WHERE us.user_id = $1 AND us.status = 'ACTIVE'
     ORDER BY us.created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function getUserTier(userId) {
  const sub = await getActiveSubscription(userId);
  return sub ? sub.plan_id.toUpperCase() : 'NONE';
}

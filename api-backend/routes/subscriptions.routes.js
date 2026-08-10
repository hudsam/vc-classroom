import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, ErrorCodes } from '../utils/response.js';
import { getActiveSubscription } from '../utils/subscription.js';

const router = Router();

// GET /subscriptions/{user_id}/quota — README/4-APIDesign.md §3.5
// Hanya bisa diakses oleh user itu sendiri atau Admin.
router.get(
  '/:user_id/quota',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { user_id } = req.params;
    const isSelf = req.user.sub === user_id;
    const isAdmin = ['STUDIO_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isSelf && !isAdmin) {
      throw ErrorCodes.FORBIDDEN('Anda hanya bisa melihat kuota milik sendiri.');
    }

    const sub = await getActiveSubscription(user_id);
    if (!sub) {
      throw ErrorCodes.NOT_FOUND('Pengguna tidak memiliki langganan aktif.');
    }

    const isUnlimited = Number(sub.quota_hours_total) === -1;

    ok(res, {
      user_id,
      subscription_id: sub.id,
      plan: {
        id: sub.plan_id,
        name: sub.plan_name,
        monthly_hours_quota: Number(sub.monthly_hours_quota),
        includes_ai_transcription: sub.includes_ai_transcription,
      },
      status: sub.status,
      quota: {
        hours_total: Number(sub.quota_hours_total),
        hours_used: Number(sub.quota_hours_used),
        // README/3-DBSchema.md §5.2 — sentinel -1 wajib di-skip, bukan dikurangi, untuk Enterprise Unlimited.
        hours_remaining: isUnlimited ? -1 : Number(sub.quota_hours_total) - Number(sub.quota_hours_used),
        is_unlimited: isUnlimited,
      },
      billing_cycle: {
        start_date: sub.start_date,
        end_date: sub.end_date,
        auto_renew: sub.auto_renew,
      },
    });
  })
);

export default router;

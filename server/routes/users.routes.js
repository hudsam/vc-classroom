import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, ErrorCodes } from '../utils/response.js';
import { normalizePhone } from '../utils/validate.js';

const router = Router();

const ME_COLUMNS = 'id, email, name, phone, institution, role, wallet_balance, two_factor_enabled, created_at';

// GET /users/me — README/4-APIDesign.md §2.5
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(`SELECT ${ME_COLUMNS} FROM users WHERE id = $1 AND deleted_at IS NULL`, [req.user.sub]);
    if (!rows[0]) throw ErrorCodes.NOT_FOUND('Akun tidak ditemukan.');
    ok(res, rows[0]);
  })
);

// PUT /users/me — README/4-APIDesign.md §2.6
router.put(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, phone, institution } = req.body;
    const normalizedPhone = phone ? normalizePhone(phone) : undefined;

    const { rows } = await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         institution = COALESCE($3, institution),
         updated_at = NOW()
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING ${ME_COLUMNS}, updated_at`,
      [name ?? null, normalizedPhone ?? null, institution ?? null, req.user.sub]
    );
    if (!rows[0]) throw ErrorCodes.NOT_FOUND('Akun tidak ditemukan.');
    ok(res, rows[0]);
  })
);

// PUT /users/me/2fa — README/4-APIBackend.md §4.4
// ⚠️ Asumsi: hanya toggle flag `users.two_factor_enabled`, bukan implementasi OTP/TOTP penuh
// (belum ada provider SMS/authenticator app yang didefinisikan di FRD/PRD).
router.put(
  '/me/2fa',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      throw ErrorCodes.VALIDATION_ERROR('Field "enabled" wajib boolean.', { enabled: ['Wajib true/false.'] });
    }
    const { rows } = await query(
      'UPDATE users SET two_factor_enabled = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING two_factor_enabled',
      [enabled, req.user.sub]
    );
    if (!rows[0]) throw ErrorCodes.NOT_FOUND('Akun tidak ditemukan.');
    ok(res, { two_factor_enabled: rows[0].two_factor_enabled });
  })
);

// DELETE /users/me — README/4-APIBackend.md §4.4 (soft delete, README/3-DBSchema.md §8)
// Diblokir jika wallet_balance > 0, sesuai rekomendasi teknis minimal P2-15.
router.delete(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT wallet_balance FROM users WHERE id = $1 AND deleted_at IS NULL', [req.user.sub]);
    if (!rows[0]) throw ErrorCodes.NOT_FOUND('Akun tidak ditemukan.');
    if (Number(rows[0].wallet_balance) > 0) {
      throw ErrorCodes.WALLET_BALANCE_NOT_EMPTY();
    }

    await query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [req.user.sub]);
    ok(res, { message: 'Akun berhasil dihapus.' });
  })
);

export default router;

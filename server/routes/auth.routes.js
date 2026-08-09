import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, ErrorCodes } from '../utils/response.js';
import { signToken } from '../utils/jwt.js';
import { requireFields, normalizePhone } from '../utils/validate.js';
import { getUserTier } from '../utils/subscription.js';

const router = Router();

// POST /auth/register — README/4-APIDesign.md §2.2
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, name, phone, institution } = req.body;
    requireFields(req.body, ['email', 'password', 'name', 'phone']);
    const normalizedPhone = normalizePhone(phone);

    const existing = await query('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
    if (existing.rows.length > 0) {
      throw ErrorCodes.EMAIL_ALREADY_REGISTERED();
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, name, phone, institution)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name, normalizedPhone, institution || null]
    );

    ok(res, { user_id: rows[0].id, ...rows[0] }, 201);
  })
);

// POST /auth/login — README/4-APIDesign.md §2.3
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    requireFields(req.body, ['email', 'password']);

    const { rows } = await query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
    const user = rows[0];
    if (!user) throw ErrorCodes.INVALID_CREDENTIALS();

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) throw ErrorCodes.INVALID_CREDENTIALS();

    const tier = await getUserTier(user.id);
    const accessToken = signToken({ ...user, tier });

    ok(res, {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: Number(process.env.JWT_EXPIRES_IN || 86400),
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tier },
    });
  })
);

// POST /auth/logout — README/4-APIDesign.md §2.4
// Sesuai desain: JWT stateless, revokasi lokal saja (tidak ada server-side blacklist di MVP ini).
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, { message: 'Token JWT berhasil direvokasi secara lokal.' });
  })
);

// POST /auth/change-password — README/4-APIBackend.md §4.4 (baru, digrounding ke users.password_hash)
router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body;
    requireFields(req.body, ['current_password', 'new_password']);
    if (String(new_password).length < 8) {
      throw ErrorCodes.VALIDATION_ERROR('Kata sandi baru minimal 8 karakter.', {
        new_password: ['Minimal 8 karakter.'],
      });
    }

    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL', [req.user.sub]);
    if (!rows[0]) throw ErrorCodes.NOT_FOUND('Akun tidak ditemukan.');

    const matches = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!matches) throw ErrorCodes.INVALID_CREDENTIALS('Kata sandi saat ini salah.');

    const newHash = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.sub]);

    ok(res, { message: 'Kata sandi berhasil diperbarui.' });
  })
);

export default router;

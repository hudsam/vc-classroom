import { verifyToken } from '../utils/jwt.js';
import { ErrorCodes } from '../utils/response.js';

// README/4-APIDesign.md §1.2 — Header Format: Authorization: Bearer <JWT_TOKEN>
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ErrorCodes.UNAUTHORIZED('Header Authorization Bearer <token> wajib disertakan.'));
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(ErrorCodes.TOKEN_EXPIRED_OR_INVALID());
  }
}

// Sama seperti requireAuth, tapi tidak menolak request tanpa token (README/4-APIDesign.md §2.1 GET /rooms — Auth: Optional).
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // Token tidak valid pada endpoint optional — abaikan, perlakukan sebagai Guest.
    }
  }
  next();
}

// FRD §4 RBAC — role di JWT harus salah satu dari roles yang diizinkan.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ErrorCodes.UNAUTHORIZED());
    }
    if (!roles.includes(req.user.role)) {
      return next(ErrorCodes.FORBIDDEN(`Aksi ini hanya untuk role: ${roles.join(', ')}.`));
    }
    next();
  };
}

export const requireAdmin = requireRole('STUDIO_ADMIN', 'SUPER_ADMIN');
export const requireSuperAdmin = requireRole('SUPER_ADMIN');

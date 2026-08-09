import jwt from 'jsonwebtoken';
import 'dotenv/config';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES_IN_SECONDS = Number(process.env.JWT_EXPIRES_IN || 86400);

// Claims persis sesuai README/4-APIDesign.md §1.2
export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier || 'NONE',
    },
    SECRET,
    { expiresIn: EXPIRES_IN_SECONDS }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

export const JWT_EXPIRES_IN_SECONDS = EXPIRES_IN_SECONDS;

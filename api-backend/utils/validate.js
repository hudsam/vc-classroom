import { ErrorCodes } from './response.js';

// README/4-APIDesign.md §7 — Skema Validasi Input & Sanitasi
export const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    throw ErrorCodes.VALIDATION_ERROR('Field wajib belum lengkap.', {
      ...Object.fromEntries(missing.map((f) => [f, ['Field ini wajib diisi.']])),
    });
  }
}

// Menormalkan nomor HP lokal (`08...`) ke format E.164 (`+62...`) sesuai users.phone (README/3-DBSchema.md §3.1).
export function normalizePhone(phone) {
  if (!PHONE_REGEX.test(phone)) {
    throw ErrorCodes.VALIDATION_ERROR('Nomor HP tidak valid.', {
      phone: ['Harus format nomor HP Indonesia valid, contoh: +628123456789.'],
    });
  }
  const digits = phone.replace(/^(\+62|62|0)/, '');
  return `+62${digits}`;
}

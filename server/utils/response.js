// Format response standar sesuai README/4-APIDesign.md §1.3

export function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json({ status: 'success', data });
}

export class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Kode error terstandar — README/4-APIDesign.md §8 (Error & Fail-Safe Matrix)
export const ErrorCodes = {
  VALIDATION_ERROR: (message, details) => new ApiError(422, 'VALIDATION_ERROR', message, details),
  UNAUTHORIZED: (message = 'Autentikasi diperlukan.') => new ApiError(401, 'UNAUTHORIZED', message),
  FORBIDDEN: (message = 'Anda tidak memiliki akses untuk aksi ini.') => new ApiError(403, 'FORBIDDEN', message),
  NOT_FOUND: (message = 'Data tidak ditemukan.') => new ApiError(404, 'NOT_FOUND', message),
  INVALID_CREDENTIALS: (message = 'Email atau kata sandi salah.') => new ApiError(401, 'INVALID_CREDENTIALS', message),
  EMAIL_ALREADY_REGISTERED: (message = 'Email sudah terdaftar.') => new ApiError(409, 'EMAIL_ALREADY_REGISTERED', message),
  TOKEN_EXPIRED_OR_INVALID: (message = 'Kode akses tidak valid atau sudah kedaluwarsa. Hubungi dukungan jika Anda yakin ini kesalahan.') =>
    new ApiError(401, 'TOKEN_EXPIRED_OR_INVALID', message),
  SLOT_ALREADY_LOCKED: (message = 'Slot waktu yang Anda pilih baru saja dipesan oleh pengguna lain. Silakan pilih jam lain.') =>
    new ApiError(409, 'SLOT_ALREADY_LOCKED', message),
  ROOM_HAS_ACTIVE_BOOKINGS: (message = 'Ruangan ini masih memiliki booking aktif dan tidak dapat dihapus/dinonaktifkan.') =>
    new ApiError(409, 'ROOM_HAS_ACTIVE_BOOKINGS', message),
  NO_ACTIVE_SESSION: (message = 'Tidak ada sesi in-room aktif untuk ruangan ini.') => new ApiError(404, 'NO_ACTIVE_SESSION', message),
  WALLET_BALANCE_NOT_EMPTY: (message = 'Saldo wallet Anda belum habis. Cairkan/gunakan saldo terlebih dahulu sebelum menghapus akun.') =>
    new ApiError(409, 'WALLET_BALANCE_NOT_EMPTY', message),
  INTERNAL_ERROR: (message = 'Terjadi kesalahan pada server.') => new ApiError(500, 'INTERNAL_ERROR', message),
};

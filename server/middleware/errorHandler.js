import { ApiError } from '../utils/response.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    status: 'error',
    error: { code: 'ROUTE_NOT_FOUND', message: `Tidak ada endpoint ${req.method} ${req.originalUrl}.` },
  });
}

// Format response gagal sesuai README/4-APIDesign.md §1.3.B
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }

  console.error('[unhandled error]', err);
  res.status(500).json({
    status: 'error',
    error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server.' },
  });
}

// Membungkus async route handler agar error otomatis diteruskan ke errorHandler.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

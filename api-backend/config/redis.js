import Redis from 'ioredis';
import 'dotenv/config';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

redis.on('error', (err) => {
  console.error('[redis] connection error:', err.message);
});

// README/3-DBSchema.md §7.1 — Distributed Locking (Slot Waktu Sementara - 15 Menit)
export const SLOT_LOCK_TTL_SECONDS = 900;
export function slotLockKey(roomId, bookingDate, startTime, endTime) {
  return `lock:room:${roomId}:${bookingDate}:${startTime}-${endTime}`;
}

// README/3-DBSchema.md §7.2 — Cache Status Perangkat IoT (Heartbeat Monitor)
export const IOT_HEARTBEAT_TTL_SECONDS = 30;
export function iotHeartbeatKey(roomId, deviceType) {
  return `iot:heartbeat:${roomId}:${deviceType}`;
}

// README/3-DBSchema.md §7.3 — Cache Token Sesi Dashboard In-Room Controller
export function inRoomSessionKey(roomId) {
  return `session:in-room:${roomId}`;
}

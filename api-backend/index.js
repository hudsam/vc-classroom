import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import roomsRoutes from './routes/rooms.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import subscriptionsRoutes from './routes/subscriptions.routes.js';
import studioRoutes from './routes/studio.routes.js';
import adminDashboardRoutes from './routes/admin/dashboard.routes.js';
import adminBookingsRoutes from './routes/admin/bookings.routes.js';
import adminDoorRoutes from './routes/admin/door.routes.js';
import adminAuditRoutes from './routes/admin/audit.routes.js';
import adminRoomsRoutes from './routes/admin/rooms.routes.js';

import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Cakupan endpoint dibatasi ke 5 screen prototipe yang sudah ada — H-01, H-02, H-06, H-07, H-08
// (index.html, in-room.html, profile.html, admin/dashboard.html, admin/rooms.html).
// Lihat README/4-APIDesign.md (kontrak resmi) & README/4-APIBackend.md (blueprint + endpoint baru).
const API_BASE = '/api/v1';

app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/users`, usersRoutes);
app.use(`${API_BASE}/rooms`, roomsRoutes);
app.use(`${API_BASE}/bookings`, bookingsRoutes);
app.use(`${API_BASE}/subscriptions`, subscriptionsRoutes);
app.use(`${API_BASE}/studio`, studioRoutes);
app.use(`${API_BASE}/admin/dashboard`, adminDashboardRoutes);
app.use(`${API_BASE}/admin/bookings`, adminBookingsRoutes);
app.use(`${API_BASE}/admin/studio`, adminDoorRoutes); // -> POST /admin/studio/door/unlock (§5.5)
app.use(`${API_BASE}/admin/audit-logs`, adminAuditRoutes);
app.use(`${API_BASE}/admin/rooms`, adminRoomsRoutes);

app.get(`${API_BASE}/health`, (req, res) => res.json({ status: 'success', data: { ok: true } }));

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[server] VC-SCR API listening on http://localhost:${PORT}${API_BASE}`);
});

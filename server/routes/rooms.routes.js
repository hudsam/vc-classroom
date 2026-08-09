import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';
import { ok } from '../utils/response.js';

const router = Router();

// GET /rooms — README/4-APIDesign.md §2.1 (katalog publik, Auth optional).
// Query params location/facility/date sesuai dokumen; ditambah capacity_tier & harga min/max
// untuk menutup gap filter yang sudah ada di UI index.html tapi belum ada di kontrak (P2-19).
// Skema respons dikoreksi mengikuti model data 1 ruangan = 1 capacity_tier + 1 price_per_hour
// (README/3-DBSchema.md §3.5), bukan objek `hourly_rates` 3-tingkat — lihat P2-19.
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { location, facility, capacity_tier, min_price, max_price } = req.query;

    const conditions = [`r.status = 'AVAILABLE'`];
    const params = [];

    if (location) {
      params.push(`%${location}%`);
      conditions.push(`r.location ILIKE $${params.length}`);
    }
    if (capacity_tier) {
      params.push(capacity_tier.toUpperCase());
      conditions.push(`r.capacity_tier = $${params.length}`);
    }
    if (min_price) {
      params.push(Number(min_price));
      conditions.push(`r.price_per_hour >= $${params.length}`);
    }
    if (max_price) {
      params.push(Number(max_price));
      conditions.push(`r.price_per_hour <= $${params.length}`);
    }
    if (facility) {
      const facilities = facility.split(',').map((f) => f.trim().toUpperCase());
      params.push(facilities);
      conditions.push(
        `r.id IN (SELECT room_id FROM room_facilities WHERE facility_name = ANY($${params.length}))`
      );
    }

    const { rows } = await query(
      `SELECT r.id AS room_id, r.name, r.location, r.capacity_tier, r.capacity_seats AS capacity,
              r.price_per_hour, r.status,
              COALESCE(array_agg(rf.facility_name) FILTER (WHERE rf.facility_name IS NOT NULL), '{}') AS facilities
       FROM rooms r
       LEFT JOIN room_facilities rf ON rf.room_id = r.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY r.id
       ORDER BY r.name ASC`,
      params
    );

    const rooms = rows.map((r) => ({
      room_id: r.room_id,
      name: r.name,
      location: r.location,
      capacity_tier: r.capacity_tier,
      capacity: r.capacity,
      price_per_hour: Number(r.price_per_hour),
      facilities: r.facilities,
      is_available: r.status === 'AVAILABLE',
    }));

    ok(res, { rooms });
  })
);

export default router;

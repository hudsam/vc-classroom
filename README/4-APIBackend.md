# Dokumen Implementasi Backend API: Platform Sewa Smart Classroom

**Versi:** 0.1 (Draft — menunggu review)
**Tanggal:** 9 Agustus 2026
**Penulis:** Senior Product & Engineering Advisor (lanjutan sesi Google Antigravity)
**Status:** 📝 **Draft untuk dipelajari & disetujui** — belum ada kode yang ditulis berdasarkan dokumen ini.
**Dokumen Terkait:**
* `README/4-APIDesign.md` v1.0 (Kontrak API resmi — dokumen ini **melengkapi**, bukan menggantikan) -> [4-APIDesign.md](4-APIDesign.md)
* `README/3-DBSchema.md` v1.1 (Skema database acuan seluruh endpoint di bawah) -> [3-DBSchema.md](3-DBSchema.md)
* `README/3-DBQuery.md` (DDL yang sudah live di Aiven PostgreSQL) -> [3-DBQuery.md](3-DBQuery.md)
* `docs/X_ProgressSummary.md` §12 (Backlog implementasi API-01 s/d API-26) -> [X_ProgressSummary.md](../docs/X_ProgressSummary.md)

---

### Riwayat Revisi

| Versi | Tanggal | Penulis | Perubahan |
| :--- | :--- | :--- | :--- |
| 0.1 | 9 Agustus 2026 | Claude (sesi ini) | Draf awal — cross-check ke-5 prototipe UI yang sudah ada (`index.html`, `in-room.html`, `profile.html`, `admin/dashboard.html`, `admin/rooms.html`) terhadap `4-APIDesign.md` v1.0. Memetakan endpoint yang sudah siap dipakai, dan mengusulkan endpoint baru untuk bagian UI yang belum punya kontrak resmi. |

---

## 1. Tujuan Dokumen

Dokumen ini adalah **jembatan antara desain (`4-APIDesign.md`) dan kode backend nyata**, dengan pola yang sama seperti `3-DBQuery.md` melengkapi `3-DBSchema.md`. Isinya tiga hal:

1. **Arsitektur & stack** yang akan dipakai untuk mengimplementasikan backend.
2. **Pemetaan endpoint yang sudah terdokumentasi** di `4-APIDesign.md` v1.0 ke screen prototipe UI yang sudah ada, supaya jelas endpoint mana yang bisa langsung dikerjakan tanpa keputusan tambahan.
3. **Usulan endpoint baru** untuk bagian UI yang sudah ada tapi **belum punya kontrak resmi** di `4-APIDesign.md` — ditemukan saat cross-check kode prototipe HTML terhadap dokumen desain API. Setiap usulan di sini digrounding ke tabel yang sudah ada di `3-DBSchema.md`, bukan tabel karangan baru, kecuali ditandai eksplisit sebagai gap skema.

**Dokumen ini sengaja belum diimplementasikan ke kode.** Sesuai instruksi, tahap ini adalah tahap belajar/review — setelah disetujui, bagian §4 (usulan endpoint baru) akan dipindahkan ke `4-APIDesign.md` sebagai v1.1, baru kode backend ditulis.

---

## 2. Arsitektur & Stack Implementasi

| Lapisan | Pilihan | Alasan |
| :--- | :--- | :--- |
| Runtime | Node.js + Express | Sudah jadi dependency di `package.json` root (`express`, `dotenv`), tinggal diaktifkan. |
| Database Client | `pg` (node-postgres) | Koneksi langsung ke Aiven PostgreSQL 17 yang sudah live (`README/3-DBQuery.md`). |
| Cache / Lock | Redis | Wajib untuk 3 mekanisme yang sudah didesain eksplisit di `3-DBSchema.md` §7: distributed lock slot booking (§7.1), heartbeat IoT (§7.2), sesi dashboard in-room (§7.3). Tanpa Redis, `POST /bookings/hold` dan bootstrap `in-room.html` tidak bisa diimplementasikan sesuai desain. |
| Auth | JWT (HS256/RS256), `Authorization: Bearer <token>` | Sesuai `4-APIDesign.md` §1.2 & NFR-S03. |
| Password Hashing | bcrypt/argon2 | Kolom `users.password_hash` di `3-DBSchema.md` §3.1 sudah mengasumsikan ini. |

### Struktur Folder yang Diusulkan

```
server/
├── index.js                 # Entry point Express
├── config/
│   ├── db.js                 # Pool koneksi pg ke Aiven
│   └── redis.js               # Klien Redis
├── middleware/
│   ├── auth.js                # requireAuth, requireRole
│   └── errorHandler.js        # Wrapper format {status, error} sesuai §1.3 4-APIDesign.md
├── routes/
│   ├── auth.routes.js
│   ├── users.routes.js
│   ├── rooms.routes.js
│   ├── bookings.routes.js
│   ├── payments.routes.js
│   ├── subscriptions.routes.js
│   ├── studio.routes.js       # in-room controller + session bootstrap
│   └── admin/
│       ├── dashboard.routes.js
│       ├── rooms.routes.js
│       ├── bookings.routes.js
│       └── audit.routes.js
└── mqtt/
    └── doorClient.js          # Publisher/subscriber /classroom/door/*
```

### Environment Variables Tambahan

`.env.example` saat ini hanya berisi `GEMINI_API_KEY` dan `APP_URL` (dipakai prototipe AI Studio). Perlu ditambahkan:

```
DATABASE_URL=postgres://user:pass@host:port/dbname?sslmode=require   # Aiven, wajib SSL
REDIS_URL=redis://...
JWT_SECRET=...
JWT_EXPIRES_IN=86400
MQTT_BROKER_URL=...
```

---

## 3. Endpoint yang Sudah Siap Diimplementasi (dari `4-APIDesign.md` v1.0)

Tabel ini adalah hasil cross-check ke-5 prototipe UI terhadap kontrak yang sudah ada — **tidak perlu keputusan tambahan**, tinggal dikerjakan sesuai urutan backlog `docs/X_ProgressSummary.md` §12.

| Screen (file) | Endpoint Terdokumentasi | Dipakai untuk | Backlog ID |
| :--- | :--- | :--- | :---: |
| Fondasi (semua screen) | `POST /auth/register` (§2.2) | Prasyarat akun sebelum aksi apa pun | API-05 |
| Fondasi (semua screen) | `POST /auth/login` (§2.3) | Prasyarat token JWT | API-05 |
| `index.html` (H-01) | `GET /rooms` (§2.1) | Katalog ruangan + filter | API-08, API-11 |
| `index.html` (H-01) | `POST /bookings/hold` (§3.1) | Tombol "Pilih Jadwal" → simulasi `SLOT_ALREADY_LOCKED` | API-09 (sebagian — hold saja, checkout H-03 belum diprototipekan) |
| `in-room.html` (H-02) | `POST /studio/record/action` (§4.1) | Start/Pause/Stop recording + preset kamera/audio/input | API-15 |
| `profile.html` (H-06) | `GET /users/me`, `PUT /users/me` (§2.5-2.6) | Info profil + form edit nama/telp/institusi | API-07 |
| `profile.html` (H-06) | `POST /auth/logout` (§2.4) | Tombol Sign Out | API-06 |
| `profile.html` (H-06) | `GET /subscriptions/{user_id}/quota` (§3.5) | Badge "Keanggotaan" (Member/Premium) | API-17 |
| `admin/dashboard.html` (H-07) | `POST /admin/studio/door/unlock` (§5.5) | Modal "Buka Pintu Manual" (override) | API-14/API-20 |
| `admin/dashboard.html` (H-07) | `POST /admin/bookings/{id}/late-checkout` (§5.3) | Modal "Catat Denda Late Checkout Manual" | API-20 |
| `admin/dashboard.html` (H-07) | `GET /admin/bookings` (§5.1) | Sumber data parsial KPI "Booking Aktif Hari Ini" | API-20 |
| `admin/dashboard.html` (H-07) | `GET /admin/audit-logs` (§5.6) | Tombol "Periksa Logs Audit" pada alert `TOKEN_EXPIRED_OR_INVALID` | API-21 |

---

## 4. Usulan Endpoint Baru (Gap Ditemukan — Belum Ada di `4-APIDesign.md` v1.0)

Setiap usulan di bawah **digrounding ke tabel yang sudah ada di `3-DBSchema.md`**, memakai format response standar `4-APIDesign.md` §1.3 (`{status, data}` / `{status, error}`) dan aturan auth §1.2. Bagian yang benar-benar butuh keputusan bisnis/skema baru ditandai ⚠️ **Asumsi**.

### 4.1 Bootstrap Sesi In-Room Controller (`in-room.html` / H-02)

**Gap:** `in-room.html` menampilkan countdown timer & status IoT begitu halaman dibuka, tapi `4-APIDesign.md` hanya punya `POST /studio/record/action` (aksi, bukan pengambilan data awal). Data pendukungnya **sudah ada** di `3-DBSchema.md` §7.3 (Redis `session:in-room:{room_id}`) dan §7.2 (Redis `iot:heartbeat:{room_id}:{device_type}`).

#### `GET /studio/session/{room_id}` (baru)
* **Auth:** Required — dibatasi ke jaringan WiFi lokal kelas (IP subnet, `rooms.wifi_ip_address`), sesuai catatan geofence FEAT-CTL-01.
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "room_id": "rm-jakarta-01",
      "booking_id": "bkg-20260820-0089",
      "session_ends_at": "2026-08-20T11:00:00Z",
      "iot_status": [
        { "device_type": "SMART_LOCK", "status": "ONLINE", "last_heartbeat": "2026-08-20T09:05:12Z" },
        { "device_type": "AI_CAMERA", "status": "ONLINE", "last_heartbeat": "2026-08-20T09:05:10Z" },
        { "device_type": "AUDIO_ARRAY", "status": "OFFLINE", "last_heartbeat": "2026-08-20T08:58:02Z" }
      ]
    }
  }
  ```
* **Error baru:** `NO_ACTIVE_SESSION` (404) — jika key Redis `session:in-room:{room_id}` sudah kedaluwarsa/tidak ada.
* **Sumber data:** Redis `session:in-room:{room_id}` (§7.3) → `booking_id`; `bookings.end_time` untuk `session_ends_at`; Redis `iot:heartbeat:*` (§7.2) atau fallback tabel `iot_device_status` (§3.13) jika cache kosong.

---

### 4.2 KPI & Alert Feed Dashboard Admin (`admin/dashboard.html` / H-07)

**Gap:** Bagian terbesar di H-07 (4 kartu KPI + Live Alert Feed real-time) tidak punya endpoint sama sekali di `4-APIDesign.md` — hanya aksi (unlock, late-checkout) yang terdokumentasi, bukan sumber datanya.

#### `GET /admin/dashboard/metrics` (baru)
* **Auth:** Required (`STUDIO_ADMIN` / `SUPER_ADMIN`).
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "utilization_rate_percent": 78.5,
      "bookings_today": { "running": 10, "upcoming": 4 },
      "hardware_incidents_count": 1,
      "late_checkout_pending_count": 2
    }
  }
  ```
* **Sumber data:** `utilization_rate_percent` dihitung dari `bookings` (jam terpakai / jam operasional tersedia hari ini) — selaras `Classroom Utilization Rate` PRD §7 Success Metrics; `bookings_today` dari `bookings.status IN ('IN_ROOM','CONFIRMED')` + `booking_date = CURRENT_DATE`; `hardware_incidents_count` dari `iot_device_status WHERE status = 'OFFLINE'` (§3.13).
* ⚠️ **Asumsi terbuka:** `late_checkout_pending_count` — **tidak ada tabel yang melacak "kasus yang belum dilaporkan"**. `late_checkout_logs` (§3.15) hanya mencatat insiden yang *sudah* diinput admin. Deteksi keterlambatan sendiri sudah diputuskan manual oleh Ops (FRD §7.3, P0-3 — bukan otomatis via sensor), jadi angka "pending" ini kemungkinan besar berasal dari proses operasional di luar sistem (checklist manual), bukan query DB. **Perlu keputusan:** apakah field ini dihilangkan dari dashboard, atau dibuatkan mekanisme flag baru (mis. kolom `bookings.checkout_confirmed_at` yang diisi manual Ops).

#### `GET /admin/alerts` (baru)
* **Auth:** Required (`STUDIO_ADMIN` / `SUPER_ADMIN`).
* **Query Parameters:** `status` (`active`/`resolved`, optional), `room_id` (optional).
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "alerts": [
        {
          "id": "ALT-8921",
          "code": "IOT_GATEWAY_OFFLINE",
          "severity": "CRITICAL",
          "room_id": "rm-jakarta-02",
          "room_name": "Ruang 201 (Medium)",
          "message": "Gateway Smart Lock terputus sejak 10 menit yang lalu.",
          "detected_at": "2026-08-20T09:05:00Z",
          "suggested_actions": ["DIAGNOSE_HARDWARE", "MANUAL_UNLOCK"]
        },
        {
          "id": "SEC-1044",
          "code": "TOKEN_EXPIRED_OR_INVALID",
          "severity": "WARNING",
          "room_id": "rm-jakarta-03",
          "room_name": "Ruang 103 (Small)",
          "message": "Percobaan akses PIN/QR gagal >3x pada ruangan ini.",
          "detected_at": "2026-08-20T08:30:00Z",
          "suggested_actions": ["VIEW_AUDIT_LOGS"]
        }
      ]
    }
  }
  ```
* **Sumber data:** Alert `IOT_GATEWAY_OFFLINE` dari transisi status di `iot_device_status` (§3.13); alert `TOKEN_EXPIRED_OR_INVALID` dari agregasi `door_access_attempts` (§3.19) yang persis dirancang untuk ini ("basis data untuk ... Live Alert Feed Ops Dashboard", lihat deskripsi tabel §3.19) — grouping percobaan gagal `> 3x` dalam jendela 10 menit per `room_id`, sesuai aturan FRD §8.

---

### 4.3 Manajemen Ruangan / Room CRUD (`admin/rooms.html` / H-08)

**Gap:** Seluruh screen ini tidak punya endpoint admin di `4-APIDesign.md` — hanya ada `GET /rooms` publik (read-only, hanya ruangan `AVAILABLE`). Data pendukung penuh sudah ada di `3-DBSchema.md` §3.5 (`rooms`), §3.6 (`room_facilities`), §3.12 (`room_maintenance_logs`), §3.13 (`iot_device_status`).

| Endpoint (baru) | Method | Fungsi UI | Sumber Tabel |
| :--- | :---: | :--- | :--- |
| `/admin/rooms` | `GET` | List semua ruangan termasuk status `MAINTENANCE` (beda dari `GET /rooms` publik) | `rooms`, `room_facilities` |
| `/admin/rooms` | `POST` | Modal "Tambah Ruangan Baru" | `rooms`, `room_facilities` |
| `/admin/rooms/{room_id}` | `PUT` | Modal "Edit Ruangan" | `rooms`, `room_facilities` |
| `/admin/rooms/{room_id}` | `DELETE` | Tombol "Hapus Ruangan" | `rooms` |
| `/admin/rooms/{room_id}/maintenance` | `POST` | Modal "Aktifkan Mode Maintenance" (toggle `AVAILABLE`↔`MAINTENANCE`) | `rooms.status`, `room_maintenance_logs` |
| `/admin/rooms/{room_id}/diagnostics` | `GET` | Modal "Device Health Check" | `iot_device_status` |

Contoh `POST /admin/rooms/{room_id}/maintenance`:
```json
// Request
{ "action": "ENABLE", "reason": "Perbaikan rutin jaringan IoT Smart Lock" }
// Response (200 OK)
{
  "status": "success",
  "data": { "room_id": "rm-jakarta-01", "status": "MAINTENANCE", "maintenance_log_id": "..." }
}
```
* **Error baru:** `ROOM_HAS_ACTIVE_BOOKINGS` (409) — diusulkan untuk memblokir `DELETE`/maintenance-enable jika ada `bookings.status IN ('CONFIRMED','IN_ROOM')` yang belum selesai pada ruangan tsb. **Belum ada aturan bisnis eksplisit soal ini di FRD/PRD** — ditandai sebagai usulan teknis, bukan keputusan bisnis final.

---

### 4.4 Kelengkapan Akun (`profile.html` / H-06)

**Gap:** 5 aksi berikut sudah ada di UI (`profile.html`), dan 3 di antaranya **sudah punya kolom pendukung di DB** — hanya endpointnya yang belum didesain.

| Aksi UI | Endpoint (baru) | Status Kesiapan DB |
| :--- | :--- | :--- |
| Ubah Kata Sandi | `POST /auth/change-password` | ✅ Siap — `users.password_hash` (§3.1) sudah ada |
| Toggle 2FA | `PUT /users/me/2fa` | ✅ Siap secara kolom — `users.two_factor_enabled` (§3.1) sudah ada. ⚠️ **Asumsi:** ini hanya toggle flag boolean di MVP, **bukan** implementasi OTP/TOTP penuh (belum ada provider SMS/authenticator app yang didefinisikan di FRD/PRD manapun). |
| Hapus Akun | `DELETE /users/me` | ✅ Siap — soft delete via `users.deleted_at`, aturan blokir `wallet_balance > 0` sudah direkomendasikan di `3-DBSchema.md` §8 (P2-15) |
| "Keluar Semua Perangkat" | `POST /auth/logout-all` | ⚠️ **Gap arsitektur:** `4-APIDesign.md` §2.4 secara eksplisit mendesain logout sebagai **"revokasi lokal saja, tanpa blacklist server"** (JWT stateless). Tanpa session/token blacklist store, server **tidak punya cara nyata** memaksa logout perangkat lain sebelum token kedaluwarsa (maks. 24 jam). Perlu keputusan: terima keterbatasan ini (tombol UI jadi *no-op* fungsional/hanya kosmetik), atau tambahkan token blacklist (Redis) sebagai perubahan arsitektur. |
| Preferensi Notifikasi | `GET/PUT /users/me/notifications` | ❌ **Belum ada tabel/kolom pendukung sama sekali** di `3-DBSchema.md`. Perlu keputusan skema baru (kolom `users.notification_preferences JSONB`, atau tabel terpisah) sebelum endpoint ini bisa diimplementasikan — bukan sekadar gap dokumen API, tapi gap skema. |

---

## 5. Ringkasan Kesiapan per Gap

| Gap | Endpoint Baru Diusulkan | Butuh Keputusan Tambahan? |
| :--- | :---: | :--- |
| §4.1 Bootstrap in-room | 1 | Tidak — data sudah lengkap di skema (§7.2, §7.3, §3.13) |
| §4.2 KPI Dashboard | 1 | Sebagian — `late_checkout_pending_count` perlu mekanisme baru |
| §4.2 Alert Feed | 1 | Tidak — `door_access_attempts` & `iot_device_status` sudah didesain untuk ini |
| §4.3 Room CRUD | 6 | Sebagian — aturan blokir `ROOM_HAS_ACTIVE_BOOKINGS` perlu sign-off produk |
| §4.4 Password/Delete Account | 2 | Tidak — kolom DB sudah siap |
| §4.4 2FA | 1 | Ya — lingkup MVP perlu diperjelas (flag saja vs OTP nyata) |
| §4.4 Logout-all | 1 | Ya — keterbatasan arsitektur JWT stateless perlu diputuskan |
| §4.4 Notification Preferences | 1 | Ya — perlu tambahan skema DB baru |

**13 endpoint baru total** diusulkan di atas, ditambah **12 endpoint yang sudah terdokumentasi dan siap dikerjakan** (§3) — total 25 endpoint untuk membuat ke-5 prototipe UI yang sudah ada fully-functional.

---

## 6. Langkah Selanjutnya

1. Anda me-review dokumen ini (§4 khususnya) — beri keputusan untuk 5 poin yang ditandai ⚠️ butuh keputusan tambahan (§5).
2. Endpoint yang disetujui dipindahkan ke `4-APIDesign.md` sebagai bagian resmi (naik ke v1.1), mengikuti format yang sudah ada (bukan dokumen terpisah selamanya — dokumen ini sifatnya sementara/kerja).
3. Baru setelah itu, implementasi kode backend dimulai mengikuti urutan `docs/X_ProgressSummary.md` §12, dengan endpoint baru dari dokumen ini ditambahkan sebagai task backlog baru (API-27 dst.) jika disetujui.

*Dokumen ini adalah draft kerja — akan diarsipkan/dilebur begitu isinya disetujui dan dipindahkan ke `4-APIDesign.md`.*

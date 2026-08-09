# Dokumen Desain Sistem (System Design): Platform Sewa Smart Classroom

**Versi:** 1.1  
**Tanggal:** 9 Agustus 2026  
**Penulis:** System Architect / Lead Engineer  
**Status:** Draf Arsitektur Sistem Produksi  
**Dokumen Terkait:**
* [2-UseCaseDiagram.md](2-UseCaseDiagram.md) (Aksi Aktor & Flow Bisnis)
* [2-UITesting.md](2-UITesting.md) (Validasi Antarmuka Pengguna)
* [3-DBSchema.md](3-DBSchema.md) (Desain Skema Database & Redis)
* [3-DBQuery.md](3-DBQuery.md) (Optimasi Kueri SQL)
* [4-APIDesign.md](4-APIDesign.md) (Kontrak REST & MQTT)
* [4-APIBackend.md](4-APIBackend.md) (Realisasi Implementasi API)
* [X_ProgressSummary.md](../docs/X_ProgressSummary.md) (Tracking Progres & Punch List — acuan status implementasi aktual)

### Riwayat Revisi

| Versi | Bagian | Sebelum | Sesudah |
| :--- | :--- | :--- | :--- |
| 1.0 | Dokumen (keseluruhan) | — | Draf awal arsitektur sistem. |
| 1.1 | §1.2 (baru), §2.1, §2.2, §2.3.A, §3.2, §4, §5.1, tautan §2.3/§4 | Cross-check terhadap source code aktual menemukan: (1) diagram & alur MQTT/S3/Midtrans/Gemini digambarkan seolah sudah terhubung penuh, padahal baru desain target — belum ditautkan ke broker/hardware/gateway nyata pada 5 screen prototipe yang ada; (2) §2.1 mengklaim frontend dibundel Vite, padahal 5 halaman prototipe memakai Tailwind & Lucide via CDN langsung (scaffold React/Vite di repo tidak dipakai halaman-halaman ini); (3) §2.2 daftar route tidak lengkap (hilang `users.routes.js`, `subscriptions.routes.js`, seluruh `server/routes/admin/*`); (4) §5.1 RBAC memakai istilah role (`USER`/`OPERATOR`/`ADMIN`) yang tidak cocok `role_enum` di `3-DBSchema.md` maupun middleware aktual (`MEMBER`/`PREMIUM_MEMBER`/`STUDIO_ADMIN`/`SUPER_ADMIN`); (5) 2 tautan relatif rusak. | Diperbaiki langsung + ditambahkan §1.2 (status implementasi eksplisit per komponen) agar dokumen ini tidak mencampur desain target dengan realisasi aktual. |

---

## 1. Arsitektur Sistem Umum (High-Level Architecture)

Platform Sewa Smart Classroom dirancang menggunakan arsitektur modern berbasis layanan terdistribusi mikro-modular (monolitik modular di sisi backend) untuk memastikan keandalan transaksional dan sinkronisasi real-time dengan perangkat IoT di kelas fisik.

### 1.1 Diagram Kontainer Sistem

Diagram di bawah menggambarkan interaksi komponen utama pada sistem:

```mermaid
graph TD
    %% Users
    U[Pengguna / Mahasiswa / Dosen] -->|Akses Web| FE(Frontend Layer: HTML5 + Tailwind + JS)
    OP[Operator / Admin] -->|Kelola & Monitor| FE
    
    %% Frontend to Backend
    FE -->|HTTP / REST API| BE(Backend API Server: Express.js)
    
    %% Databases & Cache
    BE -->|Query SQL| DB[(Relational DB: PostgreSQL 16+)]
    BE -->|Cache, Locking, Session| RD[(In-Memory Cache: Redis 7.x)]
    
    %% IoT Devices
    BE -->|Kirim Command & Monitor| MQTT[MQTT Broker / IoT Gateway]
    MQTT <-->|Detak Jantung & Akses| LOCK[Smart Lock Device]
    MQTT <-->|Status & Sinyal| CAM[AI Camera & Audio Array]
    
    %% External Integrations
    BE -->|Proses Transaksi| PG[Payment Gateway: Midtrans]
    BE -->|Unggah Rekaman Kelas| S3[(Object Storage: AWS S3 / MinIO)]
    BE -->|Transkripsi Otomatis| AI[Google GenAI / Gemini API]
```

### 1.2 Status Implementasi vs Desain Target

Diagram di atas menggambarkan **arsitektur target penuh**. Per tanggal dokumen ini, backend hanya melayani 5 screen prototipe yang sudah ada (`index.html`, `in-room.html`, `profile.html`, `admin/dashboard.html`, `admin/rooms.html` — lihat catatan cakupan di [server/index.js](server/index.js)). Status tiap komponen pada diagram §1.1:

| Komponen | Status | Catatan |
| :--- | :--- | :--- |
| Frontend statis + Backend Express + PostgreSQL (Aiven) | **Terhubung & berjalan** | Routing lengkap di §2.2, skema live di `3-DBQuery.md`. |
| Redis — Slot Locking (§3.1) & Heartbeat/Session key | **Terhubung & berjalan** | `SET NX` di `bookings.routes.js`, key helper di `server/config/redis.js`. |
| MQTT Broker, Smart Lock, AI Camera & Audio Array (§3.2) | **Desain target, belum diimplementasikan** | Tidak ada endpoint publish/subscribe MQTT maupun pemakaian tabel `room_access_tokens` di source code. Buka pintu saat ini hanya tersedia lewat override manual admin (`POST /admin/studio/door/unlock`), tanpa hardware nyata. |
| Object Storage (S3/MinIO) | **Desain target, belum diimplementasikan** | `storage_target` pada `studio.routes.js` baru berupa string placeholder (`s3://vault/{booking_id}/`); belum ada client S3/MinIO di `package.json`. |
| Payment Gateway (Midtrans) | **Desain target, belum diimplementasikan** | Tidak ada referensi Midtrans di kode backend; alur saat ini berbasis kredit `wallet_transactions` internal (hasil refund pembatalan). |
| AI Transcription (Gemini API) | **Desain target, belum diimplementasikan** | `@google/genai` terdaftar sebagai dependency tapi belum dipanggil di `server/`. |

> Detail backlog & alasan penundaan tiap komponen di atas dilacak di `docs/X_ProgressSummary.md` (§6, §12) — bagian ini hanya merujuk status terkini, tidak menduplikasi daftar tugasnya.

---

## 2. Rincian Lapisan Arsitektur (Layer Breakdown)

### 2.1 Lapisan Presentasi (Frontend Layer)
Lapisan presentasi menggunakan arsitektur Multi-Page Application (MPA) berbasis file statis HTML. Kelima halaman prototipe memuat Tailwind & Lucide langsung lewat CDN `<script>` tag (tanpa proses build) dan memicu HTTP fetch requests langsung ke backend API.

* **Teknologi Utama**:
  * **HTML5 & Vanilla JavaScript**: Mengendalikan logika UI secara langsung tanpa overhead framework yang berat.
  * **Tailwind CSS (via CDN)**: Memastikan tampilan responsif, modern, dan konsisten (menggunakan curated theme palette untuk brand & surface, dikonfigurasi inline per halaman).
  * **Lucide Icons (via CDN)**: Pustaka ikon vektor untuk komponen visual yang kaya.
* **Catatan Stack Paralel**: Repo juga berisi scaffold **React 19 + Vite + Tailwind v4** (`src/App.tsx`, `vite.config.ts`) yang **tidak dipakai** oleh 5 halaman prototipe di bawah — dua stack front-end ini masih tumpang tindih dan belum dikonsolidasi. Jangan asumsikan halaman-halaman ini melalui proses bundling Vite.
* **Halaman Utama**:
  * [index.html](index.html): Halaman Pencarian & Katalog Kelas (Discovery).
  * [in-room.html](in-room.html): Dasbor Kontroler di dalam ruang kelas (untuk kontrol perangkat, status IoT, & recording).
  * [profile.html](profile.html): Manajemen profil pengguna, daftar transaksi dompet (wallet), riwayat langganan, dan unduhan file rekaman (Video Vault).
  * [admin/dashboard.html](admin/dashboard.html): Dashboard pemantauan statistik operasional, pendapatan, status detak jantung perangkat, audit log, dan persetujuan pengembalian dana (refund).
  * [admin/rooms.html](admin/rooms.html): Manajemen inventori ruangan, status maintenance, dan integrasi kunci pintu manual.

### 2.2 Lapisan Aplikasi (Backend Layer)
Lapisan backend dibangun menggunakan **Node.js** dengan framework **Express.js** untuk melayani seluruh API endpoint `/api/v1` secara stateless dan aman menggunakan otentikasi berbasis JWT (JSON Web Token).

* **Komponen Struktur Kode**:
  * **Config**: Koneksi database terpusat untuk PostgreSQL pool ([db.js](server/config/db.js)) dan klien Redis ([redis.js](server/config/redis.js)).
  * **Middleware**: Validasi otentikasi ([auth.js](server/middleware/auth.js)) dan standarisasi penanganan error ([errorHandler.js](server/middleware/errorHandler.js)).
  * **Routes**: Pengorganisasian endpoint modular per domain — publik/pengguna: [auth.routes.js](server/routes/auth.routes.js), [users.routes.js](server/routes/users.routes.js), [rooms.routes.js](server/routes/rooms.routes.js), [bookings.routes.js](server/routes/bookings.routes.js), [subscriptions.routes.js](server/routes/subscriptions.routes.js), [studio.routes.js](server/routes/studio.routes.js); admin: [admin/dashboard.routes.js](server/routes/admin/dashboard.routes.js), [admin/bookings.routes.js](server/routes/admin/bookings.routes.js), [admin/door.routes.js](server/routes/admin/door.routes.js), [admin/audit.routes.js](server/routes/admin/audit.routes.js), [admin/rooms.routes.js](server/routes/admin/rooms.routes.js).
  * **Utils**: Fungsi bantuan audit log keamanan, enkripsi JWT, standar respon, slug generator, dan validasi input.

### 2.3 Lapisan Data & Penyimpanan (Data & Storage Layer)

Sistem menggunakan strategi penyimpanan data hibrida untuk menjaga integritas data transaksional sekaligus melayani operasi konkurensi tinggi secara real-time.

#### A. Database Relasional: PostgreSQL 16+
Digunakan untuk menyimpan seluruh data relasional yang memerlukan kepatuhan penuh ACID (Atomicity, Consistency, Isolation, Durability). 
* Terdiri dari **19 tabel utama** (lihat detail skema lengkap di [3-DBSchema.md](3-DBSchema.md)).
* Menangani integritas data pengguna (`users`), transaksi keuangan (`wallet_transactions`, `payments`), data operasional kelas (`rooms`, `bookings`), riwayat IoT (`door_access_attempts`, `manual_unlock_logs`), data rekaman & AI (`recordings`, `ai_transcriptions`), serta audit log administratif (`audit_logs`).

#### B. Cache & In-Memory Store: Redis 7.x
Digunakan untuk mengoptimalkan kinerja dan menyediakan mekanisme kunci konkurensi (distributed lock):
1. **Concurrency Slot Locking (TTL 15 Menit)**: Mencegah tabrakan pemesanan slot jadwal kelas yang sama secara bersamaan menggunakan pola `SET NX` (`lock:room:{roomId}:{bookingDate}:{startTime}-{endTime}`).
2. **Device Heartbeat Monitor (TTL 30 Detik)**: Menyimpan status detak jantung perangkat IoT fisik secara real-time dari MQTT broker sebelum diperbarui secara berkala ke database Postgres (`iot:heartbeat:{roomId}:{deviceType}`).
3. **In-Room Controller Session**: Cache token sesi aktif sementara untuk otentikasi dashboard kelas fisik (`session:in-room:{roomId}`).

#### C. Object Storage (AWS S3 / MinIO)
Digunakan sebagai repositori penyimpanan file biner berukuran besar (Video Vault), seperti file rekaman video mentah kelas (*raw video*), rekaman hasil olah kompresi (*processed video*), serta transkrip kelas (format `.srt` dan `.json`).

---

## 3. Alur Kerja & Mekanisme Kunci (Core Mechanism Flows)

### 3.1 Pencegahan Pemesanan Ganda (Concurrency Slot Locking)

Untuk menjamin tidak ada dua pengguna yang dapat membayar slot waktu yang sama di ruangan yang sama, backend menerapkan kunci terdistribusi menggunakan Redis sebelum membuat record reservasi di PostgreSQL.

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (Client)
    participant API as Express API Server
    participant Redis as Redis Cache
    participant DB as PostgreSQL DB

    User->>API: POST /api/v1/bookings/hold (room_id, date, time)
    API->>API: Validasi input & durasi kelipatan 30 mnt
    API->>DB: Cek status ketersediaan ruangan (AVAILABLE)
    DB-->>API: Ruangan Valid
    API->>Redis: SET lock:room:{id}:{date}:{time} [EX 900, NX]
    
    alt Slot Sudah Terkunci
        Redis-->>API: Lock Gagal (null)
        API-->>User: HTTP 409 Slot Sudah Dipesan (Error: SLOT_ALREADY_LOCKED)
    else Lock Berhasil Diakuisisi
        Redis-->>API: Lock Sukses (OK)
        API->>DB: INSERT INTO bookings STATUS 'PENDING_PAYMENT'
        DB-->>API: Booking ID Dibuat (bkg-YYYYMMDD-XXXX)
        API-->>User: HTTP 201 Hold Sukses (slot_lock_expires_at)
    end
```

* **Penanganan Kegagalan**: Jika penulisan ke PostgreSQL gagal setelah lock diperoleh, blok kode `try-catch` di backend akan langsung memanggil `redis.del(lockKey)` untuk segera melepas slot agar dapat dipesan oleh pengguna lain.

### 3.2 Alur Otentikasi & Akses Pintar IoT (Smart Lock)

Akses pintu fisik di kelas didasarkan pada token akses aktif (`pin_code` atau `qr_code_content`) yang hanya valid selama rentang waktu reservasi yang dikonfirmasi (`CONFIRMED` atau `IN_ROOM`). *(Status: desain target — lihat §1.2; belum ada endpoint MQTT/hardware yang diimplementasikan.)*

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (di Pintu Kelas)
    participant Lock as Smart Lock Device
    participant Broker as MQTT Broker
    participant API as Express API Server
    participant DB as PostgreSQL DB

    User->>Lock: Input PIN / Scan QR Code
    Lock->>Broker: Publish /classroom/door/access_req (pin_code, device_id)
    Broker->>API: MQTT message forwarded to Backend
    API->>DB: Query room_access_tokens & check booking status
    
    alt Token Valid & Waktu Sesuai Booking
        DB-->>API: Data Valid (Status: CONFIRMED/IN_ROOM)
        API->>DB: INSERT INTO door_access_attempts STATUS 'SUCCESS'
        API->>Broker: Publish /classroom/door/unlock (command: UNLOCK)
        Broker->>Lock: Command diterima -> Selenoid Terbuka
        Lock-->>User: Pintu Terbuka, Silakan Masuk
    else Token Tidak Valid / Diluar Waktu Booking
        DB-->>API: Token Tidak Valid / Kedaluwarsa
        API->>DB: INSERT INTO door_access_attempts STATUS 'FAILED'
        API-->>Lock: Tolak Akses (Lampu Merah / Alarm)
    end
```

---

## 4. Integrasi Kecerdasan Buatan (AI Integration - Gemini SDK)

Sistem memanfaatkan pustaka SDK resmi `@google/genai` untuk memproses rekaman sesi perkuliahan/presentasi di dalam kelas menjadi transkrip teks berkualitas tinggi secara otomatis. *(Status: desain target — lihat §1.2; dependency sudah terdaftar di `package.json` namun belum dipanggil di kode backend.)*

1. **Trigger Aksi**: Ketika kelas berakhir atau pengguna menekan tombol "Stop Recording" di dasbor [in-room.html](in-room.html), backend memperbarui status rekaman menjadi `PROCESSING`.
2. **Prapemrosesan Audio**: Audio diekstrak dari file video rekaman kelas yang tersimpan di Object Storage.
3. **Pengolahan Gemini API**: Backend mengirimkan file audio/video tersebut ke Google Gemini model menggunakan sistem prompt yang dioptimalkan untuk transkripsi akademis dan profesional (mengacu pada modul prompt di [GEMINI_SYSTEM_PROMPT.md](../docs/GEMINI_SYSTEM_PROMPT.md)).
4. **Penyimpanan Hasil**: Output transkrip berupa file format SubRip (`.srt`) dan metadata JSON (`.json`) disimpan kembali ke Object Storage dan tautannya direkam di tabel `ai_transcriptions`.
5. **Akses Pengguna**: Pengguna dapat mengunduh transkrip dan video langsung dari tab Video Vault di halaman profil mereka.

---

## 5. Keamanan, RBAC, dan Audit Kepatuhan (Security & Audit Compliance)

Keandalan operasional dan aspek audit administratif menjadi prioritas dalam arsitektur sistem ini untuk mencegah penyalahgunaan hak akses fisik maupun finansial.

### 5.1 Role-Based Access Control (RBAC)
Sistem membagi pengguna ke dalam empat role (`role_enum`, lihat [3-DBSchema.md](3-DBSchema.md) §4), ditegakkan lewat middleware [auth.js](server/middleware/auth.js):
* **`MEMBER`**: Pengguna pay-per-use (mahasiswa, dosen, atau umum). Berhak memesan ruangan, membayar via saldo dompet, membuka pintu kelas miliknya sendiri pada jam booking, serta mengakses rekaman & transkrip kelasnya.
* **`PREMIUM_MEMBER`**: Pengguna dengan langganan (*subscription*) aktif. Hak akses sama seperti `MEMBER`, ditambah kuota booking bulanan sesuai paket langganannya (lihat alur kuota di [3-DBSchema.md](3-DBSchema.md) §5.2).
* **`STUDIO_ADMIN`**: Staf operasional/pengelola studio (`requireAdmin`). Bertanggung jawab memantau ketersediaan & utilisasi kelas (dashboard metrics/alerts), mengelola inventori ruangan & status maintenance, mencatat overtime keterlambatan checkout (`late_checkout_logs`), melakukan pembukaan pintu manual (`manual_unlock_logs`), serta memproses pembatalan booking pengguna lain (*override cancellation*) yang otomatis mengkreditkan refund ke wallet pengguna (`booking_cancellations` → `wallet_transactions`).
* **`SUPER_ADMIN`**: Pengelola tingkat tertinggi (`requireSuperAdmin`). Memiliki seluruh hak `STUDIO_ADMIN`, ditambah akses eksklusif untuk melihat seluruh audit log sistem (`GET /admin/audit-logs`).

### 5.2 Sistem Audit Log Administratif
Setiap tindakan kritis (seperti pembatalan pesanan oleh admin dan pembukaan pintu manual) wajib memanggil utilitas pencatatan audit `writeAuditLog()` ([audit.js](server/utils/audit.js)) sebelum meresponsnya sebagai sukses.
* Fungsi ini menangkap data pelaku (`actor_id`, `actor_role`), tindakan (`action`), tabel target, data perubahan (`changes_payload`), dan deskripsi aktivitas.
* Seluruh log disimpan dalam tabel `audit_logs` dan tidak dapat diubah (*immutable*), yang kemudian ditampilkan pada dasbor admin untuk mematuhi standar kepatuhan operasional.

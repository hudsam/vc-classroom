# Dokumen Spesifikasi Tech Stack: Platform Sewa Smart Classroom

**Versi:** 1.1  
**Tanggal:** 9 Agustus 2026  
**Status:** Draf Spesifikasi Produksi  
**Dokumen Terkait:**
* [5-SYSDesign.md](5-SYSDesign.md) (Rancangan Sistem & Arsitektur — lihat §1.2 untuk status implementasi per komponen)
* [3-DBSchema.md](3-DBSchema.md) (Skema Database & Redis Cache)
* [4-APIDesign.md](4-APIDesign.md) (Spesifikasi Kontrak API & IoT)

### Riwayat Revisi

| Versi | Bagian | Sebelum | Sesudah |
| :--- | :--- | :--- | :--- |
| 1.0 | Dokumen (keseluruhan) | — | Draf awal spesifikasi tech stack. |
| 1.1 | §1 (baris Vite, Tailwind, React, Node.js, MQTT, Midtrans, Google GenAI SDK) | Beberapa baris dicatat seolah sudah terintegrasi/dipakai penuh oleh 5 halaman prototipe, padahal: Vite hanya membundel scaffold React yang tidak dipakai halaman manapun (halaman prototipe memakai Tailwind/Lucide via CDN, bukan versi npm); MQTT, Midtrans, dan Google GenAI SDK terdaftar/didesain tapi belum ada pemanggilan nyata di kode backend; versi Node.js tidak benar-benar dideklarasikan di `package.json`. | Kolom "Peran / Kegunaan" diperjelas per baris agar konsisten dengan status implementasi aktual di [5-SYSDesign.md](5-SYSDesign.md) §1.2. |

---

## 1. Ringkasan Tumpukan Teknologi (Technology Stack Summary)

Tabel di bawah merangkum seluruh teknologi, pustaka (libraries), dan komponen pihak ketiga yang digunakan dalam pengembangan platform **VC-Classroom** berdasarkan `package.json` dan struktur proyek aktif.

| Kategori | Teknologi / Pustaka | Versi | Peran / Kegunaan |
| :--- | :--- | :--- | :--- |
| **Runtime & Bundler** | Node.js | `>= 20` (rekomendasi operasional — belum dideklarasikan sebagai `engines` di `package.json`) | Lingkungan runtime server (backend). |
| | Vite | `^6.2.3` | Dev-server & reverse-proxy API (`/api` -> port `4000`) untuk seluruh halaman saat `npm run dev`. **Tidak** membundel 5 halaman prototipe (`index.html`, `in-room.html`, `profile.html`, `admin/*.html`) — halaman-halaman itu tidak memiliki `<script type="module">` sama sekali. Satu-satunya kode yang benar-benar dibundel Vite adalah scaffold React di `src/` (lihat baris React di bawah). |
| | TypeScript | `~5.8.2` | Menjamin type safety pada file konfigurasi & script build (`vite.config.ts`, scaffold `src/`). |
| **Lapisan Presentasi** *(Frontend)* | HTML5 & Vanilla JavaScript | Native | Dasar rendering UI 5 halaman prototipe dan interaksi DOM dinamis (fetching API). |
| | Tailwind CSS (Play CDN) | Unversioned (`cdn.tailwindcss.com`, config inline per halaman) | Styling utility-first untuk 5 halaman prototipe — **bukan** paket npm `tailwindcss@^4.1.14` (paket itu hanya dipakai lewat `@tailwindcss/vite` untuk scaffold React yang tidak dipakai halaman manapun). |
| | Lucide Icons (CDN) | `unpkg.com/lucide@latest` | Pustaka ikon vektor untuk komponen antarmuka visual pada halaman prototipe. |
| | React & React DOM | `^19.0.1` | Scaffold di `src/App.tsx` — **belum dipakai**, tidak ada halaman HTML yang mereferensikan `src/main.tsx`; dua stack frontend ini tumpang tindih dan belum dikonsolidasi. |
| | Motion | `^12.23.24` | Pustaka animasi (Framer Motion), terpasang sebagai dependency scaffold React — sama seperti React, belum dipakai halaman prototipe. |
| **Lapisan Aplikasi** *(Backend)* | Express.js | `^4.21.2` | Framework server untuk menangani REST API Routing, HTTP requests, & CORS. |
| | JSON Web Token (JWT) | `^9.0.3` | Skema otentikasi token *stateless* untuk mengamankan endpoint API. |
| | Bcryptjs | `^2.4.3` | Pengacakan (hashing) password pengguna sebelum disimpan di database. |
| | Dotenv | `^17.2.3` | Pemuat variabel lingkungan sistem dari file konfigurasi `.env`. |
| **Lapisan Data & Cache** | PostgreSQL (RDBMS) | `16+` | Database transaksional utama untuk data relasional terstruktur (ACID). |
| | node-postgres (`pg`) | `^8.23.0` | Driver database PostgreSQL untuk eksekusi query dari Node.js. |
| | Redis | `7.x` | In-memory database untuk kunci konkurensi, detak jantung IoT, & cache sesi. |
| | ioredis | `^5.11.1` | Driver/client Redis berkinerja tinggi untuk aplikasi Node.js. |
| **Integrasi Eksternal & IoT** *(desain target, belum diimplementasikan — lihat [5-SYSDesign.md](5-SYSDesign.md) §1.2)* | Google GenAI SDK | `^2.4.0` | Terdaftar sebagai dependency untuk transkripsi Gemini AI, tapi belum ada pemanggilan SDK ini di kode `server/`. |
| | Protokol MQTT | — (belum ada library MQTT di `package.json`) | Didesain sebagai protokol pub/sub untuk komunikasi real-time perangkat IoT; belum ada endpoint publish/subscribe nyata di backend. |
| | Midtrans API | REST API (belum diintegrasikan) | Didesain sebagai gerbang pembayaran; belum ada referensi Midtrans di kode backend — alur saat ini berbasis kredit `wallet_transactions` internal. |
| | Object Storage (AWS S3 / MinIO) | Belum ada client di `package.json` | Didesain sebagai repositori Video Vault (rekaman & transkrip); `storage_target` pada `studio.routes.js` baru berupa string placeholder (`s3://vault/{booking_id}/`), belum ada upload nyata. |

---

## 2. Struktur Lingkungan Pengoperasian (Runtime & Development Environment)

### 2.1 Konfigurasi Port
* **Frontend Dev Server (Vite)**: Berjalan di port `3000` (dapat diakses via host `0.0.0.0` untuk pengujian lintas perangkat).
* **Backend API Server (Express.js)**: Berjalan di port `4000` dengan base path `/api/v1`.

### 2.2 Penanganan Proxy API
Vite dikonfigurasi melalui `vite.config.ts` untuk membelokkan seluruh request frontend yang mengarah ke `/api` langsung ke server backend lokal di `http://localhost:4000` guna menghindari masalah CORS (Cross-Origin Resource Sharing) selama proses development.

### 2.3 Manajemen Sesi & Keamanan
* Otentikasi dilakukan menggunakan header `Authorization: Bearer <JWT_TOKEN>`.
* Password disimpan dalam bentuk hash `bcrypt` satu arah dengan *salt rounds* standar industri keamanan.
* Redis mengelola distributed lock untuk pemesanan slot waktu dengan durasi kadaluwarsa (TTL) otomatis selama **15 menit** (`900` detik).

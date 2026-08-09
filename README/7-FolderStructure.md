# Dokumen Struktur Folder (Folder Structure): Platform Sewa Smart Classroom

**Versi:** 1.1  
**Tanggal:** 9 Agustus 2026  
**Status:** Draf Dokumentasi Struktur Kode  
**Dokumen Terkait:**
* [5-SYSDesign.md](5-SYSDesign.md) (Rancangan Sistem & Arsitektur — lihat §1.2 & §2.1 untuk status implementasi frontend)
* [6-TechnologyStack.md](6-TechnologyStack.md) (Spesifikasi Tech Stack)

### Riwayat Revisi

| Versi | Bagian | Sebelum | Sesudah |
| :--- | :--- | :--- | :--- |
| 1.0 | Dokumen (keseluruhan) | — | Draf awal dokumentasi struktur folder. |
| 1.1 | §1 (`server/routes/admin/`, `src/`, `admin/rooms.html`, root), §2 (`src/`) | `server/routes/admin/` tidak merinci isinya (tidak konsisten dengan file lain yang dirinci satu-satu); komentar `src/` & `admin/rooms.html` belum menegaskan status "belum dipakai/bukan darurat sungguhan" sesuai temuan cross-check di `5-SYSDesign.md` §1.2 & §2.1; `metadata.json` (konfigurasi Google AI Studio) belum tercantum di pohon direktori; typo "Definis" pada komentar `routes/`; `src/` tidak dijelaskan di §2. | Diperbaiki & dilengkapi langsung. |

---

## 1. Pohon Direktori Proyek (Directory Tree)

Berikut adalah visualisasi struktur direktori utama dari repositori proyek **VC-Classroom**:

```text
vc-classroom/
├── admin/                     # Frontend: Halaman Khusus Peran Administrator
│   ├── dashboard.html         # Dasbor analisis & statistik operasional admin
│   └── rooms.html             # Manajemen inventori ruangan & override buka pintu manual
├── assets/                    # Aset Statis & Konfigurasi IDE/Studio
│   └── .aistudio/             # File konfigurasi Workspace AI Studio
├── docs/                      # Dokumen Kebutuhan Bisnis & Spesifikasi Produk (PRD/FRD)
│   ├── 01_ProductDiscovery.md
│   ├── 02_ProductRequirementDocument.md
│   ├── 03_FunctionalRequirementDocument.md
│   ├── 04_InformationArchitecture.md
│   ├── GEMINI_SYSTEM_PROMPT.md
│   └── X_ProgressSummary.md   # Catatan perkembangan fitur & pelacakan tugas
├── README/                    # Dokumen Desain Teknis & Panduan Pengembang
│   ├── 2-UseCaseDiagram.md
│   ├── 2-UITesting.md
│   ├── 3-DBSchema.md
│   ├── 3-DBQuery.md
│   ├── 4-APIDesign.md
│   ├── 4-APIBackend.md
│   ├── 5-SYSDesign.md
│   ├── 6-TechnologyStack.md
│   └── 7-FolderStructure.md   # [DOKUMEN INI]
├── server/                    # Backend Source Code (Express.js API Server)
│   ├── config/                # Inisialisasi pool koneksi database (Postgres & Redis)
│   │   ├── db.js
│   │   └── redis.js
│   ├── middleware/            # Proteksi otentikasi (JWT) & handler kesalahan global
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/                # Definisi rute & endpoint REST API (/api/v1)
│   │   ├── admin/             # Rute khusus role STUDIO_ADMIN/SUPER_ADMIN
│   │   │   ├── audit.routes.js    # Audit log (khusus SUPER_ADMIN)
│   │   │   ├── bookings.routes.js # Denda keterlambatan checkout (late-checkout)
│   │   │   ├── dashboard.routes.js# Metrics & alert operasional
│   │   │   ├── door.routes.js     # Override buka pintu manual
│   │   │   └── rooms.routes.js    # CRUD inventori ruangan
│   │   ├── auth.routes.js
│   │   ├── bookings.routes.js
│   │   ├── rooms.routes.js
│   │   ├── studio.routes.js   # Kontrol in-room, status IoT, & recording
│   │   ├── subscriptions.routes.js
│   │   └── users.routes.js
│   ├── utils/                 # Fungsi pustaka pembantu (helper utilities)
│   │   ├── audit.js           # Pencatatan log keamanan & kepatuhan audit
│   │   ├── jwt.js
│   │   ├── response.js        # Format standar respon HTTP
│   │   ├── slug.js
│   │   ├── subscription.js
│   │   └── validate.js
│   └── index.js               # Entry point Express API Server
├── src/                       # Scaffold React + Vite — TIDAK dipakai 5 halaman prototipe (lihat 5-SYSDesign.md §2.1)
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html                 # Frontend: Halaman Katalog & Pencarian Kelas (Discovery)
├── in-room.html               # Frontend: Dasbor Kontrol Perangkat & Sesi di dalam Kelas
├── profile.html               # Frontend: Profil, Riwayat Pembayaran, & Video Vault (Unduhan)
├── metadata.json               # Konfigurasi proyek Google AI Studio (capability & permission)
├── tsconfig.json              # Konfigurasi Compiler TypeScript
├── vite.config.ts             # Konfigurasi bundling Vite & API Proxy
└── package.json               # Manifest dependencies & npm scripts proyek
```

---

## 2. Penjelasan Peran Folder Utama

1. **Root Directory (`/`)**: 
   Menyimpan halaman web utama klien (katalog, profil, dasbor kelas), konfigurasi build sistem (`vite.config.ts`, `tsconfig.json`), serta deklarasi paket dependensi proyek (`package.json`).
2. **`admin/`**: 
   Menampung file antarmuka web khusus untuk role `STUDIO_ADMIN`/`SUPER_ADMIN` — memantau operasional, mengelola inventori ruangan, dan melakukan override buka pintu manual (lihat RBAC di [5-SYSDesign.md](5-SYSDesign.md) §5.1).
3. **`docs/` & `README/`**: 
   Dua folder terpisah untuk dokumentasi. `docs/` berfokus pada manajemen produk dan alur bisnis. Sementara `README/` berfokus pada visualisasi teknis, arsitektur sistem, dan referensi skema bagi *developer*.
4. **`server/`**: 
   Lapisan logika bisnis backend yang terbagi secara modular menjadi *Configuration*, *Middleware*, *Routes (API Controllers)*, dan *Utilities*. Hal ini memudahkan pemeliharaan kode (maintainability) dan pemisahan tugas secara terstruktur (Separation of Concerns).
5. **`src/`**: 
   Scaffold **React 19 + Vite** yang disediakan workspace tapi **belum dipakai** — tidak ada satu pun dari 5 halaman prototipe (`index.html`, `in-room.html`, `profile.html`, `admin/*.html`) yang memuat `src/main.tsx`. Dua stack frontend ini (HTML statis + CDN vs React/Vite) masih tumpang tindih dan belum dikonsolidasi; lihat status detailnya di [5-SYSDesign.md](5-SYSDesign.md) §2.1 dan [6-TechnologyStack.md](6-TechnologyStack.md) §1.

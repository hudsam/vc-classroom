# Dokumen Peta Jalan Pengembangan (Development Roadmap): Platform Sewa Smart Classroom

**Versi:** 1.0  
**Tanggal:** 9 Agustus 2026  
**Status:** Draf Peta Jalan Teknis  
**Dokumen Terkait:**
* [5-SYSDesign.md](5-SYSDesign.md) (Rancangan Sistem & Arsitektur)
* [6-TechnologyStack.md](6-TechnologyStack.md) (Spesifikasi Tech Stack)
* [7-FolderStructure.md](7-FolderStructure.md) (Struktur Folder Proyek)
* [X_ProgressSummary.md](../docs/X_ProgressSummary.md) (Rincian Progres & Backlog Asli)

---

## 1. Fase Pengembangan Sistem (Development Phases)

Pengembangan platform **VC-Classroom** dibagi menjadi 5 fase berurutan guna menjamin keselarasan antara kebutuhan bisnis, desain database, logika backend, dan antarmuka pengguna.

```mermaid
gantt
    title Lini Masa Proyek VC-Classroom (2026)
    dateFormat  YYYY-MM-DD
    section Fase 1
    Analisis & Discovery (docs/)       :done,    des1, 2026-07-01, 2026-07-15
    section Fase 2
    Skema DB & UI Prototypes (README/)  :done,    des2, 2026-07-16, 2026-07-31
    section Fase 3
    Backend API Server (Express)       :active,  des3, 2026-08-01, 2026-08-10
    section Fase 4
    Integrasi Frontend (Fetch Hookup)  :todo,    des4, 2026-08-11, 2026-08-20
    section Fase 5
    Pengujian Live & Deployment        :todo,    des5, 2026-08-21, 2026-08-30
```

---

## 2. Status Implementasi Fitur & Rencana Kerja

### 2.1 Fase 1: Analisis & Penemuan Produk (Selesai - 100%)
* **Hasil**: Penyusunan dokumen discovery bisnis, PRD (Product Requirement Document), FRD (Functional Requirement Document), dan IA (Information Architecture) yang terletak di folder `docs/`.
* **Output Kunci**: Matriks RBAC (5 Peran), Spesifikasi Harga Add-on, Ketentuan Refund, dan Alur Pemesanan Kelas.

### 2.2 Fase 2: Desain Database & Prototipe Antarmuka (Selesai - 100%)
* **Hasil**: 
  * Pembuatan 5 halaman HTML statis dengan data dummy (`index.html`, `in-room.html`, `profile.html`, serta Admin Dashboard & Rooms).
  * Penyusunan skema RDBMS PostgreSQL berisi 19 tabel dan kueri SQL dasar ([3-DBSchema.md](3-DBSchema.md), [3-DBQuery.md](3-DBQuery.md)).
  * Penulisan kontrak awal API REST & MQTT ([4-APIDesign.md](4-APIDesign.md)).

### 2.3 Fase 3: Pembuatan REST API Backend (Sedang Berjalan - 90%)
Fase ini memfokuskan pada penulisan logika Express.js backend untuk melayani 5 halaman prototipe yang ada.
* **Sudah Diimplementasikan (Selesai)**:
  * Inisialisasi struktur folder server, penanganan CORS, error handling global, & utilitas JWT.
  * API Registrasi/Login (`/auth/register`, `/auth/login`).
  * API Katalog Kelas dengan filter kapasitas & fasilitas (`GET /rooms`).
  * API Pemesanan Hold Slot Terdistribusi dengan Redis (`POST /bookings/hold`).
  * API Bootstrap Dashboard Kelas & Aksi Rekaman (`GET /studio/session`, `/record/action`).
  * API Langganan & Kuota (`GET /subscriptions/{user_id}/quota`).
  * API Dashboard Admin & Audit Logs (`GET /admin/dashboard/metrics`, `/admin/audit-logs`).
* **Sisa Rencana Fase 3**:
  * Konfigurasi `.env` asli untuk menghubungkan server Express ke live PostgreSQL (Aiven) dan Live Redis.

### 2.4 Fase 4: Integrasi Frontend & API Fetch (Akan Datang)
Mengganti seluruh data statis/dummy di halaman HTML dengan pemanggilan fetch API riil dari backend.
* **Target Kerja**:
  * Mengintegrasikan `index.html` dengan `GET /rooms`.
  * Mengintegrasikan `in-room.html` dengan `/studio/session` dan pemicu `/record/action`.
  * Mengintegrasikan `profile.html` dengan `/users/me` dan status kuota langganan.
  * Mengintegrasikan halaman admin dengan dashboard metrik dan logs operasional asli.
  * Penerapan handling error visual berdasarkan 9 error-code user-facing dari FRD §8.

### 2.5 Fase 5: Pengujian Live & Deployment (Akan Datang)
* **Target Kerja**:
  * Menghubungkan client MQTT backend ke IoT smart lock fisik.
  * Pengujian end-to-end (Smoke Testing) API terhadap database PostgreSQL & Redis terdistribusi yang aktif.
  * Pengujian integrasi transkripsi otomatis audio/video rekaman kelas ke model Gemini API.
  * Deployment bundel produksi ke staging/cloud hosting.

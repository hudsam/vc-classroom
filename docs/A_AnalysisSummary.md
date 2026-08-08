# Ringkasan Tahap Analisis: Platform Sewa Smart Classroom
**Tipe Dokumen:** Cross-Document Summary (bukan pengganti 4 dokumen sumber)
**Tanggal:** 8 Agustus 2026
**Disusun Setelah:** Analisis & koreksi terhadap `01_ProductDiscovery.md`, `02_ProductRequirementDocument.md`, `03_FunctionalRequirementDocument.md`, `04_InformationArchitecture.md`
**Tujuan:** Memberi satu titik baca cepat sebelum tim masuk ke tahap **Desain UI/UX**, sekaligus daftar tindakan prioritas agar proses jangka pendek menuju MVP tidak terhambat oleh gap yang masih tersisa antar dokumen.

> **Update tindak lanjut (siklus 1 — P0-1 & P0-2):** PRD naik ke v1.2 (NFR kini ber-ID, Success Metrics & Milestone disinkronkan ke PD, Bagian 10 dipulihkan, FR-09 ditambahkan) dan FRD naik ke v1.2 (traceability Modul 7 dialihkan dari NFR-S03/gap ke FR-09).
>
> **Update tindak lanjut (siklus 2 — P0-3, P1-4, P1-5, P1-6):** PD naik ke v1.2 (§8.1 tabel kerja penentuan harga, §8.2 draft kontekstual kebijakan refund subscription); FRD naik ke **v1.3** (Late Checkout Penalty diputuskan keluar dari MVP dan ditangani manual oleh petugas Ops; catatan penundaan endpoint quota/vault ke sesi backend); IA naik ke v1.2 (screen 1.6 Kebijakan & Ketentuan ditambahkan; tabel Cakupan Screen Hierarchy ditambahkan agar Temuan #6 tidak berulang).
>
> **Update tindak lanjut (siklus 3 — P1-4 tuntas, P1-5 tuntas untuk cakupan minimal):** PD naik ke **v1.3** (harga final dari §8.1 dipindahkan ke ringkasan §8 utama, menutup inkonsistensi "indikatif" yang tertinggal). IA naik ke **v1.3** (H-05 s/d H-13 ditambahkan — Subscription, Account Profile, dan 7 screen Admin Portal — menuntaskan cakupan minimal P1-5; tabel §4.0 kini 13/28 Done). Detail progres ada di §6.

> Dokumen ini **tidak menggantikan** keempat dokumen sumber — setiap klaim di sini merujuk balik ke bagian aslinya. Jika ada perbedaan, dokumen sumber yang menjadi acuan sah.

---

## 1. Peta Dokumen

| # | Dokumen | Versi | Menjawab | Target Audiens Utama |
| :--- | :--- | :--- | :--- | :--- |
| 01 | `01_ProductDiscovery.md` (PD) | **1.3** | **WHY** — Visi, persona, JTBD, kompetitor, SWOT, model bisnis (harga final + draft kebijakan refund subscription), roadmap kuartalan | Bisnis, PM, UI/UX, Engineering |
| 02 | `02_ProductRequirementDocument.md` (PRD) | 1.2 | **WHAT** — Scope (kini termasuk Manajemen Akun), 9 Functional Requirements (+FR-09), Non-Functional Requirements ber-ID, Success Metrics, User Stories & AC | PM, Engineering, QA |
| 03 | `03_FunctionalRequirementDocument.md` (FRD) | 1.3 | **HOW (system & logic)** — Modul fitur teknis (Modul 7 kini resmi ditelusuri ke FR-09), workflow, RBAC, kontrak API, validasi data, business rules (Late Checkout kini manual-MVP), error handling | Engineering, IoT Engineer, QA |
| 04 | `04_InformationArchitecture.md` (IA) | **1.3** | **HOW (navigasi & struktur)** — Sitemap (+1.6 Kebijakan & Ketentuan), navigation flow, 13/28 screen hierarchy Done (+tabel cakupan §4.0), user/task flow, implikasi permission ke UI | UI/UX Designer, Frontend Engineer |

Rantai baca yang benar: **PD → PRD → FRD → IA → (tahap berikutnya) Desain UI/UX**. Setiap dokumen sudah menegaskan prinsip anti-redundansi masing-masing (lihat §1 di tiap dokumen) — dokumen ini merangkumnya tanpa mengulang isi penuh.

---

## 2. Ringkasan per Dokumen

### 2.1 Product Discovery (PD)
* **Visi:** Ekosistem smart classroom yang mendemokratisasi akses teknologi pengajaran (booking mandiri, rekaman otomatis, live streaming).
* **3 Persona:** Dr. Aris (dosen independen), Siti Rahma (corporate trainer), Bima Utama (content creator) — masing-masing dipetakan ke JTBD terkait (§5.1 PD).
* **3 Problem (P1-P3):** aksesibilitas studio terbatas, kompleksitas otomasi rekaman, kebutuhan kelas insidental/blended — dipetakan 1:1 ke solusi produk.
* **Model bisnis:** Pay-per-use — **harga final** Rp150rb (Small) / Rp250rb (Medium) / Rp350rb (Large) per jam, disetujui 8 Ags 2026; Subscription 3 tier — **harga final** Basic Rp1,2jt / Pro Rp4,9jt / Enterprise Rp11,9jt per bulan; add-on (transkripsi AI, storage, live streaming multi-platform).
* **§8.1 Tabel Kerja Penentuan Harga:** worksheet penentuan harga — sudah **selesai diisi & disetujui** tim bisnis, dipertahankan sebagai jejak audit dasar perhitungan (acuan kompetitor, estimasi biaya operasional, margin).
* **§8.2 Kebijakan Refund Subscription (baru, draft kontekstual):** kerangka awal — 100% refund dalam 30 hari pertama aktivasi, tidak ada refund setelahnya, plus alur komunikasi & eskalasi. Ditandai tegas belum final, menunggu validasi bisnis/legal sebelum masuk halaman Kebijakan & Ketentuan (IA 1.6).
* **Roadmap:** Q3 2026 Foundation & MVP (booking core, payment dasar, IoT gateway, rekaman dasar, Beta Launch 1 lokasi) → Q4 2026 Enhancement & AI (in-room controller, AI transcription, subscription wallet) → Q1 2027 Scale (multi-lokasi, integrasi LMS, B2B portal).

### 2.2 Product Requirement Document (PRD)
* **Scope MVP:** Manajemen akun & autentikasi, web app responsive, booking & payment self-service, integrasi smart lock, in-room controller, auto-recording + transkripsi dasar. **Out of scope Fase 1:** aplikasi mobile native, pengadaan hardware, integrasi LMS enterprise, marketplace tutor, *pembatalan manual via admin*.
* **9 Functional Requirements (FR-01 s/d FR-09):** Eksplorasi Ruang, Engine Reservasi, Gateway Pembayaran, Integrasi Smart Lock, In-Room Controller, Penyimpanan Cloud, AI Transkripsi, Manajemen Kuota, **Manajemen Akun & Autentikasi Pengguna (FR-09 — baru di v1.2)**.
* **Non-Functional Requirements (kini ber-ID):** performa `NFR-P01-P04` (response time, concurrency, IoT latency, video processing time), keamanan `NFR-S01-S03` (token time-bound, TLS 1.3/AES-256, OAuth2/JWT), keandalan `NFR-R01-R02` (uptime 99.5%, local caching fail-safe).
* **Success Metrics:** Success Access Rate (>99%, ref. NFR-P03), Booking Completion Rate (>75%), Video Auto-Sync Time (<15 menit, ref. NFR-P04/NFR-R02), Classroom Utilization Rate (>30%/bulan).
* **3 User Story + AC:** Pemesanan & Pembayaran, Masuk via Smart Lock, Kontrol Perekaman.
* **Risiko utama:** internet down saat sesi, smart lock gagal karena listrik mati, pembatalan mendadak — masing-masing sudah punya mitigasi.
* **§10 Keterkaitan Antar Dokumen:** tabel *source of truth* + rekomendasi anti-redundansi jangka pendek/menengah/panjang.

### 2.3 Functional Requirement Document (FRD)
* **7 Modul, 15 Fitur Teknis (FEAT-xx):** Catalog, Booking Engine (+ Cancellation & Refund Engine), Payment Gateway, IoT Smart Lock, In-Room Controller, Cloud Video Vault, **User & Access Management (kini resmi ditelusuri ke FR-09)**.
* **4 Workflow end-to-end:** Booking & Pembayaran, Akses IoT & Kontrol Rekaman, Cloud Upload & AI Transcription, Pembatalan & Refund.
* **RBAC 5 role:** Guest, Member, Premium Member, Studio Admin, Super Admin — 8 baris permission termasuk *Cancel Own Booking*.
* **9 kontrak/ringkasan API** (REST + kanal MQTT untuk IoT), termasuk endpoint Cancel Booking yang baru.
* **Validasi data & 5 Business Rule** (access window buffer, cancellation policy, **late checkout penalty — kini ditangani manual oleh petugas Ops untuk MVP, bukan otomatis via sensor**, max concurrent lock, cancellation guard).
* **9 skenario Error Handling** dengan HTTP status, pesan user-facing, dan fail-safe.

### 2.4 Information Architecture (IA)
* **Sitemap 28 screen** dalam 5 area (Public, Booking Engine, User Dashboard, In-Room Controller, Admin Portal) — termasuk **1.6 Kebijakan & Ketentuan (baru, placeholder)** untuk menampung kebijakan refund subscription dari PD §8.2.
* **Navigation Flow** memisahkan eksplisit kanal fisik (QR di Smart Lock) vs kanal digital (WiFi → In-Room Dashboard), plus jalur pembatalan & fallback kuota habis.
* **13 dari 28 screen (46%)** sudah punya *content hierarchy* detail: Catalog (H-01), In-Room Controller (H-02), Checkout (H-03), Cloud Video Vault (H-04), Subscription (H-05), Account Profile (H-06), dan seluruh 7 screen Admin Portal (H-07 s/d H-13) — menuntaskan cakupan minimal P1-5. **§4.0 Tabel Cakupan Screen Hierarchy** melacak status Done/Pending seluruh 28 screen agar gap serupa Temuan #6 tidak lagi lolos tanpa disadari.
* **2 User Flow** (Discovery→Checkout, Cancellation & Refund) dan **3 Task Flow** mikro (Buka Pintu, Kontrol Rekaman, Pembatalan Mandiri).
* **§7 Permission & Access Notes:** menerjemahkan RBAC FRD menjadi keputusan show/hide/disable per screen untuk desainer.

---

## 3. Traceability End-to-End (Contoh Rantai Utuh)

Tabel ini membuktikan keempat dokumen benar-benar tersambung dari alasan bisnis sampai ke layar — berguna sebagai peta cepat saat desainer/engineer butuh konteks "kenapa fitur ini ada".

| Persona (PD) | JTBD (PD) | FR (PRD) | Fitur Teknis (FRD) | Screen (IA) |
| :--- | :--- | :--- | :--- | :--- |
| Dr. Aris, Siti Rahma, Bima | JTBD 1: Pemesanan & Akses | FR-01, FR-02, FR-03, FR-04 | FEAT-CAT-01/02, FEAT-BKG-01/02, FEAT-PAY-01, FEAT-IOT-01/02 | 1.2, 2.1-2.4, H-03, 3.3 |
| Siti Rahma, Bima | JTBD 2: Perekaman & Kontrol | FR-05 | FEAT-CTL-01/02 | 4.1-4.4 (H-02) |
| Dr. Aris, Bima | JTBD 3: Pasca Perekaman | FR-06, FR-07 | FEAT-VLT-01/02 | 3.4 (H-04) |
| *(seluruh persona, lintas JTBD)* | — | FR-08 | FEAT-PAY-02 | 3.5, opsi bayar di H-03 |
| *(seluruh persona)* | — | FR-09 | FEAT-USR-01/02 | 1.4, 3.6, 5.7 |
| *(seluruh persona)* | — | *(diturunkan dari Business Rule PRD §8.1/FRD §7.2, bukan FR eksplisit)* | FEAT-BKG-03 | 3.2, 3.7 |

---

## 4. Temuan Kritis

Beberapa gap berikut **sudah teridentifikasi** selama proses analisis dokumen 01-04. Status terkini ditandai per baris — lihat §6 untuk log tindak lanjut yang lebih rinci per langkah perbaikan.

| # | Temuan | Dampak jika Dibiarkan | Dokumen Terdampak | Status |
| :--- | :--- | :--- | :--- | :---: |
| 1 | ~~PRD §5 (NFR) belum memiliki ID individual per butir~~ — **sudah diperbaiki**: NFR-P01-P04, NFR-S01-S03, NFR-R01-R02 ditambahkan di PRD v1.2. | ~~Engineer tidak menemukan definisi persis ID yang dirujuk FRD.~~ | PRD §5, FRD §2 & §6 | ✅ Selesai |
| 2 | ~~PRD §6 & §9 belum sinkron tanggal dengan roadmap PD §9~~ — **sudah diperbaiki**: tanggal IoT Smart Lock & Payment Gateway Integration disamakan, task AI Transcription dipisah, PRD §10 dipulihkan. | ~~Tim mengacu tanggal berbeda saat sprint planning.~~ | PRD §9, PD §9 | ✅ Selesai |
| 3 | ~~Tidak ada FR resmi untuk User & Access Management~~ — **sudah diperbaiki**: FR-09 ditambahkan di PRD §4, traceability FRD §2.7 dialihkan dari NFR-S03/gap ke FR-09; PRD §3.1 & Scope Matrix juga diperbarui. | ~~Tim backend tidak punya acceptance criteria resmi untuk fondasi akun pengguna.~~ | PRD §3, §4; FRD §2, §2.7 | ✅ Selesai |
| 4 | ~~Business Rule "Late Checkout Penalty" (FRD §7.3) mengasumsikan mekanisme deteksi kehadiran (occupancy sensor) yang tidak ada di modul fitur manapun.~~ — **sudah diputuskan**: dikeluarkan dari cakupan MVP, deteksi & penindakan dilakukan manual oleh petugas Ops untuk sementara; otomasi sensor jadi opsi pasca-MVP. | ~~Rule tidak bisa diimplementasikan sampai ada keputusan.~~ | FRD §7.3 | ✅ Selesai (diputuskan) |
| 5 | ~~Harga sewa & seluruh angka monetisasi di PD §8 masih ditandai indikatif, belum divalidasi riset pasar.~~ — **sudah diperbaiki**: harga pay-per-use & subscription final, disetujui tim bisnis 8 Ags 2026 (PD §8, §8.1). Kebijakan refund pay-per-use per sesi tetap final di FRD §7.2; kebijakan refund **subscription** sengaja tetap draft kontekstual (PD §8.2) — bukan gap, karena teks finalnya baru dituntaskan saat halaman Kebijakan & Ketentuan (IA 1.6) dibangun. | ~~Tim Sales/Finance bisa menagih ekspektasi harga final padahal belum ada keputusan bisnis resmi.~~ | PD §8, FRD §7.2 | ✅ Selesai |
| 6 | ~~IA baru mendetailkan content hierarchy untuk 4 dari 28 screen pada sitemap.~~ — **sudah diperbaiki untuk cakupan minimal**: 13 dari 28 screen (46%) kini Done, mencakup seluruh Admin Portal + Subscription + Account Profile sesuai P1-5. 15 screen sisanya (area Public/Guest & alur dasar Booking/Dashboard yang lebih sederhana) tetap pekerjaan lanjutan tim UI/UX, kini tercatat eksplisit di tabel §4.0 (lihat P2-9). | ~~Cakupan kerja desain jauh lebih luas dari yang sudah dirinci; gap tidak ter-track.~~ | IA §4 | ✅ Selesai (cakupan minimal) |

---

## 5. Checklist Siap-Desain (Definition of Ready untuk UI/UX)

| Syarat | Status | Catatan |
| :--- | :---: | :--- |
| Sitemap lengkap & konsisten dengan fitur FRD | ✅ | 28 screen, termasuk cancellation, admin portal & placeholder Kebijakan/Ketentuan |
| RBAC diterjemahkan ke implikasi UI (show/hide/disable) | ✅ | IA §7 |
| Minimal 1 screen kunci per modul utama sudah punya content hierarchy sebagai contoh pola | ✅ | H-01 s/d H-04 |
| Seluruh error state & business rule punya pesan user-facing siap pakai | ✅ | FRD §8 (9 skenario) |
| Semua ID fitur (FR/FEAT) yang disebut di IA punya definisi valid di FRD/PRD | ✅ | FEAT-USR-01/02 kini ditelusuri resmi ke FR-09 (Temuan #3 selesai) |
| Tanggal roadmap & milestone konsisten lintas dokumen | ✅ | Temuan #2 selesai — PRD §9 sudah disamakan dengan PD §9 |
| Harga & kebijakan bisnis (tier, pay-per-use) sudah final | ✅ | Temuan #5 selesai — harga final di PD §8, disetujui 8 Ags 2026. Kebijakan refund subscription (PD §8.2) tetap draft kontekstual secara sengaja, tidak menghalangi desain wireframe halaman 1.6. |

**Kesimpulan:** Tim UI/UX **sudah bisa mulai** wireframing/mockup untuk **13 screen** yang sudah dirinci (Catalog, In-Room Controller, Checkout, Video Vault, Subscription, Account Profile, seluruh Admin Portal) mengikuti pola sitemap + RBAC yang sudah solid — termasuk alur akun/registrasi (1.4, 3.6), harga final (Pricing, Checkout), dan late checkout penalty yang tidak lagi jadi dependency blocking (ditangani manual). Sisa 15 screen (didominasi Public/Guest & alur dasar) tercatat eksplisit di tabel IA §4.0 sebagai pekerjaan lanjutan — tidak ada lagi risiko gap tersembunyi.

---

## 6. Rekomendasi Prioritas & Tracking Perbaikan (Punch List Menuju MVP)

Tabel ini adalah log tindak lanjut yang dapat dilacak (*trace-able*) — setiap baris punya ID tetap, status terkini, dan bukti perbaikan (dokumen + bagian yang berubah) agar progres mudah diaudit dari waktu ke waktu tanpa perlu membaca ulang seluruh riwayat percakapan.

### P0 — Blocker, selesaikan sebelum sprint planning teknis

| ID | Item | Status | Dokumen Terdampak | Bukti / Catatan Perbaikan |
| :--- | :--- | :---: | :--- | :--- |
| P0-1 | Sinkronkan PRD §5 (NFR) & §9 (Milestones) dengan ID dan tanggal yang sudah dipakai FRD/PD (Temuan #1, #2). | ✅ Selesai | PRD →v1.2 (§5, §6, §9, §10 dipulihkan) | NFR-P01-P04/S01-S03/R01-R02 ditambahkan; Success Metrics merujuk ID spesifik; tanggal IoT Smart Lock & Payment Gateway Integration disamakan dengan PD §9; task AI Transcription dipisah dari In-Room Controller. |
| P0-2 | Tambahkan FR resmi untuk User & Access Management di PRD (Temuan #3). | ✅ Selesai | PRD →v1.2 (§3.1, Scope Matrix, §4); FRD →v1.2 (§2, §2.7) | **FR-09 (Manajemen Akun & Autentikasi Pengguna)** ditambahkan di PRD §4; bullet Scope §3.1 & baris Scope Matrix ditambahkan; FRD §2 Feature Module Matrix dan §2.7 dialihkan dari "NFR-S03 (gap PRD)" menjadi FR-09. |
| P0-3 | Putuskan nasib "Late Checkout Penalty" — spesifikasikan sensor occupancy sebagai fitur baru, atau keluarkan rule ini dari cakupan MVP (Temuan #4). | ✅ Selesai | FRD §7.3 | **Keputusan bisnis:** dikeluarkan dari cakupan MVP. Deteksi & penindakan keterlambatan checkout dilakukan **manual oleh petugas Ops** di lokasi (dicatat via panel admin 5.1/5.6), bukan otomatis via sensor. Otomasi sensor occupancy dicatat sebagai opsi peningkatan pasca-MVP, tidak lagi memblokir rilis. |

### P1 — Selesaikan sebelum desain visual final / sebelum coding sprint berjalan penuh

| ID | Item | Status | Dokumen Terdampak | Bukti / Catatan Perbaikan |
| :--- | :--- | :---: | :--- | :--- |
| P1-4 | Validasi harga sewa & kebijakan refund bersama tim bisnis, satukan angkanya di PD §8 dan FRD §7.2 (Temuan #5). | ✅ Selesai | PD →v1.3 (§8, §8.1, §8.2) | **Harga final disetujui** (Senior PM & Finance, 8 Ags 2026): pay-per-use Small/Medium/Large Rp150rb/250rb/350rb per jam; subscription Basic/Pro/Enterprise Rp1,2jt/4,9jt/11,9jt per bulan — dipindahkan dari worksheet §8.1 ke ringkasan §8 utama (inkonsistensi "indikatif" yang sempat tertinggal sudah ditutup). Kebijakan refund subscription (§8.2) **tetap draft kontekstual secara sengaja** — bukan bagian yang harus "selesai", karena teks finalnya menunggu pembangunan halaman Kebijakan & Ketentuan (IA 1.6). Refund pay-per-use per sesi tidak diubah (tetap FRD §7.2). |
| P1-5 | Lanjutkan content hierarchy untuk sisa screen di IA §4 — **cakupan minimal: Admin Portal, Subscription, Account Profile** (Temuan #6). | ✅ Selesai (cakupan minimal) | IA →v1.3 (§4.0, §4.5-§4.13) | Ditambahkan **H-05 s/d H-13** (9 screen: Subscription, Account Profile, dan seluruh 7 screen Admin Portal — Ops Dashboard, Room Management, Hardware Status, Manual Unlock, Audit Logs, Booking & Refund Management, User & Role Management), mengikuti pola H-01-H-04 secara konsisten (route path, breakdown bernomor, rujukan FR/FEAT/error code, catatan akses RBAC per screen). Tabel §4.0 diperbarui jadi 13/28 Done. **Satu catatan jujur ditambahkan** di H-11 (Audit Logs): FRD §4 RBAC belum eksplisit mendefinisikan permission untuk log audit — ditandai sebagai asumsi kerja terbuka, bukan diklaim sebagai fakta pasti, agar tidak menimbulkan inkonsistensi baru. Sisa 15 screen (area Public/Guest & alur dasar) dilanjutkan sebagai P2-9 di bawah. |
| P1-6 | Lengkapi kontrak API yang baru disebut ringkas di FRD §5.5 tanpa contoh payload penuh (`/subscriptions/{user_id}/quota`, `/bookings/{id}/vault`). | ⏳ Ditunda (sengaja) | FRD →v1.3 (§5.5) | **Ditunda dengan sengaja atas arahan:** akan dilengkapi saat tim masuk sesi desain backend, bukan pada iterasi dokumen ini. Catatan penundaan eksplisit sudah ditambahkan di FRD §5.5 agar tidak terlupa. |

### P2 — Bisa berjalan paralel, tidak memblokir MVP

| ID | Item | Status | Dokumen Terdampak | Bukti / Catatan Perbaikan |
| :--- | :--- | :---: | :--- | :--- |
| P2-7 | Lengkapi Problem Statement PD §3.1 dengan data riset pasar kuantitatif (saat ini kualitatif). | ⏳ Belum dimulai | PD §3.1 | — |
| P2-8 | Evaluasi apakah roadmap kuartalan (PD §9) dan milestone sprint (PRD §9) tetap dua dokumen terpisah atau dikonsolidasi, mengikuti opsi anti-redundansi di PRD §10.3. | ⏳ Belum dimulai | PD §9, PRD §9-§10 | — |
| P2-9 | Lengkapi content hierarchy untuk 15 screen sisanya di IA §4.0 (area Public/Guest: Landing, Pricing, Auth, Help, Kebijakan & Ketentuan; alur dasar Booking/Dashboard: Room Detail, Schedule Picker, Success Page, Overview/Home, Active Bookings, E-Ticket, Cancellation Confirmation; In-Room: Room Auth Gate, Studio Live Feed, Session Complete). | ⏳ Belum dimulai | IA §4.0 | Di luar cakupan minimal P1-5; diturunkan prioritasnya ke P2 karena polanya sudah jelas (mengikuti H-01 s/d H-13) dan tidak memblokir mulainya desain visual untuk 13 screen yang sudah Done. |

**Ringkasan status:** Seluruh 3 blocker P0 **sudah selesai** (P0-1, P0-2, P0-3). Seluruh 3 item P1 juga **sudah selesai untuk cakupan yang diminta**: P1-4 (harga final + draft kebijakan refund kontekstual) dan P1-5 (13/28 screen Done, mencakup seluruh cakupan minimal Admin Portal/Subscription/Account Profile), sementara P1-6 **sengaja ditunda** ke sesi desain backend sesuai arahan. P2-9 ditambahkan sebagai kelanjutan alami P1-5 untuk 15 screen sisanya, belum dikerjakan pada siklus ini.

---

## 7. Indeks ID Lintas Dokumen (Referensi Cepat)

| Kategori ID | Contoh | Didefinisikan di |
| :--- | :--- | :--- |
| Problem | P1-P3 | PD §3.1 |
| JTBD | JTBD 1-3 | PD §5 |
| Functional Requirement | FR-01 s/d FR-09 (FR-09 baru: Manajemen Akun & Autentikasi) | PRD §4 |
| Non-Functional Requirement | NFR-P01-P04, NFR-S01-S03, NFR-R01-R02 | PRD §5 |
| Acceptance Criteria | AC-1.1 s/d AC-3.2 | PRD §7 |
| Risiko Produk | R-01 s/d R-03 | PRD §8.1 |
| Fitur Teknis | FEAT-CAT/BKG/PAY/IOT/CTL/VLT/USR-xx | FRD §2 |
| Kode Error | SLOT_ALREADY_LOCKED, PAYMENT_TIMEOUT, IOT_GATEWAY_OFFLINE, TOKEN_EXPIRED_OR_INVALID, MAX_CONCURRENT_LOCKS_EXCEEDED, QUOTA_EXCEEDED, CANCELLATION_NOT_ALLOWED, TRANSCRIPTION_FAILED, CLOUD_UPLOAD_FAILED | FRD §8 |
| Screen | 1.1-1.6, 2.1-2.4, 3.1-3.7, 4.1-4.4, 5.1-5.7 (28 total) | IA §2 |
| Screen dengan Content Hierarchy | H-01 s/d H-13 (13 dari 28 screen) | IA §4 |

---

*Dokumen ini sebaiknya diperbarui ulang setiap kali salah satu dari 4 dokumen sumber naik versi mayor, agar tetap menjadi ringkasan yang akurat.*

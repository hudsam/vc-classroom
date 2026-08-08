# Ringkasan Tahap Analisis: Platform Sewa Smart Classroom
**Tipe Dokumen:** Cross-Document Summary (bukan pengganti 4 dokumen sumber)
**Tanggal:** 8 Agustus 2026
**Disusun Setelah:** Analisis & koreksi terhadap `01_ProductDiscovery.md`, `02_ProductRequirementDocument.md`, `03_FunctionalRequirementDocument.md`, `04_InformationArchitecture.md`
**Tujuan:** Memberi satu titik baca cepat sebelum tim masuk ke tahap **Desain UI/UX**, sekaligus daftar tindakan prioritas agar proses jangka pendek menuju MVP tidak terhambat oleh gap yang masih tersisa antar dokumen.

> Dokumen ini **tidak menggantikan** keempat dokumen sumber — setiap klaim di sini merujuk balik ke bagian aslinya. Jika ada perbedaan, dokumen sumber yang menjadi acuan sah.


> *Dokumen ini sebaiknya diperbarui ulang setiap kali salah satu dari 4 dokumen sumber naik versi mayor, agar tetap menjadi ringkasan yang akurat.*

---

## 1. Peta Dokumen

| # | Dokumen | Versi | Menjawab | Target Audiens Utama |
| :--- | :--- | :--- | :--- | :--- |
| 01 | `01_ProductDiscovery.md` (PD) | 1.1 | **WHY** — Visi, persona, JTBD, kompetitor, SWOT, model bisnis, roadmap kuartalan | Bisnis, PM, UI/UX, Engineering |
| 02 | `02_ProductRequirementDocument.md` (PRD) | 1.1 | **WHAT** — Scope, Functional/Non-Functional Requirements, Success Metrics, User Stories & AC | PM, Engineering, QA |
| 03 | `03_FunctionalRequirementDocument.md` (FRD) | 1.1 | **HOW (system & logic)** — Modul fitur teknis, workflow, RBAC, kontrak API, validasi data, business rules, error handling | Engineering, IoT Engineer, QA |
| 04 | `04_InformationArchitecture.md` (IA) | 1.1 | **HOW (navigasi & struktur)** — Sitemap, navigation flow, screen hierarchy, user/task flow, implikasi permission ke UI | UI/UX Designer, Frontend Engineer |

Rantai baca yang benar: **PD → PRD → FRD → IA → (tahap berikutnya) Desain UI/UX**. Setiap dokumen sudah menegaskan prinsip anti-redundansi masing-masing (lihat §1 di tiap dokumen) — dokumen ini merangkumnya tanpa mengulang isi penuh.

---

## 2. Ringkasan per Dokumen

### 2.1 Product Discovery (PD)
* **Visi:** Ekosistem smart classroom yang mendemokratisasi akses teknologi pengajaran (booking mandiri, rekaman otomatis, live streaming).
* **3 Persona:** Dr. Aris (dosen independen), Siti Rahma (corporate trainer), Bima Utama (content creator) — masing-masing dipetakan ke JTBD terkait (§5.1 PD).
* **3 Problem (P1-P3):** aksesibilitas studio terbatas, kompleksitas otomasi rekaman, kebutuhan kelas insidental/blended — dipetakan 1:1 ke solusi produk.
* **Model bisnis:** Pay-per-use (Rp150rb-350rb/jam, *indikatif*), Subscription 3 tier (Basic/Pro/Enterprise), add-on (transkripsi AI, storage, live streaming multi-platform).
* **Roadmap:** Q3 2026 Foundation & MVP (booking core, payment dasar, IoT gateway, rekaman dasar, Beta Launch 1 lokasi) → Q4 2026 Enhancement & AI (in-room controller, AI transcription, subscription wallet) → Q1 2027 Scale (multi-lokasi, integrasi LMS, B2B portal).

### 2.2 Product Requirement Document (PRD)
* **Scope MVP:** Web app responsive, booking & payment self-service, integrasi smart lock, in-room controller, auto-recording + transkripsi dasar. **Out of scope Fase 1:** aplikasi mobile native, pengadaan hardware, integrasi LMS enterprise, marketplace tutor, *pembatalan manual via admin*.
* **8 Functional Requirements (FR-01 s/d FR-08):** Eksplorasi Ruang, Engine Reservasi, Gateway Pembayaran, Integrasi Smart Lock, In-Room Controller, Penyimpanan Cloud, AI Transkripsi, Manajemen Kuota.
* **Non-Functional Requirements:** performa (response time, concurrency, IoT latency), keamanan (token time-bound, TLS 1.3/AES-256, OAuth2/JWT), keandalan (uptime 99.5%, local caching fail-safe).
* **Success Metrics:** Success Access Rate (>99%), Booking Completion Rate (>75%), Video Auto-Sync Time (<15 menit), Classroom Utilization Rate (>30%/bulan).
* **3 User Story + AC:** Pemesanan & Pembayaran, Masuk via Smart Lock, Kontrol Perekaman.
* **Risiko utama:** internet down saat sesi, smart lock gagal karena listrik mati, pembatalan mendadak — masing-masing sudah punya mitigasi.

### 2.3 Functional Requirement Document (FRD)
* **7 Modul, 15 Fitur Teknis (FEAT-xx):** Catalog, Booking Engine (+ Cancellation & Refund Engine), Payment Gateway, IoT Smart Lock, In-Room Controller, Cloud Video Vault, **User & Access Management**.
* **4 Workflow end-to-end:** Booking & Pembayaran, Akses IoT & Kontrol Rekaman, Cloud Upload & AI Transcription, Pembatalan & Refund.
* **RBAC 5 role:** Guest, Member, Premium Member, Studio Admin, Super Admin — 8 baris permission termasuk *Cancel Own Booking*.
* **9 kontrak/ringkasan API** (REST + kanal MQTT untuk IoT), termasuk endpoint Cancel Booking yang baru.
* **Validasi data & 5 Business Rule** (access window buffer, cancellation policy, late checkout penalty, max concurrent lock, cancellation guard).
* **9 skenario Error Handling** dengan HTTP status, pesan user-facing, dan fail-safe.

### 2.4 Information Architecture (IA)
* **Sitemap 27 screen** dalam 5 area (Public, Booking Engine, User Dashboard, In-Room Controller, Admin Portal).
* **Navigation Flow** memisahkan eksplisit kanal fisik (QR di Smart Lock) vs kanal digital (WiFi → In-Room Dashboard), plus jalur pembatalan & fallback kuota habis.
* **4 dari 27 screen** sudah punya *content hierarchy* detail: Catalog (H-01), In-Room Controller (H-02), Checkout (H-03), Cloud Video Vault (H-04).
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
| *(seluruh persona)* | — | *(belum ada FR — lihat §4)* | FEAT-USR-01/02 | 1.4, 3.6, 5.7 |
| *(seluruh persona)* | — | *(diturunkan dari Business Rule PRD §8.1/FRD §7.2, bukan FR eksplisit)* | FEAT-BKG-03 | 3.2, 3.7 |

---

## 4. Temuan Kritis yang Masih Terbuka

Beberapa gap berikut **sudah teridentifikasi** selama proses analisis dokumen 01-04, dan **belum tertutup** di kondisi dokumen saat ini. Ini bukan kesalahan proses analisis — melainkan area yang butuh keputusan/kerja lanjutan sebelum implementasi teknis dimulai.

| # | Temuan | Dampak jika Dibiarkan | Dokumen Terdampak |
| :--- | :--- | :--- | :--- |
| 1 | PRD §5 (NFR) saat ini belum memiliki ID individual per butir (mis. `NFR-P03`, `NFR-S03`, `NFR-R02`), sementara FRD sudah mereferensikan ID-ID tersebut di beberapa tempat (Feature Matrix §2, catatan Data Validation §6). | Engineer yang membaca FRD tidak akan menemukan definisi persis dari ID yang dirujuk di PRD — berpotensi menimbulkan interpretasi ganda saat implementasi. | PRD §5, FRD §2 & §6 |
| 2 | PRD §6 (Success Metrics) & §9 (Milestones) saat ini belum mencerminkan penyelarasan tanggal dengan roadmap kuartalan di PD §9 (mis. jadwal IoT Smart Lock Integration & Payment Gateway Integration). | Tim mengacu ke tanggal yang berbeda-beda antar dokumen saat sprint planning. | PRD §9, PD §9 |
| 3 | Tidak ada FR resmi di PRD untuk **User & Access Management** (registrasi, login, profil, role) — FRD §2.7 menandainya sebagai *gap* dan sementara ditelusuri ke NFR-S03. | Tim backend tidak punya acceptance criteria resmi untuk salah satu fondasi paling dasar aplikasi (akun pengguna) — berisiko dikerjakan tanpa spek yang disepakati. | PRD §4, FRD §2.7 |
| 4 | Business Rule "Late Checkout Penalty" (FRD §7.3) mengasumsikan mekanisme deteksi kehadiran (occupancy sensor) yang **tidak ada** di modul fitur manapun. | Rule tidak bisa diimplementasikan sampai ada keputusan: tambah hardware sensor, atau hapus rule dari cakupan MVP. | FRD §7.3 |
| 5 | Harga sewa & seluruh angka monetisasi di PD §8 masih ditandai **indikatif**, belum divalidasi riset pasar; kebijakan refund pay-per-use juga belum final secara bisnis (baru diformalkan sepihak di FRD §7.2). | Tim Sales/Finance bisa menagih ekspektasi harga final ke Engineering padahal belum ada keputusan bisnis resmi. | PD §8, FRD §7.2 |
| 6 | IA baru mendetailkan content hierarchy untuk 4 dari 27 screen pada sitemap (Catalog, In-Room Controller, Checkout, Video Vault). Sisanya (termasuk seluruh Admin Portal, Subscription, Account Profile, Landing, Pricing, Help) belum punya breakdown konten. | Bukan blocker, tapi tim UI/UX perlu tahu bahwa cakupan kerja desain jauh lebih luas dari 4 screen yang sudah dirinci. | IA §4 |

---

## 5. Checklist Siap-Desain (Definition of Ready untuk UI/UX)

| Syarat | Status | Catatan |
| :--- | :---: | :--- |
| Sitemap lengkap & konsisten dengan fitur FRD | ✅ | 27 screen, termasuk cancellation & admin portal |
| RBAC diterjemahkan ke implikasi UI (show/hide/disable) | ✅ | IA §7 |
| Minimal 1 screen kunci per modul utama sudah punya content hierarchy sebagai contoh pola | ✅ | H-01 s/d H-04 |
| Seluruh error state & business rule punya pesan user-facing siap pakai | ✅ | FRD §8 (9 skenario) |
| Semua ID fitur (FR/FEAT) yang disebut di IA punya definisi valid di FRD/PRD | ⚠️ | Kecuali FEAT-USR-01/02 (lihat Temuan #3) |
| Tanggal roadmap & milestone konsisten lintas dokumen | ❌ | Lihat Temuan #2 — perlu diperbaiki sebelum sprint planning teknis, tidak menghalangi mulainya eksplorasi desain visual |
| Harga & kebijakan bisnis (refund, tier) sudah final | ❌ | Lihat Temuan #5 — tidak menghalangi desain wireframe, tapi menghalangi desain UI untuk halaman Pricing/Checkout final |

**Kesimpulan:** Tim UI/UX **sudah bisa mulai** wireframing/mockup untuk 4 screen yang sudah dirinci dan mengikuti pola sitemap + RBAC yang sudah solid. Untuk halaman yang bersentuhan langsung dengan harga (Pricing, Checkout final) dan Admin Portal, sebaiknya tunggu Temuan #5 dan #6 selesai agar tidak ada rework.

---

## 6. Rekomendasi Prioritas Jangka Pendek (Punch List Menuju MVP)

### P0 — Blocker, selesaikan sebelum sprint planning teknis
1. **Sinkronkan PRD §5 & §9** dengan ID dan tanggal yang sudah dipakai FRD/PD (Temuan #1, #2).
2. **Putuskan status FR untuk User & Access Management** — tambahkan sebagai FR resmi di PRD atau tetapkan secara sadar bahwa ia cukup diatur sebagai NFR (Temuan #3).
3. **Putuskan nasib "Late Checkout Penalty"** — spesifikasikan sensor occupancy sebagai fitur baru, atau keluarkan rule ini dari cakupan MVP (Temuan #4).

### P1 — Selesaikan sebelum desain visual final / sebelum coding sprint berjalan penuh
4. **Validasi harga sewa & kebijakan refund** bersama tim bisnis, lalu satukan angkanya di PD §8 dan FRD §7.2 (Temuan #5).
5. **Lanjutkan content hierarchy** untuk sisa screen di IA §4, minimal untuk Admin Portal dan Subscription/Account Profile karena berdampak langsung ke desain (Temuan #6).
6. **Lengkapi kontrak API** yang baru disebut ringkas di FRD §5.5 tanpa contoh payload penuh (`/subscriptions/{user_id}/quota`, `/bookings/{id}/vault`).

### P2 — Bisa berjalan paralel, tidak memblokir MVP
7. Lengkapi Problem Statement PD §3.1 dengan data riset pasar kuantitatif (saat ini kualitatif).
8. Evaluasi apakah roadmap kuartalan (PD §9) dan milestone sprint (PRD §9) tetap dipertahankan sebagai dua dokumen terpisah atau dikonsolidasi, mengikuti opsi yang pernah diajukan di rekomendasi anti-redundansi PRD.

---

## 7. Indeks ID Lintas Dokumen (Referensi Cepat)

| Kategori ID | Contoh | Didefinisikan di |
| :--- | :--- | :--- |
| Problem | P1-P3 | PD §3.1 |
| JTBD | JTBD 1-3 | PD §5 |
| Functional Requirement | FR-01 s/d FR-08 | PRD §4 |
| Non-Functional Requirement | NFR (belum ber-ID resmi — lihat Temuan #1) | PRD §5 |
| Acceptance Criteria | AC-1.1 s/d AC-3.2 | PRD §7 |
| Risiko Produk | R-01 s/d R-03 | PRD §8.1 |
| Fitur Teknis | FEAT-CAT/BKG/PAY/IOT/CTL/VLT/USR-xx | FRD §2 |
| Kode Error | SLOT_ALREADY_LOCKED, PAYMENT_TIMEOUT, IOT_GATEWAY_OFFLINE, TOKEN_EXPIRED_OR_INVALID, MAX_CONCURRENT_LOCKS_EXCEEDED, QUOTA_EXCEEDED, CANCELLATION_NOT_ALLOWED, TRANSCRIPTION_FAILED, CLOUD_UPLOAD_FAILED | FRD §8 |
| Screen | 1.1-1.5, 2.1-2.4, 3.1-3.7, 4.1-4.4, 5.1-5.7 | IA §2 |
| Screen dengan Content Hierarchy | H-01 s/d H-04 | IA §4 |

---

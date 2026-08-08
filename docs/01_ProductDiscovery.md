# Dokumen Perencanaan Produk: Platform Sewa Smart Classroom
**Peran / Penulis:** Senior Product Manager  
**Versi:** 1.1  
**Tanggal:** 8 Agustus 2026  
**Target Audiens:** Stakeholder Bisnis, UI/UX Designer, Software Engineer (Frontend/Backend), Quality Assurance (QA)  

**Riwayat Revisi v1.1:** Memperjelas dan memperkuat traceability pada Problem Statement, Solusi, Value Proposition Canvas, Target User Persona, Jobs to be Done, Competitor Analysis, SWOT Analysis, Business Model & Monetization Strategy, Product Vision, dan Product Roadmap — termasuk perbaikan typo dan satu inkonsistensi jadwal (Payment Gateway) pada roadmap.

---

## 1. Executive Summary & Ringkasan Eksekutif

Dokumen ini disusun sebagai acuan kerja utama (*Single Source of Truth*) dalam mengembangkan platform digital berbasis web untuk layanan **Penggunaan (Sewa) Smart Classroom**. Produk ini hadir untuk menjawab tantangan dan kebutuhan ekosistem pendidikan modern, akademisi, profesional trainer, serta kreator konten edukasi yang membutuhkan fasilitas ruang kelas pintar yang terintegrasi dengan teknologi perekaman otomatis, live streaming, dan alat interaktif secara mandiri (self-service).

---

## 2. Product Vision & Mission

### Product Vision
> *"Menjadi ekosistem smart classroom terdepan yang mendemokratisasi akses terhadap fasilitas pengajaran berbasis teknologi tinggi, enabling seamless blended learning, recording, and content creation for every educator and organization."*
>
> **Terjemahan bebas:** Menjadi ekosistem smart classroom nomor satu yang membuka akses teknologi pengajaran canggih bagi siapa saja, sehingga pembelajaran blended, perekaman, dan pembuatan konten dapat berjalan mulus tanpa hambatan teknis.

### Product Mission
1. **Accessibility:** Menyediakan akses sewa ruang kelas pintar yang fleksibel, cepat, dan terjangkau secara ad-hoc maupun terjadwal.
2. **Automation:** Mengotomatiskan proses perekaman (*automated recording*), live streaming, dan pemrosesan materi pengajaran (*auto-captioning*, *cloud sync*).
3. **Simplicity:** Menyediakan antarmuka web yang intuitif untuk pemesanan ruang, kontrol perangkat iot di dalam kelas, hingga manajemen aset video digital.

---

## 3. Problem Statement, Solution & Value Proposition

### 3.1 Problem Statement

| ID | Problem | Siapa Paling Terdampak | Dampak Jika Tidak Diatasi |
| :--- | :--- | :--- | :--- |
| **P1** | **Ketersediaan & Aksesibilitas Terbatas** — Lembaga pendidikan non-formal, pengajar independen, dan institusi kecil kesulitan mengakses ruang pengajaran modern berteknologi tinggi tanpa investasi kapital (CapEx) yang besar. | Pengajar independen, institusi kecil | Kualitas materi ajar tertinggal; sulit bersaing dengan penyedia kursus yang sudah memiliki studio sendiri. |
| **P2** | **Kompleksitas Otomasi Rekaman & Live Stream** — Proses rekaman micro-teaching, webinar, dan workshop sering kali memerlukan kru teknis manual (cameraman, audio engineer), menyebabkan biaya tinggi dan potensi *human error*. | Corporate trainer, content creator | Biaya produksi membengkak; jadwal produksi molor akibat ketergantungan pada kru manual. |
| **P3** | **Kebutuhan Pembelajaran Insidental & Blended** — Meningkatnya permintaan akan kelas gabungan (luring & daring) secara mendadak/insidental tanpa dukungan infrastruktur audio-visual yang responsif dan andal. | Semua persona, khususnya trainer korporat | Kualitas pengalaman peserta daring menurun; citra profesional penyelenggara terganggu. |

> **Catatan:** Ketiga problem di atas masih bersifat kualitatif berdasarkan observasi pasar. Disarankan dilengkapi data pendukung (survei/riset pasar) sebelum dijadikan justifikasi investasi.

### 3.2 Solusi Produk
Sebuah **Platform Web Sewa Smart Classroom On-Demand** yang terintegrasi dengan IoT & Sistem Otomasi Studio/Kelas — setiap solusi berikut dipetakan langsung ke problem yang dijawabnya (lihat ID pada 3.1):
* **Self-Service Booking & Door Access** *(menjawab P1, P3)*: Pemesanan jadwal kelas secara real-time dengan integrasi akses masuk pintar (QR Code / PIN Digital).
* **Automated Smart Recording & Streaming** *(menjawab P2)*: Perekaman otomatis berbasis AI-tracking camera dan audio array yang langsung terunggah ke *Cloud Storage* pengguna.
* **One-Touch Classroom Controller** *(menjawab P2, P3)*: Kontrol pencahayaan, mikrofon, kamera, dan interactive whiteboard langsung dari dashboard web di dalam kelas.

### 3.3 Value Proposition Canvas

| Dimensi | Elemen | Deskripsi Detail |
| :--- | :--- | :--- |
| **Value Proposition** | *Products & Services* | Web Booking Platform, Smart Room IoT Controller, Cloud Video Vault, Auto-Editing & Transkripsi AI |
| **Customer Profile** | *Customer Jobs* | Mengajar kelas blended, merekam materi micro-teaching, menyelenggarakan webinar/workshop |

Agar hubungan sebab-akibat antara masalah pengguna dan solusi produk mudah ditelusuri, setiap *Pain* dan *Gain* dipetakan 1:1 terhadap *Reliever*/*Creator*-nya:

**Pain → Pain Reliever**

| # | Customer Pain | Pain Reliever |
| :--- | :--- | :--- |
| 1 | Biaya sewa studio mahal | Model *pay-per-use*, tanpa investasi alat/kru mahal |
| 2 | Setting peralatan memakan waktu lama | Self-service booking & akses instan (QR/PIN) tanpa instalasi manual |
| 3 | Hasil audio/video buruk | AI-tracking camera & audio array kualitas HD/4K, menghilangkan risiko kegagalan rekaman |

**Gain → Gain Creator**

| # | Customer Gain | Gain Creator |
| :--- | :--- | :--- |
| 1 | Efisiensi waktu | Akses instan tanpa kru teknis, reservasi transparan tanpa birokrasi |
| 2 | Citra profesional di mata siswa/klien | Hasil rekaman kualitas HD/4K langsung siap diunduh |
| 3 | Efisiensi biaya operasional | Fleksibilitas durasi sewa (pay-per-hour), tanpa biaya tetap studio |

---

## 4. Target User Persona

### Persona 1: Dosen / Pengajar Independen (Dr. Aris, M.Pd.)
* **Demografi:** Usia 38 tahun, Pengajar & Konsultan Pendidikan.
* **Perilaku:** Rutin membuat materi *micro-teaching* dan kelas insidental untuk program sertifikasi.
* **Pain Points:** 
  * Tidak memiliki studio rekaman pribadi.
  * Membutuhkan waktu lama untuk mengedit video dan mengatur kamera.
* **Goals:** Mengunggah video pembelajaran berkualitas tinggi secara cepat tanpa repot urusan teknis studio.
* **Terkait JTBD:** JTBD 1 (Pemesanan & Akses), JTBD 3 (Pasca Perekaman & Manajemen Aset).

### Persona 2: Corporate Trainer / Event Organizer (Siti Rahma)
* **Demografi:** Usia 29 tahun, People Development Lead di Startup.
* **Perilaku:** Menyelenggarakan workshop internal dan webinar interaktif bulanan untuk peserta *hybrid*.
* **Pain Points:** 
  * Ruang rapat kantor tidak memadai untuk interaksi *blended learning*.
  * Biaya sewa ballroom/studio komersial terlalu mahal untuk acara skala sedang (15-30 orang).
* **Goals:** Mendapatkan ruangan interaktif dengan fasilitas audio visual jernih dan akses mudah bagi peserta luring & daring.
* **Terkait JTBD:** JTBD 1 (Pemesanan & Akses), JTBD 2 (Perekaman & Kontrol).

### Persona 3: EdTech Content Creator (Bima Utama)
* **Demografi:** Usia 26 tahun, Pembuat Kursus Online Independen.
* **Perilaku:** Memproduksi modul kursus video secara berkelanjutan (batching).
* **Pain Points:** 
  * Peralatan studio mandiri terbatas.
  * Membutuhkan papan tulis interaktif (smart whiteboard) untuk penulisan rumus/diagram.
* **Goals:** Menyewa ruang pintar berdurasi jam-jaman dengan fitur smart board dan perekaman otomatis multi-angle.
* **Terkait JTBD:** JTBD 2 (Perekaman & Kontrol), JTBD 3 (Pasca Perekaman & Manajemen Aset).

---

## 5. Jobs to be Done (JTBD) Framework

```
[When...] Situasi & Konteks
  └── [I want to...] Kebutuhan & Tindakan
        └── [So that I can...] Hasil yang Diharapkan
```

1. **JTBD 1 (Pemesanan & Akses):**
   * *When* saya harus menyelenggarakan kelas blended insidental besok pagi,
   * *I want to* menemukan dan memesan smart classroom yang memiliki spesifikasi audio-visual lengkap secara instan melalui web,
   * *So that I can* memastikan kelas berjalan lancar tanpa terkendala persiapan teknis.

2. **JTBD 2 (Perekaman & Kontrol):**
   * *When* saya sedang mengajar di dalam smart classroom,
   * *I want to* mengontrol kamera tracking dan perekaman hanya dengan satu klik di dashboard web,
   * *So that I can* fokus 100% pada materi pengajaran tanpa terdistraksi oleh pengoperasian alat.

3. **JTBD 3 (Pasca Perekaman & Manajemen Aset):**
   * *When* sesi pembelajaran selesai,
   * *I want to* langsung menerima tautan unduhan video rekaman yang sudah terpotong rapi beserta transkripsinya,
   * *So that I can* membagikan materi tersebut kepada siswa/peserta workshop hari itu juga.

### 5.1 Pemetaan Persona, Pain Point, Goal & JTBD

Tabel ini merangkas keterkaitan antara persona, pain point utama, goal utama, dan JTBD terkait agar tim pengembangan dapat menelusuri "mengapa" di balik setiap fitur yang dibangun.

| Persona | Pain Point Utama | Goal Utama | JTBD Terkait |
| :--- | :--- | :--- | :--- |
| Dr. Aris — Dosen/Pengajar Independen | Tidak punya studio pribadi; edit video memakan waktu lama | Upload video pembelajaran berkualitas tinggi secara cepat | JTBD 1, JTBD 3 |
| Siti Rahma — Corporate Trainer/EO | Ruang rapat kantor tidak memadai; sewa ballroom/studio komersial mahal | Ruangan interaktif dengan akses mudah bagi peserta hybrid | JTBD 1, JTBD 2 |
| Bima Utama — EdTech Content Creator | Peralatan studio mandiri terbatas; butuh smart whiteboard | Sewa ruang jam-jaman dengan smart board & rekaman otomatis multi-angle | JTBD 2, JTBD 3 |

---

## 6. Competitor Analysis

| Fitur / Parameter | Platform Kami (Smart Classroom) | Studio Rekaman Lokal | Ruang Co-Working / R. Rapat | Platform LMS / Zoom Only |
| :--- | :--- | :--- | :--- | :--- |
| **Spesialisasi Edukasi** | Sangat Tinggi (Smart Board, AI Track Camera) | Rendah (Fokus pada Video General) | Rendah (Fokus pada Rapat) | Tinggi (Hanya Digital) |
| **Otomasi Rekaman** | Otomatis Cloud Sync & AI Editing | Manual (Dikerjakan Editor) | Tidak Ada | Terbatas (Cloud Recording) |
| **Kemudahan Pemesanan** | Self-Service Web Booking Instant | Manual (WhatsApp / Admin) | Web / App Booking | Instant |
| **Biaya / Efisiensi** | Pay-per-use (Terjangkau) | Mahal (Include Kru Studio) | Sedang (Tanpa Alat Edukasi) | Sangat Murah (Tanpa Ruang Fisik) |
| **Akses Fisik IoT** | Smart Lock (QR / PIN Instant) | Kunci Manual / Resepsionis | Card Access | N/A |

### Insight Kompetitif
* **Vs. Studio Rekaman Lokal:** Keunggulan utama kami ada di harga (pay-per-use vs. paket mahal termasuk kru) dan kecepatan akses (self-service instant vs. booking manual via WhatsApp/admin).
* **Vs. Ruang Co-Working/Rapat:** Kami unggul di kelengkapan alat khusus edukasi (smart board, AI tracking camera) yang tidak dimiliki ruang rapat umum.
* **Vs. Platform LMS/Zoom Only:** Kami menang di sisi kualitas produksi fisik (ruang, kamera, audio) untuk kebutuhan tatap muka/hybrid, sementara Zoom/LMS unggul di biaya karena tanpa ruang fisik — sehingga kedua kategori ini melayani kebutuhan yang berbeda, bukan pengganti langsung satu sama lain.
* **Celah pasar yang dimanfaatkan:** Belum ada pemain yang menggabungkan *self-service booking*, *smart lock*, dan *automated recording* khusus untuk kebutuhan edukasi dalam satu platform.

---

## 7. SWOT Analysis

### Strength (Kekuatan)
* Integrasi teknologi IoT fisik dan platform web yang efisien.
* Fitur *automated recording & tracking* menurunkan operational cost (tanpa kru).
* Sistem pemesanan mandiri 24/7 dengan konfirmasi dan akses QR instan.

### Weakness (Kelemahan)
* Kebergantungan tinggi pada koneksi internet dan infrastruktur fisik lokasi.
* Membutuhkan edukasi awal bagi pengguna yang belum terbiasa dengan fasilitas *smart room*.

### Opportunity (Peluang)
* Tingginya adopsi *blended learning* dan *micro-learning* pasca-pandemi.
* Pertumbuhan pesat industri *EdTech* dan kursus mandiri di Indonesia.
* Kemitraan strategis dengan universitas atau gedung komersial untuk penyediaan lokasi.

### Threat (Ancaman)
* Potensi kerusakan perangkat keras fisik oleh pengguna.
* Masuknya penyedia jasa studio konvensional yang mulai beralih ke otomatisasi.

### Implikasi Strategis (Ringkasan SWOT)
* **Strength → Opportunity:** Manfaatkan otomasi rekaman (tanpa kru) untuk menangkap pertumbuhan pasar *blended learning* dengan struktur biaya yang lebih kompetitif dibanding kompetitor konvensional.
* **Strength → Threat:** Perkuat *automated recording & tracking* sebagai *moat* teknologi sebelum studio konvensional sempat beralih ke otomatisasi serupa.
* **Weakness → Opportunity:** Gunakan momentum kemitraan strategis (kampus/gedung komersial) untuk sekaligus menyediakan infrastruktur internet yang andal di setiap lokasi baru, mengurangi ketergantungan pada infrastruktur pihak ketiga.
* **Weakness → Threat:** Edukasi pengguna yang belum familiar dengan smart room perlu dipercepat (onboarding in-app) agar tidak kalah gesit dibanding kompetitor yang mulai bertransformasi digital.

---

## 8. Business Model & Monetization Strategy

```mermaid
graph TD
    Sub[Model Bisnis / Sumber Pendapatan]
    Sub --> B1[Pay-Per-Hour Booking]
    Sub --> B2[Subscription Membership]
    Sub --> B3[Add-on Services / Upselling]
    Sub --> B4[B2B Enterprise Partnership]

    B1 --> C1[Sewa reguler per jam berdasarkan ukuran kelas & fasilitas]
    B2 --> C2[Paket kuota jam bulanan untuk institusi/trainer aktif]
    B3 --> C3[Layanan AI Transkripsi, High-Res Raw Footage, Storage Tambahan]
    B4 --> C4[Kemitraan penyediaan dedicated smart room untuk sekolah/kampus]
```

### Rincian Strategi Monetisasi:
1. **Pay-Per-Use / On-Demand:** Biaya sewa berdasarkan jam (misal: Rp 150.000 - Rp 350.000 / jam tergantung tipe ruangan). Cocok untuk kebutuhan insidental Persona 1 (Dr. Aris) dan Persona 3 (Bima Utama) yang tidak selalu butuh sewa rutin.
2. **Tiered Subscription (Pengajar & Lembaga):**
   * *Basic:* 10 jam/bulan + Standard Storage — target pengajar independen dengan jadwal rutin ringan.
   * *Pro:* 30 jam/bulan + AI Transcription + Cloud Storage 500GB — target trainer korporat/kreator konten aktif (Persona 2 & 3).
   * *Enterprise:* Unlimited access (prakiraan kuota) + Dedicated Support + Custom Integrasi LMS — target institusi/perusahaan (kelanjutan B2B Enterprise Partnership).
3. **Add-on Services:**
   * AI Transkripsi & Rangkuman Materi Otomatis.
   * Penyimpanan Cloud Jangka Panjang (Archive Vault).
   * Layanan Live Streaming Multi-platform simultaneously (YouTube, Zoom, Twitch).

> **Catatan:** Seluruh angka harga di atas bersifat **indikatif** dan perlu divalidasi melalui riset harga pasar (dibandingkan dengan tarif Studio Rekaman Lokal & Ruang Co-Working pada Bagian 6) sebelum ditetapkan sebagai harga final saat Beta Launch. Kebijakan pembatalan/refund untuk model pay-per-use juga perlu dirumuskan bersama tim bisnis sebelum implementasi payment gateway.

---

## 9. Product Roadmap

```mermaid
gantt
    title Product Roadmap - Platform Sewa Smart Classroom (2026-2027)
    dateFormat  YYYY-MM-DD
    axisFormat  %b %Y

    section Q3 2026: Foundation & MVP
    Core Booking Engine & Web App        :active, m1, 2026-08-01, 2026-09-15
    Basic Payment Gateway (E-Wallet/VA)  :m1b, 2026-08-15, 2026-09-15
    IoT Gateway & QR Smart Lock          :m2, 2026-08-15, 2026-09-30
    Basic Automated Cloud Recording      :m3, 2026-09-01, 2026-10-15
    Beta Launch (1 Pilot Location)       :m4, 2026-10-15, 2026-10-31

    section Q4 2026: Enhancement & AI
    In-Room Web Controller Dashboard     :e1, 2026-11-01, 2026-12-15
    AI Auto-Captioning & Transcription  :e2, 2026-11-15, 2026-12-31
    Subscription Wallet & Kuota Jam Bulanan :e3, 2026-12-01, 2027-01-15

    section Q1 2027: Scale & Ecosystem
    Multi-Location Support               :s1, 2027-01-15, 2027-02-28
    LMS Integrations (Moodle, Canvas)    :s2, 2027-02-01, 2027-03-15
    Subscription & B2B Enterprise Portal :s3, 2027-03-01, 2027-04-15
```

> **Catatan perbaikan:** Pada draf sebelumnya, "Payment Gateway Integration" dijadwalkan di Q4 2026 — padahal alur booking di MVP (Beta Launch, Q3 2026) sudah mengharuskan pembayaran (lihat diagram user flow di Bagian 10). Roadmap ini telah disesuaikan: integrasi pembayaran dasar (E-Wallet/VA) dipindahkan ke Q3 2026 agar selaras dengan kebutuhan MVP, sementara fitur *wallet* & kuota jam bulanan untuk subscription tetap di Q4 2026.

---

## 10. Sistem Architecture & User Flow Diagram

### System User Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengajar / User
    participant Web as Web Platform
    participant IoT as IoT Smart Lock & Room
    participant Cloud as Cloud Recording Service

    User->>Web: Cari Ruangan & Pilih Jadwal
    Web-->>User: Konfirmasi & Minta Pembayaran
    User->>Web: Lakukan Pembayaran (E-Wallet/VA)
    Web-->>User: Kode Akses QR / PIN Digital & E-Ticket
    
    Note over User, IoT: Saat Hari-H di Lokasi Kelas
    User->>IoT: Scan QR Code pada Door Lock
    IoT-->>User: Pintu Terbuka & Perangkat Aktif
    User->>Web: Klik "Mulai Rekam / Streaming" di Web Dashboard
    
    Note over User, Cloud: Sesi Pengajaran Berlangsung
    User->>Web: Selesai Pengajaran & Klik "Stop"
    Web->>Cloud: Prosessing & Auto-Upload Video
    Cloud-->>User: Kirim Tautan Download Video & Transkrip via Email/Web
```

---

## 11. Panduan Implementasi untuk Tim Cross-Functional

### 11.1 Untuk UI/UX Designer
* **Mobile-First Responsiveness:** Halaman reservasi dan jadwal harus dioptimalkan untuk perangkat seluler.
* **In-Room Controller Interface:** Antarmuka *Dashboard In-Room* harus berukuran tombol besar (*touch-friendly*), ramah kontras, dan memiliki indikator visual status rekaman yang jelas (misal: warna merah berkedip saat *Live/Recording*).
* **Clear Feedback Loop:** Tampilkan status koneksi IoT secara real-time di layar.

### 11.2 Untuk Software Engineer (Frontend & Backend)
* **Backend:** 
  * Bangun arsitektur microservices atau modular monolith berbasis REST/GraphQL.
  * Sediakan Webhook untuk integrasi IoT Smart Lock (MQTT / HTTP REST).
  * Penanganan konkurensi jadwal pemesanan (*locking mechanism*) untuk mencegah *double-booking*.
* **Frontend:**
  * Gunakan framework modern (Next.js / React) untuk performa render cepat dan SEO-friendly pada halaman katalog studio.
  * Web Socket integration untuk menerima indikator status IoT dan progress upload video secara real-time.

### 11.3 Untuk Quality Assurance (QA)
* **Penyusunan Matrix Testing:**
  * **Functional Testing:** Verifikasi reservasi, pemotongan kuota sewa, dan integrasi Payment Gateway.
  * **IoT Integration Testing:** Uji skenario latensi pengiriman sinyal QR Code buka pintu & perintah rekam.
  * **Edge Cases Testing:** Apa yang terjadi jika koneksi internet di kelas terputus saat proses rekaman berlangsung? Pastikan ada fail-safe *local caching/backup storage*.

---
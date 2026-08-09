# Dokumen Desain Skema Database: Platform Sewa Smart Classroom

**Versi:** 1.1  
**Tanggal:** 9 Agustus 2026  
**Penulis:** Database Architect / Lead Engineer  
**Status:** Draf Desain Skema Produksi  
**Dokumen Terkait:**
* `docs/01_ProductDiscovery.md` (Strategi Bisnis, Pricing & Kebijakan Refund) -> [01_ProductDiscovery.md](docs/01_ProductDiscovery.md)
* `docs/02_ProductRequirementDocument.md` (Scope & Fitur Bisnis) -> [02_ProductRequirementDocument.md](docs/02_ProductRequirementDocument.md)
* `docs/03_FunctionalRequirementDocument.md` (Workflow System, API, Validation & Business Logic) -> [03_FunctionalRequirementDocument.md](docs/03_FunctionalRequirementDocument.md)
* `docs/04_InformationArchitecture.md` (Hierarchy Screens, Content & Navigasi) -> [04_InformationArchitecture.md](docs/04_InformationArchitecture.md)
* `docs/X_ProgressSummary.md` (Tracking Progres & Punch List Lintas Dokumen) -> [X_ProgressSummary.md](docs/X_ProgressSummary.md)
* `README/2-UseCaseDiagram.md` (Visualisasi Aksi Aktor) -> [2-UseCaseDiagram.md](2-UseCaseDiagram.md)
* `README/2-UITesting.md` (Panduan Uji Coba Prototipe Lokal) -> [2-UITesting.md](2-UITesting.md)

### Riwayat Revisi

| Versi | Bagian | Sebelum | Sesudah |
| :--- | :--- | :--- | :--- |
| 1.0 | Dokumen (keseluruhan) | — | Draf awal skema database. |
| 1.1 | Header | Tautan "Dokumen Terkait" ke `README/UseCaseDiagram.md` rusak (file sebenarnya `README/2-UseCaseDiagram.md`); `docs/X_ProgressSummary.md` & `README/2-UITesting.md` tidak dirujuk. | Tautan diperbaiki; 2 dokumen terkait ditambahkan. |
| 1.1 | Kamus Data §3.1, §3.16 | Deskripsi `users.role` & `audit_logs.actor_role` memakai istilah informal "Admin/Super" yang tidak cocok dengan `role_enum` resmi (`STUDIO_ADMIN`/`SUPER_ADMIN`) di §4 — inkonsistensi internal dokumen. | Deskripsi disamakan persis dengan `role_enum`. |
| 1.1 | Kamus Data §3.2, Workflow §5.2 | `monthly_hours_quota` Enterprise memakai dua sentinel berbeda sekaligus ("-1 / 9999") tanpa definisi tunggal; pseudocode §5.2 tidak menangani kasus "Unlimited" sehingga secara logika akan **salah memicu `QUOTA_EXCEEDED` untuk Enterprise** (bug). `storage_gb` mewajibkan angka pasti untuk Basic/Enterprise padahal PD §8.1.B tidak menyebutkannya. | Sentinel dikunci ke `-1` saja; pseudocode §5.2 ditambahkan pengecekan eksplisit sebelum pengurangan kuota; `storage_gb` dibuat *nullable* dengan catatan ⚠️ Asumsi. |
| 1.1 | ERD, Kamus Data §3.17-3.19, Workflow §5.5-§5.7, Indeks §6.5 | Tidak ada tabel untuk (a) refund pembatalan booking pay-per-use (FEAT-BKG-03, punya kontrak API eksplisit di FRD §5.4 tapi tidak ada tabelnya), (b) "saldo wallet" yang disebut eksplisit di FRD §7.2 tapi tidak pernah direpresentasikan, (c) log percobaan akses gagal yang dibutuhkan alert `TOKEN_EXPIRED_OR_INVALID` (FRD §8) & Live Alert Feed (IA H-07). | Ditambahkan tabel `booking_cancellations`, `wallet_transactions`, `door_access_attempts` beserta relasi ERD, alur workflow, dan indeks pendukung. |
| 1.1 | Workflow §5.6 | Tabel `subscription_refunds` sudah ada di v1.0 tapi tidak punya narasi alur (gap konsistensi internal dokumen). | Ditambahkan narasi alur mengacu PD §8.2, dengan ⚠️ Asumsi eksplisit untuk bagian yang belum final di dokumen sumber. |
| 1.1 | Keamanan Data §8 | Tidak ada ketentuan soal `wallet_balance` saat akun dihapus (soft delete). | Ditambahkan catatan ⚠️ Asumsi + rekomendasi teknis minimal (blokir hapus akun jika saldo > 0), menunggu sign-off produk/finance. |

---

## 1. Pendahuluan & Strategi Penyimpanan Data

Berdasarkan analisis prototype antarmuka pengguna (`index.html`, `profile.html`, `in-room.html`, serta Admin Portal di `admin/rooms.html` & `admin/dashboard.html`) dan dokumen fungsional platform, sistem memerlukan dua lapis penyimpanan data utama:

1. **RDBMS (PostgreSQL 16+)**: Digunakan untuk menyimpan seluruh data relasional transaksional yang membutuhkan integritas tinggi (ACID), seperti data pengguna, booking, pembayaran, konfigurasi ruangan, riwayat akses IoT, dan audit log.
2. **Caching & In-Memory Store (Redis 7.x)**: Digunakan untuk mekanisme penguncian slot waktu sementara (*Concurrency Slot Locking* 15 menit), manajemen status koneksi detak jantung (*heartbeat*) perangkat IoT, serta cache token sesi sementara kelas.

---

## 2. Entity Relationship Diagram (ERD)

Diagram di bawah menggambarkan relasi antar entitas beserta tipe data, status primary key (PK), dan foreign key (FK).

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email "UQ, NOT NULL"
        varchar password_hash "NOT NULL"
        varchar name "NOT NULL"
        varchar phone "NOT NULL"
        varchar institution "NULL"
        varchar role "NOT NULL"
        boolean two_factor_enabled "NOT NULL"
        decimal wallet_balance "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
        timestamp deleted_at "NULL"
    }

    wallet_transactions {
        uuid id PK
        uuid user_id FK "NOT NULL"
        varchar type "NOT NULL"
        decimal amount "NOT NULL"
        decimal balance_after "NOT NULL"
        varchar reference_type "NOT NULL"
        varchar reference_id "NULL"
        text description "NULL"
        timestamp created_at "NOT NULL"
    }

    subscription_plans {
        varchar id PK
        varchar name "NOT NULL"
        integer monthly_hours_quota "NOT NULL"
        integer storage_gb "NULL"
        boolean includes_ai_transcription "NOT NULL"
        decimal monthly_price "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }

    user_subscriptions {
        uuid id PK
        uuid user_id FK "NOT NULL"
        varchar plan_id FK "NOT NULL"
        varchar status "NOT NULL"
        decimal quota_hours_used "NOT NULL"
        decimal quota_hours_total "NOT NULL"
        date start_date "NOT NULL"
        date end_date "NOT NULL"
        boolean auto_renew "NOT NULL"
        varchar payment_method_id "NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }

    subscription_refunds {
        uuid id PK
        uuid user_subscription_id FK "NOT NULL"
        varchar status "NOT NULL"
        decimal refund_amount "NOT NULL"
        text reason "NULL"
        text admin_notes "NULL"
        uuid processed_by FK "NULL"
        timestamp processed_at "NULL"
        timestamp created_at "NOT NULL"
    }

    rooms {
        varchar id PK
        varchar name "NOT NULL"
        varchar location "NOT NULL"
        varchar capacity_tier "NOT NULL"
        integer capacity_seats "NOT NULL"
        decimal price_per_hour "NOT NULL"
        varchar status "NOT NULL"
        varchar smart_lock_device_id "UQ, NULL"
        varchar wifi_ip_address "NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }

    room_facilities {
        uuid id PK
        varchar room_id FK "NOT NULL"
        varchar facility_name "NOT NULL"
        timestamp created_at "NOT NULL"
    }

    bookings {
        varchar id PK
        uuid user_id FK "NOT NULL"
        varchar room_id FK "NOT NULL"
        date booking_date "NOT NULL"
        time start_time "NOT NULL"
        time end_time "NOT NULL"
        varchar status "NOT NULL"
        varchar payment_type "NOT NULL"
        decimal original_amount "NOT NULL"
        decimal add_ons_amount "NOT NULL"
        decimal discount_amount "NOT NULL"
        decimal total_amount "NOT NULL"
        boolean is_ai_transcription_addon "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }

    payments {
        uuid id PK
        varchar booking_id FK "NULL"
        uuid user_subscription_id FK "NULL"
        varchar payment_method "NOT NULL"
        varchar status "NOT NULL"
        varchar transaction_id "NULL"
        decimal paid_amount "NOT NULL"
        varchar payment_url "NULL"
        timestamp expires_at "NOT NULL"
        timestamp paid_at "NULL"
        jsonb callback_raw "NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }

    room_access_tokens {
        uuid id PK
        varchar booking_id FK "NOT NULL"
        varchar pin_code "NOT NULL"
        varchar qr_code_content "NOT NULL"
        timestamp access_start_time "NOT NULL"
        timestamp access_end_time "NOT NULL"
        boolean is_used "NOT NULL"
        timestamp created_at "NOT NULL"
    }

    door_access_attempts {
        uuid id PK
        varchar room_id FK "NOT NULL"
        varchar booking_id FK "NULL"
        varchar input_type "NOT NULL"
        varchar result "NOT NULL"
        timestamp attempted_at "NOT NULL"
    }

    booking_cancellations {
        uuid id PK
        varchar booking_id FK "UQ, NOT NULL"
        uuid cancelled_by FK "NOT NULL"
        varchar cancelled_by_role "NOT NULL"
        integer refund_percentage "NOT NULL"
        decimal refund_amount "NOT NULL"
        varchar refund_destination "NOT NULL"
        text reason "NULL"
        timestamp cancelled_at "NOT NULL"
        timestamp created_at "NOT NULL"
    }

    recordings {
        uuid id PK
        varchar booking_id FK "NOT NULL"
        varchar session_id "NOT NULL"
        varchar status "NOT NULL"
        timestamp started_at "NULL"
        timestamp stopped_at "NULL"
        varchar raw_video_url "NULL"
        varchar processed_video_url "NULL"
        integer video_duration_seconds "NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }

    ai_transcriptions {
        uuid id PK
        uuid recording_id FK "NOT NULL"
        varchar status "NOT NULL"
        varchar transcript_srt_url "NULL"
        varchar transcript_json_url "NULL"
        integer word_count "NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }

    room_maintenance_logs {
        uuid id PK
        varchar room_id FK "NOT NULL"
        uuid operator_id FK "NOT NULL"
        varchar reason "NOT NULL"
        text notes "NULL"
        timestamp started_at "NOT NULL"
        timestamp ended_at "NULL"
        timestamp created_at "NOT NULL"
    }

    iot_device_status {
        uuid id PK
        varchar room_id FK "NOT NULL"
        varchar device_type "NOT NULL"
        varchar status "NOT NULL"
        timestamp last_heartbeat "NOT NULL"
        timestamp created_at "NOT NULL"
        timestamp updated_at "NOT NULL"
    }

    manual_unlock_logs {
        uuid id PK
        varchar room_id FK "NOT NULL"
        uuid operator_id FK "NOT NULL"
        varchar booking_id FK "NULL"
        text reason "NOT NULL"
        timestamp created_at "NOT NULL"
    }

    late_checkout_logs {
        uuid id PK
        varchar booking_id FK "NOT NULL"
        uuid operator_id FK "NOT NULL"
        timestamp actual_checkout_time "NOT NULL"
        integer overtime_minutes "NOT NULL"
        decimal penalty_amount "NOT NULL"
        text notes "NULL"
        timestamp created_at "NOT NULL"
    }

    audit_logs {
        uuid id PK
        uuid actor_id FK "NOT NULL"
        varchar actor_role "NOT NULL"
        varchar action "NOT NULL"
        varchar target_table "NOT NULL"
        varchar target_id "NOT NULL"
        jsonb changes_payload "NULL"
        text description "NOT NULL"
        timestamp created_at "NOT NULL"
    }

    users ||--o{ user_subscriptions : "owns"
    users ||--o{ bookings : "creates"
    users ||--o{ audit_logs : "triggers"
    users ||--o{ room_maintenance_logs : "performs"
    users ||--o{ manual_unlock_logs : "authorizes"
    users ||--o{ late_checkout_logs : "registers"
    users ||--o{ subscription_refunds : "processes"
    users ||--o{ wallet_transactions : "owns"
    users ||--o{ booking_cancellations : "requests_or_overrides"

    subscription_plans ||--o{ user_subscriptions : "defines"
    user_subscriptions ||--o{ subscription_refunds : "requests"
    user_subscriptions ||--o{ payments : "billed_by"

    rooms ||--o{ room_facilities : "has"
    rooms ||--o{ bookings : "reserved_in"
    rooms ||--o{ room_maintenance_logs : "logged_for"
    rooms ||--o{ iot_device_status : "monitors"
    rooms ||--o{ manual_unlock_logs : "manually_unlocked_for"
    rooms ||--o{ door_access_attempts : "logs_attempt_at"

    bookings ||--o{ payments : "billed_by"
    bookings ||--o{ room_access_tokens : "accessed_by"
    bookings ||--o{ recordings : "creates_recordings"
    bookings ||--o{ late_checkout_logs : "penalized_by"
    bookings ||--o{ door_access_attempts : "attempted_against"
    bookings ||--o| booking_cancellations : "cancelled_via"

    recordings ||--o{ ai_transcriptions : "generates"
```

---

## 3. Kamus Data (Data Dictionary)

Berikut adalah struktur tabel fisik lengkap dengan tipe data PostgreSQL, batasan nilai (*constraints*), dan deskripsi kegunaannya.

### 3.1 Tabel `users`
Menyimpan kredensial autentikasi pengguna dan profil dasar. Field didasarkan pada form profil (`profile.html` / IA Screen H-06) dan aturan validasi E.164 (`docs/03_FunctionalRequirementDocument.md` §6).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID unik untuk setiap pengguna. |
| `email` | `VARCHAR(255)` | No | — | `UNIQUE`, format email valid | Email login utama (Read-only pasca verifikasi). |
| `password_hash` | `VARCHAR(255)` | No | — | — | Hash kata sandi terenkripsi (BCrypt / Argon2). |
| `name` | `VARCHAR(255)` | No | — | Min. 2 karakter | Nama lengkap pengguna (form input `inputNama`). |
| `phone` | `VARCHAR(20)` | No | — | format E.164 (`^(\+62\|62\|0)8[1-9][0-9]{7,10}$`)| Nomor HP valid Indonesia (input `inputPhone`). |
| `institution` | `VARCHAR(255)` | Yes | `NULL` | — | Institusi/organisasi (input `inputInstitusi`). |
| `role` | `VARCHAR(50)` | No | `'MEMBER'` | Check constraint: `role_enum` | Role RBAC — nilai persis `role_enum` §4: `MEMBER`, `PREMIUM_MEMBER`, `STUDIO_ADMIN`, `SUPER_ADMIN` (Guest tidak disimpan karena unauthenticated). |
| `two_factor_enabled` | `BOOLEAN` | No | `FALSE` | — | Toggle autentikasi dua faktor (input `toggle2FA`). |
| `wallet_balance` | `NUMERIC(12,2)` | No | `0.00` | `>= 0.00` | Saldo kredit internal hasil refund pembatalan booking pay-per-use (FRD §7.2: "dikreditkan ke saldo wallet/kuota") — lihat §3.18 `wallet_transactions` untuk ledger perubahannya. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal pendaftaran. |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal pembaruan profil terakhir. |
| `deleted_at` | `TIMESTAMPTZ` | Yes | `NULL` | — | Soft deletion flag untuk kepatuhan GDPR/User Delete. |

### 3.2 Tabel `subscription_plans`
Menyimpan paket katalog subscription yang disetujui tim bisnis (Finance - 8 Agustus 2026).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `VARCHAR(50)` | No | — | `PRIMARY KEY` (Enum: `'BASIC'`, `'PRO'`, `'ENTERPRISE'`) | ID string paket langganan. |
| `name` | `VARCHAR(100)` | No | — | — | Nama komersial paket. |
| `monthly_hours_quota` | `INTEGER` | No | — | `>= -1`; **`-1` = sentinel "Unlimited" (khusus Enterprise)** | Kuota sewa ruangan per bulan sesuai PD §8.1.B: Basic = 10, Pro = 30. **Enterprise = `-1`** — PD hanya menyebut "Unlimited (prakiraan kuota)" tanpa angka pasti, sehingga `-1` adalah representasi teknis internal, bukan angka bisnis final. Lihat §5.2 untuk logika penanganan nilai `-1` ini di alur pemotongan kuota (wajib di-skip, bukan dikurangi). |
| `storage_gb` | `INTEGER` | Yes | `NULL` | `>= 0` jika diisi | Kuota penyimpanan video cloud (Vault). **Hanya Pro yang punya angka pasti di PD §8.1.B (500 GB).** ⚠️ **Asumsi (belum terdokumentasi):** PD tidak menyebut angka GB untuk Basic ("Standard Storage", tanpa kuantitas) maupun Enterprise (tidak disebutkan sama sekali) — kolom dibuat *nullable* agar tidak memaksa angka karangan untuk kedua tier ini; nilai `NULL` berarti "belum ditentukan bisnis", bukan "tanpa batas". Perlu konfirmasi tim bisnis sebelum go-live. |
| `includes_ai_transcription` | `BOOLEAN` | No | `FALSE` | — | Status transkripsi otomatis (Basic: No, Pro/Ent: Yes). |
| `monthly_price` | `NUMERIC(12,2)`| No | — | `>= 0` (Basic: 1.2M, Pro: 4.9M, Ent: 11.9M) | Harga tagihan bulanan dalam IDR. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal pembuatan konfigurasi plan. |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal modifikasi konfigurasi plan. |

### 3.3 Tabel `user_subscriptions`
Menyimpan detail langganan aktif pengguna dan sisa kuota jam. Perubahan status role ke `Premium Member` terikat otomatis pada keaktifan entri di tabel ini (FEAT-USR-02).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID langganan aktif. |
| `user_id` | `UUID` | No | — | `FOREIGN KEY` -> `users.id` | Pemilik langganan. |
| `plan_id` | `VARCHAR(50)` | No | — | `FOREIGN KEY` -> `subscription_plans.id`| Konfigurasi plan yang diikuti. |
| `status` | `VARCHAR(50)` | No | `'PENDING'` | Check: `'ACTIVE'`,`'CANCELLED'`,`'EXPIRED'`,`'PENDING'` | Status kelayakan tagihan & kuota. |
| `quota_hours_used` | `NUMERIC(5,2)` | No | `0.00` | `>= 0.00` (kelipatan 0.5 jam) | Jumlah kuota jam yang sudah terpakai bulan ini. |
| `quota_hours_total` | `NUMERIC(5,2)`| No | — | Copied dari `subscription_plans` | Total kuota jam tersedia (mis. 10.00 / 30.00). |
| `start_date` | `DATE` | No | — | — | Awal siklus tagihan berjalan. |
| `end_date` | `DATE` | No | — | `> start_date` | Akhir siklus (tanggal renewal otomatis). |
| `auto_renew` | `BOOLEAN` | No | `TRUE` | — | Apakah langganan diperpanjang otomatis di `end_date`. |
| `payment_method_id` | `VARCHAR(255)`| Yes | `NULL` | — | Token pembayaran berulang tersimpan dari PG. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal aktivasi awal. |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal modifikasi record. |

### 3.4 Tabel `subscription_refunds`
Mencatat pelacakan refund atas pembatalan langganan bulanan berdasarkan masa kelayakan 30 hari pertama (Draft Kontekstual `01_ProductDiscovery.md` §8.2 & IA H-05).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID kasus refund. |
| `user_subscription_id` | `UUID` | No | — | `FOREIGN KEY` -> `user_subscriptions.id`| ID langganan yang dibatalkan. |
| `status` | `VARCHAR(50)` | No | `'PENDING'` | Check: `'PENDING'`, `'APPROVED'`, `'REJECTED'` | Status peninjauan refund. |
| `refund_amount` | `NUMERIC(12,2)`| No | — | `>= 0.00` | Nominal uang kembali (100% jika <30 hari, 0% jika >30 hari). |
| `reason` | `TEXT` | Yes | `NULL` | Max 500 karakter | Alasan pembatalan dari pengguna. |
| `admin_notes` | `TEXT` | Yes | `NULL` | — | Catatan/alasan persetujuan/penolakan dari Admin. |
| `processed_by` | `UUID` | Yes | `NULL` | `FOREIGN KEY` -> `users.id` (Admin/Finance) | Akun operator yang memproses status. |
| `processed_at` | `TIMESTAMPTZ` | Yes | `NULL` | — | Waktu keputusan diambil. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal klaim diajukan. |

### 3.5 Tabel `rooms`
Menyimpan data fisik ruangan / studio smart classroom (form edit/tambah ruangan `admin/rooms.html` / IA Screen H-08).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `VARCHAR(100)` | No | — | `PRIMARY KEY` (e.g. `'rm-jakarta-01'`) | Kode/Slug unik ruangan (tidak memakai UUID agar URL readable). |
| `name` | `VARCHAR(255)` | No | — | — | Nama ruangan (form `Tambah Ruangan`). |
| `location` | `VARCHAR(255)` | No | — | — | Keterangan gedung & lantai (e.g. `'Lantai 3, Gedung Utama'`). |
| `capacity_tier` | `VARCHAR(50)` | No | — | Check: `'SMALL'`, `'MEDIUM'`, `'LARGE'` | Kelompok kapasitas (filter sitemap IA & PRD §8.1.A). |
| `capacity_seats` | `INTEGER` | No | — | `> 0` | Jumlah kursi presisi (e.g. 15, 30, 50). |
| `price_per_hour` | `NUMERIC(12,2)`| No | — | Harga acuan: 150k (Small), 250k (Med), 350k (Large)| Tarif sewa per jam (dalam IDR). |
| `status` | `VARCHAR(50)` | No | `'AVAILABLE'`| Check: `'AVAILABLE'`, `'MAINTENANCE'` | Status operasional ruangan (Maintenance menyembunyikan ruangan dari katalog). |
| `smart_lock_device_id`| `VARCHAR(100)`| Yes | `NULL` | `UNIQUE` | ID perangkat IoT Smart Lock terdaftar (MQTT relay channel). |
| `wifi_ip_address` | `VARCHAR(45)` | Yes | `NULL` | IPv4 / IPv6 Subnet Format | IP/Subnet WiFi lokal kelas (FEAT-CTL-01 Geofence). |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal ruangan ditambahkan ke database. |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal konfigurasi ruangan diperbarui. |

### 3.6 Tabel `room_facilities`
Menampung asosiasi fasilitas hardware terinstall pada masing-masing ruangan (dijadikan referensi multi-checkbox pada `admin/rooms.html` & pencarian katalog `index.html`).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID asosiasi fasilitas. |
| `room_id` | `VARCHAR(100)` | No | — | `FOREIGN KEY` -> `rooms.id` ON DELETE CASCADE | ID ruangan terkait. |
| `facility_name` | `VARCHAR(100)` | No | — | Check: `'SMART_BOARD'`,`'MULTI_CAM_AI'`,`'STUDIO_PODCASTING'`,`'AUDIO_ARRAY'` | Tag nama fasilitas hardware aktif. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Timestamp data dibuat. |

### 3.7 Tabel `bookings`
Menyimpan transaksi sewa ruangan berdurasi jam. Kode booking dibuat terstruktur (`bkg-YYYYMMDD-XXXX`) sesuai API schema (`docs/03_FunctionalRequirementDocument.md` §5.1).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `VARCHAR(100)` | No | — | `PRIMARY KEY` (e.g. `'bkg-20260820-0089'`) | Format string ID transaksi booking terstruktur. |
| `user_id` | `UUID` | No | — | `FOREIGN KEY` -> `users.id` | Pelanggan pemesan. |
| `room_id` | `VARCHAR(100)` | No | — | `FOREIGN KEY` -> `rooms.id` | Ruangan yang dipesan. |
| `booking_date` | `DATE` | No | — | `>= Current Date` | Tanggal reservasi. |
| `start_time` | `TIME` | No | — | Format HH:mm (07:00 - 22:00) | Jam mulai sesi kelas. |
| `end_time` | `TIME` | No | — | `> start_time`, minimal selisih 60 menit & kelipatan 30m | Jam berakhir sesi kelas (validasi silang). |
| `status` | `VARCHAR(50)` | No | `'PENDING_PAYMENT'`| Check: `'PENDING_PAYMENT'`, `'CONFIRMED'`, `'CANCELLED'`, `'IN_ROOM'`, `'COMPLETED'` | Status reservasi. |
| `payment_type` | `VARCHAR(50)` | No | — | Check: `'PAY_PER_USE'`, `'SUBSCRIPTION_QUOTA'` | Jenis cara pemotongan transaksi (VA/E-wallet vs Quota). |
| `original_amount` | `NUMERIC(12,2)`| No | — | Tarif ruangan × durasi jam | Biaya sewa dasar. |
| `add_ons_amount` | `NUMERIC(12,2)`| No | `0.00` | Sesuai nominal add-on terpilih | Biaya tambahan (misal: AI Transkripsi add-on). |
| `discount_amount` | `NUMERIC(12,2)`| No | `0.00` | — | Nominal potongan harga. |
| `total_amount` | `NUMERIC(12,2)`| No | — | `(original + add_ons) - discount` | Total biaya akhir yang ditagihkan/dibayar. |
| `is_ai_transcription_addon` | `BOOLEAN` | No | `FALSE` | — | Status apakah layanan transkripsi AI dibeli secara add-on. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal pembuatan data (trigger Redis Slot Lock). |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal status diperbarui. |

### 3.8 Tabel `payments`
Mencatat riwayat pembayaran yang diproses via Payment Gateway (Midtrans/Xendit) untuk sewa ruangan atau pembelian subscription.

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID pembayaran sistem. |
| `booking_id` | `VARCHAR(100)` | Yes | `NULL` | `FOREIGN KEY` -> `bookings.id` ON DELETE SET NULL | Booking terkait (jika pembayaran sewa). |
| `user_subscription_id` | `UUID` | Yes | `NULL` | `FOREIGN KEY` -> `user_subscriptions.id` | Subscriptions terkait (jika pembayaran paket). |
| `payment_method` | `VARCHAR(100)` | No | — | Check: `'VA_BCA'`, `'VA_MANDIRI'`, `'VA_BNI'`, `'EWALLET_GOPAY'`, `'EWALLET_OVO'`, `'EWALLET_SHOPEEPAY'`, `'SUBSCRIPTION_QUOTA'` | Metode pembayaran yang dipilih. |
| `status` | `VARCHAR(50)` | No | `'PENDING'` | Check: `'PENDING'`, `'PAID'`, `'FAILED'`, `'REFUNDED'` | Status pemrosesan pembayaran. |
| `transaction_id` | `VARCHAR(255)` | Yes | `NULL` | — | Kode referensi transaksi eksternal dari PG. |
| `paid_amount` | `NUMERIC(12,2)`| No | — | `>= 0` | Nominal dana riil yang disetorkan. |
| `payment_url` | `VARCHAR(500)` | Yes | `NULL` | — | Tautan pengalihan ke PG / QR bayar. |
| `expires_at` | `TIMESTAMPTZ` | No | — | Waktu saat checkout + 15 menit | Batas waktu transfer sebelum hangus/expire. |
| `paid_at` | `TIMESTAMPTZ` | Yes | `NULL` | — | Tanggal webhook callback status lunas diterima. |
| `callback_raw` | `JSONB` | Yes | `NULL` | — | Menyimpan payload webhook mentah untuk histori debugging. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal pembayaran diajukan. |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Pembaruan status transaksi. |

### 3.9 Tabel `room_access_tokens`
Menyimpan token akses IoT digital (PIN & QR Code) dengan buffer toleransi waktu sewa (+/- 15 menit) sesuai `docs/03_FunctionalRequirementDocument.md` §7.1.

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID token akses fisik. |
| `booking_id` | `VARCHAR(100)` | No | — | `FOREIGN KEY` -> `bookings.id` ON DELETE CASCADE | Hubungan reservasi. |
| `pin_code` | `VARCHAR(6)` | No | — | format regex: `^[0-9]{6}$` | PIN cadangan 6 digit numerik. |
| `qr_code_content` | `VARCHAR(255)` | No | — | HMAC-SHA256 encrypted | Isi data QR untuk dipindai oleh kamera lock. |
| `access_start_time` | `TIMESTAMPTZ` | No | — | Tanggal sewa & `start_time` minus 15 menit | Awal waktu pintu dapat dibuka (buffer prep). |
| `access_end_time` | `TIMESTAMPTZ` | No | — | Tanggal sewa & `end_time` plus 15 menit | Akhir waktu pintu dapat dibuka (buffer checkout). |
| `is_used` | `BOOLEAN` | No | `FALSE` | — | Penanda apakah token telah digunakan masuk pertama kali. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Waktu token digenerasikan (sukses bayar). |

### 3.10 Tabel `recordings`
Menyimpan tautan video hasil rekaman lokal edge IoT studio kelas yang telah diunggah ke cloud S3 storage (FEAT-VLT-01).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID internal berkas rekaman. |
| `booking_id` | `VARCHAR(100)` | No | — | `FOREIGN KEY` -> `bookings.id` ON DELETE CASCADE | Booking asal. |
| `session_id` | `VARCHAR(100)` | No | — | — | ID sesi rekaman RTSP dari controller (`rec-sess-xxxx`). |
| `status` | `VARCHAR(50)` | No | `'PROCESSING'` | Check: `'RECORDING'`, `'PAUSED'`, `'STOPPED'`, `'PROCESSING'`, `'READY'`, `'FAILED'` | Status kesiapan video di cloud vault. |
| `started_at` | `TIMESTAMPTZ` | Yes | `NULL` | — | Waktu awal rekaman dinyalakan. |
| `stopped_at` | `TIMESTAMPTZ` | Yes | `NULL` | `> started_at` | Waktu akhir rekaman dimatikan. |
| `raw_video_url` | `VARCHAR(500)` | Yes | `NULL` | — | URL bucket S3 privat rekaman mentah (.ts / .mkv). |
| `processed_video_url`| `VARCHAR(500)`| Yes | `NULL` | — | URL CDN video yang siap diunduh pengguna (.mp4). |
| `video_duration_seconds`| `INTEGER`| Yes | `NULL` | `>= 0` | Durasi video terhitung. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Log inisiasi rekaman dibuat. |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Pembaruan status unggahan/konversi. |

### 3.11 Tabel `ai_transcriptions`
Menyimpan berkas teks hasil Speech-to-Text asynchronous yang diproses setelah video sukses terunggah (FEAT-VLT-02 / PRD FR-07).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID berkas transkrip. |
| `recording_id` | `UUID` | No | — | `FOREIGN KEY` -> `recordings.id` ON DELETE CASCADE | Berkas video asal audio. |
| `status` | `VARCHAR(50)` | No | `'PENDING'` | Check: `'PENDING'`, `'PROCESSING'`, `'READY'`, `'FAILED'` | Status progres Speech-to-Text. |
| `transcript_srt_url` | `VARCHAR(500)` | Yes | `NULL` | — | URL S3 file subtitle format `.srt`. |
| `transcript_json_url`| `VARCHAR(500)` | Yes | `NULL` | — | URL S3 file transkrip berstempel waktu format `.json`. |
| `word_count` | `INTEGER` | Yes | `NULL` | `>= 0` | Jumlah kata terdeteksi (opsional untuk analitik). |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Log inisiasi transkripsi. |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Pembaruan status konversi AI. |

### 3.12 Tabel `room_maintenance_logs`
Mencatat alasan ruangan ditutup dari publik oleh operator untuk pemeliharaan hardware/IoT (`admin/rooms.html`).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID catatan maintenance. |
| `room_id` | `VARCHAR(100)` | No | — | `FOREIGN KEY` -> `rooms.id` ON DELETE CASCADE | Ruangan yang dikunci. |
| `operator_id` | `UUID` | No | — | `FOREIGN KEY` -> `users.id` (Ops/Admin) | Operator penanggung jawab. |
| `reason` | `VARCHAR(255)` | No | — | — | Judul / deskripsi singkat maintenance. |
| `notes` | `TEXT` | Yes | `NULL` | — | Detail perbaikan rutin (input `maintenanceNotes`). |
| `started_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Waktu dimulai penutupan. |
| `ended_at` | `TIMESTAMPTZ` | Yes | `NULL` | `> started_at` | Waktu selesai perbaikan (ruangan dibuka kembali). |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Log dibuat. |

### 3.13 Tabel `iot_device_status`
Melacak status heartbeat terkini untuk seluruh perangkat sensor IoT terinstall di ruangan untuk pendeteksian dini error (dashboard Admin portal `admin/dashboard.html` / IA Screen H-09).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID status perangkat. |
| `room_id` | `VARCHAR(100)` | No | — | `FOREIGN KEY` -> `rooms.id` ON DELETE CASCADE | Lokasi ruangan hardware. |
| `device_type` | `VARCHAR(50)` | No | — | Check: `'SMART_LOCK'`, `'AI_CAMERA'`, `'AUDIO_ARRAY'` | Jenis hardware yang diawasi. |
| `status` | `VARCHAR(50)` | No | `'OFFLINE'` | Check: `'ONLINE'`, `'OFFLINE'` | Status konektivitas terakhir. |
| `last_heartbeat` | `TIMESTAMPTZ` | No | `NOW()` | — | Waktu ping detak jantung terakhir yang diterima server. |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Log inisiasi. |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Timestamp pembaruan detak jantung terakhir. |

### 3.14 Tabel `manual_unlock_logs`
Menyimpan jejak audit wajib beserta alasan tertulis ketika petugas admin membukakan kunci pintu manual dari remote server (`admin/dashboard.html` / IA Screen H-10).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID log manual unlock. |
| `room_id` | `VARCHAR(100)` | No | — | `FOREIGN KEY` -> `rooms.id` ON DELETE CASCADE | Ruangan yang pintunya dibuka manual. |
| `operator_id` | `UUID` | No | — | `FOREIGN KEY` -> `users.id` (Ops/Admin) | Akun petugas yang mengeksekusi override. |
| `booking_id` | `VARCHAR(100)` | Yes | `NULL` | `FOREIGN KEY` -> `bookings.id` ON DELETE SET NULL | Hubungan booking aktif (jika ada). |
| `reason` | `TEXT` | No | — | Min 10 karakter | Alasan wajib mengapa pintu dibukakan (input `overrideReason`). |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Waktu eksekusi perintah unlock. |

### 3.15 Tabel `late_checkout_logs`
Mencatat denda keterlambatan pengosongan kelas yang dilaporkan manual oleh petugas operasional (v1.3 logic: `docs/03_FunctionalRequirementDocument.md` §7.3).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID catatan insiden checkout terlambat. |
| `booking_id` | `VARCHAR(100)` | No | — | `FOREIGN KEY` -> `bookings.id` ON DELETE CASCADE | Booking yang overtime. |
| `operator_id` | `UUID` | No | — | `FOREIGN KEY` -> `users.id` (Ops/Admin) | Petugas yang melaporkan insiden. |
| `actual_checkout_time`| `TIMESTAMPTZ` | No | — | `> bookings.end_time` | Waktu aktual pengguna baru keluar kelas. |
| `overtime_minutes` | `INTEGER` | No | — | `> 10` (Toleransi batas checkout 10 menit) | Jumlah menit keterlambatan. |
| `penalty_amount` | `NUMERIC(12,2)`| No | — | Dihitung `1.5x tarif per jam` secara proporsional | Nominal denda yang ditagihkan. |
| `notes` | `TEXT` | Yes | `NULL` | — | Detail/alasan keterlambatan checkout (input `lateCheckoutNotes`). |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Tanggal pembuatan laporan denda. |

### 3.16 Tabel `audit_logs`
Menampung log keamanan terpusat untuk aktivitas administratif penting di Portal Admin (IA Screen H-11 / Audit Logs).

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID entri audit. |
| `actor_id` | `UUID` | No | — | `FOREIGN KEY` -> `users.id` ON DELETE RESTRICT | Operator penanggung jawab. |
| `actor_role` | `VARCHAR(50)` | No | — | — | Peran/role JWT aktor saat melakukan aksi — nilai mengacu `role_enum` §4 (Member/Premium Member/Studio Admin/Super Admin). |
| `action` | `VARCHAR(100)` | No | — | — | Tipe aksi (e.g. `'MANUAL_UNLOCK'`, `'CHANGE_ROLE'`, `'REFUND_BOOKING'`). |
| `target_table` | `VARCHAR(100)` | No | — | — | Tabel database fisik yang diubah nilainya. |
| `target_id` | `VARCHAR(100)` | No | — | — | Primary key record yang terdampak. |
| `changes_payload` | `JSONB` | Yes | `NULL` | — | Detail perubahan field (sebelum & sesudah) dalam struktur JSON. |
| `description` | `TEXT` | No | — | — | Narasi penjelas aksi (e.g. "Mengubah role user X dari Member ke Admin"). |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Waktu pencatatan log (sumber waktu server). |

### 3.17 Tabel `booking_cancellations` *(baru — hasil analisa)*

> **Temuan:** Draf v1.0 memiliki `subscription_refunds` untuk pembatalan **langganan**, tetapi tidak memiliki tabel setara untuk pembatalan **booking pay-per-use self-service** (FEAT-BKG-03) — padahal ini adalah alur MVP inti yang sudah punya kontrak API eksplisit di `docs/03_FunctionalRequirementDocument.md` §5.4 (`POST /api/v1/bookings/{id}/cancel`, response memuat `refund_percentage` & `refund_amount`) dan screen `3.7 Cancellation & Refund Confirmation` / `5.6 Booking & Refund Management` di IA. Tabel ini menutup gap tersebut, memakai field yang **sama persis namanya** dengan payload API §5.4 agar tidak ada terjemahan ganda di kode.

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID catatan pembatalan. |
| `booking_id` | `VARCHAR(100)` | No | — | `FOREIGN KEY` -> `bookings.id` ON DELETE CASCADE, `UNIQUE` (1 booking maksimal 1 kali dibatalkan) | Booking yang dibatalkan. |
| `cancelled_by` | `UUID` | No | — | `FOREIGN KEY` -> `users.id` | Akun yang mengeksekusi pembatalan — pemilik booking (self-service, 3.7) atau admin (override, 5.6). |
| `cancelled_by_role` | `VARCHAR(50)` | No | — | Nilai `role_enum` §4 | Peran aktor saat membatalkan — membedakan pembatalan mandiri (`MEMBER`/`PREMIUM_MEMBER`) vs override (`STUDIO_ADMIN`/`SUPER_ADMIN`), sesuai pemisahan RBAC "Cancel Own Booking" vs "override" di `03_FunctionalRequirementDocument.md` §4. |
| `refund_percentage` | `INTEGER` | No | — | Check: `100`, `50`, `0` | Persentase refund sesuai Cancellation Policy `03_FunctionalRequirementDocument.md` §7.2 (`>24 jam`=100, `4-24 jam`=50, `<4 jam`=0). Nama field sama persis dengan payload API §5.4. |
| `refund_amount` | `NUMERIC(12,2)`| No | — | `= bookings.total_amount * refund_percentage / 100` | Nominal refund dalam IDR. Nama field sama persis dengan payload API §5.4. |
| `refund_destination` | `VARCHAR(50)` | No | — | Check: `'WALLET'`, `'SUBSCRIPTION_QUOTA'` | Tujuan pengembalian sesuai FRD §7.2 ("dikreditkan ke saldo wallet/kuota") — `WALLET` jika booking dibayar VA/E-Wallet (lihat §3.18 `wallet_transactions`), `SUBSCRIPTION_QUOTA` jika `bookings.payment_type = 'SUBSCRIPTION_QUOTA'` (mengembalikan jam ke `user_subscriptions.quota_hours_used`). |
| `reason` | `TEXT` | Yes | `NULL` | Max 500 karakter (FRD §6) | Alasan pembatalan — tidak memengaruhi persentase refund (FRD §6, baris `reason`). |
| `cancelled_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Waktu pembatalan dieksekusi — dipakai untuk menghitung selisih jam ke sesi (basis `refund_percentage`). |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Waktu record dibuat. |

### 3.18 Tabel `wallet_transactions` *(baru — hasil analisa)*

> **Temuan:** `03_FunctionalRequirementDocument.md` §7.2 menyebut refund pembatalan booking pay-per-use "dikreditkan ke **saldo wallet**/kuota" — istilah "wallet" ini tidak direpresentasikan sama sekali di draf skema v1.0 (hanya kuota subscription yang ada). Tabel ini adalah *ledger* append-only (pola sama dengan `audit_logs` — tidak pernah di-`UPDATE`/`DELETE`, hanya `INSERT`) agar saldo `users.wallet_balance` selalu bisa direkonsiliasi dari riwayat transaksinya.

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID entri ledger. |
| `user_id` | `UUID` | No | — | `FOREIGN KEY` -> `users.id` | Pemilik saldo wallet. |
| `type` | `VARCHAR(20)` | No | — | Check: `'CREDIT'`, `'DEBIT'` | Arah transaksi. MVP saat ini hanya menghasilkan `CREDIT` (dari refund booking) — `DEBIT` disiapkan untuk saat wallet dapat dipakai membayar booking baru (belum ada di FRD, ditandai sebagai kemungkinan pasca-MVP, bukan fitur yang sudah dikonfirmasi). |
| `amount` | `NUMERIC(12,2)`| No | — | `> 0` | Nominal transaksi (selalu positif; arah ditentukan `type`). |
| `balance_after` | `NUMERIC(12,2)`| No | — | `>= 0.00` | Saldo `users.wallet_balance` setelah transaksi ini — snapshot untuk audit tanpa perlu replay seluruh ledger. |
| `reference_type` | `VARCHAR(50)` | No | — | Check: `'BOOKING_CANCELLATION'` (MVP) | Sumber pemicu transaksi. |
| `reference_id` | `VARCHAR(100)` | Yes | `NULL` | Merujuk `booking_cancellations.id` | ID record sumber transaksi. |
| `description` | `TEXT` | Yes | `NULL` | — | Narasi ringkas (e.g. "Refund pembatalan booking bkg-20260820-0089"). |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Waktu transaksi dicatat. |

### 3.19 Tabel `door_access_attempts` *(baru — hasil analisa)*

> **Temuan:** Matriks error `03_FunctionalRequirementDocument.md` §8 mensyaratkan deteksi *"jika terjadi berulang (>3x) pada `room_id` yang sama dalam 10 menit, kirim notifikasi ke Studio Admin"* untuk kode `TOKEN_EXPIRED_OR_INVALID`, dan `04_InformationArchitecture.md` §4.7 (H-07 Ops Dashboard) mensyaratkan **Live Alert Feed** yang menampilkan insiden ini — namun draf skema v1.0 hanya mencatat token yang **valid** (`room_access_tokens`), tidak ada jejak percobaan **gagal**. Tabel ini menutup gap tersebut.

| Nama Kolom | Tipe Data | Nullable | Default | Batasan & Aturan Bisnis / FK | Deskripsi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| `PRIMARY KEY` | ID entri percobaan akses. |
| `room_id` | `VARCHAR(100)` | No | — | `FOREIGN KEY` -> `rooms.id` ON DELETE CASCADE | Ruangan tempat percobaan terjadi. |
| `booking_id` | `VARCHAR(100)` | Yes | `NULL` | `FOREIGN KEY` -> `bookings.id` ON DELETE SET NULL | Terisi jika token valid tapi di luar jendela waktu; `NULL` jika PIN/QR tidak dikenali sama sekali. |
| `input_type` | `VARCHAR(10)` | No | — | Check: `'PIN'`, `'QR'` | Metode input yang dicoba di Smart Lock. |
| `result` | `VARCHAR(30)` | No | — | Check: `'SUCCESS'`, `'TOKEN_EXPIRED_OR_INVALID'` | Hasil validasi — nilai gagal memakai kode error persis dari FRD §8 agar mudah di-*grep* lintas log & API response. |
| `attempted_at` | `TIMESTAMPTZ` | No | `NOW()` | — | Waktu percobaan — dasar perhitungan jendela "10 menit" pada Business Rule terkait `TOKEN_EXPIRED_OR_INVALID`. |

---

## 4. Enum & Custom Types

Untuk membatasi kebebasan pengisian nilai kolom bertipe status, sistem menggunakan PostgreSQL native Enum (atau CHECK Constraint pada string).

1. **`role_enum`**: `'MEMBER'`, `'PREMIUM_MEMBER'`, `'STUDIO_ADMIN'`, `'SUPER_ADMIN'`
2. **`subscription_status_enum`**: `'ACTIVE'`, `'CANCELLED'`, `'EXPIRED'`, `'PENDING'`
3. **`refund_status_enum`**: `'PENDING'`, `'APPROVED'`, `'REJECTED'`
4. **`room_capacity_enum`**: `'SMALL'`, `'MEDIUM'`, `'LARGE'`
5. **`room_status_enum`**: `'AVAILABLE'`, `'MAINTENANCE'`
6. **`facility_name_enum`**: `'SMART_BOARD'`, `'MULTI_CAM_AI'`, `'STUDIO_PODCASTING'`, `'AUDIO_ARRAY'`
7. **`booking_status_enum`**: `'PENDING_PAYMENT'`, `'CONFIRMED'`, `'CANCELLED'`, `'IN_ROOM'`, `'COMPLETED'`
8. **`payment_method_enum`**: `'VA_BCA'`, `'VA_MANDIRI'`, `'VA_BNI'`, `'EWALLET_GOPAY'`, `'EWALLET_OVO'`, `'EWALLET_SHOPEEPAY'`, `'SUBSCRIPTION_QUOTA'`
9. **`payment_status_enum`**: `'PENDING'`, `'PAID'`, `'FAILED'`, `'REFUNDED'`
10. **`recording_status_enum`**: `'RECORDING'`, `'PAUSED'`, `'STOPPED'`, `'PROCESSING'`, `'READY'`, `'FAILED'`
11. **`iot_device_type_enum`**: `'SMART_LOCK'`, `'AI_CAMERA'`, `'AUDIO_ARRAY'`
12. **`wallet_transaction_type_enum`** *(baru)*: `'CREDIT'`, `'DEBIT'`
13. **`refund_destination_enum`** *(baru)*: `'WALLET'`, `'SUBSCRIPTION_QUOTA'`
14. **`door_access_input_type_enum`** *(baru)*: `'PIN'`, `'QR'`
15. **`door_access_result_enum`** *(baru)*: `'SUCCESS'`, `'TOKEN_EXPIRED_OR_INVALID'` — nilai gagal sengaja disamakan persis dengan kode error `03_FunctionalRequirementDocument.md` §8.

---

## 5. Implementasi Workflow pada Level Skema

Berikut adalah alur perubahan status record di database PostgreSQL selama siklus hidup transaksi berjalan.

### 5.1 Alur Checkout, Hold, & Pelunasan Booking
1. Ketika pengguna menekan **"Pilih Jadwal"** (FEAT-BKG-01 / Hold), sistem:
   * Menulis entri baru di tabel `bookings` dengan status `'PENDING_PAYMENT'`.
   * Menulis entri baru di tabel `payments` dengan status `'PENDING'` dan `expires_at` diset `NOW() + INTERVAL '15 minutes'`.
   * Mengambil distributed lock di Redis selama 15 menit agar tidak bisa ditimpa.
2. Jika waktu 15 menit habis tanpa pembayaran (**`PAYMENT_TIMEOUT`**):
   * Redis lock kedaluwarsa secara otomatis.
   * Webhook/Cron memperbarui status `payments.status` menjadi `'FAILED'`.
   * Memperbarui status `bookings.status` menjadi `'CANCELLED'`.
3. Jika pembayaran lunas (**Webhook Receiver** - FEAT-PAY-01):
   * Webhook menerima callback, mencari record pembayaran berdasarkan `booking_id`.
   * Memperbarui `payments.status` = `'PAID'`, `payments.paid_at` = `NOW()`, dan menyimpan payload mentah ke `payments.callback_raw`.
   * Memperbarui `bookings.status` = `'CONFIRMED'`.
   * Menghasilkan entri baru di tabel `room_access_tokens` lengkap dengan PIN 6 digit dan `qr_code_content` hasil enkripsi HMAC, di mana `access_start_time` diisi `bookings.start_time - 15 menit` dan `access_end_time` diisi `bookings.end_time + 15 menit`.

### 5.2 Alur Pemotongan Kuota Langganan (Subscription Quota)
Jika metode pembayaran terpilih adalah **`SUBSCRIPTION_QUOTA`** (Premium Member - FEAT-PAY-02):
1. Transaksi dibungkus dalam Database ACID Transaction Block (`BEGIN ... COMMIT`).
2. Program melakukan lock record baris langganan aktif:
   ```sql
   SELECT id, quota_hours_used, quota_hours_total 
   FROM user_subscriptions 
   WHERE user_id = :user_id AND status = 'ACTIVE' 
   FOR UPDATE;
   ```
3. Melakukan pengecekan sisa kuota — **wajib periksa sentinel "Unlimited" lebih dulu** (koreksi hasil analisa: pseudocode draf v1.0 langsung mengurangkan tanpa case ini, yang akan membuat `sisa_kuota` selalu negatif untuk Enterprise dan salah memicu `QUOTA_EXCEEDED`):
   ```sql
   IF quota_hours_total = -1 THEN
       -- Enterprise "Unlimited" (§3.2) — lewati pengecekan sisa kuota sepenuhnya
       sisa_kuota := 999999; -- nilai simbolis, tidak pernah dipakai untuk membatasi
   ELSE
       sisa_kuota := quota_hours_total - quota_hours_used;
   END IF;
   ```
   Jika sewa membutuhkan `2.0` jam, dan `sisa_kuota < 2.0`, transaksi dibatalkan (`ROLLBACK`) dan memicu error `QUOTA_EXCEEDED` agar dialihkan ke pay-per-use. Untuk Enterprise (`quota_hours_total = -1`), langkah ini **tidak pernah** menghasilkan `QUOTA_EXCEEDED`.
4. Jika kuota mencukupi (atau plan = Enterprise/Unlimited):
   * Menambahkan kuota terpakai: `quota_hours_used = quota_hours_used + 2.0`.
   * Membuat entri di tabel `bookings` dengan status `'CONFIRMED'` secara instan (karena tidak perlu menunggu status lunas Payment Gateway).
   * Membuat entri `'PAID'` di tabel `payments` dengan `payment_method` = `'SUBSCRIPTION_QUOTA'` dan `paid_amount` = `0`.
   * Membuat entri token di `room_access_tokens`.
   * Mengakhiri transaksi database (`COMMIT`).

### 5.3 Alur Buka Pintu Smart Lock IoT & In-Room Control
1. Pengguna memindai QR / mengetikkan PIN di pintu kelas fisik (Smart Lock).
2. Perangkat smart lock mengirimkan data payload ke MQTT broker pada topik `/classroom/door/access_req`.
3. Backend membaca payload, mencari token akses aktif di PostgreSQL:
   ```sql
   SELECT rat.booking_id, b.room_id, b.status
   FROM room_access_tokens rat
   JOIN bookings b ON rat.booking_id = b.id
   WHERE (rat.pin_code = :input_pin OR rat.qr_code_content = :input_qr)
     AND NOW() BETWEEN rat.access_start_time AND rat.access_end_time
     AND b.status = 'CONFIRMED';
   ```
4. Jika ditemukan record valid:
   * Mengirim pesan persetujuan ke MQTT topik `/classroom/door/unlock`.
   * Memperbarui status booking `bookings.status` dari `'CONFIRMED'` menjadi `'IN_ROOM'`.
   * Menandai token akses `room_access_tokens.is_used` = `TRUE`.
5. Jika pengguna menekan tombol **"Start Recording"** di In-Room Controller (FEAT-CTL-02):
   * Membuat entri baru di tabel `recordings` dengan status `'RECORDING'` dan `started_at` = `NOW()`.

### 5.4 Alur Pasca Kelas: Upload Video & Transkripsi AI
1. Ketika sesi berakhir / pengguna menekan **"Selesaikan Sesi Lebih Awal"** (Exit):
   * Memperbarui `bookings.status` menjadi `'COMPLETED'`.
   * Memperbarui status video `recordings.status` menjadi `'STOPPED'` dan `stopped_at` = `NOW()`.
2. Pipeline edge studio lokal mengunggah video ke S3 bucket. Begitu sukses terunggah (FEAT-VLT-01):
   * Memperbarui `recordings.status` = `'READY'`, `recordings.raw_video_url` dan `processed_video_url` diisi dengan path S3.
   * Menghitung dan menyimpan `recordings.video_duration_seconds`.
3. Worker memicu tugas Speech-to-Text secara asynchronous (FEAT-VLT-02):
   * Membuat entri baru di tabel `ai_transcriptions` dengan status `'PENDING'`.
   * Begitu selesai dikonversi oleh mesin AI: memperbarui status `ai_transcriptions.status` = `'READY'` serta menulis tautan bucket berkas teks hasil transkrip ke `transcript_srt_url` dan `transcript_json_url`.
   * Jika konversi gagal pasca-retry 3x: memperbarui status `ai_transcriptions.status` = `'FAILED'` (memicu notifikasi error `TRANSCRIPTION_FAILED` di Admin panel).

### 5.5 Alur Pembatalan & Refund Booking Pay-Per-Use *(baru — hasil analisa, sebelumnya tidak terdokumentasi meski tabelnya sekarang ada di §3.17-3.18)*

Alur ini mengimplementasikan `POST /api/v1/bookings/{id}/cancel` (`03_FunctionalRequirementDocument.md` §5.4) yang dipanggil dari screen self-service `3.7 Cancellation & Refund Confirmation` maupun override admin `5.6 Booking & Refund Management`.

1. Sistem memvalidasi **Cancellation Guard** (Business Rule 5, FRD §7): jika `bookings.status` sudah `'COMPLETED'`/`'CANCELLED'` atau `current_time >= start_time`, tolak dengan `CANCELLATION_NOT_ALLOWED` (409).
2. Hitung `refund_percentage` berdasarkan selisih waktu ke `start_time` (FRD §7.2): `100` jika `> 24 jam`, `50` jika `4-24 jam`, `0` jika `< 4 jam`.
3. Dalam satu **Database ACID Transaction Block**:
   * Insert baris baru ke `booking_cancellations` (`refund_percentage`, `refund_amount = bookings.total_amount * refund_percentage / 100`, `cancelled_by`, `cancelled_by_role`, `reason`).
   * Update `bookings.status` = `'CANCELLED'`.
   * **Tentukan `refund_destination` dari `bookings.payment_type`:**
     * Jika `payment_type = 'PAY_PER_USE'` dan `refund_amount > 0`: `refund_destination = 'WALLET'` → `UPDATE users SET wallet_balance = wallet_balance + refund_amount WHERE id = :user_id` **(gunakan `SELECT ... FOR UPDATE` pada baris `users` untuk mencegah race condition, pola sama seperti lock kuota di §5.2)**, lalu insert baris `wallet_transactions` (`type = 'CREDIT'`, `reference_type = 'BOOKING_CANCELLATION'`, `reference_id = booking_cancellations.id`, `balance_after` = saldo terbaru).
     * Jika `payment_type = 'SUBSCRIPTION_QUOTA'` dan `refund_amount > 0`: `refund_destination = 'SUBSCRIPTION_QUOTA'` → `UPDATE user_subscriptions SET quota_hours_used = quota_hours_used - :durasi_jam_booking WHERE id = :subscription_id` (mengembalikan jam yang sempat terpotong di §5.2).
     * Jika `refund_amount = 0` (pembatalan `< 4 jam`): tetap insert `booking_cancellations` untuk audit trail, tanpa mutasi saldo/kuota.
   * Update `payments.status` = `'REFUNDED'` pada record pembayaran terkait `booking_id` (hanya jika `refund_amount > 0`).
   * (`COMMIT`)
4. Response `200 OK` mengembalikan `refund_percentage` & `refund_amount` sesuai kontrak API §5.4.

### 5.6 Alur Pembatalan & Refund Subscription *(baru — hasil analisa; tabel `subscription_refunds` sudah ada di draf v1.0 tapi belum punya narasi alur)*

Mengikuti alur komunikasi draft kontekstual `01_ProductDiscovery.md` §8.2 (angka "30 hari" & SLA proses masih **belum final**, menunggu validasi bisnis/legal — lihat catatan di §8.2 sumber):

1. Pengguna mengajukan pembatalan dari `3.5 Subscriptions` (H-05) → Insert baris baru `subscription_refunds` dengan `status = 'PENDING'`, `refund_amount` dihitung sementara (100% jika `NOW() - user_subscriptions.start_date <= 30 hari`, else `0`).
2. Notifikasi email/in-app dikirim ke pengguna (di luar cakupan skema — lapisan notifikasi terpisah).
3. Tim Ops/Finance meninjau via Admin Portal, memperbarui `status` menjadi `'APPROVED'` atau `'REJECTED'` beserta `admin_notes`, `processed_by`, `processed_at`.
4. Jika `'APPROVED'`: update `user_subscriptions.status = 'CANCELLED'`, `user_subscriptions.auto_renew = FALSE`; nominal `refund_amount` diproses ke metode pembayaran asal (di luar cakupan skema — ditangani Payment Gateway, bukan `wallet_balance`, karena ini pembatalan siklus tagihan bulanan bukan pembatalan sesi per-jam).
5. Jika `'REJECTED'`: `user_subscriptions` tidak berubah, tetap aktif hingga `end_date`.

> ⚠️ **Asumsi (belum terdokumentasi):** PD §8.2 belum mengunci angka SLA hari kerja proses refund maupun mekanisme pencairan dana (transfer manual vs reversal otomatis PG) — poin 4 di atas adalah asumsi kerja minimal agar skema tetap konsisten, **bukan keputusan final**. Perlu dikonfirmasi bersama `P1-6`/kebijakan final IA screen 1.6 sebelum implementasi.

### 5.7 Alur Deteksi Percobaan Akses Berulang (Security Alert) *(baru — hasil analisa)*

Melengkapi Workflow 3.2 (`03_FunctionalRequirementDocument.md`) dan fail-safe `TOKEN_EXPIRED_OR_INVALID` (§8):

1. Setiap kali Smart Lock mengirim payload akses (valid maupun tidak) ke MQTT topik `/classroom/door/access_req`, backend **selalu** insert satu baris ke `door_access_attempts` (`result = 'SUCCESS'` atau `'TOKEN_EXPIRED_OR_INVALID'`), terlepas dari hasilnya — berbeda dari `room_access_tokens` yang hanya mencatat token yang valid.
2. Setelah insert gagal (`TOKEN_EXPIRED_OR_INVALID`), jalankan query pengecekan ambang batas:
   ```sql
   SELECT COUNT(*) FROM door_access_attempts
   WHERE room_id = :room_id
     AND result = 'TOKEN_EXPIRED_OR_INVALID'
     AND attempted_at >= NOW() - INTERVAL '10 minutes';
   ```
3. Jika hasil `COUNT(*) > 3`: kirim notifikasi ke **Studio Admin** (Live Alert Feed, IA §4.7 H-07) — indikasi percobaan akses ilegal pada `room_id` tersebut.

---

## 6. Strategi Pengindeksan & Optimasi Kinerja

Untuk memastikan query database tetap responsif saat traffic padat (terutama query pencarian katalog, pencocokan jadwal, dan pengecekan token akses IoT), indeks fisik berikut wajib diimplementasikan di PostgreSQL:

### 6.1 Indeks Pencarian Katalog Ruangan (Catalog Discovery)
Mendukung query filter cepat berdasarkan lokasi, kapasitas, status, dan harga (`index.html` / IA Screen H-01).
```sql
-- Indeks komposit untuk filter ruangan aktif berdasarkan lokasi dan kapasitas
CREATE INDEX idx_rooms_lookup 
ON rooms (status, capacity_tier, price_per_hour);

-- Indeks pada relasi fasilitas ruangan untuk pencarian filter hardware spesifik
CREATE INDEX idx_room_facilities_room_id 
ON room_facilities (room_id, facility_name);
```

### 6.2 Indeks Keterisian Jadwal (Slot Conflict Guard)
Mendukung pengecekan tabrakan slot waktu pemesanan saat booking hold diajukan (`POST /bookings/hold`).
```sql
-- Indeks komposit mendeteksi tabrakan slot pada tanggal & jam tertentu untuk ruangan tertentu
CREATE INDEX idx_bookings_schedule_guard 
ON bookings (room_id, booking_date, start_time, end_time) 
WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED', 'IN_ROOM');
```

### 6.3 Indeks Autentikasi IoT Smart Lock (Access Door Check)
Mendukung proses pencarian token PIN/QR Code super cepat oleh MQTT Broker (<200ms) saat user berdiri di depan pintu fisik.
```sql
-- Indeks pencarian token akses unik dengan range waktu validitas
CREATE UNIQUE INDEX idx_access_tokens_lookup 
ON room_access_tokens (pin_code) 
INCLUDE (booking_id, access_start_time, access_end_time);

CREATE UNIQUE INDEX idx_access_tokens_qr 
ON room_access_tokens (qr_code_content) 
INCLUDE (booking_id, access_start_time, access_end_time);
```

### 6.4 Indeks Riwayat Transaksi & Audit Logs
Mendukung pagination cepat pada halaman dashboard pengguna (Video Vault / History) dan tabel filter log admin.
```sql
-- Indeks pencarian riwayat booking milik pengguna
CREATE INDEX idx_bookings_user_history 
ON bookings (user_id, created_at DESC);

-- Indeks pencarian Video Vault pengguna
CREATE INDEX idx_recordings_lookup 
ON recordings (booking_id, status);

-- Indeks filter audit logs untuk admin (IA Screen H-11)
CREATE INDEX idx_audit_logs_filter 
ON audit_logs (target_table, action, created_at DESC);
```

### 6.5 Indeks Pendukung Temuan Baru (Wallet, Pembatalan & Security Alert) *(baru — hasil analisa)*
Mendukung query yang dipakai alur §5.5-§5.7 di atas.
```sql
-- Menjaga Business Rule 4 (MAX_CONCURRENT_LOCKS_EXCEEDED): hitung cepat booking PENDING_PAYMENT milik satu user
CREATE INDEX idx_bookings_user_pending_guard 
ON bookings (user_id) 
WHERE status = 'PENDING_PAYMENT';

-- Riwayat wallet pengguna (mirror pola idx_bookings_user_history)
CREATE INDEX idx_wallet_transactions_user_history 
ON wallet_transactions (user_id, created_at DESC);

-- Deteksi TOKEN_EXPIRED_OR_INVALID berulang dalam jendela 10 menit (§5.7)
CREATE INDEX idx_door_access_attempts_alert_window 
ON door_access_attempts (room_id, result, attempted_at DESC);
```

---

## 7. Desain Struktur Caching & Key-Value Redis

Redis digunakan untuk operasi berkecepatan tinggi yang tidak membutuhkan penyimpanan jangka panjang. Berikut adalah taksonomi key-value terstruktur untuk VC Classroom:

### 7.1 Distributed Locking (Slot Waktu Sementara - 15 Menit)
Mencegah terjadinya *double-booking* slot jam operasional ketika dua user menekan tombol checkout di detik yang sama (FEAT-BKG-01).

* **Format Key**: `lock:room:{room_id}:{booking_date}:{start_time}-{end_time}`
* **Format Value**: `{user_id}`
* **Masa Kedaluwarsa (TTL)**: `900` detik (15 Menit)
* **Logika Operasi**:
  * Mengunci slot menggunakan perintah atomic `SETNX`:
    ```redis
    SET lock:room:rm-jakarta-01:2026-08-20:09:00-11:00 "usr-uuid-12345" EX 900 NX
    ```
  * Jika perintah mengembalikan nilai `1`, kunci sukses dipegang pengguna dan proses simpan pending booking di DB dapat diteruskan. Jika return `0`, slot sudah dipesan orang lain (memicu error `SLOT_ALREADY_LOCKED`).

### 7.2 Cache Status Perangkat IoT (Heartbeat Monitor)
Menghindari beban query berlebih ke PostgreSQL setiap kali perangkat mengirimkan ping heartbeat secara berkala (mis. tiap 10 detik).

* **Format Key**: `iot:heartbeat:{room_id}:{device_type}`
* **Format Value**: `{"status": "ONLINE", "last_ping": "2026-08-09T14:15:30Z"}`
* **Masa Kedaluwarsa (TTL)**: `30` detik (jika hardware absen mengirim ping >30 detik, status otomatis dianggap offline).
* **Sync Logika**: Worker cron berkala (mis. 1 menit sekali) membaca keys ini dan memperbarui status di tabel `iot_device_status` PostgreSQL jika terjadi transisi status (`ONLINE` <-> `OFFLINE`), guna mencatat histori insiden.

### 7.3 Cache Token Sesi Dashboard In-Room Controller
Memvalidasi akses dashboard lokal kelas (`in-room.html` / Screen H-02) yang terikat dengan IP subnet lokal kelas.

* **Format Key**: `session:in-room:{room_id}`
* **Format Value**: `{"booking_id": "bkg-20260820-0089", "ip_address": "192.168.1.15"}`
* **Masa Kedaluwarsa (TTL)**: Dinamis, disesuaikan sisa durasi booking sesi berjalan + 15 menit toleransi.

---

## 8. Keamanan Data & Kebijakan Penghapusan (Soft Delete)

Sesuai dengan regulasi kepatuhan privasi (GDPR / UU PDP):
1. **Penghapusan Akun Pengguna (Soft Delete)**:
   * Kolom `deleted_at` di tabel `users` akan diisi timestamp saat pengguna menghapus akunnya.
   * Seluruh query publik harus mengabaikan record dengan `deleted_at IS NOT NULL`.
   * Setelah 30 hari (masa tunggu pembatalan akun), worker otomatis akan melakukan pengaburan data (*data masking* / anonimisasi) pada kolom sensitif seperti `email` (diubah menjadi `deleted_user_id@anonymized.com`), `name` (`"Deleted User"`), dan `phone` (`"0"`), namun tetap mempertahankan integritas data transaksional di tabel `bookings` dan `payments` demi kepentingan audit laporan keuangan perusahaan.
   * ⚠️ **Asumsi (belum terdokumentasi — hasil analisa):** Belum ada keputusan bisnis eksplisit di dokumen sumber mengenai nasib `users.wallet_balance` yang masih tersisa saat akun dihapus (dicairkan? hangus? Perlu proses klaim manual?). Untuk sementara, rekomendasi teknis minimal: **blokir proses penghapusan akun (soft delete) jika `wallet_balance > 0`** hingga saldo dihabiskan/dicairkan, agar tidak ada dana pengguna yang hilang diam-diam — ini perlu sign-off produk/finance, bukan keputusan final.
2. **Kerahasiaan Media (Video Vault)**:
   * Tautan di kolom `raw_video_url` dan `processed_video_url` pada tabel `recordings` menunjuk ke bucket S3 yang diproteksi secara privat.
   * Aplikasi mengakses file menggunakan mekanisme **S3 Presigned URL** dengan masa kedaluwarsa URL maksimal 1 jam, guna mencegah kebocoran data rekaman kelas ke publik yang tidak berhak.

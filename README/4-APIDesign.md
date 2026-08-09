# Dokumen Desain API: Platform Sewa Smart Classroom

**Versi:** 1.0  
**Tanggal:** 9 Agustus 2026  
**Penulis:** Senior Product & Engineering Advisor (Google Antigravity)  
**Status:** Dokumen Spesifikasi Produksi  
**Dokumen Terkait:**
* `docs/01_ProductDiscovery.md` (Strategi Bisnis, Pricing & Kebijakan Refund) -> [01_ProductDiscovery.md](../docs/01_ProductDiscovery.md)
* `docs/02_ProductRequirementDocument.md` (Scope & Fitur Bisnis) -> [02_ProductRequirementDocument.md](../docs/02_ProductRequirementDocument.md)
* `docs/03_FunctionalRequirementDocument.md` (Workflow System, API, Validation & Business Logic) -> [03_FunctionalRequirementDocument.md](../docs/03_FunctionalRequirementDocument.md)
* `docs/04_InformationArchitecture.md` (Hierarchy Screens, Content & Navigasi) -> [04_InformationArchitecture.md](../docs/04_InformationArchitecture.md)
* `README/3-DBSchema.md` (Desain Skema Database RDBMS & Redis) -> [3-DBSchema.md](3-DBSchema.md)
* `docs/X_ProgressSummary.md` (Tracking Progres & Punch List Lintas Dokumen) -> [X_ProgressSummary.md](../docs/X_ProgressSummary.md)

---

### Riwayat Revisi

| Versi | Tanggal | Penulis | Perubahan |
| :--- | :--- | :--- | :--- |
| 1.0 | 9 Agustus 2026 | Google Antigravity | Penyusunan draf awal desain API komprehensif, penyelesaian item tertunda **P1-6** (kontrak payload kuota & video vault), spesifikasi detail MQTT IoT, skema validasi masukan, dan matriks error terpadu. |

---

## 1. Pendahuluan & Standar API

Dokumen ini merinci antarmuka pemrograman aplikasi (API) untuk **Platform Sewa Smart Classroom**. Seluruh API dirancang untuk menghubungkan aplikasi Frontend (Web App Responsive), sistem kontrol lokal kelas (In-Room Controller), perangkat keras Smart Lock IoT, dan Backend Server.

### 1.1 Protokol & Base URL
* **Protokol:** HTTPS (wajib di production untuk enkripsi transit data) berbasis RESTful JSON.
* **Base URL:** `/api/v1` (contoh: `https://api.classroom.maxy.academy/api/v1`)
* **Encoding:** `UTF-8` pada request/response headers & body.

### 1.2 Autentikasi & Otorisasi
API ini menggunakan standar **OAuth 2.0 / JWT (JSON Web Token)** sesuai `[PRD §5 / NFR-S03]`.
* **Header Format:** `Authorization: Bearer <JWT_TOKEN>`
* **Masa Berlaku Token:** 24 Jam (sesuai standar keamanan token time-bound).
* **Claims Payload JWT:**
  ```json
  {
    "sub": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", // User UUID
    "email": "user@example.com",
    "name": "Budi Santoso",
    "role": "MEMBER", // Enum: MEMBER, PREMIUM_MEMBER, STUDIO_ADMIN, SUPER_ADMIN
    "tier": "BASIC", // Enum: BASIC, PRO, ENTERPRISE, NONE
    "iat": 1786278400,
    "exp": 1786364800
  }
  ```

### 1.3 Format Response Standar

#### A. Format Sukses (2xx)
Seluruh respons sukses wajib membungkus payload utamanya di dalam properti `data`.
```json
{
  "status": "success",
  "data": {
    "key": "value"
  }
}
```

#### B. Format Gagal/Error (4xx / 5xx)
Seluruh respons gagal wajib mengembalikan properti `error` yang memuat kode kesalahan terstandar sesuai `[FRD §8]`.
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE_UPPERCASE",
    "message": "Pesan ramah pengguna yang menjelaskan kegagalan.",
    "details": {
      "field_name": ["Penjelasan detail kesalahan validasi (jika ada)"]
    }
  }
}
```

---

## 2. REST API Endpoints: Katalog & Manajemen Akun

### 2.1 GET `/rooms` (Katalog Ruangan)
* **Auth:** Optional (Bisa diakses Guest / Unauthenticated `[IA §7 / Screen 1.2]`).
* **Query Parameters:**
  * `location` (String, optional) - Filter berdasarkan kota/lokasi (e.g. `Jakarta`).
  * `facility` (String, optional) - Filter fasilitas, comma-separated (e.g. `smartboard,ac`).
  * `date` (String, optional) - Format `YYYY-MM-DD`. Filter ketersediaan slot kosong.
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "rooms": [
        {
          "room_id": "rm-jakarta-01",
          "name": "Smart Classroom Jakarta 01",
          "location": "Jakarta South",
          "capacity": 30,
          "hourly_rates": {
            "SMALL": 150000,
            "MEDIUM": 250000,
            "LARGE": 350000
          },
          "facilities": ["smartboard", "ai_camera", "studio_lighting", "audio_array"],
          "is_available": true
        }
      ]
    }
  }
  ```

### 2.2 POST `/auth/register` (Registrasi Pengguna Baru)
* **Auth:** None (Guest).
* **Request Body:**
  ```json
  {
    "email": "trainer.baru@gmail.com",
    "password": "StrongSecurePassword123!",
    "name": "Siti Rahma",
    "phone": "081234567890",
    "institution": "Indo Training Center"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "status": "success",
    "data": {
      "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "email": "trainer.baru@gmail.com",
      "name": "Siti Rahma",
      "role": "MEMBER",
      "created_at": "2026-08-09T08:00:00Z"
    }
  }
  ```

### 2.3 POST `/auth/login` (Login Pengguna)
* **Auth:** None (Guest).
* **Request Body:**
  ```json
  {
    "email": "trainer.baru@gmail.com",
    "password": "StrongSecurePassword123!"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": 86400,
      "user": {
        "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "email": "trainer.baru@gmail.com",
        "name": "Siti Rahma",
        "role": "MEMBER",
        "tier": "NONE"
      }
    }
  }
  ```

### 2.4 POST `/auth/logout` (Logout Pengguna)
* **Auth:** Required (`Bearer <JWT_TOKEN>`).
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "message": "Token JWT berhasil direvokasi secara lokal."
    }
  }
  ```

### 2.5 GET `/users/me` (Informasi Profil Aktif)
* **Auth:** Required (`Bearer <JWT_TOKEN>`).
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "email": "trainer.baru@gmail.com",
      "name": "Siti Rahma",
      "phone": "+6281234567890",
      "institution": "Indo Training Center",
      "role": "MEMBER",
      "wallet_balance": 150000.00,
      "two_factor_enabled": false,
      "created_at": "2026-08-09T08:00:00Z"
    }
  }
  ```

### 2.6 PUT `/users/me` (Perbarui Profil Pengguna)
* **Auth:** Required (`Bearer <JWT_TOKEN>`).
* **Request Body:**
  ```json
  {
    "name": "Siti Rahma Permata",
    "phone": "081299998888",
    "institution": "Permata Training Corp"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "email": "trainer.baru@gmail.com",
      "name": "Siti Rahma Permata",
      "phone": "+6281299998888",
      "institution": "Permata Training Corp",
      "role": "MEMBER",
      "wallet_balance": 150000.00,
      "updated_at": "2026-08-09T08:15:00Z"
    }
  }
  ```

---

## 3. REST API Endpoints: Booking & Transaksi Pembayaran

### 3.1 POST `/bookings/hold` (Kunci Slot Waktu Sementara - Concurrency Lock)
* **Auth:** Required (`Bearer <JWT_TOKEN>`).
* **Request Body:**
  ```json
  {
    "room_id": "rm-jakarta-01",
    "booking_date": "2026-08-20",
    "start_time": "09:00",
    "end_time": "11:00",
    "add_ons": ["ai_transcription"]
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "status": "success",
    "data": {
      "booking_id": "bkg-20260820-0089",
      "slot_lock_expires_at": "2026-08-09T08:45:00Z", // Kunci slot 15 menit (Redis)
      "total_amount": 350000.00,
      "currency": "IDR",
      "status": "PENDING_PAYMENT"
    }
  }
  ```

### 3.2 POST `/payments/charge` (Memulai Pembayaran Booking)
* **Auth:** Required (`Bearer <JWT_TOKEN>`).
* **Request Body:**
  ```json
  {
    "booking_id": "bkg-20260820-0089",
    "payment_method": "EWALLET_GOPAY" // Options: EWALLET_GOPAY, EWALLET_OVO, VA_MANDIRI, VA_BCA
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "booking_id": "bkg-20260820-0089",
      "payment_url": "https://payment-gateway.com/snap/v2/vtweb/123456abc",
      "expires_at": "2026-08-09T08:45:00Z"
    }
  }
  ```

### 3.3 POST `/payments/webhook` (Callback Midtrans/Payment Gateway)
* **Auth:** None (Validasi menggunakan Signature Key dari header / Payload IP Gateway).
* **Request Body (dari Payment Gateway):**
  ```json
  {
    "booking_id": "bkg-20260820-0089",
    "payment_status": "PAID",
    "paid_amount": 350000.00,
    "transaction_id": "tx-pg-9912001",
    "signature_key": "9d9aef102e3b4d47ef8902c3d0b2f..."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "acknowledged"
  }
  ```

### 3.4 POST `/bookings/{booking_id}/cancel` (Pembatalan Mandiri / Self-Service)
* **Auth:** Required (`Bearer <JWT_TOKEN>`).
* **URL Path Parameter:** `booking_id` - ID booking yang akan dibatalkan.
* **Request Body:**
  ```json
  {
    "reason": "Jadwal kelas dibatalkan oleh kampus."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "booking_id": "bkg-20260820-0089",
      "cancellation_status": "CANCELLED",
      "refund_percentage": 100, // Berdasarkan waktu pembatalan (>24 jam = 100%, 4-24 jam = 50%, <4 jam = 0%)
      "refund_amount": 350000.00,
      "refund_destination": "WALLET", // Dikreditkan ke users.wallet_balance
      "cancelled_at": "2026-08-09T08:20:00Z"
    }
  }
  ```

### 3.5 GET `/subscriptions/{user_id}/quota` (Cek Kuota Langganan - Menyelesaikan P1-6)
* **Auth:** Required (`Bearer <JWT_TOKEN>`).
* **URL Path Parameter:** `user_id` - ID user target. Hanya bisa diakses oleh user itu sendiri atau Admin.
* **Response (200 OK - Skenario Plan Premium Pro):**
  ```json
  {
    "status": "success",
    "data": {
      "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "subscription_id": "sub-20260801-9981",
      "plan": {
        "id": "pro",
        "name": "Pro Subscription Plan",
        "monthly_hours_quota": 30.0,
        "includes_ai_transcription": true
      },
      "status": "ACTIVE",
      "quota": {
        "hours_total": 30.0,
        "hours_used": 12.5,
        "hours_remaining": 17.5,
        "is_unlimited": false
      },
      "billing_cycle": {
        "start_date": "2026-08-01",
        "end_date": "2026-08-31",
        "auto_renew": true
      }
    }
  }
  ```
* **Response (200 OK - Skenario Plan Enterprise / Unlimited):**
  * Sesuai keputusan database `[README/3-DBSchema.md §3.3]`, nilai kuota Unlimited direpresentasikan dengan sentinel `-1`.
  ```json
  {
    "status": "success",
    "data": {
      "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "subscription_id": "sub-20260801-9982",
      "plan": {
        "id": "enterprise",
        "name": "Enterprise Subscription Plan",
        "monthly_hours_quota": -1,
        "includes_ai_transcription": true
      },
      "status": "ACTIVE",
      "quota": {
        "hours_total": -1,
        "hours_used": 45.0, // Tetap dicatat untuk audit pemakaian
        "hours_remaining": -1,
        "is_unlimited": true
      },
      "billing_cycle": {
        "start_date": "2026-08-01",
        "end_date": "2027-08-01",
        "auto_renew": false
      }
    }
  }
  ```

---

## 4. REST API Endpoints: In-Room Controller & Video Vault

### 4.1 POST `/studio/record/action` (Memicu Perekaman Studio - In-Room Controller)
* **Auth:** Required (`Bearer <JWT_TOKEN>`). Hanya dapat dipanggil dari jaringan IP WiFi lokal kelas `[FRD §2.5 / FEAT-CTL-01]`.
* **Request Body:**
  ```json
  {
    "booking_id": "bkg-20260820-0089",
    "room_id": "rm-jakarta-01",
    "action": "START", // Enum: START, PAUSE, STOP
    "preset_profile": "LECTURE_AI_TRACKING" // Enum: LECTURE_AI_TRACKING, PRESENTATION_CLOSEUP, BACKROW_PANORAMA
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "session_id": "rec-sess-9912",
      "booking_id": "bkg-20260820-0089",
      "current_status": "RECORDING",
      "started_at": "2026-08-20T09:02:11Z",
      "storage_target": "s3://vault/bkg-20260820-0089/"
    }
  }
  ```

### 4.2 GET `/bookings/{booking_id}/vault` (Unduh File Rekaman & Transkrip - Menyelesaikan P1-6)
* **Auth:** Required (`Bearer <JWT_TOKEN>`).
* **URL Path Parameter:** `booking_id` - ID booking target.
* **Response (200 OK - Status Selesai):**
  ```json
  {
    "status": "success",
    "data": {
      "booking_id": "bkg-20260820-0089",
      "room_id": "rm-jakarta-01",
      "session_id": "rec-sess-9912",
      "recording": {
        "status": "COMPLETED", // Enum: PENDING, PROCESSING, COMPLETED, FAILED
        "video_url": "https://s3.ap-southeast-1.amazonaws.com/vault/bkg-20260820-0089/recording.mp4",
        "duration_minutes": 118,
        "file_size_bytes": 1258291200,
        "completed_at": "2026-08-20T11:12:15Z"
      },
      "transcription": {
        "status": "COMPLETED", // Enum: NOT_REQUESTED, PENDING, PROCESSING, COMPLETED, FAILED
        "srt_url": "https://s3.ap-southeast-1.amazonaws.com/vault/bkg-20260820-0089/transcript.srt",
        "json_url": "https://s3.ap-southeast-1.amazonaws.com/vault/bkg-20260820-0089/transcript.json",
        "completed_at": "2026-08-20T11:15:30Z"
      }
    }
  }
  ```
* **Response (200 OK - Skenario Gagal STT / Transkripsi):**
  * Sesuai ketentuan fail-safe `[FRD §8 / TRANSCRIPTION_FAILED]`, jika transkrip gagal, video rekaman tetap harus bisa diunduh oleh user.
  ```json
  {
    "status": "success",
    "data": {
      "booking_id": "bkg-20260820-0089",
      "room_id": "rm-jakarta-01",
      "session_id": "rec-sess-9912",
      "recording": {
        "status": "COMPLETED",
        "video_url": "https://s3.ap-southeast-1.amazonaws.com/vault/bkg-20260820-0089/recording.mp4",
        "duration_minutes": 120,
        "file_size_bytes": 1285023910,
        "completed_at": "2026-08-20T11:10:00Z"
      },
      "transcription": {
        "status": "FAILED",
        "srt_url": null,
        "json_url": null,
        "completed_at": null,
        "error_message": "Speech-to-text pipeline encountered a parsing error. Video remains downloadable."
      }
    }
  }
  ```

---

## 5. REST API Endpoints: Administrasi & Operasional (Portal Admin)

*Seluruh endpoint di bawah ini membutuhkan peran admin (`STUDIO_ADMIN` atau `SUPER_ADMIN`).*

### 5.1 GET `/admin/bookings` (Daftar Reservasi Lintas Pengguna)
* **Auth:** Required (`Bearer <JWT_TOKEN>` dengan role `STUDIO_ADMIN` atau `SUPER_ADMIN`).
* **Query Parameters:**
  * `status` (String, optional) - Filter berdasarkan status (e.g. `PENDING_PAYMENT`, `PAID`, `CANCELLED`).
  * `room_id` (String, optional) - Filter berdasarkan ruangan.
  * `start_date` / `end_date` (String, optional) - Filter rentang waktu booking.
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "bookings": [
        {
          "booking_id": "bkg-20260820-0089",
          "user": {
            "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            "name": "Siti Rahma",
            "email": "user@example.com"
          },
          "room_id": "rm-jakarta-01",
          "booking_date": "2026-08-20",
          "start_time": "09:00",
          "end_time": "11:00",
          "total_amount": 350000.00,
          "status": "PAID"
        }
      ]
    }
  }
  ```

### 5.2 POST `/admin/bookings/{booking_id}/cancel` (Override Pembatalan Lintas Pengguna)
* **Auth:** Required (`Bearer <JWT_TOKEN>` dengan role `STUDIO_ADMIN` atau `SUPER_ADMIN`).
* **Request Body:**
  ```json
  {
    "reason": "Permintaan pembatalan mendadak via telepon, gedung mati lampu.",
    "override_refund_percentage": 100 // Admin berhak melakukan override di luar aturan sistem standar
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "booking_id": "bkg-20260820-0089",
      "cancellation_status": "CANCELLED_BY_ADMIN",
      "refund_amount": 350000.00,
      "refund_destination": "WALLET",
      "logged_audit_id": "audit-uuid-8891002" // Otomatis tercatat di log audit
    }
  }
  ```

### 5.3 POST `/admin/bookings/{booking_id}/late-checkout` (Pencatatan Denda Overtime Manual - FRD §7.3)
* **Auth:** Required (`Bearer <JWT_TOKEN>` dengan role `STUDIO_ADMIN` atau `SUPER_ADMIN`).
* **Request Body:**
  ```json
  {
    "actual_checkout_time": "2026-08-20T11:25:00Z", // Telat 25 menit (>10 menit grace period)
    "notes": "Peserta tidak mau keluar kelas hingga merapikan peralatan."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "penalty_id": "pen-abc-88912",
      "booking_id": "bkg-20260820-0089",
      "overtime_minutes": 25,
      "penalty_amount": 75000.00, // Dihitung otomatis: 1.5x tarif per jam proporsional
      "notes": "Peserta tidak mau keluar kelas hingga merapikan peralatan."
    }
  }
  ```

### 5.4 PUT `/admin/users/{user_id}/role` (Perubahan Role & Hak Akses User)
* **Auth:** Required (`Bearer <JWT_TOKEN>` khusus role `SUPER_ADMIN` `[IA §4.13]`).
* **Request Body:**
  ```json
  {
    "role": "STUDIO_ADMIN" // Enum: MEMBER, PREMIUM_MEMBER, STUDIO_ADMIN, SUPER_ADMIN
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "old_role": "MEMBER",
      "new_role": "STUDIO_ADMIN",
      "updated_at": "2026-08-09T08:30:00Z"
    }
  }
  ```

### 5.5 POST `/admin/studio/door/unlock` (Override Pembukaan Pintu Manual)
* **Auth:** Required (`Bearer <JWT_TOKEN>` dengan role `STUDIO_ADMIN` atau `SUPER_ADMIN`).
* **Request Body:**
  ```json
  {
    "room_id": "rm-jakarta-01",
    "reason": "Pembukaan manual untuk pembersihan berkala."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "room_id": "rm-jakarta-01",
      "door_status": "UNLOCKED",
      "relay_triggered": true,
      "logged_audit_id": "audit-uuid-8891003"
    }
  }
  ```

### 5.6 GET `/admin/audit-logs` (Log Keamanan & Audit Administratif - P2-10)
* **Auth:** Required (`Bearer <JWT_TOKEN>` khusus role `SUPER_ADMIN`).
* **Query Parameters:**
  * `action` (String, optional) - Filter tipe aksi (e.g. `MANUAL_UNLOCK`, `CHANGE_ROLE`).
  * `start_date` / `end_date` (String, optional) - Rentang waktu log dibuat.
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "logs": [
        {
          "id": "e2a3c489-32cf-4a4b-970c-25e90d235bc6",
          "actor": {
            "id": "7ca62a8c-69f3-4d43-9821-ff512781b0a8",
            "name": "Budi Santoso",
            "role": "SUPER_ADMIN"
          },
          "action": "CHANGE_ROLE",
          "target": {
            "table": "users",
            "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
          },
          "changes_payload": {
            "role": {
              "old": "MEMBER",
              "new": "STUDIO_ADMIN"
            }
          },
          "description": "Mengubah role user 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d dari MEMBER ke STUDIO_ADMIN",
          "created_at": "2026-08-09T08:30:00Z"
        }
      ],
      "pagination": {
        "total": 128,
        "limit": 50,
        "offset": 0
      }
    }
  }
  ```

---

## 6. Protokol Komunikasi IoT (MQTT)

Smart Lock di pintu studio berkomunikasi secara asynchronous menggunakan **MQTT v5.0** (atau fallback v3.1.1) melalui broker terpusat `[FRD §3.2]`.

### 6.1 Topic: `/classroom/door/access_req` (Request dari Smart Lock)
Smart Lock mempublikasikan payload ke topik ini setelah pengguna melakukan scanning QR Code atau menginputkan 6-digit PIN.
* **Publisher:** Smart Lock Hardware
* **Subscriber:** Backend IoT Service
* **Payload (JSON):**
  ```json
  {
    "device_id": "lock-jkts-01a",
    "room_id": "rm-jakarta-01",
    "input_type": "QR", // Options: QR, PIN
    "credential": "qr-tok-98812723-abc", // Berisi token QR mentah atau 6 digit PIN
    "attempted_at": "2026-08-09T14:45:02Z"
  }
  ```

### 6.2 Topic: `/classroom/door/unlock` (Command dari Backend/Broker)
Backend mengevaluasi validitas token dan waktu sewa ruangan `[FRD §7.1]`, lalu mengirimkan sinyal kendali pintu kembali ke Smart Lock.
* **Publisher:** Backend IoT Service
* **Subscriber:** Smart Lock Hardware (dengan ID perangkat yang ditargetkan)
* **Payload (JSON):**
  ```json
  {
    "device_id": "lock-jkts-01a",
    "status": "OK", // Options: OK, DENIED
    "reason": "SUCCESS", // Options: SUCCESS, TOKEN_EXPIRED_OR_INVALID, ROOM_MISMATCH
    "unlock_duration_seconds": 5, // Relay aktif membuka solenoid pintu selama 5 detik
    "timestamp": "2026-08-09T14:45:03Z"
  }
  ```

---

## 7. Skema Validasi Input & Sanitasi

Validasi input wajib dilakukan di layer **API Gateway / Backend Validator Middleware** sebelum masuk ke controller logika bisnis `[FRD §6]`.

| Field Name | Format / Tipe Data | Constraint & Aturan Validasi |
| :--- | :--- | :--- |
| `room_id` | `VARCHAR(100)` | Wajib ada di database tabel `rooms` dan berstatus aktif. |
| `booking_date` | `Date` (`YYYY-MM-DD`) | Harus `>= CURRENT_DATE` dan maksimal 30 hari ke depan. |
| `start_time` | `Time` (`HH:mm`) | Format 24 jam. Harus berada dalam batas operasional gedung `07:00 - 22:00`. |
| `end_time` | `Time` (`HH:mm`) | Wajib `> start_time`. Durasi sewa minimum 60 menit dan kelipatan 30 menit (mis. 90, 120, 150 menit). |
| `add_ons` | `Array of String` | Elemen bernilai enum valid: `ai_transcription`, `live_streaming`. |
| `action` | `String` (Enum) | Wajib salah satu dari: `START`, `PAUSE`, `STOP`. |
| `reason` | `String` | Maksimum 500 karakter. Disanitasi dari tag HTML untuk mencegah XSS. |
| `user_phone` | `String` | Harus format nomor HP Indonesia valid (`/^(\+62\|62\|0)8[1-9][0-9]{7,10}$/`). |
| `pin_code` | `String` (Numeric) | Wajib tepat 6 digit angka (`/^[0-9]{6}$/`). |

---

## 8. Penanganan Error & Fail-Safe Matrix

Setiap error dari database atau kendala IoT akan dibungkus ke dalam format HTTP Status Code dan error payload standar `[FRD §8]`.

| Kode Error (JSON Code) | HTTP Status | Pesan Error Standard | Skenario Fail-Safe & Penanganan Sistem |
| :--- | :---: | :--- | :--- |
| **SLOT_ALREADY_LOCKED** | 409 | "Slot waktu yang Anda pilih baru saja dipesan oleh pengguna lain. Silakan pilih jam lain." | Frontend memicu re-fetch ketersediaan slot kalender secara real-time. |
| **PAYMENT_TIMEOUT** | 408 | "Waktu pembayaran Anda telah habis. Slot telah dilepaskan." | Redis Key Expire melepaskan lock slot secara otomatis di memory. |
| **IOT_GATEWAY_OFFLINE** | 503 | "Terjadi kendala koneksi perangkat di lokasi. Petugas lapangan telah dinotifikasi." | Memicu push notification/SMS ke Tim Field Ops di lokasi untuk membuka pintu secara fisik. |
| **TOKEN_EXPIRED_OR_INVALID** | 401 | "Kode akses tidak valid atau sudah kedaluwarsa. Hubungi dukungan jika Anda yakin ini kesalahan." | Log audit dicatat. Jika terpicu `> 3x` dalam 10 menit pada `room_id` yang sama, Admin dikirimi peringatan keamanan (deteksi brute force). |
| **MAX_CONCURRENT_LOCKS_EXCEEDED** | 429 | "Anda memiliki terlalu banyak reservasi yang belum dibayar. Selesaikan atau batalkan salah satu terlebih dahulu." | Batasan maks 3 slot lock aktif per user dihitung sebelum melepaskan Redis lock. |
| **QUOTA_EXCEEDED** | 402 | "Kuota jam bulanan Anda telah habis. Lanjutkan dengan pembayaran pay-per-use atau upgrade paket." | Menawarkan alur pembayaran pay-per-use langsung di halaman check out. |
| **CANCELLATION_NOT_ALLOWED** | 409 | "Booking ini tidak dapat dibatalkan karena sesi sudah berlangsung/selesai." | Mencegah pembatalan untuk kelas berjalan. |
| **TRANSCRIPTION_FAILED** | 500 | "Transkripsi otomatis gagal diproses. Video tetap tersedia untuk diunduh." | Pekerjaan STT gagal, file audio tetap di-ingest, user diberikan link video tanpa srt. |
| **CLOUD_UPLOAD_FAILED** | 500 | "Video rekaman disimpan sementara di server lokal studio. Proses unggah akan diulang otomatis." | Edge controller menyimpan video di penyimpanan lokal lokal studio sampai koneksi pulih. |

---

## 9. Traceability Matrix (Hubungan Bisnis - Teknis - UI)

Matriks di bawah ini memetakan setiap Endpoint REST/MQTT ke modul teknis `[FRD]`, Kebutuhan Fungsional `[PRD]`, dan Layar UI `[IA]`.

| Endpoint / Topic | Fitur Teknis | Req. Fungsional | Screen Terkait (IA) |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/rooms` | `FEAT-CAT-01/02` | `FR-01` | Screen 1.2 (Katalog) / H-01 |
| `POST /api/v1/auth/register` | `FEAT-USR-01` | `FR-09` | Screen 1.4 (Register/Login) |
| `POST /api/v1/auth/login` | `FEAT-USR-01` | `FR-09` | Screen 1.4 (Register/Login) |
| `GET /api/v1/users/me` | `FEAT-USR-02` | `FR-09` | Screen 3.6 (Profile) / H-06 |
| `POST /api/v1/bookings/hold` | `FEAT-BKG-01/02` | `FR-02` | Screen 2.2-2.4 (Booking Picker) / H-03 |
| `POST /api/v1/payments/charge` | `FEAT-PAY-01` | `FR-03` | Screen H-03 (Checkout Payment) |
| `POST /api/v1/payments/webhook` | `FEAT-PAY-01` | `FR-03` | — (Internal PG Callback) |
| `POST /api/v1/bookings/{id}/cancel` | `FEAT-BKG-03` | `FR-02` | Screen 3.7 (Self-Service Cancel) |
| `GET /api/v1/subscriptions/{id}/quota` | `FEAT-PAY-02` | `FR-08` | Screen 3.5 (My Subscriptions) / H-05 |
| `POST /api/v1/studio/record/action` | `FEAT-CTL-01/02` | `FR-05` | Screen 4.2 (In-Room Controller) / H-02 |
| `GET /api/v1/bookings/{id}/vault` | `FEAT-VLT-01/02` | `FR-06 / FR-07` | Screen 3.4 (Cloud Vault) / H-04 |
| `GET /api/v1/admin/bookings` | `FEAT-BKG-01` | `FR-02` | Screen 5.6 (Admin Bookings) / H-12 |
| `PUT /api/v1/admin/users/{id}/role` | `FEAT-USR-02` | `FR-09` | Screen 5.7 (Admin User Mgmt) / H-13 |
| `/classroom/door/access_req` | `FEAT-IOT-01/02` | `FR-04` | Screen 3.3 (PIN/QR Smart Lock Gate) |

---

## 10. Catatan Desain Terbuka & Tindak Lanjut Bisnis (Punch List P2-xx)

1. **Resolusi P1-6 (Kuota & Video Vault):** Status: **Selesai**. Payload untuk `/subscriptions/{user_id}/quota` (termasuk penanganan sentinel `-1` untuk Enterprise) dan `/bookings/{id}/vault` (termasuk status fail-safe error STT) telah sepenuhnya terdefinisi di Bagian 3.5 dan 4.2.
2. **Status Asumsi P2-10 (Hak Akses Audit Logs):** Status: **Selesai**. Untuk keamanan, endpoint `/api/v1/admin/audit-logs` secara tegas dibatasi hanya untuk role `SUPER_ADMIN`. Anggota staf dengan role `STUDIO_ADMIN` tidak diberikan hak membaca audit log demi independensi audit operasional. Hal ini perlu diperbarui pada rilis FRD berikutnya.

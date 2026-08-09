# Dokumentasi Kueri SQL Inisialisasi Database: VC Classroom

Dokumen ini mencatat seluruh kueri DDL (*Data Definition Language*) yang digunakan untuk menginisialisasi skema database PostgreSQL 17 di Aiven Public Cloud. Kueri di bawah diurutkan secara logis berdasarkan hierarki ketergantungan asing (*foreign key*) untuk memastikan instalasi berjalan lancar tanpa kendala dependensi.

**Skema Acuan:** [README/3-DBSchema.md](3-DBSchema.md)  
**Tanggal Inisialisasi:** 9 Agustus 2026

---

## 1. Pembuatan Tabel Independen (Tanpa Foreign Key)

Tabel-tabel ini merupakan tabel master yang tidak memiliki ketergantungan pada tabel lain.

### 1.1 Tabel `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    institution VARCHAR(255) DEFAULT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT chk_user_role CHECK (role IN ('MEMBER', 'PREMIUM_MEMBER', 'STUDIO_ADMIN', 'SUPER_ADMIN')),
    CONSTRAINT chk_user_phone CHECK (phone ~ '^(\+62|62|0)8[1-9][0-9]{7,10}$'),
    CONSTRAINT chk_wallet_balance CHECK (wallet_balance >= 0.00)
);
```

### 1.2 Tabel `subscription_plans`
```sql
CREATE TABLE subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    monthly_hours_quota INTEGER NOT NULL,
    storage_gb INTEGER DEFAULT NULL,
    includes_ai_transcription BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_monthly_hours_quota CHECK (monthly_hours_quota >= -1),
    CONSTRAINT chk_storage_gb CHECK (storage_gb IS NULL OR storage_gb >= 0),
    CONSTRAINT chk_monthly_price CHECK (monthly_price >= 0.00),
    CONSTRAINT chk_plan_id CHECK (id IN ('BASIC', 'PRO', 'ENTERPRISE'))
);
```

### 1.3 Tabel `rooms`
```sql
CREATE TABLE rooms (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity_tier VARCHAR(50) NOT NULL,
    capacity_seats INTEGER NOT NULL,
    price_per_hour NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    smart_lock_device_id VARCHAR(100) UNIQUE DEFAULT NULL,
    wifi_ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_room_capacity_tier CHECK (capacity_tier IN ('SMALL', 'MEDIUM', 'LARGE')),
    CONSTRAINT chk_room_capacity_seats CHECK (capacity_seats > 0),
    CONSTRAINT chk_room_price CHECK (price_per_hour >= 0.00),
    CONSTRAINT chk_room_status CHECK (status IN ('AVAILABLE', 'MAINTENANCE'))
);
```

---

## 2. Pembuatan Tabel Dependen Tingkat 1 (Ketergantungan Langsung ke Tabel Master)

### 2.1 Tabel `user_subscriptions`
```sql
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    quota_hours_used NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    quota_hours_total NUMERIC(5, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    payment_method_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans (id) ON DELETE RESTRICT,
    CONSTRAINT chk_subscription_status CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING')),
    CONSTRAINT chk_quota_hours_used CHECK (quota_hours_used >= 0.00),
    CONSTRAINT chk_subscription_dates CHECK (end_date > start_date)
);
```

### 2.2 Tabel `subscription_refunds`
```sql
CREATE TABLE subscription_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_subscription_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    refund_amount NUMERIC(12, 2) NOT NULL,
    reason TEXT DEFAULT NULL,
    admin_notes TEXT DEFAULT NULL,
    processed_by UUID DEFAULT NULL,
    processed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_refund_subscription FOREIGN KEY (user_subscription_id) REFERENCES user_subscriptions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_refund_processor FOREIGN KEY (processed_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_refund_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_refund_amount CHECK (refund_amount >= 0.00)
);
```

### 2.3 Tabel `room_facilities`
```sql
CREATE TABLE room_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) NOT NULL,
    facility_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_facility_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT chk_facility_name CHECK (facility_name IN ('SMART_BOARD', 'MULTI_CAM_AI', 'STUDIO_PODCASTING', 'AUDIO_ARRAY'))
);
```

### 2.4 Tabel `bookings`
```sql
CREATE TABLE bookings (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL,
    room_id VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
    payment_type VARCHAR(50) NOT NULL,
    original_amount NUMERIC(12, 2) NOT NULL,
    add_ons_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    is_ai_transcription_addon BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE RESTRICT,
    CONSTRAINT chk_booking_status CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'IN_ROOM', 'COMPLETED')),
    CONSTRAINT chk_booking_payment_type CHECK (payment_type IN ('PAY_PER_USE', 'SUBSCRIPTION_QUOTA')),
    CONSTRAINT chk_booking_times CHECK (end_time > start_time),
    CONSTRAINT chk_booking_original_amount CHECK (original_amount >= 0.00),
    CONSTRAINT chk_booking_add_ons_amount CHECK (add_ons_amount >= 0.00),
    CONSTRAINT chk_booking_discount_amount CHECK (discount_amount >= 0.00),
    CONSTRAINT chk_booking_total_amount CHECK (total_amount >= 0.00)
);
```

### 2.5 Tabel `audit_logs`
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    changes_payload JSONB DEFAULT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_audit_actor_role CHECK (actor_role IN ('MEMBER', 'PREMIUM_MEMBER', 'STUDIO_ADMIN', 'SUPER_ADMIN'))
);
```

### 2.6 Tabel `iot_device_status`
```sql
CREATE TABLE iot_device_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE',
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_device_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT chk_device_type CHECK (device_type IN ('SMART_LOCK', 'AI_CAMERA', 'AUDIO_ARRAY')),
    CONSTRAINT chk_device_status CHECK (status IN ('ONLINE', 'OFFLINE'))
);
```

### 2.7 Tabel `room_maintenance_logs`
```sql
CREATE TABLE room_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) NOT NULL,
    operator_id UUID NOT NULL,
    reason VARCHAR(255) NOT NULL,
    notes TEXT DEFAULT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_maintenance_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_operator FOREIGN KEY (operator_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_maintenance_dates CHECK (ended_at IS NULL OR ended_at > started_at)
);
```

---

## 3. Pembuatan Tabel Dependen Tingkat 2 (Ketergantungan ke Tabel Booking)

Tabel-tabel ini memerlukan eksistensi tabel `bookings` untuk pembentukan constraint integritas referensial.

### 3.1 Tabel `payments`
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id VARCHAR(100) DEFAULT NULL,
    user_subscription_id UUID DEFAULT NULL,
    payment_method VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(255) DEFAULT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL,
    payment_url VARCHAR(500) DEFAULT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ DEFAULT NULL,
    callback_raw JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL,
    CONSTRAINT fk_payment_subscription FOREIGN KEY (user_subscription_id) REFERENCES user_subscriptions (id) ON DELETE SET NULL,
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('VA_BCA', 'VA_MANDIRI', 'VA_BNI', 'EWALLET_GOPAY', 'EWALLET_OVO', 'EWALLET_SHOPEEPAY', 'SUBSCRIPTION_QUOTA')),
    CONSTRAINT chk_payment_status CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    CONSTRAINT chk_payment_amount CHECK (paid_amount >= 0.00)
);
```

### 3.2 Tabel `room_access_tokens`
```sql
CREATE TABLE room_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id VARCHAR(100) NOT NULL,
    pin_code VARCHAR(6) NOT NULL,
    qr_code_content VARCHAR(255) NOT NULL,
    access_start_time TIMESTAMPTZ NOT NULL,
    access_end_time TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_token_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT chk_token_pin_code CHECK (pin_code ~ '^[0-9]{6}$')
);
```

### 3.3 Tabel `door_access_attempts`
```sql
CREATE TABLE door_access_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) NOT NULL,
    booking_id VARCHAR(100) DEFAULT NULL,
    input_type VARCHAR(10) NOT NULL,
    result VARCHAR(30) NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_attempt_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL,
    CONSTRAINT chk_attempt_input_type CHECK (input_type IN ('PIN', 'QR')),
    CONSTRAINT chk_attempt_result CHECK (result IN ('SUCCESS', 'TOKEN_EXPIRED_OR_INVALID'))
);
```

### 3.4 Tabel `booking_cancellations`
```sql
CREATE TABLE booking_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id VARCHAR(100) NOT NULL UNIQUE,
    cancelled_by UUID NOT NULL,
    cancelled_by_role VARCHAR(50) NOT NULL,
    refund_percentage INTEGER NOT NULL,
    refund_amount NUMERIC(12, 2) NOT NULL,
    refund_destination VARCHAR(50) NOT NULL,
    reason TEXT DEFAULT NULL,
    cancelled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cancel_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_cancel_user FOREIGN KEY (cancelled_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_cancel_by_role CHECK (cancelled_by_role IN ('MEMBER', 'PREMIUM_MEMBER', 'STUDIO_ADMIN', 'SUPER_ADMIN')),
    CONSTRAINT chk_cancel_refund_percentage CHECK (refund_percentage IN (100, 50, 0)),
    CONSTRAINT chk_cancel_refund_amount CHECK (refund_amount >= 0.00),
    CONSTRAINT chk_cancel_refund_destination CHECK (refund_destination IN ('WALLET', 'SUBSCRIPTION_QUOTA'))
);
```

### 3.5 Tabel `wallet_transactions`
```sql
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_wallet_reference FOREIGN KEY (reference_id) REFERENCES booking_cancellations (id) ON DELETE SET NULL,
    CONSTRAINT chk_wallet_type CHECK (type IN ('CREDIT', 'DEBIT')),
    CONSTRAINT chk_wallet_amount CHECK (amount > 0.00),
    CONSTRAINT chk_wallet_balance_after CHECK (balance_after >= 0.00),
    CONSTRAINT chk_wallet_ref_type CHECK (reference_type IN ('BOOKING_CANCELLATION'))
);
```

### 3.6 Tabel `recordings`
```sql
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
    started_at TIMESTAMPTZ DEFAULT NULL,
    stopped_at TIMESTAMPTZ DEFAULT NULL,
    raw_video_url VARCHAR(500) DEFAULT NULL,
    processed_video_url VARCHAR(500) DEFAULT NULL,
    video_duration_seconds INTEGER DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_recording_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT chk_recording_status CHECK (status IN ('RECORDING', 'PAUSED', 'STOPPED', 'PROCESSING', 'READY', 'FAILED')),
    CONSTRAINT chk_recording_duration CHECK (video_duration_seconds IS NULL OR video_duration_seconds >= 0)
);
```

### 3.7 Tabel `ai_transcriptions`
```sql
CREATE TABLE ai_transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    transcript_srt_url VARCHAR(500) DEFAULT NULL,
    transcript_json_url VARCHAR(500) DEFAULT NULL,
    word_count INTEGER DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_transcription_recording FOREIGN KEY (recording_id) REFERENCES recordings (id) ON DELETE CASCADE,
    CONSTRAINT chk_transcription_status CHECK (status IN ('PENDING', 'PROCESSING', 'READY', 'FAILED')),
    CONSTRAINT chk_transcription_word_count CHECK (word_count IS NULL OR word_count >= 0)
);
```

### 3.8 Tabel `manual_unlock_logs`
```sql
CREATE TABLE manual_unlock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) NOT NULL,
    operator_id UUID NOT NULL,
    booking_id VARCHAR(100) DEFAULT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_unlock_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_unlock_operator FOREIGN KEY (operator_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_unlock_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL,
    CONSTRAINT chk_unlock_reason CHECK (length(reason) >= 10)
);
```

### 3.9 Tabel `late_checkout_logs`
```sql
CREATE TABLE late_checkout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id VARCHAR(100) NOT NULL,
    operator_id UUID NOT NULL,
    actual_checkout_time TIMESTAMPTZ NOT NULL,
    overtime_minutes INTEGER NOT NULL,
    penalty_amount NUMERIC(12, 2) NOT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_late_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_late_operator FOREIGN KEY (operator_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_late_overtime CHECK (overtime_minutes > 10),
    CONSTRAINT chk_late_penalty CHECK (penalty_amount >= 0.00)
);
```

---

## 4. Pembuatan Indeks Database (Database Indexes)

Untuk menjamin skalabilitas query, indeks fisik berikut diinstall pada kolom pencarian utama.

```sql
-- 4.1 Filter Pencarian Katalog Publik
CREATE INDEX idx_rooms_lookup ON rooms (status, capacity_tier, price_per_hour);
CREATE INDEX idx_room_facilities_room_id ON room_facilities (room_id, facility_name);

-- 4.2 Guard Tabrakan Slot Sewa (Concurrency Guard)
CREATE INDEX idx_bookings_schedule_guard ON bookings (room_id, booking_date, start_time, end_time) 
WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED', 'IN_ROOM');

-- 4.3 lookup Cepat Token MQTT Door Lock
CREATE UNIQUE INDEX idx_access_tokens_lookup ON room_access_tokens (pin_code) 
INCLUDE (booking_id, access_start_time, access_end_time);

CREATE UNIQUE INDEX idx_access_tokens_qr ON room_access_tokens (qr_code_content) 
INCLUDE (booking_id, access_start_time, access_end_time);

-- 4.4 Riwayat Pengguna & Dashboard
CREATE INDEX idx_bookings_user_history ON bookings (user_id, created_at DESC);
CREATE INDEX idx_recordings_lookup ON recordings (booking_id, status);
CREATE INDEX idx_wallet_transactions_user_history ON wallet_transactions (user_id, created_at DESC);

-- 4.5 Audit Log Admin
CREATE INDEX idx_audit_logs_filter ON audit_logs (target_table, action, created_at DESC);

-- 4.6 Pengendalian Concurrency Limit & Keamanan IoT
CREATE INDEX idx_bookings_user_pending_guard ON bookings (user_id) 
WHERE status = 'PENDING_PAYMENT';

CREATE INDEX idx_door_access_attempts_alert_window ON door_access_attempts (room_id, result, attempted_at DESC);
```

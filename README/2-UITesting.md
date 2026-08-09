# Panduan Uji Coba & Menjalankan Prototipe Secara Lokal
**Tipe Dokumen:** Panduan operasional (bukan dokumen sumber — lihat `docs/X_ProgressSummary.md` §8 untuk status progres tiap screen)
**Cakupan:** 5 prototipe HTML statis yang sudah dihasilkan pada Tahap 3 — Prototyping (Google AI Studio)
**Prasyarat paham:** `docs/04_InformationArchitecture.md` (untuk konteks screen H-xx) dan `docs/03_FunctionalRequirementDocument.md` §8 (untuk arti kode error yang disimulasikan)

---

## 1. Prasyarat

* Node.js (disarankan versi 18+; sudah diverifikasi jalan di Node v26).
* Tidak perlu API key apa pun (`GEMINI_API_KEY` di `.env.local` **tidak dipakai** oleh 5 prototipe ini — hanya relevan jika nanti fitur AI Transkripsi/Gemini diaktifkan).
* Tidak perlu database/backend — seluruh data di layar adalah **dummy/hardcoded** langsung di HTML.

---

## 2. Cara Menjalankan

### Opsi A — Lewat Vite (direkomendasikan, sudah dikonfigurasi di `package.json`)

```bash
npm install     # sekali saja
npm run dev
```

Server akan aktif di **http://localhost:3000**. Opsi ini dipakai karena `vite.config.ts` di root project sudah menyalakan dev server yang bisa menyajikan file HTML statis apa pun di root project — bukan cuma bagian React (lihat catatan P2-12 di `docs/X_ProgressSummary.md` soal scaffold React yang saat ini tidak dipakai oleh 5 prototipe ini).

### Opsi B — Static server tanpa instalasi apa pun (fallback)

```bash
python3 -m http.server 5173
```

Lalu buka **http://localhost:5173**.

> **Penting:** Jangan buka file HTML langsung lewat `file://` (klik dua kali di Finder). Semua prototipe memakai path absolut (`href="/profile.html"`, `href="/admin/rooms.html"`, dst.) yang hanya valid jika disajikan lewat HTTP server yang root-nya adalah folder project ini — lewat `file://` navigasi antar halaman akan patah.

---

## 3. Daftar Screen yang Bisa Diuji

| URL Lokal | Screen (IA) | File | Role Minimum (IA §7) |
| :--- | :--- | :--- | :---: |
| `/` | 1.2 Catalog Search (H-01) | `index.html` | Guest |
| `/in-room.html` | 4.2 In-Room Control Panel (H-02) | `in-room.html` | Member/Premium (slot sendiri) |
| `/profile.html` | 3.6 Account Profile (H-06) | `profile.html` | Member/Premium |
| `/admin/dashboard.html` | 5.1 Ops Dashboard (H-07) | `admin/dashboard.html` | Studio Admin/Super Admin |
| `/admin/rooms.html` | 5.2 Room Management (H-08) | `admin/rooms.html` | Studio Admin/Super Admin |

8 screen lain yang sudah punya content hierarchy di IA (H-03, H-04, H-05, H-09 s/d H-13) **belum punya prototipe** — lihat tabel tracking di `docs/X_ProgressSummary.md` §8.

---

## 4. Skenario Uji Coba per Screen

Setiap prototipe punya **panel "Simulation" tersembunyi di pojok kanan bawah** (hover/klik untuk membuka) yang memungkinkan uji edge case tanpa backend sungguhan. Gunakan skenario berikut untuk memverifikasi perilaku sesuai FRD §8 (kode error) dan IA §7 (RBAC).

### 4.1 Catalog Search (`/`)
| Simulasi | Efek yang Diharapkan | Referensi |
| :--- | :--- | :--- |
| Centang **"Simulate No Results"** | Grid katalog diganti Empty State + CTA "Reset Filter" | IA §4.1 |
| Centang **"Simulate Slot Locked"** | Banner kuning muncul di atas, tombol "Pilih Jadwal" pada kartu pertama berubah jadi "Sedang Dipesan" (disabled) | `SLOT_ALREADY_LOCKED` — FRD §8 |

### 4.2 In-Room Control Panel (`/in-room.html`)
| Simulasi | Efek yang Diharapkan | Referensi |
| :--- | :--- | :--- |
| Tombol **`[ START RECORDING ]`** | Berubah jadi indikator merah berkedip `[ RECORDING ]` + badge `[REC]` di header | IA §4.2 |
| Centang **"Simulate IOT_GATEWAY_OFFLINE"** | Banner merah full-width muncul di atas, status dot berubah abu-abu | `IOT_GATEWAY_OFFLINE` — FRD §8 |
| Centang simulasi timer | Timer sesi berubah warna kuning saat mendekati habis (<10 menit) | IA §4.2 poin 1 |

### 4.3 Account Profile (`/profile.html`)
| Simulasi | Efek yang Diharapkan | Referensi |
| :--- | :--- | :--- |
| Toggle role **Member ⇄ Premium** | Badge Role & Membership berubah; elemen yang bergantung pada tier ikut menyesuaikan | RBAC — IA §7 baris 3.6 |
| Isi field **No. HP** tanpa awalan `+62`/kurang dari 10 digit | Muncul pesan error validasi | FRD §6 (validasi `user_phone`) |
| Centang **"Simulasi TOKEN_EXPIRED_OR_INVALID"** | Banner merah sticky + overlay blur di atas konten utama, CTA "Re-Authenticate" muncul | `TOKEN_EXPIRED_OR_INVALID` — FRD §8 |
| Klik **"Hapus Akun"** | Modal konfirmasi ganda — tombol konfirmasi tetap disabled sampai mengetik teks konfirmasi persis | IA §4.6 poin 5 |

### 4.4 Ops Dashboard (`/admin/dashboard.html`)
| Simulasi | Efek yang Diharapkan | Referensi |
| :--- | :--- | :--- |
| Toggle role **Admin ⇄ Member** ("Role Check") | Simulasi redirect akses non-admin | IA §7 baris 5.1-5.7 |
| Centang **"IoT Outage (Global)"** | Insiden `IOT_GATEWAY_OFFLINE` disimulasikan di seluruh sistem | FRD §8 |
| Centang **"Emergency Protocol"** | Simulasi buka semua pintu + broadcast peringatan | Fail-safe — FRD §7 |
| Klik kartu KPI **"Late Checkout Pending"** | Buka modal "Pencatatan Denda Late Checkout Manual" | FRD §7.3 v1.3 (manual oleh Ops) — lihat juga catatan P2-11/H-12 di `docs/X_ProgressSummary.md` §8 soal modul ini yang seharusnya milik H-12 |
| Klik Quick Link **"Manajemen Ruangan"** | ⚠️ **Belum tersambung** (masih `href="#"`) — bug diketahui, lihat P2-11 di `docs/X_ProgressSummary.md`. Untuk membuka Room Management, navigasikan manual ke `/admin/rooms.html`. |

### 4.5 Room Management (`/admin/rooms.html`)
| Simulasi | Efek yang Diharapkan | Referensi |
| :--- | :--- | :--- |
| Toggle **Super Admin / Studio Admin / Guest-Member** ("Role Check") | Kontrol Full Access vs Read/Write vs tanpa akses ikut berubah | RBAC "Manage Room & Hardware Config" — IA §4.8 poin 4 |
| Centang **"IoT Hardware Fault"** | Ruangan "Alpha" berubah status jadi Offline (merah) di tabel | `IOT_GATEWAY_OFFLINE` — FRD §8 |

---

## 5. Keterbatasan Prototipe (Baca Sebelum Uji Coba)

* **Tidak ada state lintas halaman.** Perubahan di satu screen (mis. ubah role di Profile) tidak terbawa ke screen lain (mis. Dashboard) — setiap file mengelola state simulasinya sendiri lewat JavaScript inline.
* **Tidak ada backend/API sungguhan.** Semua data (daftar ruangan, KPI, riwayat tagihan, dll.) adalah dummy tertulis langsung di HTML, bukan hasil fetch.
* **Bergantung pada CDN eksternal saat online** (Tailwind CDN, Google Fonts, Lucide Icons via unpkg, gambar dari Unsplash/ui-avatars) — jika tidak ada koneksi internet, styling/ikon/gambar tidak akan termuat meski halaman tetap bisa dibuka.
* Untuk daftar gap/bug yang sudah diketahui dan status pengerjaannya, lihat **`docs/X_ProgressSummary.md` §6 (P2-11 s/d P2-13)** dan **§8 (tracking progres prototipe)**.

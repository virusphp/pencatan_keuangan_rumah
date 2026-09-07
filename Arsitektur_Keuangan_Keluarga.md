# Arsitektur & Perencanaan Aplikasi Keuangan Keluarga

Dokumen ini berisi rancangan teknis, skema database, aturan bisnis, dan rencana _sprint_ untuk pengembangan aplikasi pencatatan keuangan keluarga berbasis Svelte, Tailwind CSS, PostgreSQL, dan Capacitor.

---

## 1. Arsitektur Sistem

Aplikasi ini menggunakan pendekatan **Decoupled Architecture** dengan SvelteKit sebagai penggerak utama, yang di-_wrap_ menjadi aplikasi _native_ Android menggunakan Capacitor.

- **Frontend & UI:** SvelteKit (dikonfigurasi sebagai _Single Page Application_ / SPA dengan `adapter-static`), Tailwind CSS untuk tata letak dan tema dinamis.
- **Mobile Wrapper:** Capacitor JS untuk akses perangkat keras Android keras (khususnya _Local Notifications_ dan _Preferences_).
- **Backend / API:** SvelteKit API Routes (atau backend terpisah) untuk menangani logika otentikasi, otorisasi (_role-based_), dan transaksi.
- **Database:** PostgreSQL.
- **ORM / Query Builder:** Prisma, Drizzle, atau koneksi SQL Native untuk menjembatani Backend dan PostgreSQL.

---

### Koneksi database

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_keuangan_keluarga"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="app_keuangan_keluarga"

## 2. Skema Database (ERD)

Skema dirancang untuk mendukung sistem entri berpasangan ringan (_transfer_ jatah) dan visibilitas asimetris.

### `users`

Menyimpan data pengguna, preferensi tema, dan sakelar transparansi.

- `id` (UUID, Primary Key)
- `name` (Varchar)
- `role` (Enum: 'suami', 'istri')
- `theme_color` (Varchar, Default: '#3B82F6')
- `is_transparent_mode` (Boolean, Default: false) - _Hanya dikontrol oleh Suami_

### `categories`

Kategori transaksi untuk analisis.

- `id` (Serial, Primary Key)
- `name` (Varchar)
- `type` (Enum: 'income', 'expense', 'transfer')
- `role_access` (Enum: 'all', 'suami', 'istri')

### `saving_goals`

Pencatatan target tabungan keluarga.

- `id` (UUID, Primary Key)
- `name` (Varchar) - _Misal: "Dana Darurat", "Liburan"_
- `target_amount` (Numeric)
- `is_shared` (Boolean)
- `status` (Enum: 'active', 'achieved', 'canceled')
- `created_by` (UUID, Foreign Key ke `users.id`)

### `transactions`

Tabel utama arus kas.

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key ke `users.id`)
- `amount` (Numeric)
- `type` (Enum: 'income', 'expense', 'transfer')
- `category_id` (Integer, Foreign Key ke `categories.id`)
- `saving_goal_id` (UUID, Nullable, Foreign Key ke `saving_goals.id`)
- `notes` (Text, Nullable)
- `created_at` (Timestamp, Default: NOW())

### `rewards`

Menyimpan riwayat poin gamifikasi di akhir bulan.

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key ke `users.id`)
- `month` (Integer)
- `year` (Integer)
- `score` (Integer)
- `badge` (Varchar)

---

## 3. Tech Stack & Skill Requirement

- **Svelte / SvelteKit:** Penguasaan _Stores_ (untuk _state_ saldo reaktif), _Routing_, dan _Form Actions_.
- **Tailwind CSS:** Konfigurasi `tailwind.config.js` dengan CSS Variables (`--color-primary`) agar pengguna bisa mengganti tema (kustomisasi warna).
- **Capacitor JS:** Instalasi dan konfigurasi plugin `@capacitor/local-notifications` dan `@capacitor/android`.
- **PostgreSQL / SQL:** Pembuatan _Common Table Expressions_ (CTE) atau _Aggregate query_ untuk menghitung saldo berjalan dan persentase progres tabungan.
- **UI/UX Design:** Pemahaman struktur layout _Android View_ (Bottom Navigation Bar, Floating Action Button / FAB, Card-based layout).

---

## 4. Rules & Business Logic

1.  **Asymmetrical Visibility (Hak Akses API):**
    - Jika pemanggil adalah `istri` dan `is_transparent_mode` = `false`, API HANYA mengembalikan transaksi dimana `user_id = istri_id` dan `saving_goals` yang `is_shared = true`.
    - Jika pemanggil adalah `suami` ATAU `is_transparent_mode` = `true`, API mengembalikan seluruh data _cashflow_ keluarga.
2.  **Logika Transfer Jatah:**
    - Saat suami mencatat "Jatah Istri" (type: `transfer`, amount: X), sistem harus melakukan _Database Transaction (BEGIN/COMMIT)_ yang membuat 2 _record_ di tabel `transactions`:
      1. Pengeluaran di ID Suami sebesar X.
      2. Pemasukan di ID Istri sebesar X.
3.  **Logika Tabungan:**
    - Pencatatan menabung dianggap sebagai `expense` (memotong saldo aktif agar tidak terpakai harian), tetapi disematkan `saving_goal_id`.
    - Progres tabungan dihitung dengan query `SUM(amount) WHERE saving_goal_id = Y`.
4.  **Local Notifications:**
    - Didaftarkan pada saat aplikasi pertama kali dibuka (di _lifecycle_ Svelte `onMount`).
    - Notifikasi 1: Pukul 12:00 Siang ("Catat pengeluaran siang ini!").
    - Notifikasi 2: Pukul 21:30 Malam ("Cek dompet malam ini, jangan sampai ada yang terlewat!").
5.  **Gamifikasi & Reward:**
    - Dieksekusi setiap tanggal 1 (bisa menggunakan _Cron Job_ di backend atau logika _check-on-login_ di frontend).
    - Menghitung rasio sisa uang terhadap total uang masuk bulan lalu. Rasio tertinggi mendapatkan _badge_ di tabel `rewards`.

---

## 5. Rencana Pembuatan (Sprint Plan)

Pengembangan dapat dibagi menjadi 4 _Sprint_ (masing-masing durasi 1-2 minggu tergantung ketersediaan waktu):

### Sprint 1: Setup Lingkungan & Database

- **Goal:** Fondasi proyek berdiri dan database terhubung.
- **Tasks:**
  - Inisialisasi SvelteKit dengan adapter-static.
  - Setup Tailwind CSS dan konfigurasi tata letak Android View (Header, Content, Bottom Nav).
  - Instalasi dan migrasi skema PostgreSQL (ERD).
  - Membuat dummy login (pemilihan role 'suami' / 'istri' di _local storage_ untuk simulasi sesi).

### Sprint 2: Core Transactions (Arus Kas Utama)

- **Goal:** Pencatatan uang masuk dan keluar berfungsi.
- **Tasks:**
  - API Endpoint & UI untuk Suami mencatat gaji.
  - API Endpoint & UI untuk Suami transfer jatah ke Istri (Logika _Double-Entry_).
  - API Endpoint & UI untuk Suami dan Istri mencatat pengeluaran.
  - Implementasi `is_transparent_mode` di tingkat UI Svelte (`{#if}`) dan filter logika API.

### Sprint 3: Tabungan, Analisis & Gamifikasi

- **Goal:** Fitur penunjang dan _reward_ berjalan.
- **Tasks:**
  - Modul `saving_goals` (Buat target, catat progres menabung, render UI _Progress Bar_).
  - Halaman Analisis (Integrasi library _Chart_ ringan untuk visualisasi).
  - Logika tutup buku bulanan & sistem Poin/Badge.
  - Implementasi ganti tema dinamis di profil.

### Sprint 4: Mobile Integration & Polish

- **Goal:** Aplikasi siap diinstal di Android.
- **Tasks:**
  - Integrasi Capacitor ke proyek Svelte.
  - Setup `@capacitor/local-notifications` untuk pengingat pukul 12:00 dan 21:30.
  - Uji coba di Android Emulator atau perangkat keras asli.
  - Build ke file `.apk`.

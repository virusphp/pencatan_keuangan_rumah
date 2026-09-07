# Pencatatan Keuangan Rumah Tangga (SvelteKit + Prisma)

Aplikasi pencatatan keuangan modern untuk keluarga, dirancang khusus untuk mempermudah manajemen dompet suami dan istri dengan transparansi dan efisiensi. Dibangun dengan teknologi **SvelteKit**, **Tailwind CSS**, dan **Prisma ORM** (PostgreSQL).

## Fitur Utama ✨
- **Pemisahan Dompet Cerdas:** Saldo Suami dan Istri dipisahkan untuk menjaga privasi dan ketepatan data.
- **Mode Transparan:** Istri dapat melihat histori transaksi dan saldo suami secara *real-time* jika akses diberikan.
- **Auto-Transfer Dompet:** Fitur transfer uang dari suami ke istri akan otomatis memotong saldo pengirim dan menambah saldo penerima.
- **Tema Dinamis:** Pilih warna aplikasi sesuai mood Anda (pengaturan disimpan di database).
- **Analisis Keuangan:** Grafik ringkasan pengeluaran per bulan dengan persentase per kategori.
- **Filter Riwayat Bulanan:** Lacak kemana uang pergi di bulan-bulan sebelumnya tanpa menghilangkan total saldo real Anda.

---

## Panduan Instalasi (Development) 🛠️

Ikuti langkah-langkah berikut untuk menjalankan aplikasi secara lokal di komputer Anda:

### 1. Prasyarat Sistem
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/) (Versi 18 atau lebih baru)
- [PostgreSQL](https://www.postgresql.org/) (Database)

### 2. Kloning Repositori & Install Dependensi
Buka terminal dan jalankan:
```bash
git clone <url-repositori-anda>
cd pencatan_keuangan_rumah
npm install
```

### 3. Konfigurasi Database
Buat file `.env` di *root directory* (folder utama proyek) dan masukkan kredensial database PostgreSQL Anda:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/nama_database?schema=public"
```
*(Ganti `username`, `password`, dan `nama_database` sesuai setup Anda)*.

### 4. Setup Prisma (Migrasi & Generate)
Jalankan perintah berikut untuk mensinkronisasi database dan meng-generate Prisma Client:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Jalankan Server Development
```bash
npm run dev
```
Buka browser Anda dan akses `http://localhost:5173`. 
(Anda bisa memanggil `/api/seed` melalui browser jika membutuhkan data contoh awal, pastikan API tersebut aktif/dikonfigurasi dengan benar).

---

## Panduan Deploy ke Production 🚀

Untuk mempublikasikan aplikasi ini agar bisa diakses online, Anda memerlukan layanan Hosting Serverless (seperti Vercel) dan Hosting Database (seperti Supabase atau Prisma Postgres).

### Langkah 1: Hosting Database (Supabase)
1. Buat akun di [Supabase](https://supabase.com/).
2. Buat **New Project** dan tunggu database selesai disiapkan.
3. Buka menu **Settings > Database** dan salin **Transaction Connection String** (URL untuk koneksi).
4. Pastikan untuk menonaktifkan *Connection Pooling* untuk mode migrasi, atau sesuaikan parameter di URL (contoh menambahkan `?pgbouncer=true`).

### Langkah 2: Deploy SvelteKit (Vercel)
Aplikasi ini sudah dipasang dengan `@sveltejs/adapter-auto` yang secara default sangat kompatibel dengan Vercel.

1. Buat akun di [Vercel](https://vercel.com/) dan hubungkan dengan akun GitHub Anda.
2. Buat **New Project** dan pilih repositori `pencatan_keuangan_rumah` dari GitHub.
3. Di bagian **Environment Variables**, tambahkan:
   - `DATABASE_URL` : (Masukkan URL database dari Supabase di Langkah 1)
4. Pada menu **Build & Development Settings**, Vercel akan otomatis mengenali SvelteKit (`npm run build`).
5. Tambahkan skrip perintah instalasi kustom jika diperlukan, agar Prisma di-generate saat *build*:
   - Di tab *Settings > General > Build & Development Settings*, ubah **Install Command** menjadi:
     ```bash
     npm install && npx prisma generate
     ```
6. Klik **Deploy**.

### Langkah 3: Migrasi Database Production
Karena Vercel hanya me-*run build*, Anda harus memigrasikan skema tabel ke database *production* secara manual pertama kali:
```bash
# Ubah sementara isi .env di komputer Anda menjadi URL Supabase
# Lalu jalankan perintah ini dari komputer lokal:
npx prisma db push
```

**Selesai!** Aplikasi Pencatatan Keuangan Keluarga sekarang sudah mengudara dan bisa diakses lewat internet. 🥳

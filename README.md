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

---

## Panduan Deploy ke VPS / aaPanel 🖥️

Karena aplikasi ini sudah dikonfigurasi menggunakan `@sveltejs/adapter-node`, proses *deploy* ke VPS atau control panel seperti **aaPanel** menjadi sangat mudah.

### Langkah 1: Kloning & Build di Server
Masuk ke terminal VPS Anda, kloning repositori ini, lalu jalankan perintah *build*:
```bash
git clone <url-repositori-anda>
cd pencatatan_keuangan
npm install
npx prisma generate
npm run build
```
Setelah berhasil, SvelteKit akan menghasilkan folder `build/`.

### Langkah 2: Setup Database
Pastikan Anda sudah membuat database PostgreSQL kosong di server VPS atau aaPanel Anda.
Ubah file `.env` di server Anda dengan URL koneksi database yang baru.
```bash
# Lakukan push schema ke database production
npx prisma db push
```

### Langkah 3: Menjalankan Server Node

#### Jika menggunakan aaPanel:
1. Buka menu **Website > Node Project**.
2. Klik **Add Node Project**.
3. **Project directory**: Pilih folder aplikasi Anda (contoh: `/www/wwwroot/pencatatan_keuangan`).
4. **Run Command / Startup file**: Ketik `build/index.js`.
5. **Port**: Isi dengan `3000` (atau port pilihan Anda).
6. **Environment Variables**: Tambahkan `DATABASE_URL` (milik postgres lokal server) dan `ORIGIN` (contoh: `ORIGIN=https://domain-anda.com`).
7. Klik Submit dan biarkan aaPanel menjalankan aplikasi Anda (menggunakan PM2 di belakang layar).

#### Jika menggunakan PM2 (VPS Standar):
Instal PM2 dan jalankan secara daemon:
```bash
npm install -g pm2
PORT=3000 ORIGIN=https://domain-anda.com DATABASE_URL="postgresql://..." pm2 start build/index.js --name "keuangan-app"
pm2 save
pm2 startup
```

### Langkah 4: Setup Reverse Proxy (Domain)
Aplikasi berjalan di port `3000`. Agar bisa diakses dari domain tanpa port, setup Nginx.

**Di aaPanel:**
1. Pada list Website Node Project, klik **Mapping** lalu masukkan nama domain Anda (misal: `uang.keluarga.com`). aaPanel otomatis membuatkan reverse proxy Nginx.
2. Anda bisa langsung mengaktifkan SSL (Let's Encrypt) dari pengaturan website yang baru dibuat.

**Di VPS (Nginx Manual):**
Edit konfigurasi server block Nginx Anda:
```nginx
server {
    listen 80;
    server_name uang.keluarga.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Restart Nginx (`sudo systemctl restart nginx`).

**Selesai!** Aplikasi Pencatatan Keuangan Anda kini berjalan mandiri di VPS.

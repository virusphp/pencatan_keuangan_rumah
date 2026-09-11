#!/bin/bash

# ==========================================
# SET TIMEZONE KE WIB (Asia/Jakarta)
# ==========================================
export TZ="Asia/Jakarta"

# ==========================================
# KONFIGURASI BOT & TELEGRAM
# ==========================================
BOT_TOKEN="369034438:AAF9sgnOPCeofgidIJG3pgNzMZBjDGZtE-s"
CHAT_ID="-1004487561728" # Contoh: -1001234567890 (Channel) atau 12345678 (Pribadi)

# ==========================================
# KONFIGURASI DATABASE
# ==========================================
CONTAINER_NAME="keuangan_db"
DB_USER="postgres"
DB_NAME="keuangan_rumah"
BACKUP_DIR="/www/backup/db_keuangan" # Direktori penyimpanan backup di VPS

# Buat folder backup jika belum ada
mkdir -p "$BACKUP_DIR"

# ==========================================
# FORMAT TANGGAL & NAMA FILE
# ==========================================
DATE_SUFFIX=$(date +"%Y%m%d_%H%M%S")
FILE_NAME="${DB_NAME}_${DATE_SUFFIX}.sql"
FILE_PATH="${BACKUP_DIR}/${FILE_NAME}"

# ==========================================
# PROSES DUMP DATABASE DARI DOCKER
# ==========================================
echo "[1/4] Sedang melakukan pg_dump dari container $CONTAINER_NAME..."
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$FILE_PATH"

# Cek apakah dump berhasil dan file tidak kosong
if [ ! -s "$FILE_PATH" ]; then
  echo "❌ Error: Backup database gagal atau file kosong!"
  exit 1
fi

# ==========================================
# PERHITUNGAN UKURAN & FORMAT WAKTU INDONESIA
# ==========================================
FILE_SIZE=$(ls -lh "$FILE_PATH" | awk '{print $5}')

# Mapping Nama Hari & Bulan ke Bahasa Indonesia
DAY_EN=$(date +"%u")
MONTH_EN=$(date +"%m")
DAY_NUM=$(date +"%d")
YEAR=$(date +"%Y")
TIME_STR=$(date +"%H.%M.%S")

case $DAY_EN in
  1) HARI="Senin" ;;
  2) HARI="Selasa" ;;
  3) HARI="Rabu" ;;
  4) HARI="Kamis" ;;
  5) HARI="Jumat" ;;
  6) HARI="Sabtu" ;;
  7) HARI="Minggu" ;;
esac

case $MONTH_EN in
  01) BULAN="Januari" ;;
  02) BULAN="Februari" ;;
  03) BULAN="Maret" ;;
  04) BULAN="April" ;;
  05) BULAN="Mei" ;;
  06) BULAN="Juni" ;;
  07) BULAN="Juli" ;;
  08) BULAN="Agustus" ;;
  09) BULAN="September" ;;
  10) BULAN="Oktober" ;;
  11) BULAN="November" ;;
  12) BULAN="Desember" ;;
esac

WAKTU_INDONESIA="${HARI}, ${DAY_NUM} ${BULAN} ${YEAR} pukul ${TIME_STR} WIB"

# ==========================================
# FORMAT CAPTION TELEGRAM
# ==========================================
CAPTION="📦 DATABASE BACKUP AUTO-FORWARD
----------------------------------------
📄 Berkas: ${FILE_NAME}
📊 Ukuran: ${FILE_SIZE}
📅 Waktu: ${WAKTU_INDONESIA}
🔒 Status: Completed via pg_dump
----------------------------------------
🤖 Pencatatan Keuangan Rumah"

# ==========================================
# KIRIM FILE KE TELEGRAM CHANNEL
# ==========================================
echo "[2/4] Mengirim file backup ke Telegram..."
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendDocument" \
  -F "chat_id=${CHAT_ID}" \
  -F "document=@${FILE_PATH}" \
  -F "caption=${CAPTION}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "✅ [3/4] Backup berhasil dikirim ke Telegram!"
else
  echo "❌ Error mengirim ke Telegram: $RESPONSE"
fi

# ==========================================
# BERSIHKAN BACKUP LAMA (Hapus > 7 hari)
# ==========================================
echo "[4/4] Membersihkan file backup lokal yang lebih lama dari 7 hari..."
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -delete

echo "Selesai!"

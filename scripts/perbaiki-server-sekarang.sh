#!/usr/bin/env bash
# ============================================================
# PERBAIKI KATALOG GOLDEN BEE — SEMUA OTOMATIS DI SERVER
# ============================================================
# Masalah : Prisma engine hilang di node_modules cPanel →
#           semua API 500 → "Gagal memuat katalog".
# Solusi  : Unduh paket lengkap (kode + node_modules utuh +
#           engine Prisma + database sehat) langsung dari GitHub,
#           ekstrak menimpa file lama, lalu restart aplikasi.
#
# CARA PAKAI — cukup SATU baris di cPanel → Terminal:
#
#   curl -sL -o /tmp/perbaiki.sh https://raw.githubusercontent.com/aginacinta-sketch/goldenbee/main/scripts/perbaiki-server-sekarang.sh && bash /tmp/perbaiki.sh
#
# Tidak perlu token, tidak perlu upload apa pun.
# ============================================================
set -u

APP="$HOME/goldenbee-app"
ZIP="/home/$USER/goldenbee-cpanel-fix.zip"
URL="https://github.com/aginacinta-sketch/goldenbee/releases/download/cpanel-paket-20261028/goldenbee-cpanel-fix.zip"
SITE="https://goldenbee.web-id.id"

echo "============================================================"
echo "  PERBAIKI KATALOG GOLDEN BEE — $(date '+%d %b %Y %H:%M')"
echo "============================================================"

# ---------- [0] Pemeriksaan awal ----------
if [ ! -d "$APP" ]; then
  echo "ERROR: Folder aplikasi $APP tidak ditemukan."
  echo "Pastikan nama folder benar, lalu jalankan ulang."
  exit 1
fi
echo "[0/8] Folder aplikasi OK: $APP"

# ---------- [1] Backup database lama ----------
STAMP=$(date +%Y%m%d-%H%M%S)
if [ -f "$APP/db/custom.db" ]; then
  cp "$APP/db/custom.db" "$APP/db/custom.db.bak-$STAMP"
  echo "[1/8] Backup DB lama -> db/custom.db.bak-$STAMP"
else
  echo "[1/8] DB lama tidak ada (akan dipasang dari paket)."
fi

# ---------- [2] Unduh paket ----------
echo "[2/8] Mengunduh paket perbaikan dari GitHub (~136 MB)..."
echo "      Ini otomatis di server, biasanya 10-90 detik. Mohon tunggu..."
CURL_CODE=$(curl -L --retry 3 --retry-delay 3 -o "$ZIP" -sS -w "%{http_code}" "$URL")
SIZE=$(stat -c%s "$ZIP" 2>/dev/null || echo 0)
if [ "$CURL_CODE" != "200" ] || [ "$SIZE" -lt 100000000 ]; then
  echo "ERROR: Unduhan gagal (HTTP $CURL_CODE, $SIZE byte)."
  echo "Coba jalankan perintah ini sekali lagi."
  exit 1
fi
echo "      -> Berhasil: $SIZE byte"

# ---------- [3] Verifikasi paket ----------
echo -n "[3/8] Verifikasi isi paket... "
if unzip -tq "$ZIP" >/dev/null 2>&1; then
  echo "ZIP utuh."
else
  echo "ZIP rusak! Coba jalankan ulang perintahnya."
  exit 1
fi

# ---------- [4] Hentikan aplikasi sesaat ----------
echo "[4/8] Menghentikan proses aplikasi lama sesaat..."
pkill -f "nodevenv/goldenbee-app" 2>/dev/null || true
pkill -f "goldenbee-app/server.js" 2>/dev/null || true
pkill -f "goldenbee-app/app.js"   2>/dev/null || true
sleep 2
echo "      -> Selesai."

# ---------- [5] Ekstrak paket (menimpa file lama) ----------
echo "[5/8] Mengekstrak 3.598 file ke $APP (1-3 menit)..."
if unzip -oq "$ZIP" -d "$APP"; then
  echo "      -> Ekstraksi selesai."
else
  echo "ERROR: Ekstraksi gagal. Coba jalankan ulang."
  exit 1
fi
rm -f "$ZIP"

# ---------- [6] Pastikan konfigurasi database benar ----------
echo "[6/8] Menyiapkan konfigurasi (.env)..."
cat > "$APP/.env" <<EOF
DATABASE_URL=file:$APP/db/custom.db
EOF
echo "      -> .env: DATABASE_URL=file:$APP/db/custom.db"

# ---------- [7] Cek engine Prisma + izin file ----------
echo "[7/8] Memeriksa engine database Prisma (akar masalah):"
ENGINE_OK=0
for e in "$APP"/node_modules/.prisma/client/libquery_engine-*.so.node; do
  if [ -s "$e" ]; then
    echo "      OK: $(basename "$e") ($(stat -c%s "$e") byte)"
    ENGINE_OK=1
  fi
done
if [ "$ENGINE_OK" != "1" ]; then
  echo "      !! Engine masih hilang — jalankan ulang perintah ini."
  exit 1
fi
chmod -R u+rwX "$APP" 2>/dev/null || true

# ---------- [8] Restart + verifikasi ----------
mkdir -p "$APP/tmp"
touch "$APP/tmp/restart.txt"
echo "[8/8] Aplikasi di-restart (Passenger). Menunggu 8 detik..."
sleep 8

echo ""
echo "=========== HASIL VERIFIKASI ==========="
GAGAL=0
for ep in "/" "api/settings" "api/products" "api/menus" "api/gallery" "api/testimonials"; do
  CODE=$(curl -s -o /tmp/beecek.out -w "%{http_code}" --max-time 20 "$SITE/$ep" 2>/dev/null || echo 000)
  if [ "$CODE" = "200" ]; then
    echo "  OK   /$ep -> HTTP $CODE"
  else
    echo "  GAGAL /$ep -> HTTP $CODE  $(head -c 80 /tmp/beecek.out 2>/dev/null)"
    GAGAL=1
  fi
done
echo "========================================"
echo ""
if [ "$GAGAL" = "0" ]; then
  echo ">>> SUKSES! Semua endpoint hidup. Katalog sudah normal."
  echo ">>> Buka https://goldenbee.web-id.id dan muat ulang (Ctrl+Shift+R)."
else
  echo ">>> Masih ada yang gagal. Tunggu 30 detik lalu cek lagi website."
  echo ">>> Jika masih gagal, jalankan sekali lagi perintah yang sama."
fi
echo ""
echo "Backup DB lama tersimpan di: $APP/db/custom.db.bak-$STAMP"
echo "============================================================"

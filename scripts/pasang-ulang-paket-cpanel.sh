#!/usr/bin/env bash
# ============================================================
# PASANG ULANG PAKET RESMI GOLDEN BEE DI CPANEL (Task 103)
# Mengembalikan node_modules + engine Prisma yang hilang,
# sekaligus meng-upgrade build ke versi terbaru (fitur galeri).
# AMAN: aplikasi lama dicadangkan penuh; database & chat lama
# dipertahankan (db/ diambil dari cadangan, bukan dari paket).
# ============================================================
bash <<'BEE3'
set -e
GH_REPO="aginacinta-sketch/goldenbee"
GH_TOKEN="${GITHUB_TOKEN:-}"
if [ -z "$GH_TOKEN" ]; then
  read -r -p "Tempel Token GitHub (ghp_...): " GH_TOKEN
fi
ART=12710232626

cd ~
echo "[1/7] Unduh paket resmi (~118 MB, tunggu 2-5 menit)..."
curl -sSL --max-time 900 -H "Authorization: token $GH_TOKEN" -o paket.zip \
  "https://api.github.com/repos/$GH_REPO/actions/artifacts/$ART/zip"
UK=$(stat -c%s paket.zip)
echo "ukuran unduhan: $UK byte"
[ "$UK" -gt 100000000 ] || { echo "!! unduhan tidak lengkap — jalankan ulang skrip ini"; exit 1; }

echo "[2/7] Buka lapis luar (artifact)..."
rm -rf paket-dalam && mkdir paket-dalam
cd paket-dalam && unzip -qo ../paket.zip && ls -l

echo "[3/7] Cadangkan aplikasi lama (tidak dihapus)..."
cd ~ && mv goldenbee-app "goldenbee-app-lama-$(date +%m%d-%H%M)"

echo "[4/7] Pasang paket baru..."
mkdir goldenbee-app
cd goldenbee-app && unzip -qo ~/paket-dalam/goldenbee-cpanel.zip

echo "[5/7] Kembalikan database terbaru & riwayat chat lama..."
rm -rf db && cp -a ~/goldenbee-app-lama-*/db db
cp -a ~/goldenbee-app-lama-*/app.js . 2>/dev/null || echo "(tanpa app.js lama — startup pakai server.js)"
ls -la db/ | head -8

echo "[6/7] Cek engine Prisma terpasang..."
ls -l node_modules/.prisma/client/libquery_engine-* 2>/dev/null || { echo "!! ENGINE MASIH HILANG — kirim output ini ke saya"; exit 1; }

echo "[7/7] Restart aplikasi & uji katalog..."
mkdir -p tmp && touch tmp/restart.txt
echo "sinyal restart terkirim — tunggu 20 detik..."
sleep 20
for ep in settings products menus testimonials; do
  echo "/api/$ep -> $(curl -sS -o /tmp/b.out -w '%{http_code}' --max-time 25 https://goldenbee.web-id.id/api/$ep) $(head -c 60 /tmp/b.out)"
done

echo ""
echo "SELESAI. Bila keempatnya HTTP 200 -> buka https://goldenbee.web-id.id :"
echo "katalog PULIH + fitur galeri baru ikut aktif."
echo "Bila masih 500: buka cPanel 'Setup Node.js App' -> klik Restart sekali lagi,"
echo "tunggu 30 detik -> muat ulang situs. Bila tetap gagal, kirim output ini ke saya."
BEE3

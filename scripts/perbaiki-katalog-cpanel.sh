#!/usr/bin/env bash
# ============================================================
# PERBAIKI KATALOG GOLDEN BEE DI CPANEL — diagnosa + pulihkan DB
# Jalankan di: cPanel → Terminal (tinggal tempel satu kali).
# Aman: database lama TIDAK dihapus (di-backup), tidak menyentuh kode.
# ============================================================
bash <<'BEE'
set -u
APP="$HOME/goldenbee-app"
DB="$APP/db/custom.db"
GH_REPO="aginacinta-sketch/goldenbee"
# Token GitHub (akses baca repo privat). Isi lewat env GITHUB_TOKEN
# atau tempel saat skrip bertanya — JANGAN ditulis mentah di berkas ini.
GH_TOKEN="${GITHUB_TOKEN:-}"
if [ -z "$GH_TOKEN" ]; then
  read -r -p "Tempel Token GitHub (ghp_...): " GH_TOKEN
fi
MD5_HARAPAN="d2558be32c8d1673dda77a8ce77f69c9"
UKURAN_HARAPAN=53174272
GAGAL=0

echo "================ DIAGNOSA GOLDEN BEE $(date '+%d %b %Y %H:%M') ================"

echo ""; echo "[1/7] Pemakaian disk (penyebab umum: kuota penuh)..."
df -h "$HOME" 2>/dev/null | head -3
quota -s 2>/dev/null | head -3 || echo "(kuota tidak tersedia via CLI)"
du -sh "$APP" "$APP/.next" "$APP/db" 2>/dev/null
du -sh "$HOME"/goldenbee-app-lama* "$HOME"/goldenbee-app-backup* 2>/dev/null || true

echo ""; echo "[2/7] Kondisi berkas database saat ini..."
ls -la "$APP/db/" 2>/dev/null || { echo "!! Folder db TIDAK ADA: $APP/db"; GAGAL=1; }
if [ -f "$DB" ]; then
  UK=$(stat -c%s "$DB" 2>/dev/null || echo 0)
  HDR=$(head -c 16 "$DB" 2>/dev/null | tr -d '\0')
  echo "Ukuran: $UK byte | Header: ${HDR:0:15}"
  if [ "$UK" -lt 4096 ]; then echo ">> DB RUSAK/KOSONG (terlalu kecil)"; GAGAL=1; fi
  case "$HDR" in "SQLite format 3") echo ">> Header SQLite valid";; *) echo ">> BUKAN file SQLite (kemungkinan HTML error saat unduh)"; GAGAL=1;; esac
else
  echo ">> DB TIDAK ADA: $DB"; GAGAL=1
fi

echo ""; echo "[3/7] Uji baca database dengan aplikasi (integritas + hitung data)..."
NODE_BIN=""
for c in "$HOME"/nodevenv/goldenbee-app/*/bin/node "$HOME"/nodevenv/goldenbee-app/bin/node $(command -v node 2>/dev/null); do
  if [ -x "$c" ] || command -v "$c" >/dev/null 2>&1; then
    V=$("$c" -e 'console.log(process.versions.node.split(".")[0])' 2>/dev/null || echo 0)
    if [ "${V:-0}" -ge 18 ] 2>/dev/null; then NODE_BIN="$c"; break; fi
  fi
done
if [ -n "$NODE_BIN" ]; then
  ( cd "$APP" && "$NODE_BIN" -e "
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient({datasources:{db:{url:'file:$DB'}}});
(async()=>{
  const i=await db.\$queryRawUnsafe('PRAGMA integrity_check');
  const p=await db.\$queryRawUnsafe('SELECT COUNT(*) c FROM Product');
  const s=await db.\$queryRawUnsafe('SELECT COUNT(*) c FROM Setting');
  console.log('integritas:',JSON.stringify(i),'| produk:',p[0].c,'| setting:',s[0].c);
  await db.\$disconnect();
})().catch(e=>{console.error('GAGAL BACA DB:',e.message.split('\n')[0]);process.exit(1)});" ) \
    && echo ">> Database TERBACA dengan baik" \
    || { echo ">> Database TIDAK DAPAT DIBACA aplikasi"; GAGAL=1; }
else
  echo "(node tidak ditemukan di Terminal — uji ini dilewati)"
fi

echo ""; echo "[4/7] Cadangkan database lama (apa pun kondisinya)..."
if [ -f "$DB" ]; then
  BAK="$DB.rusak-$(date +%Y%m%d-%H%M%S)"
  mv "$DB" "$BAK" && echo ">> DB lama disimpan sebagai: $(basename "$BAK")"
else
  echo ">> Tidak ada DB lama untuk dicadangkan"
fi
rm -f "$DB-wal" "$DB-shm" 2>/dev/null

echo ""; echo "[5/7] Unduh database sehat dari GitHub (backup resmi)..."
curl -sSL --max-time 300 -H "Authorization: token $GH_TOKEN" \
     -H "Accept: application/vnd.github.raw" \
     -o "$DB.tmp" "https://raw.githubusercontent.com/$GH_REPO/main/db/custom.db" \
  && echo ">> Unduhan selesai: $(stat -c%s "$DB.tmp" 2>/dev/null) byte" \
  || { echo "!! UNDUH GAGAL — cek koneksi server/kuota disk"; GAGAL=1; }

if [ -f "$DB.tmp" ]; then
  MD5=$(md5sum "$DB.tmp" | awk '{print $1}')
  UK=$(stat -c%s "$DB.tmp")
  echo "MD5: $MD5 (harapan: $MD5_HARAPAN)"
  if [ "$MD5" = "$MD5_HARAPAN" ]; then
    mv "$DB.tmp" "$DB"
    chmod 664 "$DB" 2>/dev/null; chmod 775 "$APP/db" 2>/dev/null
    echo ">> DATABASE SEHAT TERPASANG ($UK byte)"
  else
    echo "!! MD5 TIDAK COCOK — unduhan korup, DB lama TIDAK ditimpa."
    echo "   (berkas gagal tetap ada sebagai $DB.tmp untuk diperiksa)"
    GAGAL=1
  fi
fi

echo ""; echo "[6/7] Restart aplikasi (Passenger)..."
mkdir -p "$APP/tmp" && touch "$APP/tmp/restart.txt" && echo ">> Sinyal restart dikirim — tunggu ± 20 detik."
echo "   (Bila nanti masih error: Setup Node.js App → klik Restart sekali lagi.)"

echo ""; echo "[7/7] Uji katalog lewat website..."
sleep 20
for ep in products settings menus testimonials; do
  KODE=$(curl -sS -o /tmp/bee_$ep.out -w "%{http_code}" --max-time 25 "https://goldenbee.web-id.id/api/$ep" 2>/dev/null)
  echo "/api/$ep -> HTTP $KODE | $(head -c 90 /tmp/bee_$ep.out 2>/dev/null)"
  [ "$KODE" = "200" ] || GAGAL=1
done

echo ""
if [ "$GAGAL" = "0" ]; then
  echo "================ SELESAI: KATALOG PULIH ✔ ================"
  echo "Buka https://goldenbee.web-id.id — katalog harus tampil normal."
else
  echo "================ MASIH ADA MASALAH ✘ ================"
  echo "Salin SELURUH output layar ini dan kirimkan kembali ke saya."
  echo "Log server terakhir (jika ada):"
  ls -t "$HOME/logs/" 2>/dev/null | head -3
  for f in $(ls -t "$HOME/logs/"* 2>/dev/null | head -1); do tail -15 "$f" 2>/dev/null; done
fi
echo "========================================================"
BEE

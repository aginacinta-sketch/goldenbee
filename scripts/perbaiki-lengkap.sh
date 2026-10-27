#!/usr/bin/env bash
# ============================================================
# GOLDEN BEE — DIAGNOSA + PERBAIKAN LENGKAP (satu perintah)
# Jalankan di cPanel → Terminal:
#   curl -sL -o /tmp/bee.sh https://raw.githubusercontent.com/aginacinta-sketch/goldenbee/main/scripts/perbaiki-lengkap.sh && bash /tmp/bee.sh
# Aman: mem-backup dulu, hanya menyentuh yang perlu.
# ============================================================
set -u
APP="$HOME/goldenbee-app"
SITE="https://goldenbee.web-id.id"
MINI_URL="https://github.com/aginacinta-sketch/goldenbee/releases/download/cpanel-paket-20261028/goldenbee-engine-fix.zip"
ENGINE_WAJIB="libquery_engine-debian-openssl-1.0.x.so.node"
FULL_URL="https://github.com/aginacinta-sketch/goldenbee/releases/download/cpanel-paket-20261028/goldenbee-cpanel-fix.zip"

echo "############################################################"
echo "#  GOLDEN BEE — DIAGNOSA & PERBAIKAN  $(date '+%d %b %H:%M')"
echo "############################################################"

# ---------------- DIAGNOSA AWAL ----------------
echo ""
echo "========== [1] KONDISI SAAT INI =========="
ls -ld "$APP" >/dev/null 2>&1 || { echo "!! Folder $APP TIDAK ADA — hentikan, laporkan ke asisten."; exit 1; }
echo "  Folder app   : ADA ($APP)"
[ -d "$APP/.next" ] && echo "  Build .next  : ADA" || echo "  Build .next  : TIDAK ADA"
if [ -s "$APP/node_modules/.prisma/client/$ENGINE_WAJIB" ]; then
  echo "  Engine Prisma: ADA ($ENGINE_WAJIB)"
  ENGINE_ADA=1
elif ls "$APP"/node_modules/.prisma/client/libquery_engine-*.so.node >/dev/null 2>&1; then
  echo "  Engine Prisma: ADA TAPI SALAH VERSI — server butuh $ENGINE_WAJIB (OpenSSL 1.0)"
  echo "    yang ada: $(ls "$APP"/node_modules/.prisma/client/libquery_engine-*.so.node | xargs -n1 basename | tr '\n' ' ')"
  ENGINE_ADA=0
else
  echo "  Engine Prisma: !! TIDAK ADA sama sekali (penyebab katalog gagal)"
  ENGINE_ADA=0
fi
[ -f "$APP/.env" ] && echo "  File .env    : $(cat "$APP/.env" | head -1)" || echo "  File .env    : TIDAK ADA"
[ -f "$APP/db/custom.db" ] && echo "  Database     : ADA ($(stat -c%s "$APP/db/custom.db") byte)" || echo "  Database     : TIDAK ADA"

# ---------------- PERBAIKAN ----------------
echo ""
echo "========== [2] PERBAIKAN =========="
STAMP=$(date +%Y%m%d-%H%M%S)
if [ -f "$APP/db/custom.db" ]; then
  cp "$APP/db/custom.db" "$APP/db/custom.db.bak-$STAMP" && echo "  Backup DB -> db/custom.db.bak-$STAMP"
fi

# .env selalu dipastikan benar
printf 'DATABASE_URL=file:%s/db/custom.db\n' "$APP" > "$APP/.env"
echo "  .env ditulis : DATABASE_URL=file:$APP/db/custom.db"

if [ "$ENGINE_ADA" != "1" ]; then
  echo "  Engine belum lengkap -> unduh paket engine (18 MB) langsung di server..."
  if curl -L --retry 3 --retry-delay 2 -sS -o /tmp/bee-mini.zip "$MINI_URL"; then
    SZ=$(stat -c%s /tmp/bee-mini.zip 2>/dev/null || echo 0)
    if [ "$SZ" -gt 15000000 ] && unzip -tq /tmp/bee-mini.zip >/dev/null 2>&1; then
      unzip -oq /tmp/bee-mini.zip -d "$APP" && rm -f /tmp/bee-mini.zip
      if [ -s "$APP/node_modules/.prisma/client/$ENGINE_WAJIB" ]; then
        echo "  -> Engine $ENGINE_WAJIB berhasil dipasang"
      else
        echo "  !! Engine masih belum ada setelah ekstrak — akan dicoba paket LENGKAP..."
        curl -L --retry 2 -sS -o /tmp/bee-full.zip "$FULL_URL" && unzip -oq /tmp/bee-full.zip -d "$APP" && rm -f /tmp/bee-full.zip
        [ -s "$APP/node_modules/.prisma/client/$ENGINE_WAJIB" ] && echo "  -> Engine terpasang (paket lengkap)" || echo "  !! GAGAL pasang engine — screenshot hasil ini."
      fi
    else
      echo "  !! Unduhan rusak ($SZ byte) — jalankan ulang perintah ini."
    fi
  else
    echo "  !! Unduhan gagal (server tidak bisa akses GitHub?) — screenshot hasil ini."
  fi
else
  echo "  Engine $ENGINE_WAJIB sudah ada — tidak perlu unduh."
fi

chmod -R u+rwX "$APP" 2>/dev/null

# ---------------- RESTART ----------------
echo ""
echo "========== [3] RESTART APLIKASI =========="
pkill -f "nodevenv/goldenbee-app" 2>/dev/null || true
pkill -f "goldenbee-app/server.js" 2>/dev/null || true
mkdir -p "$APP/tmp"; touch "$APP/tmp/restart.txt"
echo "  Sinyal restart terkirim. Menunggu 10 detik..."
sleep 10

# ---------------- VERIFIKASI ----------------
echo ""
echo "========== [4] VERIFIKASI WEBSITE =========="
GAGAL=0
for ep in "" "api/settings" "api/products" "api/menus" "api/gallery" "api/testimonials"; do
  C=$(curl -s -o /tmp/bee-cek.out -w "%{http_code}" -m 25 "$SITE/$ep" 2>/dev/null || echo 000)
  if [ "$C" = "200" ]; then echo "  OK    /$ep -> HTTP 200"
  else echo "  GAGAL /$ep -> HTTP $C $(head -c 60 /tmp/bee-cek.out 2>/dev/null)"; GAGAL=1; fi
done

# ---------------- ERROR ASLI (bila perlu) ----------------
if [ "$GAGAL" = "1" ]; then
  echo ""
  echo "========== [5] ERROR ASLI DARI DATABASE =========="
  NODE_BIN=""
  for c in "$HOME"/nodevenv/goldenbee-app/*/bin/node "$HOME"/nodevenv/goldenbee-app/bin/node; do
    [ -x "$c" ] && NODE_BIN="$c" && break
  done
  [ -z "$NODE_BIN" ] && NODE_BIN=$(command -v node 2>/dev/null)
  ( cd "$APP" && "$NODE_BIN" -e "
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
(async()=>{
  const r=await db.\$queryRawUnsafe('SELECT COUNT(*) c FROM Setting');
  console.log('>>> DB TERBACA. jumlah setting:', r[0].c);
  await db.\$disconnect();
})().catch(e=>{ console.error('>>> ERROR ASLI:'); console.error(e.message); });
" ) 2>&1 | head -8
fi

echo ""
echo "############################################################"
if [ "$GAGAL" = "0" ]; then
  echo "#  SUKSES! Semua endpoint hidup. Buka website + Ctrl+Shift+R."
else
  echo "#  Belum sukses — SCREENSHOT seluruh hasil ini, kirim ke asisten."
fi
echo "############################################################"

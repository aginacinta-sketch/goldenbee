#!/bin/bash
# ============================================================
# GOLDEN BEE — PEMULIHAN SERVER (disk penuh / proses macet)
# Jalankan di cPanel → Terminal:
#   curl -sL -o /tmp/pulih.sh https://raw.githubusercontent.com/aginacinta-sketch/goldenbee/main/scripts/pulihkan-server.sh && bash /tmp/pulih.sh
# Aman: DB utama TIDAK disentuh; hanya ZIP sisa & backup lama yang dibuang.
# ============================================================
set -u
APP="$HOME/goldenbee-app"
SITE="https://goldenbee.web-id.id"

echo "############################################################"
echo "#  GOLDEN BEE — PEMULIHAN SERVER  $(date '+%d %b %H:%M')"
echo "############################################################"

echo ""
echo "========== [1] KONDISI DISK =========="
df -h "$HOME" 2>/dev/null | tail -2
echo ""
echo "  Berkas besar sisa (kandidat hapus):"
du -sh "$HOME"/goldenbee-*.zip "$HOME"/paket*.zip /tmp/bee-*.zip /tmp/perbaiki.sh 2>/dev/null | sed 's/^/    /'
du -sh "$APP"/db/custom.db.bak-* 2>/dev/null | sed 's/^/    /'

echo ""
echo "========== [2] BERSIH-BERSIH =========="
BEFORE=$(df -k "$HOME" 2>/dev/null | tail -1 | awk '{print $4}')
rm -f /tmp/bee-mini.zip /tmp/bee-full.zip /tmp/bee.sh /tmp/perbaiki.sh /tmp/pulih.sh \
      "$HOME"/goldenbee-cpanel-fix.zip "$HOME"/goldenbee-minimal-fix.zip \
      "$HOME"/goldenbee-engine-fix.zip "$HOME"/paket*.zip 2>/dev/null
# Sisakan HANYA 1 backup DB terbaru
ls -t "$APP"/db/custom.db.bak-* 2>/dev/null | tail -n +2 | xargs -r rm -f
AFTER=$(df -k "$HOME" 2>/dev/null | tail -1 | awk '{print $4}')
if [ -n "$BEFORE" ] && [ -n "$AFTER" ]; then
  echo "  Ruang dibebaskan: $(( (AFTER - BEFORE) / 1024 )) MB"
fi
df -h "$HOME" 2>/dev/null | tail -1 | sed 's/^/  Disk sekarang: /'

echo ""
echo "========== [3] SEHATKAN DATABASE =========="
NODE_BIN=""
for c in "$HOME"/nodevenv/goldenbee-app/*/bin/node "$HOME"/nodevenv/goldenbee-app/bin/node; do
  [ -x "$c" ] && NODE_BIN="$c" && break
done
[ -z "$NODE_BIN" ] && NODE_BIN=$(command -v node 2>/dev/null)
echo "  node: $NODE_BIN"
( cd "$APP" && "$NODE_BIN" -e "
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
(async()=>{
  const r=await db.\$queryRawUnsafe('PRAGMA integrity_check');
  console.log('  integrity_check:', JSON.stringify(r));
  await db.\$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE)');
  console.log('  wal_checkpoint: OK');
  const s=await db.\$queryRawUnsafe('SELECT COUNT(*) c FROM Setting');
  console.log('  baca uji: OK, jumlah setting:', String(s[0].c));
  await db.\$disconnect();
})().catch(e=>{ console.error('  DB ERROR:', e.message); process.exit(1); });
" ) 2>&1 | head -6

echo ""
echo "========== [4] RESTART APLIKASI =========="
pkill -f "nodevenv/goldenbee-app" 2>/dev/null || true
pkill -f "goldenbee-app/server.js" 2>/dev/null || true
pkill -f "goldenbee-app/app.js" 2>/dev/null || true
sleep 2
mkdir -p "$APP/tmp"; touch "$APP/tmp/restart.txt"
echo "  Sinyal restart terkirim. Menunggu 12 detik..."
sleep 12

echo ""
echo "========== [5] VERIFIKASI =========="
GAGAL=0
for ep in "" "api/settings" "api/products" "api/gallery"; do
  C=$(timeout 25 curl -s -o /dev/null -w "%{http_code}" -m 20 "$SITE/$ep" 2>/dev/null || echo 000)
  if [ "$C" = "200" ]; then echo "  OK    /$ep -> HTTP 200"; else echo "  GAGAL /$ep -> HTTP $C"; GAGAL=1; fi
done
echo ""
echo "############################################################"
if [ "$GAGAL" = "0" ]; then
  echo "#  PULIH! Website normal kembali."
else
  echo "#  Belum pulih — SCREENSHOT seluruh hasil ini, kirim ke asisten."
fi
echo "############################################################"

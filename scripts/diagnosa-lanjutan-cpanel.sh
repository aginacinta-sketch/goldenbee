#!/usr/bin/env bash
# ============================================================
# DIAGNOSA LANJUTAN GOLDEN BEE CPANEL — cari error ASLI Prisma.
# Jalankan di cPanel → Terminal. Tidak mengubah apa pun (baca saja).
# ============================================================
bash <<'BEE2'
set -u
APP="$HOME/goldenbee-app"

echo "=========== DIAGNOSA LANJUTAN GOLDEN BEE $(date '+%d %b %H:%M') ============"

echo ""; echo "[A] Struktur aplikasi (semua baris harus ada):"
ls -ld "$APP" "$APP/server.js" "$APP/.next" "$APP/node_modules" "$APP/node_modules/@prisma/client" 2>&1

echo ""; echo "[B] Engine database Prisma (native binary):"
ls -la "$APP/node_modules/.prisma/client/" 2>/dev/null | grep -Ei "engine|\.node" || echo "!! TIDAK ADA file engine di .prisma/client"
ls -la "$APP/node_modules/@prisma/engines/" 2>/dev/null | grep -Ei "engine" | head -4 || echo "!! folder @prisma/engines tidak ada"

echo ""; echo "[C] Berkas samping database (bukti aplikasi pernah membuka DB):"
ls -la "$APP/db/" 2>&1 | head -10

echo ""; echo "[D] Env aplikasi:"
cat "$APP/.env" 2>/dev/null || echo "(tidak ada .env — env lewat Setup Node.js App: DATABASE_URL)"

echo ""; echo "[E] UJI QUERY LANGSUNG — pesan error ASLI akan tampil di sini:"
NODE_BIN=""
for c in "$HOME"/nodevenv/goldenbee-app/*/bin/node "$HOME"/nodevenv/goldenbee-app/bin/node; do
  [ -x "$c" ] && NODE_BIN="$c" && break
done
[ -z "$NODE_BIN" ] && NODE_BIN=$(command -v node 2>/dev/null)
echo "node yang dipakai: ${NODE_BIN:-TIDAK KETEMU} $("$NODE_BIN" -v 2>/dev/null)"
( cd "$APP" && "$NODE_BIN" -e "
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient({datasources:{db:{url:'file:'+process.cwd()+'/db/custom.db'}}});
(async()=>{
  const r=await db.\$queryRawUnsafe('SELECT COUNT(*) c FROM Setting');
  console.log('>>> OK! DB TERBACA. jumlah setting:', r[0].c);
  await db.\$disconnect();
})().catch(e=>{
  console.error('>>> ERROR ASLI PRISMA:');
  console.error(String(e.message).split('\n').slice(0,6).join('\n'));
  process.exit(1);
});" ) 2>&1 | tail -10

echo ""; echo "[F] Log aplikasi terakhir (jika ditemukan):"
for f in $(ls -t "$HOME/logs/"* 2>/dev/null | head -2); do echo "--- $f:"; tail -10 "$f" 2>/dev/null; done
ls -t "$HOME"/nodevenv/goldenbee-app/*/stderr.log 2>/dev/null | head -1 | xargs -r tail -10
ls -t "$HOME"/nodevenv/goldenbee-app/*/stdout.log 2>/dev/null | head -1 | xargs -r tail -5

echo ""; echo "=== SELESAI — SALIN SELURUH OUTPUT INI & KIRIMKAN KEPADA SAYA ==="
BEE2

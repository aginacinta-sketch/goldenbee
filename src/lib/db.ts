import path from "path"
import fs from "fs"
import { PrismaClient } from '@prisma/client'

// ============================================================
// Resolusi lokasi database SQLite yang TAHAN LINGKUNGAN:
//  1) DATABASE_URL di-set (sandbox dev/standalone/VPS .env) → pakai apa adanya.
//  2) Tidak di-set (mis. deploy Vercel dari GitHub — .env memang tidak ikut,
//     lihat .gitignore) → pakai <cwd>/db/custom.db dari repo.
//     Di hosting dengan filesystem READ-ONLY (Vercel serverless), SQLite
//     di mode WAL butuh direktori writable untuk berkas sampingan -shm/-wal;
//     kalau tidak, bahkan SELECT pun bisa gagal. Solusi: salin db ke /tmp
//     (satu-satunya direktori writable) dan arahkan URL ke sana.
//     CATATAN JUJUR: di serverless, hasil tulisan ke /tmp hilang saat
//     instance dingin ulang — untuk simpan permanen gunakan VPS/hosting
//     sendiri (lihat PANDUAN-HOSTING.md).
// ============================================================
function resolusiUrlDatabase(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const berkasDb = path.join(process.cwd(), "db", "custom.db")
  if (!fs.existsSync(berkasDb)) {
    // Biarkan Prisma yang melapor dengan pesan bawaannya bila berkas tak ada.
    return `file:${berkasDb}`
  }

  let direktoriBisaTulis = true
  try {
    fs.accessSync(path.dirname(berkasDb), fs.constants.W_OK)
  } catch {
    direktoriBisaTulis = false
  }

  if (direktoriBisaTulis) return `file:${berkasDb}`

  try {
    const salinan = "/tmp/goldenbee-custom.db"
    fs.copyFileSync(berkasDb, salinan)
    // Hapus sisa WAL/SHM lama agar salinan bersih (isi WAL utama sudah
    // ter-checkpoint saat repo di-commit — berkas -wal diabaikan git).
    for (const sampingan of [`${salinan}-wal`, `${salinan}-shm`]) {
      try { fs.rmSync(sampingan, { force: true }) } catch {}
    }
    return `file:${salinan}`
  } catch {
    // Gagal menyalin? Coba tetap pakai berkas asli — lebih baik mencoba.
    return `file:${berkasDb}`
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // URL database: env bila ada, kalau tidak pakai resolusi otomatis di atas.
    datasourceUrl: resolusiUrlDatabase(),
    // Log query hanya di dev — di produksi (server hasil publish) cukup error
    // agar server.log tidak membengkak.
    log: process.env.NODE_ENV === "production" ? ["error"] : ["query"],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

import { db } from "@/lib/db";

/**
 * pastikanTabelGaleri — memastikan tabel "GalleryItem" tersedia sebelum API
 * galeri menjalankan query (Task 92).
 *
 * Kenapa perlu: salinan ter-deploy memakai database lama (di-copy pemilik
 * saat pasang paket baru) yang belum memiliki tabel GalleryItem. Tanpa
 * langkah migrasi manual, API galeri akan 500. Fungsi ini menjalankan
 * CREATE TABLE IF NOT EXISTS sekali per proses — idempoten, aman dipanggil
 * di setiap handler, dan no-op di database yang sudah memiliki tabel
 * (mis. database baru dari paket deploy).
 */
let janji: Promise<void> | null = null;

export function pastikanTabelGaleri(): Promise<void> {
  janji ??= (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GalleryItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "image" TEXT NOT NULL,
        "caption" TEXT NOT NULL DEFAULT '',
        "active" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
  })().catch((e) => {
    janji = null; // gagal (mis. database sibuk) — coba lagi di permintaan berikutnya
    throw e;
  });
  return janji;
}

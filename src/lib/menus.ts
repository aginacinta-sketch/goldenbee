import { db } from "@/lib/db";
import { pastikanTabelGaleri } from "@/lib/galeri";

/**
 * pastikanMenuGaleri (Task 96) — menu navigasi "Galeri" (#galeri)
 * ditambahkan OTOMATIS bila belum ada di database.
 *
 * Kenapa lewat kode, bukan sekadar diisi di database pengembangan:
 * saat memasang paket baru, pemilik menyalin database LAMA ke aplikasi
 * baru — menu yang hanya diisi di database sandbox tidak akan pernah
 * sampai ke produksi. Dengan penjagaan ini, database milik siapa pun
 * (lama/baru) otomatis mendapat menu Galeri begitu ada foto galeri
 * aktif, tanpa langkah manual.
 *
 * Aturan:
 * - Bila sudah ada menu ber-target "#galeri" (termasuk yang disembunyikan
 *   admin), TIDAK melakukan apa-apa — keputusan admin dihormati.
 * - Bila tidak ada satu pun foto galeri aktif, menu tidak dibuat —
 *   menghindari tombol yang menuju section kosong. Menu otomatis muncul
 *   begitu pemilik mengunggah foto pertama.
 * - Disisipkan SEBELUM menu Testimoni/Kontak agar urutan menu mengikuti
 *   urutan section halaman (galeri berada di atas testimoni).
 * - Selalu di dalam try/catch: kegagalan bootstrap tidak boleh
 *   menggagalkan pemuatan daftar menu.
 */
export async function pastikanMenuGaleri(): Promise<void> {
  try {
    const ada = await db.menuItem.findFirst({ where: { target: "#galeri" } });
    if (ada) return;

    // Tabel GalleryItem mungkin belum ada di database lama — pastikan dulu
    // (idempoten, sekali per proses) agar query count tidak 500.
    await pastikanTabelGaleri();
    const jumlahFoto = await db.galleryItem.count({ where: { active: true } });
    if (jumlahFoto === 0) return;

    // Titik sisip: sebelum menu pertama yang ber-target #testimoni atau
    // #kontak; bila keduanya tidak ada, taruh di urutan paling akhir.
    const acuan = await db.menuItem.findFirst({
      where: { target: { in: ["#testimoni", "#kontak"] } },
      orderBy: { order: "asc" },
    });
    const maks = await db.menuItem.aggregate({ _max: { order: true } });
    const orderBaru = acuan ? acuan.order : (maks._max.order ?? 0) + 1;

    await db.$transaction(async (tx) => {
      if (acuan) {
        // Buka ruang satu nomor: semua menu dari posisi acuan bergeser +1
        await tx.menuItem.updateMany({
          where: { order: { gte: acuan.order } },
          data: { order: { increment: 1 } },
        });
      }
      await tx.menuItem.create({
        data: {
          label: "Galeri",
          target: "#galeri",
          icon: "images",
          visible: true,
          order: orderBaru,
        },
      });
    });
  } catch {
    // diam — daftar menu tetap ditampilkan walau bootstrap gagal
  }
}

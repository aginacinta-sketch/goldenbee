"use client";

/**
 * GallerySection — barisan foto galeri beranimasi untuk situs katalog
 * (Task 92). Foto berjalan perlahan tanpa putus (marquee CSS, kelas
 * .galeri-lintasan di globals.css); bila foto cukup banyak tampil dua
 * baris yang bergerak berlawanan arah. Klik foto membuka layar besar
 * (lightbox) dengan tombol sebelum/berikutnya.
 *
 * Sumber foto dikelola dari panel admin (tab Galeri). Tanpa foto aktif,
 * section ini tidak dirender sama sekali.
 */

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import type { GalleryItem } from "@/lib/types";

export function GallerySection({ items }: { items: GalleryItem[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const lanjut = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : (i + 1) % items.length));
  }, [items.length]);
  const sebelumnya = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : (i - 1 + items.length) % items.length));
  }, [items.length]);

  // Navigasi keyboard di lightbox: panah kiri/kanan pindah foto, Esc menutup
  // (Esc sudah ditangani Dialog Radix).
  useEffect(() => {
    if (lightboxIdx === null) return;
    const padaTombol = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") lanjut();
      else if (e.key === "ArrowLeft") sebelumnya();
    };
    window.addEventListener("keydown", padaTombol);
    return () => window.removeEventListener("keydown", padaTombol);
  }, [lightboxIdx, lanjut, sebelumnya]);

  if (items.length === 0) return null;

  const adaBarisKedua = items.length >= 4;
  // Kecepatan proporsional jumlah foto — makin banyak foto makin panjang durasi
  // agar laju per foto terasa tetap (dibatasi 24–96 detik per putaran).
  const durasi = Math.max(24, Math.min(96, items.length * 8));
  const gaya = { "--galeri-durasi": `${durasi}s` } as React.CSSProperties;
  const aktif = lightboxIdx !== null ? items[lightboxIdx] : null;

  return (
    <section id="galeri" className="scroll-mt-36 bg-slate-50 py-12" aria-label="Galeri foto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Galeri Kami</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Melihat lebih dekat produk, kegiatan, dan pengiriman kami
          </p>
        </div>
      </div>

      <div className="galeri-area mt-8 space-y-3 overflow-hidden" style={gaya}>
        <BarisanGaleri items={items} onBuka={setLightboxIdx} />
        {adaBarisKedua && (
          <BarisanGaleri items={[...items].reverse()} onBuka={setLightboxIdx} mundur />
        )}
      </div>

      {/* Lightbox foto besar + navigasi sebelum/berikutnya */}
      <Dialog open={lightboxIdx !== null} onOpenChange={(v) => !v && setLightboxIdx(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto nice-scroll border-none bg-transparent p-2 shadow-none sm:max-w-3xl [&>button]:bg-black/50 [&>button]:rounded-full [&>button]:p-1 [&>button]:text-white">
          <DialogTitle className="sr-only">
            Foto galeri {(lightboxIdx ?? 0) + 1} dari {items.length}
          </DialogTitle>
          {aktif && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={aktif.image}
                alt={aktif.caption || "Foto galeri"}
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
              />
              <div className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-lg">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={sebelumnya}
                  aria-label="Foto sebelumnya"
                  className="h-11 w-11 shrink-0"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0 text-center">
                  {aktif.caption ? (
                    <p className="truncate text-sm font-semibold text-slate-800">{aktif.caption}</p>
                  ) : (
                    <p className="text-xs text-slate-400">Tanpa keterangan</p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    {(lightboxIdx ?? 0) + 1} / {items.length}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={lanjut}
                  aria-label="Foto berikutnya"
                  className="h-11 w-11 shrink-0"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

/** Satu barisan marquee: konten digandakan (sisi kedua aria-hidden) agar
 *  loop -50% terasa tak berujung tanpa lompatan. */
function BarisanGaleri({
  items,
  onBuka,
  mundur = false,
}: {
  items: GalleryItem[];
  onBuka: (idx: number) => void;
  mundur?: boolean;
}) {
  return (
    <div
      className={`galeri-lintasan flex w-max ${mundur ? "galeri-lintasan-mundur" : ""}`}
    >
      {items.map((g, i) => (
        <FotoGaleri key={g.id} item={g} idx={i} onBuka={onBuka} />
      ))}
      {items.map((g, i) => (
        <FotoGaleri key={`${g.id}-ganda`} item={g} idx={i} onBuka={onBuka} ariaTersembunyi />
      ))}
    </div>
  );
}

function FotoGaleri({
  item,
  idx,
  onBuka,
  ariaTersembunyi = false,
}: {
  item: GalleryItem;
  idx: number;
  onBuka: (idx: number) => void;
  ariaTersembunyi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onBuka(idx)}
      aria-hidden={ariaTersembunyi || undefined}
      tabIndex={ariaTersembunyi ? -1 : undefined}
      aria-label={item.caption ? `Lihat foto: ${item.caption}` : "Lihat foto galeri"}
      className="group relative mr-3 block h-40 w-64 shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bp-accent)] focus-visible:ring-offset-2 sm:h-48 sm:w-80"
    >
      { }
      <img
        src={item.image}
        alt={item.caption || "Foto galeri"}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Selubung keterangan muncul saat kursor di atas foto */}
      {item.caption && (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2.5 pt-6 text-left text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="line-clamp-2">{item.caption}</span>
        </span>
      )}
      {/* Ikon kecil penanda bisa diklik */}
      {!ariaTersembunyi && (
        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-700 opacity-0 shadow transition-opacity duration-300 group-hover:opacity-100">
          <Images className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}

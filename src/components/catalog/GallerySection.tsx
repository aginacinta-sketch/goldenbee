"use client";

/**
 * GallerySection — barisan foto galeri beranimasi untuk situs katalog
 * (Task 92, diperkaya Task 94). Foto berjalan perlahan tanpa putus
 * (marquee CSS, kelas .galeri-lintasan di globals.css); bila foto cukup
 * banyak tampil dua baris yang bergerak berlawanan arah. Lapisan animasi
 * Task 94: reveal saat masuk viewport, ken-burns (foto "bernapes"),
 * kilau & angkatan kartu saat hover, serta zoom halus pada lightbox.
 * Klik foto membuka layar besar (lightbox) dengan tombol sebelum/berikutnya.
 *
 * Sumber foto dikelola dari panel admin (tab Galeri). Tanpa foto aktif,
 * section ini tidak dirender sama sekali.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import type { GalleryItem } from "@/lib/types";

export function GallerySection({ items }: { items: GalleryItem[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [tampak, setTampak] = useState(false);
  const akarRef = useRef<HTMLElement | null>(null);

  // Reveal saat section masuk viewport (Task 94): kelas .galeri-tampak
  // memicu transisi judul, garis aksen, dan barisan foto (stagger).
  // Dipicu sekali saja lalu observer dilepas.
  useEffect(() => {
    const el = akarRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // Browser sangat lama tanpa IntersectionObserver: tampilkan galeri
      // langsung (asinkron agar tidak memicu render berantai di effect).
      const t = window.setTimeout(() => setTampak(true), 0);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (ent) => {
        if (ent.some((e) => e.isIntersecting)) {
          setTampak(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
    <section
      id="galeri"
      ref={akarRef}
      className={`scroll-mt-36 bg-slate-50 py-12 ${tampak ? "galeri-tampak" : ""}`}
      aria-label="Galeri foto"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="galeri-judul text-center">
          <h2 className="text-2xl font-bold text-slate-900">Galeri Kami</h2>
          {/* Garis aksen membentang saat section tampil (animasi reveal) */}
          <span
            aria-hidden
            className="galeri-garis mx-auto mt-3 block h-1 w-16 rounded-full bg-[var(--bp-accent)]"
          />
          <p className="mt-1.5 text-sm text-slate-500">
            Melihat lebih dekat produk, kegiatan, dan pengiriman kami
          </p>
        </div>
      </div>

      <div className="galeri-area mt-8 space-y-3 overflow-hidden" style={gaya}>
        {/* Slide show otomatis (Task 95): foto besar bergantian dengan
            animasi geser; panah, titik navigasi, dan jeda saat hover. */}
        <div className="galeri-baris">
          <SlideshowGaleri items={items} onBuka={setLightboxIdx} />
        </div>
        <div className="galeri-baris">
          <BarisanGaleri items={items} onBuka={setLightboxIdx} />
        </div>
        {adaBarisKedua && (
          <div className="galeri-baris">
            <BarisanGaleri items={[...items].reverse()} onBuka={setLightboxIdx} mundur />
          </div>
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
                // key termasuk index agar animasi zoom diputar ulang
                // setiap pindah foto (Task 94).
                key={`${aktif.id}-${lightboxIdx}`}
                src={aktif.image}
                alt={aktif.caption || "Foto galeri"}
                className="galeri-zoom max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
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

/**
 * Slide show galeri (Task 95) — foto besar tampil bergantian otomatis
 * setiap 4,5 detik dengan animasi geser halus (track translateX).
 * Pengunjung bisa memaksa pindah lewat panah/titik; kursor di atas
 * slide menahan putaran. Klik slide membuka lightbox foto tersebut.
 * Tidak dirender bila foto kurang dari 2.
 */
function SlideshowGaleri({
  items,
  onBuka,
}: {
  items: GalleryItem[];
  onBuka: (idx: number) => void;
}) {
  const total = items.length;
  const [idx, setIdx] = useState(0);
  const [jeda, setJeda] = useState(false);

  const lanjut = useCallback(() => setIdx((i) => (i + 1) % total), [total]);
  const mundur = useCallback(
    () => setIdx((i) => (i - 1 + total) % total),
    [total],
  );
  const keIdx = useCallback(
    (i: number) => setIdx(((i % total) + total) % total),
    [total],
  );

  // Putaran otomatis; berhenti saat kursor di atas slide, saat foto
  // kurang dari 2, atau bila pengunjung memilih "kurangi gerak".
  useEffect(() => {
    if (jeda || total < 2) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const t = window.setInterval(lanjut, 4500);
    return () => window.clearInterval(t);
  }, [jeda, total, lanjut]);

  if (total < 2) return null;

  return (
    <div
      className="galeri-slide relative mx-auto max-w-5xl overflow-hidden rounded-2xl border bg-white shadow-lg"
      onMouseEnter={() => setJeda(true)}
      onMouseLeave={() => setJeda(false)}
      aria-roledescription="karosel"
      aria-label="Slide show galeri"
    >
      {/* Track slide: semua foto berjajar, digeser -idx × 100% dengan
          transisi CSS — inilah animasi geser antar foto. */}
      <div
        className="galeri-track flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {items.map((g, i) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onBuka(i)}
            aria-hidden={i !== idx || undefined}
            tabIndex={i === idx ? 0 : -1}
            aria-label={
              g.caption
                ? `Perbesar foto: ${g.caption}`
                : `Perbesar foto ${i + 1}`
            }
            className="relative block w-full shrink-0 focus-visible:outline-none"
          >
            <img
              src={g.image}
              alt={g.caption || "Foto galeri"}
              loading={i === 0 ? "eager" : "lazy"}
              className="h-60 w-full object-cover sm:h-80 md:h-[26rem]"
            />
            {/* Keterangan foto di atas gradasi gelap */}
            {g.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent p-4 pt-10 text-left text-sm font-medium text-white">
                <span className="line-clamp-1">{g.caption}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panah kiri/kanan — selalu terlihat agar bisa dipakai di layar sentuh */}
      <button
        type="button"
        onClick={mundur}
        aria-label="Slide sebelumnya"
        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-700 shadow-md backdrop-blur transition-all duration-300 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bp-accent)]"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={lanjut}
        aria-label="Slide berikutnya"
        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-700 shadow-md backdrop-blur transition-all duration-300 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bp-accent)]"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Batang bawah: keterangan, titik navigasi, dan hitungan slide */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="hidden min-w-0 flex-1 truncate text-xs font-medium text-slate-600 sm:block">
          {items[idx]?.caption || ""}
        </span>
        <div className="flex flex-1 items-center justify-center gap-1.5 sm:flex-none" role="tablist" aria-label="Pilih slide">
          {items.map((g, i) => (
            <button
              key={`titik-${g.id}`}
              type="button"
              role="tab"
              aria-selected={i === idx}
              aria-label={`Slide ${i + 1}`}
              onClick={() => keIdx(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === idx
                  ? "w-6 bg-[var(--bp-accent)]"
                  : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
        <span className="flex-1 text-right text-xs tabular-nums text-slate-400">
          {idx + 1} / {total}
        </span>
      </div>
    </div>
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
      className="group relative mr-3 block h-40 w-64 shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.04] hover:shadow-[0_20px_45px_-15px_rgba(132,189,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bp-accent)] focus-visible:ring-offset-2 sm:h-48 sm:w-80"
    >
      {/* Foto bernapas (ken-burns) + zoom ekstra saat kursor di atas kartu.
          Durasi & fase ken-burns bervariasi per foto agar tidak gerak serempak. */}
      <span className="absolute inset-0 block overflow-hidden transition-transform duration-500 group-hover:scale-[1.07]">
        <img
          src={item.image}
          alt={item.caption || "Foto galeri"}
          loading="lazy"
          className="galeri-kenburns h-full w-full object-cover"
          style={
            {
              "--kb-durasi": `${13 + (idx % 4) * 2.5}s`,
              animationDelay: `${-2.5 * (idx % 5)}s`,
            } as React.CSSProperties
          }
        />
      </span>
      {/* Kilau menyapu foto saat kursor di atas kartu (Task 94) */}
      <span aria-hidden className="galeri-kilau" />
      {/* Keterangan meluncur naik saat kursor di atas foto */}
      {item.caption && (
        <span className="absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2.5 pt-6 text-left text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
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

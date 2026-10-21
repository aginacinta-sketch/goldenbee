import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getPublicSettings } from "@/lib/admin";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata (judul tab browser, nama situs berbagi tautan) dihitung PER
// PERMINTAAN — bukan dibekukan saat build — sehingga selalu mengikuti nama
// brand/pemasok terbaru yang diisikan admin pada panel (Task 91).
export const dynamic = "force-dynamic";

const JUDUL_BAWAAN = "MitraDagang — Katalog Supplier B2B Indonesia";

export async function generateMetadata(): Promise<Metadata> {
  let nama = "";
  try {
    const s = await getPublicSettings();
    nama = (s.supplierName || "").trim();
  } catch {
    // Basis data belum tersedia (mis. saat build) — pakai judul bawaan.
  }
  return {
    title: nama || JUDUL_BAWAAN,
    description:
      "Katalog supplier B2B lengkap: temukan produk supplier terpercaya, cari produk, dan kirim permintaan kontak langsung ke pemasok.",
    keywords: ["katalog supplier", "B2B", "pemasok", "distributor", "grosir", "ekspor Indonesia"],
    authors: [{ name: nama || "MitraDagang" }],
    openGraph: {
      title: nama || "MitraDagang — Katalog Supplier B2B",
      description: "Temukan produk supplier terpercaya dan kirim permintaan kontak langsung.",
      siteName: nama || "MitraDagang",
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Anti-kedip hijau saat membuka panel admin: sebelum React hidup,
            tandai <html> dengan kelas boot-admin bila URL membawa hash #admin
            (bukan mode publik QR). CSS globals.css memakai kelas ini untuk
            menyembunyikan render awal katalog (spinner hijau "Memuat katalog…")
            dan menampilkan layar netral sampai keputusan view selesai — kelas
            dilepas oleh src/app/page.tsx begitu pemeriksaan sesi berakhir. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var h=location.hash||'';var qr=/[?&]via=qr/i.test(location.search||'');if(!qr&&h.lastIndexOf('#admin',0)===0){document.documentElement.classList.add('boot-admin');}}catch(e){}})();",
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

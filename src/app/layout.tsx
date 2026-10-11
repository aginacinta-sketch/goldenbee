import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MitraDagang — Katalog Supplier B2B Indonesia",
  description:
    "Katalog supplier B2B lengkap: temukan produk supplier terpercaya, cari produk, dan kirim permintaan kontak langsung ke pemasok.",
  keywords: ["katalog supplier", "B2B", "pemasok", "distributor", "grosir", "ekspor Indonesia"],
  authors: [{ name: "MitraDagang" }],
  openGraph: {
    title: "MitraDagang — Katalog Supplier B2B",
    description: "Temukan produk supplier terpercaya dan kirim permintaan kontak langsung.",
    siteName: "MitraDagang",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

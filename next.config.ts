import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output standalone: hasil publish = server produksi mandiri (.next/standalone)
  output: "standalone",
  // Prisma dibuat external agar query engine ikut ter-trace dengan benar
  // ke build standalone (hasil publish) — tanpa ini server produksi bisa
  // gagal memuat engine database.
  serverExternalPackages: ["pdfkit", "pdfkit-table", "exceljs", "@prisma/client", "prisma"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;

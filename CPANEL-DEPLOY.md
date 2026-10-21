# 🎛️ PANDUAN DEPLOY cPANEL — Website Katalog Supplier B2B

> Khusus untuk hosting **cPanel** dengan menu **"Setup Node.js App"**.
> Proyek: MitraDagang / GOLDEN BEE INDONESIA (Next.js 16 · SQLite · live chat · panel admin).
> Panduan induk: lihat `PANDUAN-HOSTING.md` untuk opsi hosting lain (VPS, Docker, PaaS).

---

## Daftar isi

1. [Ringkasan — kenapa bisa jalan di cPanel](#1-ringkasan--kenapa-bisa-jalan-di-cpanel)
2. [Prasyarat](#2-prasyarat)
3. [Langkah 1 — Unduh paket ZIP dari GitHub](#3-langkah-1--unduh-paket-zip-dari-github)
4. [Langkah 2 — Upload & ekstrak di File Manager](#4-langkah-2--upload--ekstrak-di-file-manager)
5. [Langkah 3 — Buat aplikasi Node.js](#5-langkah-3--buat-aplikasi-nodejs)
6. [Langkah 4 — Set variabel lingkungan & jalankan](#6-langkah-4--set-variabel-lingkungan--jalankan)
7. [Langkah 5 — Cek website online](#7-langkah-5--cek-website-online)
8. [Update aplikasi (deploy ulang)](#8-update-aplikasi-deploy-ulang)
9. [Perilaku fitur di cPanel (live chat, dsb.)](#9-perilaku-fitur-di-cpanel-live-chat-dsb)
10. [Backup database](#10-backup-database)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Ringkasan — kenapa bisa jalan di cPanel

Aplikasi ini adalah **satu aplikasi Node.js utuh** (bukan PHP, bukan HTML statis):

| Komponen | Di mana berjalan | Keterangan |
|---|---|---|
| Website katalog + panel admin | Proses Node.js (Next.js standalone) | Satu proses, satu port |
| API (produk, pesan, media, login) | Di dalam proses yang sama | `/api/*` |
| Live chat | Di dalam proses yang sama | Mode **HTTP polling** otomatis |
| Database | File SQLite `db/custom.db` | Tidak butuh MySQL |

- **Live chat tidak butuh layanan terpisah.** Komponen chat otomatis mendeteksi
  socket.io tidak tersedia lalu beralih ke jalur HTTP (`/api/chat/*`) yang hidup
  di dalam aplikasi — cocok untuk cPanel yang hanya mengizinkan satu port.
- **Database berupa file** → semua perubahan lewat panel admin tersimpan
  permanen di hosting (lebih baik daripada Vercel yang read-only).
- Paket ZIP hasil build **sudah berisi semuanya** (kode, aset, klien Prisma
  multi-OpenSSL, database) — tidak perlu `npm install` di cPanel.

---

## 2. Prasyarat

- ✅ cPanel dengan menu **Setup Node.js App** (Application Manager) — Anda sudah punya.
- ✅ Node.js tersedia **20, 22, 24** — pilih **Node 22** (paling stabil).
  ❌ Jangan pilih 18 atau 19 — Next.js 16 butuh Node ≥ 20.9.
- ✅ Node.js version **Production** (bukan Development).
- ✅ Ruang disk kosong minimal ± 500 MB (paket ± 150–250 MB + sisa ruang kerja).

---

## 3. Langkah 1 — Unduh paket ZIP dari GitHub

1. Buka **github.com/aginacinta-sketch/goldenbee** (login akun GitHub Anda).
2. Klik tab **Actions**.
3. Di daftar workflow sebelah kiri, pilih **"Bangun paket deploy cPanel"**.
4. Klik tombol **Run workflow** → **Run workflow** (atau pilih run terbaru yang sudah hijau ✅).
5. Klik run tersebut → gulir ke bawah ke bagian **Artifacts**.
6. Klik **goldenbee-cpanel** → terunduh `goldenbee-cpanel.zip` ke komputer Anda.

> Workflow ini juga berjalan **otomatis** setiap ada perubahan kode yang di-push
> ke GitHub, jadi paket selalu siap versi terbaru. Perubahan data (database)
> saja tidak memicu build — menghemat waktu.

---

## 4. Langkah 2 — Upload & ekstrak di File Manager

1. Login **cPanel** → buka **File Manager**.
2. Buat folder baru di home Anda, misal: `goldenbee-app`
   (catat jalur lengkapnya — biasanya `/home/USERNAME/goldenbee-app`).
3. Upload `goldenbee-cpanel.zip` ke dalam folder itu (tombol **Upload**).
4. Klik kanan ZIP → **Extract** → ekstrak **di dalam folder yang sama**
   sehingga isi folder langsung berupa `server.js`, `.next/`, `public/`, `db/`, `node_modules/`.
5. Hapus file ZIP-nya setelah ekstrak selesai (hemat ruang).

> ⚠️ Pastikan `server.js` berada **langsung di dalam** folder aplikasi —
> bukan di dalam subfolder hasil ekstrak ganda (mis. `goldenbee-app/goldenbee-cpanel/server.js` ❌).

---

## 5. Langkah 3 — Buat aplikasi Node.js

1. Di cPanel → cari menu **Setup Node.js App**.
2. Klik **Create Application** dan isi:

| Kolom | Nilai yang diisi |
|---|---|
| Node.js version | **22.x** |
| Application mode | **Production** |
| Application root | `goldenbee-app` (nama folder dari Langkah 2) |
| Application URL | pilih domain/subdomain Anda (mis. `namadomain.com`) |
| Application startup file | **`server.js`** ← penting, bawaan paket |

3. Klik **Create**.

---

## 6. Langkah 4 — Set variabel lingkungan & jalankan

Masih di halaman aplikasi Node.js yang baru dibuat:

1. Bagian **Environment variables**, tambahkan:

| Nama | Nilai | Keterangan |
|---|---|---|
| `DATABASE_URL` | `file:/home/USERNAME/goldenbee-app/db/custom.db` | Ganti `USERNAME` dengan username cPanel Anda. Menjamin database ditemukan di jalur yang pasti. |
| `NODE_ENV` | `production` | Mode produksi |

2. Klik **Save**.
3. ❌ **JANGAN klik "Run NPM Install"** — paket ZIP sudah berisi
   `node_modules` lengkap. Pada shared hosting, npm justru sering gagal
   (kehabisan memori/registry diblokir) dan bisa mengacak-acak paket yang
   sudah benar. Error "npm install error" jika tombol itu terlanjur ditekan
   dapat **diabaikan**; ekstrak ulang ZIP bila ingin memastikan bersih.
4. Klik **Restart** (tombol di kanan atas halaman aplikasi).

> 💡 Setiap kali menekan **Restart**, cPanel menjalankan `server.js` lewat
> Passenger. Tidak ada langkah terminal/SSH yang diperlukan.

---

## 7. Langkah 5 — Cek website online

1. Buka `https://namadomain.com` di browser.
2. Cek cepat:
   - Katalog tampil dengan produk Anda → database terbaca ✅
   - Klik **Admin** (pojok header) → login → Dashboard tampil ✅
   - Buka widget chat pojok bawah → kirim pesan → tidak error ✅
3. Jika halaman 503/error, lihat [Troubleshooting](#11-troubleshooting).

**SSL/HTTPS**: cPanel → **SSL/TLS Status** → **Run AutoSSL** untuk domain
Anda. Site yang di-handle Passenger otomatis menerima trafik HTTPS dari Apache.

---

## 8. Update aplikasi (deploy ulang)

Saat ada versi baru (atau Anda ingin mengganti data):

1. **(Disarankan) Backup dulu database** — lihat bagian 10.
2. Unduh `goldenbee-cpanel.zip` terbaru dari GitHub Actions.
3. Upload & **Extract** ke folder `goldenbee-app` — pilih **replace/overwrite**
   semua berkas yang ditanya.
4. **Hapus cache** aplikasi: di File Manager hapus folder
   `goldenbee-app/.next/cache` jika ada.
5. Kembali ke **Setup Node.js App** → **Restart**.

> ⚠️ Ekstrak menimpa `db/custom.db` dengan data dari repo. Kalau ada
> pesan/chat yang baru dibuat di hosting setelah backup terakhir, itu akan
> tertimpa — karena itu backup dulu (bagian 10) bila datanya penting.

---

## 9. Perilaku fitur di cPanel (live chat, dsb.)

| Fitur | Perilaku di cPanel |
|---|---|
| Live chat pengunjung ⇄ admin | ✅ Jalan — mode **polling** (pembaruan ± tiap 2 detik saat panel terbuka, badge notifikasi tiap 6 detik). Tanpa socket.io, tanpa port tambahan. |
| Riwayat chat & penghapusan percakapan | ✅ Tersimpan di SQLite, permanen. |
| Panel admin (produk, media, testimoni, pesan, pengaturan) | ✅ Penuh — data tersimpan permanen. |
| Upload media (gambar/video produk) | ✅ Disimpan sebagai base64 di database. Perhatikan batas `upload_max_filesize` cPanel bila ada. |
| Laporan Excel/PDF (exceljs, pdfkit) | ✅ Jalan (engine termasuk dalam paket). |
| QR mode publik | ✅ Jalan. |
| Fitur AI | Tidak ada di aplikasi — tidak berpengaruh. |

---

## 10. Backup database

Semua data Anda ada di **satu file**: `/home/USERNAME/goldenbee-app/db/custom.db`.

**Cara backup manual (praktis):**
1. File Manager → masuk folder `goldenbee-app/db`.
2. Klik kanan `custom.db` → **Download** → tersimpan di komputer Anda.
3. Simpan dengan nama bertanggal, mis. `custom-2026-02-14.db`.

**Cara restore:** upload kembali file `.db` ke folder yang sama (timpa), lalu **Restart** aplikasi Node.js.

> 💡 Situs sandbox Anda juga tetap menyinkronkan salinan database ke GitHub
> secara otomatis (fitur auto-sync) — salinan itu yang ikut dalam setiap paket build.

---

## 11. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| **503 / "Application not responding"** | Aplikasi gagal start (biasanya env salah) | Buka Setup Node.js App → lihat kolom **stderr/stdout log**. Pastikan `DATABASE_URL` tepat & `server.js` di root aplikasi → Restart. |
| **Halaman blank / "SQLite database does not exist"** | `DATABASE_URL` salah jalur, atau folder `db` tidak ikut terekstrak | Cek File Manager: `goldenbee-app/db/custom.db` harus ada. Perbaiki env → Restart. |
| **Error "Query engine binary ... could not be found"** | Engine Prisma tidak cocok OpenSSL hosting | Paket sudah membawa engine OpenSSL 1.1 & 3.0. Bila tetap muncul, hubungi saya untuk menambah `binaryTargets` sesuai OS hosting Anda. |
| **404 saat login admin / data tidak tersimpan** | Database read-only (permission) | File Manager → klik kanan `db/custom.db` → **Change Permissions** → 664 (atau 666), pemilik = user cPanel → Restart. |
| **Chat lambat / tidak realtime** | Normal di mode polling (bukan gangguan) | Pembaruan tiap ± 2 detik saat chat terbuka — ini perilaku desain di hosting tanpa socket.io. |
| **Gambar lama hilang setelah deploy ulang** | Ekstrak menimpa database dengan versi repo | Restore backup `custom.db` (bagian 10) → Restart. |
| **Update tidak berubah** | Cache .next atau Passenger belum restart | Hapus `goldenbee-app/.next/cache` → **Restart** → tunggu ± 30 detik. |
| **"npm install error" saat Run NPM Install** | Tombol ini memang TIDAK dibutuhkan (paket sudah berisi node_modules); shared hosting biasanya kehabisan memori saat npm berjalan | Abaikan. Ekstrak ulang ZIP (overwrite) untuk memulihkan node_modules bila terlanjur terganggu → langsung **Restart**. |
| **Port conflict / EADDRINUSE** | Aplikasi lama belum mati | Setup Node.js App → **Stop** → **Restart**. |

---

## Ringkasan alur (sekali baca cepat)

```
GitHub Actions (build otomatis)
        │  goldenbee-cpanel.zip
        ▼
Upload di File Manager cPanel → Extract ke ~/goldenbee-app
        ▼
Setup Node.js App: Node 22 · Production · startup file server.js
        ▼
Env: DATABASE_URL=file:/home/USER/goldenbee-app/db/custom.db
        ▼
Restart → https://namadomain.com ONLINE 🐝
```

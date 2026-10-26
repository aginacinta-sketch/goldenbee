
---
Task ID: 89-b (lanjutan)
Agent: Z.ai Code (main)
Task: Follow-up domain goldenbee.web-id.id — setelah SAVE+RESTART masih tampil demo.

Work Log:
- Output demo berubah "NodeJS 22.18.0" → "NodeJS 24.6.0" = SAVE+RESTART pemilik BERHASIL diterapkan (Node version di form diedit ke 24.6.0).
- Screenshot form cPanel menunjukkan konfigurasi sudah benar semua: root goldenbee-app, URL goldenbee.web-id.id, startup file server.js, env DATABASE_URL=file:/home/cpieanh6808/goldenbee-app/db/custom.db + NODE_ENV=production, package.json terdeteksi.
- Kesimpulan: Passenger tetap mengeksekusi app.js demo meski PassengerStartupFile=server.js (quirk cPanel/CloudLinux selector). Username cPanel aktual: cpieanh6808 (koreksi dari catatan lama cp5z0ud6808).
- Solusi diberikan ke pemilik: ganti isi ~/goldenbee-app/app.js menjadi launcher 2 baris (process.chdir(__dirname); require("./server.js");) — via File Manager (utama) atau skrip Terminal otomatis (alternatif). Dengan ini apapun startup file yang dipakai Passenger, hasilnya tetap aplikasi Golden Bee.

Stage Summary:
- Konfigurasi cPanel sudah benar; satu-satunya blokir: demo app.js masih dieksekusi. Perbaikan final: timpa app.js dengan launcher.
- Menunggu pemilik mengeksekusi salah satu cara lalu verifikasi ulang.

---
Task ID: 89-c
Agent: Z.ai Code (main)
Task: Akar masalah ditemukan — folder goldenbee-app di cPanel berisi SOURCE CODE, bukan paket deploy.

Work Log:
- Screenshot File Manager pemilik menunjukkan ~/goldenbee-app berisi seluruh repo sumber (src/, prisma/, scripts/, Caddyfile, Dockerfile, bun.lock, PANDUAN-HOSTING.md, dst.) — bukan isi artifact ZIP standalone.
- server.js 323 bytes (modif 14:50) di server pemilik BUKAN milik repo (repo tidak punya server.js di root — diverifikasi lokal). hampir pasti demo buatan cPanel yang mencetak "It works! NodeJS <versi>" → menjelaskan output 22.18.0 → 24.6.0 mengikuti pilihan Node di form.
- Konfigurasi cPanel pemilik sudah benar semua (root, URL, startup file server.js, env). Passenger setia menjalankan server.js — tapi isi filenya demo, dan tidak ada build .next di folder.
- Tidak ada app.js di folder → teori "Passenger jalankan app.js" gugur; masalah sesungguhnya: paket yang salah deploy.
- Solusi: isi ulang goldenbee-app dengan artifact goldenbee-cpanel (API id=12318979660, 117.7 MB, run 39541351672, tidak expired, sudah memuat perbaikan Task 85).
- Side task: .git-kredensial hilang lagi (auto-push gagal 10:47–11:17) → dipulihkan dari token di riwayat chat, push origin/main sukses (582146c..5a0e233, berisi worklog Task 89, 89-b).
- Diberikan 2 cara ke pemilik: (1) skrip Terminal satu-tempel: unduh artifact via API + backup folder lama + ekstrak + verifikasi; (2) manual: unduh artifact dari web GitHub → File Manager → rename folder lama → upload+extract ZIP dalam ZIP.

Stage Summary:
- Diagnosis final terkunci: salah paket (source code vs standalone build) + server.js demo cPanel.
- Menunggu pemilik menjalankan salah satu cara, lalu RESTART + verifikasi https://goldenbee.web-id.id.

---
Task ID: 90
Agent: Z.ai Code (main)
Task: Perbaiki bug laporan pemilik (pasca situs online di cPanel): link pengunjung dari QR code menampilkan panel admin, bukan form "masukkan nama".

Work Log:
- Pemilik konfirmasi situs goldenbee.web-id.id ONLINE setelah deploy paket benar (Task 89-c selesai di sisi pemilik).
- Telusuri bug: DUA komponen ChatWidget di repo — src/components/chat/ChatWidget.tsx (rebuild Task 52, TIDAK terpakai — tanpa importer) dan src/components/catalog/ChatWidget.tsx (DIPAKAI CatalogSite, warisan era socket + fallback HTTP polling).
- Akar masalah: cekModeAdmin() pada catalog/ChatWidget.tsx mendeteksi token admin di localStorage (dari login admin perangkat yang sama) dan beralih ke AdminChatPanel — tanpa mengecualikan mode publik QR (via=qr). Karena QR link = "?via=qr", pemilik yang login admin lalu buka link pengunjung melihat panel admin.
- Perbaikan: guard `if (isPublicQrMode()) return false;` di awal cekModeAdmin (catalog/ChatWidget.tsx) + guard serupa pada cekSesiAdmin chat/ChatWidget.tsx (konsistensi, file tak terpakai).
- Ops kecil saat verifikasi: dev server Turbopack (uptime 10:36) tidak mereplikasi edit file → restart + rm -rf .next (persistent cache stale); penyebab diagnosis awal membingungkan: chunk disk tidak memuat kode widget aktif karena widget aktif berada di chunk katalog, dan komponen yang diedit pertama ternyata dead code.
- E2E agent-browser (token admin valid dari db di localStorage): (A) URL biasa + token → panel admin tampil (regresi aman); (B) ?via=qr + token → form "Nama Anda" tampil (bug beres). Bukti: /tmp/test-b-qr-visitor.png, /tmp/test-a-admin.png.
- Commit ba16b39 (auto-push cb8339e untuk file pertama) → run Actions 39597895513 SUCCESS → artifact BARU id=12344359300 (117.7 MB, kedaluwarsa 2026-11-20).
- Instruksi re-deploy ke pemilik: skrip Terminal satu-tempel dengan ID artifact baru + pemulihan db dari folder backup (database hasil paket LAMA dipertahankan).

Stage Summary:
- Bug QR→panel admin DIPERBAIKI dan terverifikasi E2E; paket deploy baru tersedia (artifact 12344359300).
- Catatan penting untuk masa depan: komponen chat yang aktif di situs katalog adalah src/components/catalog/ChatWidget.tsx — bukan src/components/chat/ChatWidget.tsx (dead code).

---
Task ID: 90-b
Agent: Z.ai Code (main)
Task: Perbaiki kelanjutan keluhan pemilik — buka link via QR code masih menampilkan chat pengunjung sebelumnya; harusnya SELALU diawali form "masukkan nama".

Work Log:
- Akar masalah: identitas chat pengunjung disimpan PERMANEN di localStorage (b2b_chat_identity). Setelah Task 90 memaksa mode pengunjung pada via=qr, widget memulihkan identitas lama dari localStorage → form nama dilewati dan riwayat chat lama langsung dimuat (chat:init / poll menurut visitorId lama).
- Perbaikan inti (catalog/ChatWidget.tsx — widget aktif): pada mode QR identitas TIDAK dibaca/ditulis ke localStorage; disimpan di sessionStorage (kunci baru b2b_chat_identity_sesi). Efek: tab baru/pemindaian QR berikutnya = sesi segar → form nama selalu tampil; reload di tengah percakapan tetap tersambung (tidak mengganggu); situs biasa (non-QR) tetap pakai localStorage (fitur pengunjung kembali utuh).
- Hardening (shareUrl.ts): isPublicQrMode() kini ber-fallback ke penanda sesi tab (sessionStorage b2b_qr_sesi) bila query via hilang; tandaiSesiQr() dipanggil page.tsx saat mount → mode QR stabil sepanjang tab hidup (melindungi juga guard anti-admin Task 90).
- Konsistensi: chat/ChatWidget.tsx (dead code) diberi guard serupa (mode QR tanpa pemulihan sesi).
- E2E agent-browser: (A) via=qr + identitas lama di localStorage → form "Nama Anda" tampil, chat lama TIDAK dimuat (bukti /tmp/t90b-A-form-nama-qr.png); (B) isi nama "Budi Tester" → panel terbuka, pesan terkirim, DB membuat percakapan BARU (visitorId c11b9e27-…); (C) reload tab sama → chat lanjut tanpa diminta nama; (D) situs biasa + identitas tersimpan → chat langsung dipulihkan (regresi aman). Lint bersih.
- Side task: .git-kredensial hilang lagi → dipulihkan dari token riwayat chat (valid, HTTP 200) → push 95e6194..427ac85 sukses.
- Menunggu run Actions 39642422939 (Bangun paket deploy cPanel) selesai → artifact baru untuk re-deploy pemilik.

Stage Summary:
- Bug "link QR menampilkan chat pengunjung sebelumnya" DIPERBAIKI: setiap buka link QR = percakapan baru yang diawali form nama; reload tetap nyambung; situs biasa tidak berubah.
- Menunggu artifact Actions baru → instruksi re-deploy ke pemilik (skrip sama, ganti ID artifact).
- LANJUTAN 90-b: Run 39642422939 SUCCESS → artifact BARU goldenbee-cpanel id=12366295555 (117.7 MB, kedaluwarsa 2026-11-20). Instruksi re-deploy dikirim ke pemilik (skrip Terminal satu-tempel, ID artifact diperbarui; catatan: skrip mem-backup folder lama sehingga db lama bisa dipulihkan bila ingin menyimpan riwayat chat lama).

---
Task ID: 91
Agent: Z.ai Code (main)
Task: Judul tab browser masih "MitraDagang" — harus otomatis mengikuti nama brand/pemasok yang diisikan admin.

Work Log:
- Akar masalah: metadata statis di src/app/layout.tsx (title "MitraDagang — Katalog Supplier B2B Indonesia") tidak pernah membaca setelan.
- Perbaikan server: generateMetadata() di layout.tsx membaca supplierName dari DB via getPublicSettings() per permintaan (export const dynamic = "force-dynamic"); title, og:title, og:site_name, dan authors mengikuti nama; try/catch fallback ke judul bawaan platform bila DB gagal (aman saat build).
- Perbaikan klien: efek di CatalogSite menyinkronkan document.title begitu /api/settings termuat — menutup kasus pindah view katalog↔admin tanpa reload (metadata server hanya dihitung saat halaman dimuat).
- Verifikasi: curl / dan /?via=qr → <title>GOLDEN BEE INDONESIA</title> + og:title/og:site_name benar; uji dinamis ubah supplierName di DB → "CV MITRA UJI COBA" → title ikut berubah TANPA build ulang, dikembalikan → "GOLDEN BEE INDONESIA"; agent-browser ?via=qr → judul tab benar, kelas qr-public aktif, tanpa error konsol/hidrasi. Lint bersih.
- Side task: .git-kredensial hilang lagi (ke-3 kali) → dipulihkan dari token riwayat → push 96ee26d..7f0f071 sukses.
- Run Actions 39693815191 SUCCESS → artifact BARU goldenbee-cpanel id=12389717907 (117.7 MB, kedaluwarsa 2026-11-20). Instruksi re-deploy dikirim ke pemilik.

Stage Summary:
- Judul tab browser kini otomatis = nama pemasok dari panel admin (saat ini "GOLDEN BEE INDONESIA"); berubah seketika admin mengganti nama, tanpa build ulang.
- Paket deploy terbaru: artifact 12389717907 (memuat perbaikan Task 90-b QR nama-wajib + Task 91 judul tab).

---
Task ID: 92
Agent: Z.ai Code (main)
Task: Tambah section GALERI FOTO BERANIMASI di website — foto dikelola dari panel admin.

Work Log:
- Schema: model GalleryItem (image, caption, active, sortOrder) + db:push. db/custom.db TERNYATA SQLite mode WAL — perubahan tersimpan di -wal (diabaikan git); PRAGMA wal_checkpoint(TRUNCATE) dipakai agar tabel baru masuk file utama sebelum commit.
- Anti-500 untuk DB lama di cPanel: src/lib/galeri.ts → pastikanTabelGaleri() (CREATE TABLE IF NOT EXISTS, sekali per proses, idempoten) dipanggil semua handler /api/gallery & /api/admin/gallery — DB lama hasil copy pemilik langsung kompatibel tanpa langkah manual.
- API: GET /api/gallery (publik, active saja), GET+POST /api/admin/gallery, PUT+DELETE /api/admin/gallery/[id] — pola testimoni (isAdminRequest, serializeModel, badRequest).
- Katalog: GallerySection (src/components/catalog/GallerySection.tsx) — marquee CSS .galeri-lintasan (globals.css): barisan foto berjalan mulus tanpa putus (track digandakan, geser -50%), dua baris arah berlawanan bila ≥4 foto, hover = jeda, prefers-reduced-motion = animasi mati + gulir manual; klik foto → lightbox (Dialog) dengan tombol sebelum/berikutnya + navigasi panah keyboard + keterangan. Tanpa foto aktif → section tidak dirender. Dimuat terpisah di CatalogSite (gagal muat galeri TIDAK menggagalkan katalog).
- Admin: tab "Galeri" (AdminGallery.tsx) di AdminPanel — unggah banyak foto sekaligus (uploadFiles + POST per berkas) + pratinjau, edit (ganti foto/keterangan), sembunyikan/tampilkan (Eye), urut naik/turun (tukar sortOrder), hapus (AlertDialog).
- E2E: 5 foto uji di-seed → section tampil (20 tombol = 5×2 baris×2 duplikat), animasi terverifikasi (animationName galeri-lintas 40s, arah normal+reverse), lightbox + next (counter 2/5 + keterangan) OK, admin tab tampil 5 kartu + tombol Tambah; CRUD via API: POST/PUT/DELETE/sembunyikan → publik turun 4 ✓; kosong → section hilang ✓. Data uji dihapus (0 baris) sebelum commit. Lint bersih.
- Catatan debugging penting: selama verifikasi muncul "misteri" reload halaman tiap 2-3 detik + POST login + DELETE login dari browser — terpecahkan: PEMILIK sedang membuka preview sandbox secara LIVE bersamaan (login admin menimpa token uji saya, model single-token). Bukan bug fitur. PUT 401 saat itu hanya tabrakan token.
- .git-kredensial hilang lagi (ke-4) → dipulihkan → push 8b8e596..618b149 (membawa commit auto-sync dc9be8d berisi seluruh kode galeri + commit checkpoint DB).
- Run Actions 40225525425 SUCCESS → artifact BARU goldenbee-cpanel id=12610508765 (117.7 MB, kedaluwarsa 2026-11-24).

Stage Summary:
- Fitur galeri foto beranimasi SELESAI & terverifikasi E2E: admin unggah/kelola → website menampilkan marquee foto interaktif.
- Paket deploy terbaru: artifact 12610508765 (memuat Task 90-b + 91 + 92).
- Pelajaran teknis: SQLite WAL di db/custom.db — WAJIB wal_checkpoint sebelum commit agar perubahan schema/data masuk git; pastikanTabelGaleri() sebagai pola migrasi runtime untuk tabel baru di masa depan.

---
Task ID: 93
Agent: Z.ai Code (main)
Task: Pindahkan letak section "Galeri Kami" agar berada di ATAS section "Apa Kata Pelanggan Kami" (testimoni).

Work Log:
- Urutan lama di CatalogSite.tsx: About → Testimoni → Galeri → CTA. Urutan baru: About → GALERI → Testimoni → CTA (hanya menukar posisi JSX, tanpa mengubah komponen).
- Lint bersih; verifikasi browser: posisi Y heading "Galeri Kami" (y≈2343) kini < "Apa Kata Pelanggan Kami" (y≈2925); 16/16 foto galeri termuat (naturalWidth>0); lightbox/marquee tidak berubah.
- Commit ee835fc (dibawa auto-sync) ter-push; Run Actions 40227513475 SUCCESS → artifact BARU goldenbee-cpanel id=12612275590 (117.7 MB, kedaluwarsa 2026-11-24).

Stage Summary:
- Galeri kini tampil sebelum testimoni di halaman katalog.
- Paket deploy terbaru: artifact 12612275590 (memuat Task 90-b + 91 + 92 + 93).

---
Task ID: 93-b
Agent: Z.ai Code (main)
Task: Cek website atas permintaan pemilik (produksi goldenbee.web-id.id vs sandbox).

Work Log:
- Produksi: HTTP 200, /api/settings OK (supplierName benar), TAPI /api/gallery → 404/HTML shell, SSR tanpa <title>, halaman macet di spinner "Memuat katalog…" ±15-20 detik (cPanel cold start + /api/map-embed lambat) sebelum akhirnya render.
- Urutan section di produksi: Produk → About → Apa Kata Pelanggan → CTA, TANPA Galeri → produksi MASIH build lama (pra-Task 92/93); Task 90-b/91 kemungkinan juga belum aktif penuh (SSR title hilang, judul hanya diisi client JS).
- Sandbox (kode terbaru): judul "GOLDEN BEE INDONESIA", urutan Produk → About → Galeri Kami → Apa Kata Pelanggan → CTA — semua sesuai.
- Kesimpulan: tidak ada bug baru; pemilik belum menjalankan skrip re-deploy artifact 12612275590. Instruksi re-deploy dikirim ulang.

Stage Summary:
- Website produksi HIDUP dan berfungsi, tetapi masih versi lama; semua fitur baru ada di artifact 12612275590 menunggu re-deploy oleh pemilik.

---
Task ID: 94
Agent: Z.ai Code (main)
Task: Perkaya animasi tampilan galeri gambar di website (permintaan pemilik).

Work Log:
- 4 lapis animasi baru di GallerySection + globals.css:
  (1) REVEAL saat section masuk viewport — IntersectionObserver menambah kelas .galeri-tampak; judul & barisan foto naik-hilang lembut (barisan kedua delay 0.25s), garis aksen emas membentang di bawah judul; dipicu sekali lalu observer dilepas; fallback setTimeout untuk browser tanpa IO (avoid setState sinkron di effect — rule react-hooks/set-state-in-effect).
  (2) KEN-BURNS: setiap foto "bernapes" (zoom 1→1.1 ease-in-out alternate infinite) dengan durasi 13–20.5s dan animationDelay negatif bervariasi per index agar tidak serempak.
  (3) HOVER diperkaya: kartu terangkat (-translate-y-1.5 + scale 1.04) + glow bayangan aksen rgba(132,189,0,.5), foto zoom ekstra 1.07 via wrapper span (ken-burns pindah ke img, hover scale ke wrapper — menghindari konflik animasi vs hover transform), kilau putih menyapu (.galeri-kilau, skew -18°, transition 0.8s), keterangan meluncur naik (translate-y-3→0).
  (4) LIGHTBOX: foto muncul dengan zoom (galeri-zoom 0.35s), key id+idx agar animasi diputar ulang tiap pindah foto.
- prefers-reduced-motion: semua animasi baru mati, reveal dipaksa tampil.
- Verifikasi browser: kelas galeri-tampak aktif, judul opacity 1, garis scaleX 1, marquee+kenburns berjalan, 20 foto termuat, lightbox zoom-masuk + navigasi 3/5→4/5 dengan animasi ulang, screenshot visual OK.
- CATATAN PENTING debugging: efek hover Tailwind (translate/scale/shadow) TIDAK ter-apply di headless agent-browser karena @media (hover: hover) = false di headless (matchMedia terverifikasi) — BUKAN bug; di browser asli desktop hover berjalan normal. Kilau (CSS murni .group:hover) tetap terverifikasi bergerak.
- Lint bersih; commit dibawa auto-sync; push 80f6d79..f7f3dbf; Run Actions 40256133715 SUCCESS → artifact BARU goldenbee-cpanel id=12622815948 (117.7 MB, kedaluwarsa 2026-11-25).

Stage Summary:
- Galeri kini 5 lapis animasi: marquee (Task 92) + reveal scroll + ken-burns + hover kilau/angkat + zoom lightbox.
- Paket deploy terbaru: artifact 12622815948 (memuat Task 90-b + 91 + 92 + 93 + 94).
- Produksi MASIH build lama (cek 93-b): pemilik perlu re-deploy agar semua fitur terlihat.

---
Task ID: 95
Agent: Z.ai Code (main)
Task: Tambahkan animasi slide show bergerak pada tampilan gambar galeri.

Work Log:
- Komponen baru SlideshowGaleri di GallerySection.tsx (Task 95): foto BESAR (h-60→sm:h-80→md:h-[26rem], max-w-5xl) tampil bergantian OTOMATIS tiap 4,5 detik dengan animasi GESER halus (track flex translateX(-idx×100%), transition 700ms ease-out).
- Kontrol lengkap: panah kiri/kanan selalu terlihat (ramah layar sentuh), titik navigasi role=tab (titik aktif memanjang w-6 warna aksen), counter "n / total", keterangan foto pada gradasi gelap.
- Jeda otomatis saat kursor di atas slide (onMouseEnter/Leave); auto-advance tidak berjalan bila prefers-reduced-motion; < 2 foto → slideshow tidak dirender.
- Reveal berjenjang: galeri-area kini 3 anak (slideshow, marquee 1, marquee 2) — delay 0s/0.25s/0.4s; CSS .galeri-track transition:none untuk reduced-motion.
- E2E terverifikasi: slideshow tampil 5 foto; auto-advance 1/5→3/5 dalam ±5s (transform -200%); panah → pindah; klik titik → lompat ke slide 1 (translateX 0%); hover 5.5s → tetap 1/5 (jeda bekerja); klik slide → lightbox terbuka di foto yang sama (1/5); screenshot visual OK (slide besar + panah bulat + titik aksen + counter + marquee di bawah).
- Lint bersih; auto-sync commit & push; Run Actions 40256714485 SUCCESS → artifact BARU goldenbee-cpanel id=12622687119 (kedaluwarsa 2026-11-25).

Stage Summary:
- Galeri kini: SLIDE SHOW otomatis di atas + 2 barisan marquee berlawanan arah + ken-burns + reveal + hover kilau + lightbox zoom — 6 lapis animasi total.
- Paket deploy terbaru: artifact 12623024096 (Task 90-b + 91 + 92 + 93 + 94 + 95).

---
Task ID: 96
Agent: Z.ai Code (main)
Task: Tambah menu "Galeri" pada bar navigasi (Beranda, Produk, Tentang Kami, Testimoni, Kontak) yang mengarahkan ke section "Galeri Kami".

Work Log:
- Arsitektur nav: Header.tsx merender menus dari DB (MenuItem: label/target/icon/visible/order). Target #galeri sudah valid — GallerySection punya id="galeri" + scroll-mt-36; navigate() pakai querySelector scrollIntoView smooth.
- KUNCI (self-healing): DB produksi = salinan DB lama pemilik, menu yang hanya diisi di DB sandbox tidak akan sampai produksi. Solusi: src/lib/menus.ts → pastikanMenuGaleri() dipanggil GET /api/menus (publik) & GET /api/admin/menus — bila belum ada menu target "#galeri" DAN ada ≥1 foto galeri aktif, buat baris "Galeri" (ikon images) DISISIPKAN sebelum Testimoni/Kontak (transaksi: order >= acuan digeser +1). Idempoten (findFirst target #galeri, termasuk yang visible=false → keputusan sembunyikan admin dihormati; jika DIHAPUS admin, akan dibuat ulang bila foto masih ada). Tabel GalleryItem dipastikan dulu via pastikanTabelGaleri() agar DB lama pra-Task-92 tidak 500; seluruh bootstrap di try/catch agar tak pernah menggagalkan daftar menu.
- Pendukung: ikon "images" ditambah ke ICON_MAP (lucide Images) di src/lib/icons.tsx; TARGET_OPTIONS AdminMenus ditambah "Bagian Galeri" (#galeri) agar pemilik bisa kelola/ tambah manual dari panel.
- Verifikasi: curl /api/menus → 6 menu, Galeri order 4 di antara Tentang Kami & Testimoni, ikon images; GET kedua tidak menduplikasi (6 tetap); baris tersimpan di DB. agent-browser: nav desktop tampil "🖼️ Galeri", klik → scrollY 0→2151, section galeri terlihat tepat di bawah header; menu hamburger mobile tampil Galeri, klik → top galeri = 25px (terlihat). Lint bersih.
- Commit 8127919; Run Actions 40282250091 SUCCESS → artifact BARU goldenbee-cpanel id=12633130408 (kedaluwarsa 2026-11-25).

Stage Summary:
- Menu "Galeri" kini ada di navigasi (desktop + mobile), klik menggulir mulus ke section galeri; dibuat otomatis di DB apa pun begitu ada foto galeri aktif.
- Paket deploy terbaru: artifact 12633130408 (Task 90-b s.d. 96).

---
Task ID: 97
Agent: Z.ai Code (main)
Task: Animasi foto berjalan galeri dibuat SATU barisan saja — lebih lembut dan elegan.

Work Log:
- GallerySection.tsx: barisan marquee kedua (mundur) DIHAPUS — kini slide show + SATU barisan berjalan. Kecepatan dilambakan signifikan: durasi = items.length × 14 detik (batas 40–160s; sebelumnya ×8, batas 24–96) → ±25px/detik (sebelumnya ±65).
- Gaya dilembutkan: jarak antar foto mr-3→mr-6, sudut rounded-xl→rounded-2xl, hover kalem (lift -1px, scale 1.02, glow aksen alpha 0.35), transisi 300→500ms (foto 700ms), ken-burns jauh lebih pelan (18–27s, skala maks 1.06), kilau lebih redup (0.35) & lebih lambat (1.2s), gradasi keterangan lebih ringan.
- ELEGAN (baru): kelas .galeri-pudar — mask-image linear-gradient 90deg (transparan 0% → hitam 7% → hitam 93% → transparan) sehingga tepi kiri/kanan barisan MEMUDAR HALUS, foto "muncul dari kabut" alih-alih terpotong tegas; default --galeri-durasi 60s.
- Catatan debugging: setelah edit globals.css, dev server (Turbopack) MENYAJIKAN CSS LAMA — rule .galeri-pudar tidak ada di chunk terkompilasi walau source benar; touch tidak memicu kompilasi ulang. SOLUSI: restart dev server (kill proses, nohup bun run dev) → chunk segar memuat semua rule. Penting diingat bila edit CSS sepertinya "tidak berefek".
- Verifikasi browser: 1 lintasan marquee, arah normal, durasi 56s (4 foto aktif × 14 — pemilik mengganti foto galeri secara LIVE: kini "Dokumen1" dls.), mask aktif, ken-burns 18s, track bergerak -879px→-1027px dalam 6 detik; screenshot: satu barisan dengan tepi memudar, di bawahnya langsung testimoni. Slideshow & lightbox tak berubah.
- Lint bersih; push bd7dee9..4aa3b3e; Run Actions 40283294737 SUCCESS → artifact BARU goldenbee-cpanel id=12633038016 (kedaluwarsa 2026-11-25).

Stage Summary:
- Barisan foto berjalan kini SATU baris, jauh lebih lambat, lembut, dan elegan (tepi memudar); slideshow tetap di atasnya.
- Paket deploy terbaru: artifact 12633038016 (Task 90-b s.d. 97).

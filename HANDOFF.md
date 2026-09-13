# Serah-terima — aset & motion

Disusun 13 September 2026, saat commit `a4d2d93`.
Untuk siapa pun yang melanjutkan bagian **aset** (logo, gambar, ilustrasi 3D)
dan **motion**.

Angka di dokumen ini dihitung dari repo, bukan dari ingatan. Kalau sudah lewat
beberapa minggu, jalankan ulang perintah yang disebut di tiap bagian untuk
memeriksanya.

---

## 1. Repo & deploy

- **Repo:** <https://github.com/ekiIman123/iysa-web> — **privat**, branch produksi `main`
- **Lokal:** `/Users/kimen/Documents/iysa-web/site` (repo git ada di `site/`, bukan di `iysa-web/`)

```bash
cd /Users/kimen/Documents/iysa-web/site
npm install
npm run dev      # http://localhost:3000 → dialihkan ke /id
npm run build    # prebuild menjalankan uji kontras dulu; gagal kontras = gagal build
npm start
npm run lint     # eslint 9 — saat ini 0 error 0 warning
npx tsc --noEmit # saat ini bersih
npm test         # BELUM ADA — tidak ada test runner sama sekali
```

- **Deploy: BELUM ADA.** Repo belum tersambung ke Vercel. Tidak ada CI, tidak ada
  GitHub Action, tidak ada pemicu apa pun. Push ke `main` sekarang tidak
  menerbitkan apa-apa.
- **Domain produksi `iysa.or.id` masih menyajikan situs LAMA** dari
  `iysaofficial/Iysa`. Yang ada di repo ini belum pernah online.
- Untuk menyambungkan (perlu login akun Vercel):
  <https://vercel.com/new/import?s=https://github.com/ekiIman123/iysa-web> —
  set `NEXT_PUBLIC_SITE_URL=https://iysa.or.id`.

---

## 2. Tumpukan

| | Versi terpasang |
|---|---|
| next | **16.3.5** (App Router, Turbopack) |
| react / react-dom | **19.2.8** |
| next-intl | **4.14.4** |
| tailwindcss | **4.3.3** (`@tailwindcss/postcss`) |
| typescript | **5.9.3** |
| sharp | **0.35.4** — devDependency, hanya untuk skrip migrasi, tidak masuk bundel |

**Token warna & tipografi ada di satu berkas:** `src/app/globals.css`

- `@theme { }` → skala tipografi (`--text-hero`, `--text-display`, `--text-title`,
  `--text-lead`), `--font-sans`, `--font-mono`, `--container-shell`
- `:root { }` → palet terang; blok `[data-theme="dark"]` dan
  `@media (prefers-color-scheme: dark)` → palet gelap
- Font dimuat lewat `next/font/google` di `src/app/[locale]/layout.tsx`:
  **Plus Jakarta Sans** (400–800) + **JetBrains Mono** (400, 500)

**Library animasi: tidak ada, dan sengaja.** Tidak ada framer-motion, motion,
gsap, lottie, react-spring, rive. Semua gerakan CSS murni, tokennya di
`globals.css` (`--gerak-cepat/-sedang/-naik`, `--lengkung`).

**3D: `three` 0.186.0**, dipakai satu tempat saja — `src/components/hero-atom.tsx`,
lambang IYSA sebagai objek tiga dimensi di hero beranda. Dimuat lewat
`await import("three")` di dalam `useEffect`, jadi ia masuk chunk terpisah
720 KB yang **tidak dirujuk sama sekali** oleh HTML beranda: muat awal situs
tidak bertambah, dan halaman selain beranda tidak pernah mengunduhnya.
Diverifikasi dengan mencari nama chunk itu di `.next/server/app/id.html` — nol
kemunculan. Kalau three dipakai di tempat kedua, ulangi pemeriksaan itu.

---

## 3. Struktur

```
/Users/kimen/Documents/iysa-web/
├── .old/                    sparse checkout repo lama (BUKAN bagian repo ini,
│                            tidak di-commit; skrip migrasi membacanya)
└── site/                    ← repo git
    ├── public/
    │   ├── media/           semua aset gambar (14 MB)
        ├── scripts/             3 skrip migrasi + uji kontras + pembangun ikon
    └── src/
        ├── app/
        │   ├── [locale]/    semua halaman
        │   ├── api/         contact, subscribe
        │   └── og/          perakit Open Graph image
        ├── components/      SEMUA komponen bersama (datar, tanpa subfolder)
        ├── content/         teks & data
        │   └── generated/   hasil skrip — JANGAN sunting tangan
        ├── i18n/            routing, request, navigation
        └── lib/             api, assets, data, mail, nav, ratelimit, seo, theme-store
```

- **Komponen bersama:** `src/components/` — datar, 15 berkas. **Tidak ada
  komponen per-halaman**; kalau butuh, buat konvensi baru.
- **Penamaan:** berkas `kebab-case.tsx`, komponen `PascalCase`, named export
  (bukan default) kecuali `page.tsx`/`layout.tsx`. Segmen rute berbahasa
  Indonesia (`/profil`, `/mitra`, `/kalender`, `/galeri`).
- Primitif UI ada di satu berkas: `src/components/ui.tsx` → `PageHeader`,
  `Section`, `ButtonLink`, `MoreLink`, `BackLink`, `Pill`, `Stat`, `StatRow`,
  `DefList`, `EmptyState`

**Rute yang sudah jadi** (21 `page.tsx`, 307 halaman ter-render):

`/` · `/profil` · `/event` · `/event/[slug]` · `/event/situs` ·
`/event/afiliasi` · `/mitra` · `/mitra/[slug]` · `/newsletter` ·
`/newsletter/[slug]` · `/tim` · `/tim/ahli` · `/faq` · `/kontak` ·
`/galeri/video` · `/galeri/foto` · `/kalender` · `/kurasi` ·
`/kurasi/[berkas]` · `/status`

**Placeholder / setengah jadi:**

- `/tim/staf-ahli` — **bukan halaman**, hanya `redirect()` ke `/tim/ahli`.
  Sengaja: di situs lama dua rute ini menampilkan isi yang sama.
- `/galeri/foto` — 7 kartu tahun berisi tautan ke Google Drive, tanpa gambar.
  **Itu keputusan, bukan sisa kerja** — alasannya di bagian 5.E.
- `/kalender` — satu `<iframe>` Heyzine, tidak ada apa-apa lagi.
- `/kurasi` + `/kurasi/[berkas]` — hanya tombol keluar ke Drive.

---

## 4. Data

**Semua konten dari berkas lokal. Nol dari API.**

| Jenis | Path | Bentuk |
|---|---|---|
| Event (66) | `src/content/generated/events.json` | `{slug,title,poster,level,mode,city,dates,registrationUrl,venueName,venueImage,mapsEmbed,hashtags[]}` |
| Newsletter (48) | `.../newsletter-issues.json` | `{slug,year,month,batch,title,cover,driveId,pdfPreview,hasPdf}` |
| Mitra (13) | `.../affiliates.json` + teks dua bahasa di `src/content/affiliates.ts` | `{slug,name,logo,description,videos[],gallery[],sections[]}` |
| Struktur tim (22 orang, 5 tingkat) | `.../org-structure.json` | `{name,position,photo,photoAlt,children[]}` |
| Tim ahli (15) | `.../expert-images.json` | senarai **nama berkas saja** — tidak ada nama orang |
| FAQ (20) | `.../faq.json` | `{group,question,answer}` |
| Video (49) | `.../videos.json` | `{year,title,description,youtubeId}` |
| Logo mitra (41) | `.../partners.json` | `{scope,logo}` |
| Situs event (34) | `.../event-sites.json` | `{name,type,url}` |
| Peta aset | `.../asset-map.json` | jalur lama → `/media/...` |
| Redirect (280) | `.../redirects.json` | dibaca `next.config.ts` |
| Teks profil/visi-misi | `src/content/profile.ts` | hardcode, dua bahasa |
| Kontak/sosial | `src/content/org.ts` | hardcode |
| Drive/Heyzine | `src/content/external.ts` | hardcode |

**Tersambung ke `api-dashboard.iysa.or.id`: TIDAK ADA SATU PUN.** Klien sudah
ditulis di `src/lib/api.ts` dengan pola `withFallback()`, tapi seluruh rute
`/api/public/v1` menjawab `seri_ini_belum_menetapkan_edisi_yang_disiarkan`
(host hidup, header `X-Organization-Slug: iysa` diterima, tapi belum ada seri
yang menetapkan edisi siaran). Keadaan terkini: `/id/status`.

---

## 5. Aset

### Di mana & bagaimana dirujuk

- **Tersimpan:** `site/public/media/` — **14 MB total**
- **Dirujuk lewat satu lapisan penerjemah**, bukan langsung. Data menyimpan
  jalur lama (`./assets/images/poster/bisf.WebP`); `src/lib/assets.ts`
  menerjemahkannya lewat `asset-map.json` ke `/media/poster/bisf.webp`.

```tsx
import { posterUrl } from "@/lib/assets";   // alias: coverUrl, logoUrl, photoUrl, assetUrl
const src = posterUrl(event.poster);        // string | null — SELALU bisa null
```

> **Aturan yang berlaku:** `assetUrl()` mengembalikan `null` untuk berkas yang
> tidak ada, dan setiap komponen wajib menangani null dengan fallback (inisial
> nama, judul teks, atau tidak merender sama sekali). Jangan pasang `<Image>`
> tanpa penjaga null — situs lama penuh gambar 404 justru karena itu.

- **Komponen gambar: `next/image` di mana-mana. Tidak ada satu `<img>` pun.**
  Dipakai di 7 berkas: `tim/page.tsx`, `tim/ahli/page.tsx`,
  `newsletter/page.tsx`, `newsletter/[slug]/page.tsx`, `event/[slug]/page.tsx`,
  `mitra/page.tsx`, `mitra/[slug]/page.tsx`
- **Format: WebP tunggal.** `next.config.ts` menyajikan
  `["image/avif","image/webp"]` on the fly. Host luar yang diizinkan:
  `i.ytimg.com`, `drive.google.com`, `api-dashboard.iysa.or.id` — tambah dulu di
  `remotePatterns` kalau butuh host lain, kalau tidak gambarnya diblokir
  diam-diam.

### Pipeline konversi — ADA

`scripts/build-assets.mjs`, jalankan `npm run migrate:assets`. Butuh `../.old`
(perintah clone-nya ada di README).

Lebar maksimum per folder: poster **1400px**, venue **1200px**, newsletter
**1000px**, team **800px**, logo **600px**, sisanya 1200px. WebP kualitas 82,
`effort: 5`, `withoutEnlargement`, `.rotate()` untuk EXIF. GIF disalin apa
adanya (animasi hilang kalau dipaksa WebP statis) — saat ini nol GIF terpakai.

### Isi `public/media` sekarang

| Folder | Berkas | Ukuran |
|---|---|---|
| allimg | 92 | 5,0 MB |
| newsletter | 40 | 4,0 MB |
| poster | 28 | 3,6 MB |
| team | 15 | 772 KB |
| logo-afiliasi | 14 | 372 KB |
| national-affiliation | 8 | 176 KB |
| logo | **5** | 104 KB |
| venue | 1 | 12 KB |

### ⚠ Aset kosong — daftar kerja

Hitung ulang kapan saja dengan skrip di bagian bawah dokumen ini.

**A. Poster event hilang (5)** — `/id/event/<slug>`. Bukan salah migrasi:
berkasnya tidak pernah ada di repo lama, jadi di situs lama pun sudah lama
gambar rusak. **Sengaja tidak ditebak** — menempelkan poster tahun lain ke
event yang salah lebih buruk daripada kosong.

```
olimpiade-sains-siswa-madrasah-nasional-os2mn-2024   ← dulu os2mn.WebP
youth-national-science-fair-ynsf-2025                ← dulu YNSF.WebP
youth-international-science-fair-yisf-2025           ← dulu YISF.WebP
world-youth-stem-invention-innovation-wysii-2024     ← dulu wysii.WebP
international-youth-physics-olympiad-iypo-2024       ← dulu iypo.WebP
```

Catatan: di `.old/public/assets/images/poster/` ADA `yisf2026.png` dan
`ynsf2026.png` — tahunnya beda, jangan asal pakai tanpa konfirmasi.

**B. Foto venue hilang (3)** — `venueImage` **kini dirender** di `/event/[slug]`
(kotak 16:9 + `object-cover`), 27 dari 30 rujukan ada. 19 event punya
`venueName` tanpa foto; 28 dari 66 punya `mapsEmbed`.

```
global-youth-invention-and-innovation-fair-gyiif-2026   ← rujukan "-" (kosong)
nasisc-national-agriculture-...-competition             ← sma-taruna-nusantara-malang.webp
wasisc-world-agriculture-...-competition                ← sma-taruna-nusantara-malang.webp
```

**C. Logo IYSA — SELESAI.** Lambangnya kini SVG yang digambar ulang dari
geometri, bukan raster.

Sumber kebenarannya `src/components/iysa-logo.tsx` — tiga orbit elips berjarak
60°, tiga simpul, bola dunia di pusat. Tidak ada vektor IYSA di mana pun untuk
dilacak: satu-satunya `.svg` di repo lama (`.old/src/logo.svg`) ternyata **logo
React bawaan create-react-app** (viewBox 841.9×595.3, `#61DAFB`). Jadi bentuknya
disusun dari angka, dan itu yang membuatnya tetap tajam dari 16px sampai
1200px.

Yang perlu diketahui sebelum menyentuhnya:

- **Urutan gambar membawa kedalaman.** Teal dan coral dulu, lalu bola dunia
  menutupinya, lalu navy di ATAS bola. Kalau ketiganya digambar sebelum bola,
  lambangnya jadi rata.
- **Di bawah 40px meridian bola dunia dibuang otomatis** (`polos`). Diuji
  dengan merender 32px lalu memperbesarnya tanpa penghalusan — meridiannya
  jadi kotak abu bergaris.
- **Warnanya token `--logo-*`, bukan palet situs.** Palet situs dipilih supaya
  lolos WCAG sebagai teks, jadi lebih gelap. Warna asli logo juga tidak dipakai
  mentah karena masing-masing gagal di salah satu tema: teal `#30b4b4` hanya
  2,53:1 di putih, navy `#305490` hanya 2,49:1 di latar gelap. Nilai di
  `globals.css` sudah digeser sampai ≥3:1 di kedua tema; `npm run contrast`
  melaporkannya tanpa menggagalkan build (WCAG 1.4.11 mengecualikan logotype).

**Ada DUA lambang, dan keduanya memang dipakai:**

| | dari | dipakai di | ukuran |
|---|---|---|---|
| `iysa-logo.tsx` | geometri (elips + lingkaran) | header, footer, favicon, apple-icon, `icon.svg` | ~1 KB sebaris |
| `iysa-mark-traced.svg` | **tracing raster aslinya** | cadangan hero, sumber bentuk objek 3D | 19 KB berkas |

Yang kedua dibangun `npm run trace:logo` (`scripts/trace-logo.mjs`) dari
`logo iysa tanpa logo type.png` 472×512 — satu-satunya berkas lambang yang
dimiliki IYSA. potrace hanya bisa memisahkan gelap dari terang, jadi rasternya
dipecah dulu jadi **lima masker warna** (navy · teal · coral · badan bola
dunia · benua), masing-masing ditelusuri sendiri, lalu disusun ulang. Karena
tiap piksel hanya masuk satu kelas, kelimanya saling lepas dan menutup bidang
yang sama persis dengan rasternya — orbit yang terputus di tempat navy lewat
di depan ikut terbawa apa adanya.

> **`fill-rule` wajib ikut terbawa.** potrace mengeluarkan lubang — benua di
> dalam bola dunia — sebagai sub-path dan mengandalkan `evenodd`. Percobaan
> pertama hanya mengambil atribut `d`, dan aturan bawaan `nonzero` menutup
> semua lubang: bola dunia berbenua jadi cakram hitam pekat.

Yang geometris tetap dipakai untuk ukuran kecil karena di 32px hasil tracing
berbutir, dan 19 KB terlalu berat untuk ikut di setiap HTML halaman.

Ikon dibangun `npm run build:icons` (`scripts/build-icons.mjs`, ikut
`npm run migrate`): `src/app/icon.svg` (adaptif tema lewat `@media` di dalam
SVG), `favicon.ico` 32px, `apple-icon.png` 180px, plus
`public/media/logo/iysa-mark{,-gelap}.svg` dan `.png`.

> **Jangan pakai `var(--x)` di dalam berkas SVG.** Versi pertama `icon.svg`
> begitu, dan librsvg — yang dipakai sharp, ImageMagick, dan sebagian
> pratinjau sistem berkas — tidak menyelesaikan custom property: ketiga
> orbitnya hilang dan yang tersisa empat lingkaran hitam. Warna harfiah di
> atribut, `@media` hanya menimpa lewat kelas.

Skrip ikon **membaca `iysa-logo.tsx` dan membandingkan angka geometrinya**
sebelum menulis apa pun; kalau keduanya menyimpang ia berhenti dan menyebut
angka mana yang beda.

**Favicon sudah diganti** — 25.931 byte (logo Next) → **1.306 byte**.

**D. Data sudah dikonversi tapi TIDAK DIRENDER** — asetnya siap, halamannya
belum ada:

- **`partners.json` — 59 logo institusi, SUDAH dirender**
  (`src/components/partner-wall.tsx`, dipakai di beranda). 30 nasional,
  29 internasional, 59 dari 59 terpetakan.

  **Sumbernya dua komponen, bukan JSON.** Daftar yang benar-benar tampil di
  situs lama di-hardcode sebagai `<img>` di `National-affiliation.js` dan
  `International-affiliation.js` — termasuk 15 entri yang sengaja dikomentari
  dan karenanya tidak ikut.

  > **Jangan kembali ke `AffiliationLogo.json`.** Berkas itu tidak pernah
  > dipakai komponen mana pun dan isinya rusak: 41 entri menunjuk hanya 9
  > berkas, **26 di antaranya `about-logo.png` alias logo IYSA sendiri**, dan
  > bagian "International"-nya identik byte-per-byte dengan bagian "National".
  > Dinding pernah dibangun dari sana; hasilnya memajang lambang IYSA 26 kali
  > di bawah judul "41 institusi mitra". Ketahuan hanya karena dindingnya
  > dipotret — peta aset melaporkan 41 dari 41 terpetakan, dan HTML memang
  > memuat 41 `<img>`.

  **Tanpa nama, dan itu disengaja.** `legacyName` hanya nama berkas, sebagian
  bukan nama institusi sama sekali (`pohon`, `burung`, `red g`, `img`). Situs
  lama pun memakai `alt=""` di setiap logo. Kalau IYSA menyediakan daftar
  bernama, petakan lewat berkas di `src/content/`, pola yang sama dengan
  `affiliateNames`.

  **Di tema gelap logonya duduk di ubin terang** (`.sel-logo`), bukan diberi
  filter. `brightness(0) invert(1)` sempat dicoba dan hasilnya lebih buruk:
  logo berisian pejal berubah jadi gumpalan bulat tanpa detail. Logo institusi
  memang dirancang untuk latar terang.
- `event-highlights.json` — 5 poster sorotan, masih tidak dipakai
- `affiliate-sites.json` — 13 entri, masih tidak dipakai

**E. `/galeri/foto` tetap nol gambar — dan itu keputusan, bukan sisa kerja.**

Thumbnail per tahun sudah dicoba dua kali dan dibatalkan dua-duanya, karena
tidak ada satu sumber pun yang menutup ketujuh tahunnya:

| Sumber | Menutup |
|---|---|
| poster event (`events.json`) | **2 dari 7** — datanya hanya memuat 2024–2026 |
| sampul newsletter | **4 dari 7** — terbitan baru mulai 2022 |

Hasilnya kartu yang sebagian bergambar dan sebagian kosong, yang terbaca
sebagai kerusakan — lebih buruk daripada tujuh kartu seragam. Menambalnya
dengan gambar dari tahun lain bukan pilihan: kartu 2021 berposter 2025 adalah
keterangan yang salah, dan di halaman arsip justru di situ ia paling
menyesatkan. Aturan yang sama sudah berlaku untuk lima poster event yang
hilang.

Kalau dokumentasi fotonya nanti pindah dari Drive, satu gambar sampul per
tahun bisa diambil dari sana dan halaman ini tinggal merendernya. Alasan
lengkapnya ada di komentar `src/app/[locale]/galeri/foto/page.tsx`.

**F. Ilustrasi / 3D — ada satu, dan memang cuma satu.**
`src/components/hero-atom.tsx`: lambang IYSA sebagai objek tiga dimensi di
hero beranda.

Bentuknya **bukan tiruan**. `SVGLoader` mengurai `iysa-mark-traced.svg` — hasil
tracing raster aslinya — lalu tiap lapisan di-`ExtrudeGeometry` jadi relief.
Tiap lapisan diberi pergeseran z sesuai urutan tumpukannya di lambang asli
(navy paling depan, bola dunia paling belakang), jadi objeknya punya parallax
sungguhan saat berputar, bukan satu lempeng pipih.

Versi pertama menyusunnya dari tiga torus dan tiga bola. Mendekati, tapi tetap
tiruan — dan untuk lambang organisasi, "mendekati" bukan standar yang benar.

Tiga hal yang menyelamatkan komponen ini dari kegagalan diam:

1. **Berkas SVG-nya diambil, bukan ditanam sebagai JSON.** Menanamnya membuat
   Turbopack menyalin 18,7 KB itu ke chunk muat awal DAN chunk lazy; muat awal
   beranda naik 622 → 656 KB untuk data yang cuma dipakai kalau three jalan.
   Diambil sebagai berkas, biayanya nol — halaman sudah mengunduhnya sebagai
   lambang cadangan.
2. **Nama lapisan dibaca dari atribut `class`**, dengan cadangan ke urutan.
   Tanpa cadangan itu, satu pemetaan gagal = semua path dilewati = hero kosong.
3. **Lambang cadangan hanya disembunyikan kalau ada mesh yang benar-benar
   terbentuk.** Tanpa penjaga ini, kegagalan penguraian menghasilkan kanvas
   kosong DAN cadangan yang sudah terlanjur dilenyapkan.

`emissive` disetel serendah 0,32 dari warna isiannya: tanpa itu sisi extrude
yang membelakangi lampu jatuh ke hitam dan lambangnya terbaca sebagai siluet
gelap, bukan sebagai logo IYSA.

> **Swiftshader tidak bisa dipakai menilai ini.** Tangkapan layar headless
> dengan `--use-gl=swiftshader` di mesin pengembangan menampilkan seluruh
> halaman di bawah hero sebagai bidang kosong — artefak perender perangkat
> lunak, bukan cacat situs (dibuktikan dengan render `--disable-gpu` yang utuh).
> Nilai objek 3D-nya di peramban sungguhan.

Yang dijaga di komponen itu, jangan dilepas tanpa alasan:

- `prefers-reduced-motion` → three tidak dimuat sama sekali; lambang SVG statis
  yang tampil, bukan versi 3D yang diam
- WebGL gagal atau `import("three")` gagal → lambang SVG tetap di tempatnya
- berhenti menggambar saat keluar layar (IntersectionObserver) — kalau tidak,
  GPU ponsel berputar sepanjang halaman digulir
- bukan elemen LCP: kanvasnya kosong sampai three tiba, sementara judul hero
  sudah dirender di server
- kemiringan ikut kursor dibatasi **±8°** — lebih dari itu objeknya terasa
  mengejar pembaca

Selain ini, situs tetap tanpa ilustrasi. `EmptyState` masih teks dalam kotak
garis putus-putus, halaman 404 masih teks. Itu konsisten dengan brief
"berani tanpa norak", bukan kekosongan yang belum sempat diisi.

**G. ~~Sampah template Next di `public/`~~ — sudah dihapus.** `file.svg`,
`globe.svg`, `next.svg`, `vercel.svg`, `window.svg`, dan `public/docs/` kosong.
Sekarang `public/` hanya berisi `media/`.

### Soal 136 MB aset situs lama

**Sudah dipindah, dengan tiga aturan:**

1. **Saring** — hanya berkas yang benar-benar dirujuk data. 211 rujukan dari
   466 berkas.
2. **Seragamkan** — 5 format (PNG/JPG/WebP/JPEG/GIF) → WebP tunggal.
3. **Batasi lebar** — per folder, tabel di atas.

**Hasil: 135,2 MB → 13,9 MB (−89,7%).** Yang **tidak** ikut: 65,6 MB aset tak
terpakai, termasuk **dua .zip 14 MB** (arsip foto tim yang tidak pernah bisa
diunduh lewat situs). Lima ekstensi salah tulis dipulihkan otomatis
(`ispc.WebP`→`ispc.jpeg`, `nicyms`, `nyiia`, `wice`, `about-logo`).

Repo lama masih utuh di `../.old/public/assets/` kalau perlu mengambil sesuatu
yang tersaring keluar.

### Hitung ulang aset kosong

```bash
cd /Users/kimen/Documents/iysa-web/site && node -e '
const map=require("./src/content/generated/asset-map.json");
const has=p=>p&&map[String(p).replace(/^\.?\//,"")];
const ev=require("./src/content/generated/events.json");
const iss=require("./src/content/generated/newsletter-issues.json");
const aff=require("./src/content/generated/affiliates.json");
const par=require("./src/content/generated/partners.json");
const org=require("./src/content/generated/org-structure.json");
const flat=n=>[n,...(n.children||[]).flatMap(flat)];
const people=org.flatMap(flat);
const row=(n,t,a)=>console.log("  "+n.padEnd(28)+String(t).padStart(4)+String(a).padStart(5)+String(t-a).padStart(7));
console.log("KELOMPOK                    TOTAL  ADA  KOSONG");
row("poster event",ev.length,ev.filter(e=>has(e.poster)).length);
row("foto venue",ev.filter(e=>e.venueImage).length,ev.filter(e=>has(e.venueImage)).length);
row("sampul newsletter",iss.length,iss.filter(i=>has(i.cover)).length);
row("logo mitra",aff.length,aff.filter(a=>has(a.logo)).length);
row("logo institusi",par.length,par.filter(p=>has(p.logo)).length);
row("foto orang",people.length,people.filter(p=>has(p.photo)).length);
console.log("\nPoster kosong:");
ev.filter(e=>e.poster&&!has(e.poster)).forEach(e=>console.log("  · "+e.slug));'
```

---

## 6. Motion yang sudah ada

**Library: tidak ada.** CSS murni, semua di `src/app/globals.css`. (three.js
dipakai HANYA untuk objek 3D di hero — lihat bagian 2 — bukan untuk motion.)

**Gerakannya sedikit dan disengaja** (brief klien: "motion secukupnya dan
bermakna, bukan elemen terbang di mana-mana"):

| | |
|---|---|
| `@keyframes rise` | naik 12px + fade, `var(--gerak-naik)` + `var(--lengkung)` |
| `.rise` | dipasang per elemen |
| `.rise-stagger` | menunda anak-anak grid lewat `sibling-index()`, dibatasi `min(…, 0.3s)` — berlaku untuk grid berisi berapa pun |
| `[data-reveal]` | menahan animasi sampai elemennya masuk layar (`src/components/reveal.tsx`) |
| `AngkaNaik` | angka `Stat` berhitung naik saat masuk layar |
| transisi | `duration-[var(--gerak-cepat)]` / `-sedang`, token di `globals.css` |

**Token gerak — satu sumber untuk tempo situs:**

```css
--lengkung:     cubic-bezier(0.22, 1, 0.36, 1);
--gerak-cepat:  150ms;  /* warna hover, keadaan tombol */
--gerak-sedang: 300ms;  /* transformasi, sampul membesar */
--gerak-naik:   500ms;  /* masuknya elemen ke layar */
```

Sebelumnya `duration-150` ditulis ulang sebagai kelas Tailwind di 31 tempat.
Sekarang nol — pakai token, jangan tulis angka baru.

**Per komponen yang sudah jalan:**

- `page.tsx` (beranda) — `.rise` di eyebrow/h1/lead/tombol hero;
  `.rise-stagger` di grid angka dan kartu event
- `ui.tsx` → `PageHeader` — `.rise` di eyebrow/h1/lead; `StatRow` —
  `.rise-stagger`
- `mitra/page.tsx`, `newsletter/page.tsx`, `tim/page.tsx`, `tim/ahli/page.tsx`
  — `.rise-stagger` di grid
- `event/[slug]/page.tsx`, `mitra/[slug]/page.tsx` — `.rise` di h1
- Sampul newsletter — `group-hover:scale-[1.03]`, `duration-300`
- `MoreLink` / `BackLink` — panah geser `translate-x-0.5` saat hover
- FAQ — tanda `+` berputar 45° via `group-open:rotate-45`

**Aturan bersama: sudah utuh.** Durasi, easing, dan tunda bertahap semuanya
token di `globals.css`. Tidak ada angka durasi harfiah tersisa di `src/`.

**`prefers-reduced-motion`: ditangani di tiga lapis.** `globals.css` memendekkan
semua animasi + transisi jadi `0.01ms` dan `scroll-behavior: auto`; penahan
`[data-reveal]` ikut dilepas di sana (kalau tidak, elemen yang tak pernah masuk
layar tertahan selamanya di keadaan awal); `hero-atom.tsx` tidak memuat three
sama sekali dan `angka-naik.tsx` tidak beranimasi. **Hormati ini untuk apa pun
yang ditambahkan.**

**Dua jebakan yang sudah kena sekali — jangan ulangi:**

1. **Penahan animasi harus di CSS, bukan JS.** Kalau JavaScript yang memberi
   aba-aba mulai, ada jendela antara halaman terlihat dan skrip jalan, dan di
   jendela itu animasinya sudah telanjur berjalan — persis masalah yang mau
   dibereskan.
2. **Selalu sediakan jalan keluar tanpa JS — tapi bukan lewat `scripting:`.**
   Penahan `[data-reveal]` digerbangi `:root[data-gerak="aktif"]`, atribut yang
   dipasang `ThemeScript` di `<head>`. Tanpa JavaScript atribut itu tidak
   pernah ada, jadi tidak ada yang ditahan.

   Pola umumnya: **kalau CSS menyembunyikan sesuatu dan hanya JS yang bisa
   memunculkannya lagi, gerbangnya harus dipasang oleh JS itu sendiri.**
   `@media (scripting: none)` tidak bisa dipakai untuk ini — Chrome melaporkan
   `scripting: enabled` bahkan saat JavaScript dimatikan. Tambahkan juga jaring
   pengaman berbatas waktu, seperti timeout 3 detik di `reveal.tsx`.

**Belum ada:** transisi antar halaman (View Transitions API), parallax,
skeleton loader.

---

## 7. Pagar — jangan disentuh

### Rapuh / setengah jadi

1. **`src/content/generated/*.json` — jangan sunting tangan.** Semuanya
   dihasilkan skrip; suntingan hilang saat `npm run migrate`. Kalau perlu
   mengubah isi, ubah skripnya di `scripts/`, atau taruh override di
   `src/content/*.ts` — pola ini sudah ada: `affiliateNames` di
   `affiliates.ts` menimpa nama dari JSON.
2. **`src/middleware.ts` — `matcher` mengandung `og`.** Kalau `og` dihapus dari
   daftar pengecualian, middleware i18n mengalihkan `/og` ke `/id/og` dan
   **setiap pratinjau tautan WhatsApp jadi kosong**. Bug ini sudah pernah
   terjadi sekali.
3. **`assetUrl()` bisa mengembalikan `null`** untuk 5 poster + 3 venue. Setiap
   `<Image>` baru wajib punya penjaga null.
4. **API dasbor mati** — jangan bangun apa pun yang mengandalkan data live dari
   sana sebelum edisi siaran diset.
5. **`/tim/ahli` hanya menampilkan gambar tanpa nama** — bukan kelalaian;
   `expertTeam.json` lama memang cuma senarai nama berkas. Dasbor punya 29
   orang + CV; halaman ini yang pertama pindah begitu API hidup.

### Keputusan desain yang sudah final

1. **Peran warna, yang paling penting:** navy memikul struktur & judul · teal
   untuk tautan/aksen · **coral HANYA untuk satu ajakan utama per layar**.
   Kelangkaan coral itu yang membuatnya berwibawa. Jangan sebar ke banyak
   elemen.
2. **Palet terkunci uji.** `scripts/contrast.mjs` menguji 34 pasangan terhadap
   WCAG AA dan **`prebuild` memanggilnya — warna yang gagal menghentikan
   build**. Kalau token warna di `globals.css` diubah, jalankan
   `npm run contrast` dan perbaiki sampai lolos. Jangan lemahkan ambangnya.
   - `--line` (garis dekoratif) **sengaja dikecualikan** dari ambang 3:1.
     Alasannya tertulis di `scripts/contrast.mjs`. Untuk batas komponen
     interaktif dan cincin fokus pakai `--border` / `--focus` yang sudah lolos
     3:1. Jangan gelapkan `--line` "supaya lolos" — itu memecah halaman jadi
     kotak-kotak dan merusak ruang putihnya.
3. **Tanpa bayangan, tanpa sudut besar.** Pembatas berupa garis 1px lewat pola
   `gap-px` + `bg-[var(--line)]` di grid induk, jadi daftar terbaca sebagai
   tabel, bukan kartu melayang.
4. **Keberanian datang dari skala tipografi dan angka mono besar**, bukan dari
   gradien atau elemen terbang. Brief eksplisit klien: "berani tanpa norak".
5. **Saringan event = tautan biasa, bukan state klien.** Setiap kombinasi jadi
   URL yang bisa dibagikan dan bekerja tanpa JavaScript. Jangan ubah jadi
   `useState`.
6. **Poster tidak ditampilkan di kartu event**, hanya di halaman detail — di
   situs lama beranda memuat 61 poster PNG 2–4 MB sekaligus.
7. **Ponsel yang utama.** Peserta mendaftar dari HP.
8. **Cincin fokus** (`:focus-visible`, 2px `--focus`, offset 2px) berlaku global
   dan tidak pernah dimatikan.

### Anggaran performa

Belum ada anggaran formal. **Patokan sekarang, jangan sampai memburuk:**

| | Sebelum pekerjaan aset | Sekarang |
|---|---|---|
| **JS muat awal beranda** | 636 KB | **637 KB** |
| JS di disk (termasuk chunk lazy) | 636 KB | ±1.400 KB (three 720 KB, lazy) |
| CSS | 40 KB | **37 KB** |
| HTML beranda | 86 KB / 13,9 KB gzip | 161 KB / **21,4 KB gzip** |
| Seluruh aset gambar | 14 MB | **16 MB** (59 logo mitra) |
| Halaman ter-render saat build | 305 | **307** |

Muat awal naik 15 KB karena beranda kini memuat gambar: sebelum dinding logo
mitra ada, halaman itu tidak punya satu pun `next/image`, jadi runtime-nya
tidak pernah ikut. Itu harga yang dibayar sekali untuk 59 logo.

HTML membengkak 94 → 161 KB karena srcset 59 gambar. Sempat 211 KB waktu
`sizes` masih dipasang — untuk gambar berukuran tetap sekecil ini, `sizes`
memaksa Next memancarkan srcset dari seluruh daftar deviceSizes; tanpa `sizes`
ia cukup memancarkan 1x/2x. Jangan pasang `sizes` di dinding logo.

**Angka yang dijaga adalah baris pertama, bukan kedua.** Total di disk naik
sekitar 740 KB karena three, tapi muat awal beranda justru **turun** 636 → 622
KB. Keduanya benar sekaligus, dan itu intinya: chunk three tidak pernah ikut
muat awal. Ukur dengan menjumlahkan hanya chunk yang benar-benar dirujuk
HTML-nya, jangan menjumlahkan isi `.next/static`:

```bash
F=.next/server/app/id.html; tot=0
for c in $(grep -o '/_next/static/chunks/[a-zA-Z0-9_.-]*\.js' $F | sort -u); do
  tot=$((tot + $(stat -f%z ".next/${c#/_next/}")))
done; echo "$((tot/1024)) KB"
```

Menambah framer-motion (~34 KB gzip) atau three.js (~150 KB gzip) adalah
perubahan besar terhadap angka-angka ini — pertimbangkan `next/dynamic` dan
muat hanya di halaman yang butuh.

### Uji otomatis

**BELUM ADA. Nol.** Tidak ada Jest, Vitest, Playwright, atau test runner apa
pun. Yang ada hanya tiga penjaga di jalur build:

1. `npm run contrast` — 34 pasangan WCAG, keluar 1 kalau gagal, dipanggil
   `prebuild`
2. `npm run migrate:redirects` — gagal kalau ada rute lama tanpa tujuan **atau**
   ada sumber redirect ganda
3. `npx tsc --noEmit` + `npm run lint` — sekarang bersih

**Patokan yang diverifikasi manual dan harus tetap benar: 80 dari 80 URL lama
mendarat di HTTP 200.** Belum ada tes otomatisnya. Kalau struktur rute diubah,
uji ulang:

```bash
cd /Users/kimen/Documents/iysa-web/site
npm run build && npm start &   # tunggu siap
node -e 'const fs=require("fs");const a=fs.readFileSync("../.old/src/App.js","utf8");
fs.writeFileSync("/tmp/routes.txt",[...new Set([...a.matchAll(/path="([^"]+)"/g)].map(m=>m[1]))].join("\n")+"\n")'
ok=0; bad=0
while read -r r; do [ -z "$r" ] && continue
  t="$r"; [ "$r" = "/Event/:id" ] && t="/Event/1"
  f=$(curl -s -L -o /dev/null -w "%{http_code}" "http://localhost:3000$t")
  [ "$f" = "200" ] && ok=$((ok+1)) || { bad=$((bad+1)); echo "GAGAL $t → $f"; }
done < /tmp/routes.txt
echo "mendarat: $ok / 80   gagal: $bad"
```

---

## 8. Utang & catatan

### TODO yang ditinggalkan

1. Sambungkan ke Vercel + set `NEXT_PUBLIC_SITE_URL`
2. `RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM` belum diset → `/api/contact` dan
   `/api/subscribe` menjawab **503**. Sengaja gagal terang-terangan dan
   menawarkan alamat surel IYSA, bukan diam-diam membuang pesan. Pemilik akan
   memasangnya sendiri.
3. ~~Bangun dinding logo mitra~~ — **selesai**, 59 logo dari daftar yang benar
   (dua komponen afiliasi, bukan `AffiliationLogo.json`). Lihat bagian 5.D.
4. ~~Ganti favicon bawaan Next~~ — **selesai**, `npm run build:icons`
5. ~~Hapus 5 SVG template dari `public/`~~ — **selesai**
6. ~~Hapus `public/docs/` kosong~~ — **selesai** (dihapus; isi `Kurasi.pdf` kalau
   PDF-nya nanti ada)
7. ~~`.rise` belum scroll-triggered~~ — **selesai**, `src/components/reveal.tsx`
8. `event-highlights.json` (5 poster sorotan) dan `affiliate-sites.json`
   (13 entri) masih belum dirender di halaman mana pun
9. Transisi antar halaman belum ada (View Transitions API belum dipakai)

### Sengaja ditunda, dengan alasan

- ~~`venueImage` diekstrak tapi tidak dirender~~ — **sudah dirender** di
  `/event/[slug]`, 27 dari 30 rujukan benar-benar ada. Masalah rasio yang
  tidak seragam diselesaikan dengan kotak 16:9 + `object-cover`: apa pun rasio
  aslinya, yang tampil selalu pita selebar kolom. Foto venue di sini
  keterangan, bukan subjek — gambar terpotong lebih baik daripada baris
  tinggi-rendah acak.
- **Dokumentasi Drive tidak dipindah** (75 tautan). Memindahkan foto
  bertahun-tahun ke penyimpanan lain adalah keputusan IYSA, bukan keputusan
  penulisan ulang situs. Risikonya: tautan mati kalau izin berubah, dan situs
  tidak bisa tahu.
- **Penghitung pembaca newsletter dihapus** — Firebase Firestore 12 MB untuk
  satu angka. Bukan ditunda; dibuang.
- **4 label negara mitra tidak ditampilkan** — ASBF→Namibia, Innoverse→India,
  ICPC→Indonesia, TISF→Taiwan. **Disimpulkan, tidak ada di data mana pun.** Ada
  di `unverifiedCountry` di `src/content/affiliates.ts`; hapus dari set itu
  setelah dikonfirmasi. Label negara salah di halaman mitra jadi kesalahan atas
  nama IYSA.
- **Nomor WhatsApp kedua** (+62 817 7091 4129) tersimpan di
  `src/content/org.ts` dengan `primary: false`, tidak ditampilkan. Di kode lama
  dikomentari — belum jelas masih aktif.

### Bug yang diketahui

1. ~~`.rise-stagger` hanya menunda 6 anak pertama.~~ **Diperbaiki.** Tundanya
   kini dihitung dengan `sibling-index()`, berlaku untuk grid berisi berapa
   pun, dibatasi `min(…, 0.3s)` supaya item ke-41 tidak menunggu 1,6 detik.
   Sudah diverifikasi lolos utuh ke CSS produksi — Tailwind 4.3.3
   meneruskannya. Peramban yang belum mengenalnya memakai delay 0s: semua anak
   muncul bersamaan, animasinya tetap jalan.
2. ~~`.rise` jalan saat mount, bukan saat masuk viewport.~~ **Diperbaiki.**
   `src/components/reveal.tsx` + penahan di `globals.css`. Penahannya di CSS
   supaya ikut render pertama; kalau JS yang memberi aba-aba mulai, ada jendela
   di mana animasinya sudah telanjur jalan.
   **Pasang `data-reveal` di setiap `.rise-stagger` baru**, kalau tidak ia
   beranimasi saat mount seperti dulu.

   Penahannya digerbangi `:root[data-gerak="aktif"]`, yang dipasang
   `ThemeScript` sebelum lukis pertama. Sebab `rise` mulai dari `opacity: 0`,
   jadi menahannya berarti menyembunyikan isi halaman — itu hanya boleh terjadi
   kalau sudah terbukti ada JavaScript yang sanggup melepasnya lagi.

   > Versi pertama memakai `@media (scripting: none)` sebagai pagar tanpa-JS
   > dan itu **tidak bekerja**: Chrome melaporkan `scripting: enabled` bahkan
   > ketika JavaScript dimatikan, jadi pagarnya tidak pernah menyala justru
   > bagi orang yang membutuhkannya. Diuji dengan halaman kecil berisi ketiga
   > nilai media feature — hasilnya identik dengan dan tanpa
   > `--disable-javascript`. Jangan andalkan `scripting:` untuk ini.

   `reveal.tsx` juga punya jaring pengaman 3 detik: apa pun yang masih
   tertahan dilepas, apa pun sebabnya. Kehilangan animasi jauh lebih ringan
   daripada kehilangan isinya.
3. **Rate limiter di memori proses** (`src/lib/ratelimit.ts`) — di Vercel tiap
   instance punya memori sendiri, jadi batas nyata = 5 × jumlah instance per 10
   menit. Cukup menahan naskah sederhana, bukan serangan serius.
4. **5 terbitan newsletter 2022 tanpa PDF** (`hasPdf: false`) — menampilkan
   pesan, bukan pembaca kosong. Alamatnya sudah terindeks jadi entrinya
   dipertahankan.
5. **`stats().countries` di-hardcode `11`** (`src/lib/data.ts`) — dihitung dari
   daftar negara di teks profil, bukan dari tabel. Beranda menampilkannya
   sebagai "11+ negara terjangkau".

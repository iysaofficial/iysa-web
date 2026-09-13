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

**Library animasi / gambar / 3D: BELUM ADA — nol.** Tidak ada framer-motion,
motion, gsap, lottie, three, react-spring, rive. Semua animasi saat ini CSS
murni. Bidang kosong.

---

## 3. Struktur

```
/Users/kimen/Documents/iysa-web/
├── .old/                    sparse checkout repo lama (BUKAN bagian repo ini,
│                            tidak di-commit; skrip migrasi membacanya)
└── site/                    ← repo git
    ├── public/
    │   ├── media/           semua aset gambar (14 MB)
    │   └── docs/            KOSONG (0 byte)
    ├── scripts/             3 skrip migrasi + uji kontras
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

- **Komponen bersama:** `src/components/` — datar, 10 berkas. **Tidak ada
  komponen per-halaman**; kalau butuh, buat konvensi baru.
- **Penamaan:** berkas `kebab-case.tsx`, komponen `PascalCase`, named export
  (bukan default) kecuali `page.tsx`/`layout.tsx`. Segmen rute berbahasa
  Indonesia (`/profil`, `/mitra`, `/kalender`, `/galeri`).
- Primitif UI ada di satu berkas: `src/components/ui.tsx` → `PageHeader`,
  `Section`, `ButtonLink`, `MoreLink`, `BackLink`, `Pill`, `Stat`, `StatRow`,
  `DefList`, `EmptyState`

**Rute yang sudah jadi** (21 `page.tsx`, 305 halaman ter-render):

`/` · `/profil` · `/event` · `/event/[slug]` · `/event/situs` ·
`/event/afiliasi` · `/mitra` · `/mitra/[slug]` · `/newsletter` ·
`/newsletter/[slug]` · `/tim` · `/tim/ahli` · `/faq` · `/kontak` ·
`/galeri/video` · `/galeri/foto` · `/kalender` · `/kurasi` ·
`/kurasi/[berkas]` · `/status`

**Placeholder / setengah jadi:**

- `/tim/staf-ahli` — **bukan halaman**, hanya `redirect()` ke `/tim/ahli`.
  Sengaja: di situs lama dua rute ini menampilkan isi yang sama.
- `/galeri/foto` — hanya 7 kartu tahun berisi tautan ke Google Drive.
  **Tidak ada satu gambar pun.** Kandidat terkuat untuk dikerjakan.
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
| logo | **2** | 64 KB |
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

**B. Foto venue hilang (3)** — tapi **`venueImage` tidak dirender di halaman
mana pun saat ini**. Ada di tipe `src/lib/data.ts:44`, tidak dipakai. 19 event
punya `venueName` tanpa foto; 28 dari 66 punya `mapsEmbed`.

```
global-youth-invention-and-innovation-fair-gyiif-2026   ← rujukan "-" (kosong)
nasisc-national-agriculture-...-competition             ← sma-taruna-nusantara-malang.webp
wasisc-world-agriculture-...-competition                ← sma-taruna-nusantara-malang.webp
```

**C. Logo IYSA — kekosongan terbesar.** `public/media/logo/` hanya berisi
**2 berkas**:

- `iysa-white-logo.webp` — versi putih (untuk latar gelap)
- `about-logo.webp` — logo halaman about lama

**BELUM ADA:** versi gelap/berwarna untuk latar terang · monokrom · favicon ·
apple-touch-icon · OG fallback image · SVG apa pun. `iysa_logo.WebP` dirujuk
data lama tapi **tidak ada di repo**.

Konsekuensinya: **logo IYSA tidak ditampilkan di mana pun.** Header dan footer
memakai **wordmark tipografi** (`<span>IYSA</span>`, Plus Jakarta Sans 800,
`tracking-[-0.04em]`) di `src/components/site-header.tsx` dan
`site-footer.tsx`. Keputusan sementara karena logo lama 24 MB PNG dan tidak ada
versi yang layak.

**Favicon masih bawaan create-next-app** — `src/app/favicon.ico`, 25.931 byte,
logo Next.js. Harus diganti.

**D. Data sudah dikonversi tapi TIDAK DIRENDER** — asetnya siap, halamannya
belum ada:

- **`partners.json` — 41 logo institusi**, semua sudah jadi WebP di
  `public/media/allimg/` dan `national-affiliation/`. Beranda menampilkan angka
  "41 institusi mitra" **tanpa satu logo pun**. Dinding logo mitra belum dibuat.
- `event-highlights.json` — 5 poster sorotan, tidak dipakai
- `affiliate-sites.json` — 13 entri, tidak dipakai

**E. `/galeri/foto` nol gambar** — 7 kartu tahun berisi angka besar + tautan
Drive. Tidak ada thumbnail, tidak ada pratinjau.

**F. Ilustrasi / 3D / grafis: nol.** Tidak ada satu ilustrasi pun di seluruh
situs. Hero beranda murni tipografi. `EmptyState` hanya teks dalam kotak garis
putus-putus. Halaman 404 hanya teks.

**G. Sampah template Next di `public/`:** `file.svg`, `globe.svg`, `next.svg`,
`vercel.svg`, `window.svg` — hapus. `public/docs/` kosong 0 byte (dibuat untuk
`Kurasi.pdf` yang ternyata tidak pernah ada di repo lama).

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

**Library: BELUM ADA.** CSS murni, semua di `src/app/globals.css`.

**Hanya dua gerakan di seluruh situs**, keputusan sadar (brief klien: "motion
secukupnya dan bermakna, bukan elemen terbang di mana-mana"):

| | |
|---|---|
| `@keyframes rise` | naik 12px + fade, `0.5s cubic-bezier(0.22, 1, 0.36, 1)` |
| `.rise` | dipasang per elemen |
| `.rise-stagger` | menunda anak-anak grid, `nth-child(1..6)` → delay 0,02s–0,22s. **Hanya 6 anak pertama** |
| transisi warna | `duration-150` di semua hover/state, ditulis inline per komponen |

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

**Aturan bersama: setengah ada.** Durasi/easing `rise` terpusat di
`globals.css`, tapi `duration-150` hover ditulis ulang di tiap komponen sebagai
kelas Tailwind — belum jadi token. Kalau mau sistem motion sungguhan, itu yang
pertama perlu disatukan.

**`prefers-reduced-motion`: SUDAH ditangani** — `globals.css` mematikan semua
animasi + transisi jadi `0.01ms` dan `scroll-behavior: auto`. **Hormati ini
untuk apa pun yang ditambahkan.**

**Belum ada:** scroll-triggered animation (`.rise` jalan saat mount, bukan saat
masuk viewport — tidak ada IntersectionObserver), page transition, parallax,
animasi angka, skeleton loader.

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

| | |
|---|---|
| Total JS chunks | **644 KB** (5 terbesar: 224 / 172 / 112 / 52 / 24 KB) |
| CSS | **40 KB** |
| HTML beranda | 86 KB mentah / **13,9 KB gzip** |
| Seluruh aset gambar | **14 MB** |
| Halaman ter-render saat build | **305** |

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
3. Bangun dinding logo 41 mitra (aset sudah siap)
4. Ganti favicon bawaan Next
5. Hapus 5 SVG template dari `public/`
6. Hapus `public/docs/` kosong atau isi `Kurasi.pdf`
7. `.rise` belum scroll-triggered

### Sengaja ditunda, dengan alasan

- **`venueImage` diekstrak tapi tidak dirender** — 30 event punya, 19 punya nama
  venue tanpa foto. Kualitas dan rasionya tidak seragam; menampilkannya apa
  adanya akan berantakan. Menunggu keputusan desain.
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

1. **`.rise-stagger` hanya menunda 6 anak pertama.** Grid dengan lebih dari 6
   item (event 66, newsletter per tahun, tim 22) — item ke-7 dst. muncul
   serempak tanpa delay. Terlihat kalau diperhatikan.
2. **`.rise` jalan saat mount, bukan saat masuk viewport.** Konten jauh di bawah
   lipatan sudah selesai beranimasi sebelum pengunjung sampai. Perlu
   IntersectionObserver.
3. **Rate limiter di memori proses** (`src/lib/ratelimit.ts`) — di Vercel tiap
   instance punya memori sendiri, jadi batas nyata = 5 × jumlah instance per 10
   menit. Cukup menahan naskah sederhana, bukan serangan serius.
4. **5 terbitan newsletter 2022 tanpa PDF** (`hasPdf: false`) — menampilkan
   pesan, bukan pembaca kosong. Alamatnya sudah terindeks jadi entrinya
   dipertahankan.
5. **`stats().countries` di-hardcode `11`** (`src/lib/data.ts`) — dihitung dari
   daftar negara di teks profil, bukan dari tabel. Beranda menampilkannya
   sebagai "11+ negara terjangkau".

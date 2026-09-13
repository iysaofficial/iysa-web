# iysa.or.id

Penulisan ulang situs Indonesian Young Scientist Association.
Menggantikan `iysaofficial/Iysa` (Create React App + Bootstrap 5).

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:3000 → dialihkan ke /id
npm run build        # menguji kontras dulu, lalu build
npm start
```

## Apa yang berubah dari situs lama

| | Lama | Sekarang |
|---|---|---|
| Rute | 80 berkas, 55 di antaranya data yang menyamar jadi kode | 2 rute dinamis + 16 halaman |
| Render | Peramban saja (CRA mengirim HTML kosong) | 305 halaman ter-render saat build |
| SEO | Satu `<title>` global, tanpa meta/OG/sitemap | Metadata + OG image + JSON-LD per halaman, sitemap 298 URL |
| Bahasa | Inggris saja | Indonesia + Inggris, rute berprefiks |
| Aset | 136 MB di repo, 5 format | 13,9 MB, satu format (−89,7%) |
| Konten | ~1.500 kata terkunci di JSX | Seluruhnya jadi data |
| Backend | Firebase (12 MB) untuk satu penghitung | Tidak ada |

## Perintah

| | |
|---|---|
| `npm run contrast` | Uji palet terhadap WCAG AA. Keluar 1 kalau gagal — `prebuild` memanggilnya, jadi build ikut gagal. |
| `npm run migrate` | Jalankan ulang seluruh migrasi (butuh `../.old`, lihat di bawah). |
| `npm run migrate:content` | Komponen React lama → JSON. |
| `npm run migrate:assets` | Saring, seragamkan, dan perkecil aset. |
| `npm run migrate:redirects` | Bangun peta 301. Gagal kalau ada rute lama tanpa tujuan. |

### Soal `../.old`

Skrip migrasi membaca repo lama di `../.old`, hasil sparse checkout:

```bash
git clone --filter=blob:none --no-checkout --depth 1 \
  https://github.com/iysaofficial/Iysa.git ../.old
cd ../.old && git sparse-checkout init --cone \
  && git sparse-checkout set src package.json public && git checkout
```

Hasil migrasi (`src/content/generated/`, `public/media/`) ikut di-commit, jadi
`npm run build` tetap jalan tanpa `../.old`. Yang butuh folder itu hanya kalau
migrasi mau dijalankan ulang.

## Struktur

```
src/
  app/[locale]/        halaman; [slug] menggantikan 55 rute lama
  app/og/route.tsx     perakit Open Graph image
  app/api/             kontak & langganan (Resend)
  components/          UI bersama
  content/             teks yang dulu terkunci di komponen
    generated/         hasil skrip migrasi — jangan disunting tangan
  lib/
    api.ts             klien API dasbor, selalu punya cadangan
    data.ts            pembacaan data bertipe
    seo.ts             metadata, hreflang, JSON-LD
scripts/               skrip migrasi & uji kontras
```

## Variabel lingkungan

```bash
NEXT_PUBLIC_SITE_URL=https://iysa.or.id

# Formulir kontak & langganan. Tanpa ini, keduanya menjawab 503 dan
# menawarkan alamat surel IYSA sebagai jalan langsung — bukan diam-diam gagal.
RESEND_API_KEY=
MAIL_TO=youngscientist.iysa@gmail.com
MAIL_FROM="IYSA <noreply@iysa.or.id>"   # domain harus terverifikasi di Resend

# Bawaannya sudah benar; ubah hanya kalau API dasbor pindah.
IYSA_API_BASE=https://api-dashboard.iysa.or.id/api/public/v1
IYSA_API_ORG_SLUG=iysa
```

## Yang masih perlu dibereskan

Lihat `/id/status` di situs yang sudah jalan untuk keadaan terkini.

1. **API dasbor belum menyajikan data.** Seluruh rute `/api/public/v1` menjawab
   `seri_ini_belum_menetapkan_edisi_yang_disiarkan`. Situs jalan dari cuplikan
   statis sampai edisi siaran diset di dasbor.
2. **7 berkas gambar hilang** dari repo lama — daftarnya keluar saat
   `npm run migrate:assets`.
3. **`Kurasi.pdf` tidak pernah ada.** Tombolnya disembunyikan, bukan dipasang
   sebagai tautan mati.
4. **4 label negara mitra belum terverifikasi** — lihat `unverifiedCountry` di
   `src/content/affiliates.ts`. Yang belum pasti tidak ditampilkan.
5. **Nomor WhatsApp kedua** ada di data tapi dinonaktifkan; di situs lama ia
   dikomentari. Perlu konfirmasi masih aktif atau tidak.

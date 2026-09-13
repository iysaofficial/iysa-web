/**
 * Sumber daya yang tetap tinggal di luar: Google Drive, Heyzine, YouTube.
 *
 * Tidak dipindah, dan itu keputusan sadar. Memindahkan 75 tautan Drive berarti
 * memindahkan dokumentasi foto bertahun-tahun ke penyimpanan lain tanpa
 * diminta — itu keputusan IYSA, bukan keputusan penulisan ulang situs. Yang
 * berubah: tautannya sekarang data, bukan JSX, jadi bisa diganti tanpa deploy.
 *
 * Risiko yang perlu diketahui: tautan Drive mati kalau izin berkasnya berubah,
 * dan situs tidak bisa tahu itu terjadi. Kalender Heyzine lebih rawan lagi —
 * ia satu-satunya kalender yang dimiliki situs ini.
 */

/** Galeri foto per tahun. Urutan tautan di situs lama: 2025 turun ke 2019. */
export const photoFolders: { year: number; url: string }[] = [
  { year: 2025, url: "https://drive.google.com/drive/folders/1YlEuMXgqC27fYPA_Rb6lxFfIgRf1yQ_4?usp=sharing" },
  { year: 2024, url: "https://drive.google.com/drive/folders/1YgABahNuzqOOPmwssnd_9ht1Ogt8-qEG?usp=sharing" },
  { year: 2023, url: "https://drive.google.com/drive/folders/1hwrWzTYg0qKIkoAMo6VH2-mMPsPwxnYC?usp=sharing" },
  { year: 2022, url: "https://drive.google.com/drive/folders/1ryUJGTgJlMfQSmlm-_vrSvLCeEO359uM?usp=sharing" },
  { year: 2021, url: "https://drive.google.com/drive/folders/145lTk5-26WjugcW9gpbPLuutPTMyZx5j?usp=sharing" },
  { year: 2020, url: "https://drive.google.com/drive/folders/16x0jhCQFv_6KmUB1LozDF_tUDK7vYSjY?usp=sharing" },
  { year: 2019, url: "https://drive.google.com/drive/folders/1vmF4VnMeum1iseTii1N46mG76Vd2lzGW?usp=sharing" },
];

/**
 * Kalender event — flipbook Heyzine.
 * Satu iframe, dan satu-satunya kalender yang situs ini punya.
 */
export const eventCalendar = {
  embedUrl: "https://heyzine.com/flip-book/a0b77cde2d.html",
  year: 2026,
};

/**
 * Dokumen kurasi.
 *
 * `pdf` sengaja null. Situs lama menautkan ke
 * ./assets/images/newsletter/Kurasi.pdf, tapi berkas itu TIDAK PERNAH ADA di
 * repo — tidak ada satu pun .pdf di seluruh repositori lama. Jadi tombol
 * "Buka dokumen" di halaman Kurasi selama ini mengarah ke 404.
 *
 * Dibiarkan null supaya halaman tidak memasang tautan mati lagi; isi dengan
 * jalur berkas setelah PDF-nya diunggah.
 */
/**
 * Folder kurasi per program dan per tahun.
 *
 * ── Kenapa daftar ini pernah salah ──────────────────────────────────────
 *
 * Versi pertama menamainya menurut tebakan: satu folder disebut "LKTIN", satu
 * "OSPC", sisanya "Arsip kurasi I" dan "II". Tiga dari lima meleset. Situs
 * lama menyimpan nama sebenarnya bukan di data, melainkan sebagai judul di
 * dalam tiga komponen terpisah — CurationOSPCComp, CurationLKTINComp, dan
 * CurationPTKComp — dan tiap folder di sana punya program DAN tahun.
 *
 * Yang paling menyesatkan: folder 15mh-… sebenarnya OSPC 2021, tapi diberi
 * nama "Karya terpilih LKTIN"; sementara dua folder LKTIN yang asli justru
 * berakhir sebagai "Arsip kurasi I/II" tanpa nama program sama sekali.
 *
 * Sekarang keduanya diambil apa adanya dari komponen-komponen itu.
 *
 * Catatan satu kejanggalan yang memang ada di sumbernya: folder 1bBXV…
 * ditautkan DUA KALI oleh situs lama — sebagai OSPC 2023 dan sebagai PTK
 * 2025. Itu dipertahankan, bukan dirapikan diam-diam: menghapus salah satunya
 * berarti memutuskan sendiri mana yang keliru, dan hanya IYSA yang tahu.
 */
export const curation = {
  pdf: null as string | null,
  folders: [
    { key: "ospc-2021", program: "OSPC", year: 2021, url: "https://drive.google.com/drive/folders/15mh-RGRblGzinXEGvSLY6E77M1JJmMgh?usp=sharing" },
    { key: "ospc-2022", program: "OSPC", year: 2022, url: "https://drive.google.com/drive/folders/1TVp5jP9C_CSNBWLncR0IFH4_kwiL-L9m?usp=sharing" },
    { key: "ospc-2023", program: "OSPC", year: 2023, url: "https://drive.google.com/drive/folders/1bBXVRxZOhlbPvyKZ4lM0irgOPOZISBZw?usp=sharing" },
    { key: "lktin-2022", program: "LKTIN", year: 2022, url: "https://drive.google.com/drive/folders/1LUmfYpgQ8OUqW1_jBiOIHeBtVHejlJ4o" },
    { key: "lktin-2023", program: "LKTIN", year: 2023, url: "https://drive.google.com/drive/folders/116iUwWOIHdVH1IgF6Z7ckDvc8CkYzoth" },
    { key: "ptk-2025", program: "PTK", year: 2025, url: "https://drive.google.com/drive/folders/1bBXVRxZOhlbPvyKZ4lM0irgOPOZISBZw?usp=sharing" },
  ],
};

/**
 * Dokumen resmi Lomba Invensi & PTK.
 *
 * Di situs lama keduanya duduk di dropdown navbar bernama "Event Info", dan
 * itu satu-satunya tempatnya — tidak ada halaman yang memuatnya. Penulisan
 * ulang membuang dropdown itu tanpa memindahkan isinya, jadi dua dokumen ini
 * sempat tidak bisa dijangkau sama sekali dari situs baru.
 *
 * Judulnya diambil dari nama berkas aslinya di Drive, bukan dari label navbar
 * lama yang disingkat-singkat ("SK PTK 2025"), supaya yang membuka tahu persis
 * dokumen apa yang ia dapat.
 */
export const ptkDocuments: { key: string; url: string; year: number }[] = [
  {
    key: "sk-pemenang",
    year: 2025,
    url: "https://drive.google.com/file/d/1JXtOT-MF64oCEdV1q8ocVopBu-dYk92X/view?usp=sharing",
  },
  {
    key: "guidebook",
    year: 2026,
    url: "https://drive.google.com/file/d/1uwrJdqWGX6OlVYUjmBsRrfa-ukj0jj9y/view?usp=sharing",
  },
];

export const ptkDocumentLabels: Record<string, { en: string; id: string }> = {
  "sk-pemenang": {
    en: "Decree of winners — Lomba Invensi & PTK",
    id: "Surat Keputusan Pemenang Lomba Invensi & PTK",
  },
  guidebook: {
    en: "Guidebook — Lomba Invensi dan PTK",
    id: "Guidebook Lomba Invensi dan PTK",
  },
};

/**
 * Label folder kurasi. Program dan tahun sekaligus — situs lama menampilkan
 * keduanya ("Curation 2021" di halaman "Curation OSPC"), dan tanpa tahun
 * kelima folder itu tidak bisa dibedakan satu sama lain.
 */
export const curationLabels: Record<string, { en: string; id: string }> =
  Object.fromEntries(
    curation.folders.map((f) => [
      f.key,
      {
        en: `${f.program} ${f.year} — curated works`,
        id: `Karya terkurasi ${f.program} ${f.year}`,
      },
    ]),
  );

/**
 * Mitra media.
 *
 * Situs lama memberinya seksi sendiri di beranda (`Media-Partner.js`), dan
 * seksi itu tidak ikut pindah sama sekali — satu-satunya mitra media IYSA jadi
 * tak tersebut di mana pun.
 *
 * Isinya memang cuma satu. Folder aslinya berisi tiga berkas (`_page-0001`
 * sampai `-0003`), tapi komponen lamanya hanya memasang yang kedua; dua
 * sisanya halaman lain dari lembar cetak yang sama, bukan mitra tambahan.
 * Karena itu ia tidak diberi seksi sendiri di situs baru — satu logo dengan
 * judul seksi selebar layar akan terbaca sebagai ruang kosong — melainkan
 * menumpang di bawah dinding logo mitra.
 */
export const mediaPartners: { name: string; logo: string }[] = [
  { name: "The Patent — Invention Magazine", logo: "/media/logo/the-patent.webp" },
];

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
export const curation = {
  pdf: null as string | null,
  folders: [
    { key: "lktin", url: "https://drive.google.com/drive/folders/15mh-RGRblGzinXEGvSLY6E77M1JJmMgh?usp=sharing" },
    { key: "ospc", url: "https://drive.google.com/drive/folders/1TVp5jP9C_CSNBWLncR0IFH4_kwiL-L9m?usp=sharing" },
    { key: "ptk", url: "https://drive.google.com/drive/folders/1bBXVRxZOhlbPvyKZ4lM0irgOPOZISBZw?usp=sharing" },
    { key: "arsip-1", url: "https://drive.google.com/drive/folders/116iUwWOIHdVH1IgF6Z7ckDvc8CkYzoth" },
    { key: "arsip-2", url: "https://drive.google.com/drive/folders/1LUmfYpgQ8OUqW1_jBiOIHeBtVHejlJ4o" },
  ],
};

export const curationLabels: Record<string, { en: string; id: string }> = {
  lktin: { en: "LKTIN selected works", id: "Karya terpilih LKTIN" },
  ospc: { en: "OSPC selected works", id: "Karya terpilih OSPC" },
  ptk: { en: "PTK selected works", id: "Karya terpilih PTK" },
  "arsip-1": { en: "Curation archive I", id: "Arsip kurasi I" },
  "arsip-2": { en: "Curation archive II", id: "Arsip kurasi II" },
};

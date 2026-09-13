/**
 * Membersihkan teks event dari data warisan.
 *
 * Data event diekstrak apa adanya dari komponen situs lama, dan situs lama
 * menulis judul serta lokasi langsung di JSX tanpa aturan apa pun. Yang
 * tertinggal: emoji di tengah judul, alamat empat ruas di kolom kota, dan satu
 * tanggal yang hanya berisi koma dan tahun.
 *
 * Semua pembersihan di sini SEMATA UNTUK TAMPILAN. Nilai aslinya tidak diubah
 * di `events.json` — berkas itu hasil skrip migrasi, dan menyuntingnya dengan
 * tangan akan hilang saat migrasi diulang. Kalau datanya mau dibereskan
 * sungguhan, tempatnya di dasbor, bukan di sini.
 */

/**
 * Buang emoji dan simbol piktograf dari judul.
 *
 * Tiga judul membawanya dari situs lama:
 *   "International Science Project Competition (ISPC) 2024💥"
 *   "🌐WORLD INVENTION COMPETITION AND EXHIBITION 2025 (WICE)🌐"
 *
 * Tanda pisah en-dash pada "5th WYIIA – World Youth..." sengaja DIPERTAHANKAN:
 * itu tanda baca yang sah, bukan hiasan.
 */
export function judulEvent(judul: string) {
  return judul
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Ringkas nilai kota yang sebenarnya alamat lengkap.
 *
 * Tiga dari delapan nilai kota berisi alamat berkoma:
 *   "Offline, Kota Damansara, Selangor, Malaysia"
 *   "Hall 10A, Exhibition Center 2, KINTEX"
 *   "Seoul National University of Education, Korea"
 *
 * Dipakai ruas TERAKHIR, karena ruas terakhir adalah yang paling umum —
 * negara atau nama tempat yang dikenal — dan itu yang berguna di pil sempit:
 * "Malaysia", "KINTEX", "Korea". Ruas pertama justru yang paling panjang dan
 * paling tidak berguna ("Offline", "Hall 10A").
 *
 * Nilai aslinya dikembalikan juga supaya bisa dipasang sebagai `title`, jadi
 * yang diringkas tetap bisa dibaca utuh.
 */
export function kotaSingkat(kota: string | null): { tampil: string; penuh: string } | null {
  if (!kota) return null;
  const penuh = kota.trim();
  if (!penuh) return null;

  const ruas = penuh
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const tampil = ruas.length > 1 ? ruas[ruas.length - 1] : penuh;
  return { tampil, penuh };
}

/**
 * Tanggal penutupan pendaftaran hanya dipakai kalau bentuknya masuk akal.
 *
 * Satu event membawa `", 2026"` — tanpa hari, tanpa bulan. Dirender apa adanya
 * ia jadi kalimat "Pendaftaran ditutup , 2026", yang terbaca sebagai kerusakan.
 * Syaratnya sederhana: harus ada nama bulan, yaitu tiga huruf berurutan.
 */
export function tanggalSah(nilai: string | null): string | null {
  if (!nilai) return null;
  const bersih = nilai.replace(/^[\s,–-]+/, "").trim();
  return /[A-Za-z]{3}/.test(bersih) ? bersih : null;
}

/**
 * Akronim event, untuk kartu yang posternya tidak ada.
 *
 * Semua judul IYSA menaruh akronimnya di dalam kurung — "(OS2MN)", "(YNSF)",
 * "(WYSII)" — dan kelima event tanpa poster kebetulan semuanya punya. Kalau
 * suatu saat ada yang tidak, huruf awal kata-kata pentingnya dipakai sebagai
 * gantinya, jadi kartunya tidak pernah kosong.
 */
export function akronimEvent(judul: string) {
  const dalamKurung = judulEvent(judul).match(/\(([A-Za-z0-9&]{2,12})\)/);
  if (dalamKurung) return dalamKurung[1].toUpperCase();

  const abaikan = new Set([
    "and",
    "the",
    "of",
    "for",
    "dan",
    "di",
    "untuk",
    "ke",
    "th",
    "st",
    "nd",
    "rd",
  ]);

  return (
    judulEvent(judul)
      .replace(/[^A-Za-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !abaikan.has(w.toLowerCase()))
      .slice(0, 5)
      .map((w) => w[0].toUpperCase())
      .join("") || "IYSA"
  );
}

/** Tahun dari judul, untuk melengkapi kartu tanpa poster. */
export function tahunEvent(judul: string) {
  return judul.match(/\b(20\d{2})\b/)?.[1] ?? null;
}

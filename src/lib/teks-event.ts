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
 * Buang emoji, rapikan tanda kurung yang hilang atau menempel, serta perbaiki
 * judul kapital semua (ALL-CAPS) dan salah ketik akronim dari situs lama.
 *
 * Tiga judul membawa emoji dari situs lama:
 *   "International Science Project Competition (ISPC) 2024💥"
 *   "🌐WORLD INVENTION COMPETITION AND EXHIBITION 2025 (WICE)🌐"
 *
 * Beberapa judul lain kehilangan kurung tutup, spasi sebelum `(`, atau memakai
 * akronim internasional pada edisi nasional ("National Invention... (IICYMS)").
 * Tanda pisah en-dash pada "5th WYIIA – World Youth..." sengaja DIPERTAHANKAN:
 * itu tanda baca yang sah, bukan hiasan.
 */
const KATA_KECIL_JUDUL = new Set([
  "and",
  "or",
  "for",
  "of",
  "in",
  "on",
  "at",
  "to",
  "the",
  "a",
  "an",
  "dan",
  "di",
  "ke",
  "untuk",
]);

const AKRONIM_TETAP = new Set([
  "IYSA",
  "OS2MN",
  "YNSF",
  "YISF",
  "NYIIA",
  "WYIIA",
  "I2ASPO",
  "NASPO",
  "ISPC",
  "IYBC",
  "IYPC",
  "IYMO",
  "IYPO",
  "IYBO",
  "IYCO",
  "I3O",
  "IWC",
  "I3C",
  "WICE",
  "WICO",
  "WRCSO",
  "IICYMS",
  "NICYMS",
  "NRTC",
  "IRTC",
  "ISIF",
  "IIF",
  "LKTIN",
  "PTK",
  "GLOCOLIS",
  "WECC",
  "JNSF",
  "BYSCC",
  "MIYIO",
  "PISF",
  "ICPC",
  "AYIRI",
  "IYMIA",
  "GYIIF",
  "IISEF",
  "IMSEF",
  "AISEEF",
  "ASEAN",
  "KIWIE",
]);

function rapikanKapitalJudul(teks: string): string {
  // Deteksi apakah bagian huruf di luar tanda kurung mayoritas huruf besar
  const tanpaKurung = teks.replace(/\([^)]*\)/g, "");
  const huruf = tanpaKurung.replace(/[^A-Za-z]/g, "");
  if (huruf.length < 6) return teks;
  const hurufBesar = huruf.replace(/[^A-Z]/g, "").length;
  if (hurufBesar / huruf.length < 0.8) return teks;

  return teks.replace(/[A-Za-z0-9']+/g, (kata, offset) => {
    const atas = kata.toUpperCase();
    if (AKRONIM_TETAP.has(atas)) return atas;
    if ( atas === "IOT" ) return "IoT";
    if (/^\d+(ST|ND|RD|TH)$/i.test(kata)) return kata.toLowerCase();
    const kecil = kata.toLowerCase();
    if (offset > 0 && KATA_KECIL_JUDUL.has(kecil)) return kecil;
    return kecil.charAt(0).toUpperCase() + kecil.slice(1);
  });
}

export function judulEvent(judul: string) {
  let hasil = judul
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Perbaiki kurung tutup yang hilang pada OS2MN 2026
  hasil = hasil.replace(
    /\(Olimpiade Sains Siswa Madrasah Nasional\s+(20\d{2})$/i,
    "(Olimpiade Sains Siswa Madrasah Nasional) $1",
  );

  // Pastikan ada spasi sebelum kurung buka bila menempel pada huruf/angka
  hasil = hasil.replace(/([A-Za-z0-9])\(/g, "$1 (");

  // Perbaiki penulisan akronim yang tidak konsisten di data warisan
  hasil = hasil
    .replace(/^Wico\s+\(/, "WICO (")
    .replace(/\bIOT\b/g, "IoT")
    .replace(
      /National Invention Competition For Young Moslem Scientists \(IICYMS\)/i,
      "National Invention Competition for Young Moslem Scientists (NICYMS)",
    );

  return rapikanKapitalJudul(hasil);
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
  const ruas = kota
    .split(",")
    .map((s) => s.trim())
    .filter((s) => Boolean(s) && !/^offline$/i.test(s) && !/^online$/i.test(s));

  if (ruas.length === 0) return null;
  const penuh = ruas.join(", ");
  const tampil = ruas.length > 1 ? ruas[ruas.length - 1] : penuh;
  return { tampil, penuh };
}

/**
 * Bersihkan nama tempat (venue) dari awalan emoji, label ganda, nilai kosong
 * seperti "-" atau "Online", serta salah ketik nama universitas di data lama.
 */
export function tempatBersih(venue: string | null): string | null {
  if (!venue) return null;
  const bersih = venue
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/^\s*(?:Offline\s+Venue|Venue|Lokasi)\s*:\s*/i, "")
    .replace(/\bUniversitas Negri\b/gi, "Universitas Negeri")
    .replace(/\bTun Canselour Malaysia\s*,/gi, "Dewan Tunku Canselor, Universiti Malaya,")
    .replace(/\bSegi University\b/g, "SEGi University")
    .replace(/\s+,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!bersih || bersih === "-" || /^online$/i.test(bersih)) return null;
  return bersih;
}

/**
 * Ekstrak URL sematan Google Maps dari nilai `mapsEmbed` warisan.
 *
 * Di `events.json`, `mapsEmbed` menyimpan seluruh tag HTML `<iframe src="...">`
 * (bahkan beberapa kehilangan `>` penutup), bukan URL mentah. Fungsi ini
 * mengambil atribut `src`-nya agar bisa dipasang dengan aman pada `<iframe src>`.
 */
export function urlPeta(mapsEmbed: string | null): string | null {
  if (!mapsEmbed) return null;
  const trimmed = mapsEmbed.trim();
  if (trimmed.startsWith("https://")) return trimmed;
  const cocok = trimmed.match(/src=["']([^"']+)["']/i);
  return cocok?.[1]?.trim() ?? null;
}

const BULAN_ID_KE_EN: Record<string, string> = {
  Januari: "January",
  Februari: "February",
  Maret: "March",
  April: "April",
  Mei: "May",
  Juni: "June",
  Juli: "July",
  Agustus: "August",
  September: "September",
  Oktober: "October",
  November: "November",
  Desember: "December",
};

const BULAN_EN_KE_ID: Record<string, string> = Object.fromEntries(
  Object.entries(BULAN_ID_KE_EN).map(([id, en]) => [en, id]),
);

const NAMA_BULAN_ID = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const NAMA_BULAN_EN = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Rapikan penulisan tanggal event (salah ketik akhiran urutan bahasa Inggris
 * seperti "13rd", "23th", "21th", "20st", "2th", tanda baca ganda, dan
 * terjemahan nama bulan / keterangan Daring & Luring sesuai bahasa aktif).
 */
export function formatTanggalEvent(
  nilai: string | null,
  locale: "id" | "en" = "id",
): string | null {
  const sah = tanggalSah(nilai);
  if (!sah) return null;

  let hasil = sah
    .replace(/\bfor\s+\((Online|Offline)\)/gi, "($1)")
    .replace(/\b11(?:st|nd|rd)\b/gi, "11th")
    .replace(/\b12(?:st|nd|rd)\b/gi, "12th")
    .replace(/\b13(?:st|nd|rd)\b/gi, "13th")
    .replace(/\b(\d*1)(?:nd|rd|th)\b/gi, (_, d) => (/11$/.test(d) ? `${d}th` : `${d}st`))
    .replace(/\b(\d*2)(?:st|rd|th)\b/gi, (_, d) => (/12$/.test(d) ? `${d}th` : `${d}nd`))
    .replace(/\b(\d*3)(?:st|nd|th)\b/gi, (_, d) => (/13$/.test(d) ? `${d}th` : `${d}rd`))
    .replace(/\b(\d*[04-9])(?:st|nd|rd)\b/gi, "$1th")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (locale === "id") {
    // Dalam bahasa Indonesia: buang akhiran st/nd/rd/th, ubah "Bulan Hari, Tahun" -> "Hari Bulan Tahun"
    hasil = hasil.replace(/\b(\d{1,2})(?:st|nd|rd|th)\b/gi, "$1");
    for (const [en, id] of Object.entries(BULAN_EN_KE_ID)) {
      hasil = hasil.replace(new RegExp(`\\b${en}\\b`, "gi"), id);
    }
    const polaBulan = Object.keys(BULAN_ID_KE_EN).join("|");
    // "Januari 29 - Februari 2, 2026" -> "29 Januari – 2 Februari 2026"
    hasil = hasil.replace(
      new RegExp(`\\b(${polaBulan})\\s+(\\d{1,2})\\s*[-–]\\s*(${polaBulan})\\s+(\\d{1,2}),?\\s*(20\\d{2})`, "g"),
      "$2 $1 – $4 $3 $5",
    );
    // "Agustus 21 - 25, 2024" -> "21 – 25 Agustus 2024"
    hasil = hasil.replace(
      new RegExp(`\\b(${polaBulan})\\s+(\\d{1,2})\\s*[-–]\\s*(\\d{1,2}),?\\s*(20\\d{2})`, "g"),
      "$2 – $3 $1 $4",
    );
    // "Desember 20, 2025" -> "20 Desember 2025"
    hasil = hasil.replace(
      new RegExp(`\\b(${polaBulan})\\s+(\\d{1,2}),?\\s*(20\\d{2})`, "g"),
      "$2 $1 $3",
    );
    // Hilangkan koma sebelum tahun ("21 Mei, 2025" -> "21 Mei 2025")
    hasil = hasil.replace(
      new RegExp(`\\b(${polaBulan}),\\s*(20\\d{2})`, "g"),
      "$1 $2",
    );
    hasil = hasil
      .replace(/\(Online\)/gi, "(Daring)")
      .replace(/\(Offline\)/gi, "(Luring)");
  } else {
    for (const [id, en] of Object.entries(BULAN_ID_KE_EN)) {
      hasil = hasil.replace(new RegExp(`\\b${id}\\b`, "gi"), en);
    }
    hasil = hasil
      .replace(/\(Daring\)/gi, "(Online)")
      .replace(/\(Luring\)/gi, "(Offline)");
  }

  return hasil;
}

/**
 * Format judul edisi Newsletter agar seragam di bahasa Indonesia maupun Inggris.
 * Data warisan mencampur "IYSA Newsletter Juni", "IYSA Newsletter May", dsb. tanpa tahun.
 */
export function judulNewsletter(
  issue: {
    title: string;
    year: number;
    month: number | null;
    batch: number | null;
    kind: "monthly" | "batch" | "other";
  },
  locale: "id" | "en" = "id",
): string {
  if (issue.kind === "monthly" && issue.month && issue.month >= 1 && issue.month <= 12) {
    const bulan = locale === "id" ? NAMA_BULAN_ID[issue.month] : NAMA_BULAN_EN[issue.month];
    return locale === "id"
      ? `Newsletter IYSA — ${bulan} ${issue.year}`
      : `IYSA Newsletter — ${bulan} ${issue.year}`;
  }
  if (issue.kind === "batch" && issue.batch) {
    return locale === "id"
      ? `Newsletter IYSA — Batch ${issue.batch} (${issue.year})`
      : `IYSA Newsletter — Batch ${issue.batch} (${issue.year})`;
  }
  return issue.title;
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

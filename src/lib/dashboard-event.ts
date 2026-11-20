/**
 * Data event dari database dashboard IYSA, lewat API publiknya.
 *
 * ── Kenapa ini ada ──────────────────────────────────────────────────────
 *
 * Sampai sekarang seluruh data event di situs ini hasil kikisan situs lama:
 * tanggalnya kalimat bebas ("2th November - 6th November, 2026 (Offline)"),
 * statusnya ditebak dengan mengurai kalimat itu, dan tidak ada satu pun logo
 * event. Dashboard punya semuanya sebagai kolom sungguhan — dan dashboard
 * yang dipakai panitia sehari-hari, jadi dialah yang benar.
 *
 * ── Cara kerjanya, dan kenapa tidak semua seri muncul ───────────────────
 *
 * `GET /api/public/v1/{akronim}` terbuka tanpa token dan tanpa header. Tapi ia
 * hanya menjawab kalau seri itu sudah punya baris "pin" — penanda edisi mana
 * yang sedang disiarkan. Pin dipasang dari dashboard oleh divisi IT
 * (`PUT /api/event-api/pins`). Tanpa pin, jawabannya 404
 * "Seri ini belum menetapkan edisi yang disiarkan".
 *
 * Jadi seri yang belum dipin BUKAN kesalahan: situs diam-diam kembali memakai
 * data lama untuk seri itu, dan otomatis berpindah ke data dashboard begitu
 * IYSA memasang pinnya. Tidak ada yang perlu diubah di sini saat itu terjadi.
 *
 * ── Gambar ──────────────────────────────────────────────────────────────
 *
 * Dua berkas per edisi: `logo` (lambang ajang) dan `banner` (gambar lebar 3:2,
 * biasanya foto acaranya sendiri — bukan poster). Keduanya disajikan lewat
 * proxy gambar dashboard, yang menerima `?w=` dari daftar tertutup dan
 * menjawabnya sebagai WebP.
 *
 * Edisi yang bannernya kosong mewarisi banner serinya. Pewarisan itu terjadi
 * DI BASIS DATA, bukan di sini — supaya dashboard dan situs menyebut gambar
 * yang sama persis, dan tidak ada dua tempat yang menyimpan aturannya sendiri.
 */

const PANGKAL = "https://api-dashboard.iysa.or.id/api/public/v1";

/**
 * Satu jam. API-nya sendiri menyarankan `s-maxage=3600`, dan yang paling cepat
 * berubah di sini — `pendaftaran_dibuka` — adalah saklar yang dibalik panitia,
 * bukan sesuatu yang berubah tiap menit.
 */
const SEGAR = 3600;

/**
 * Lebar yang diterima proxy gambar dashboard. Daftarnya tertutup — lebar lain
 * diabaikan diam-diam dan berkas aslinya yang dikirim — jadi ia ditulis
 * sebagai tipe supaya nilai di luar daftar ketahuan saat kompilasi, bukan saat
 * pengunjung mengunduh PNG 336 KB.
 */
type LebarSah = 64 | 96 | 128 | 256 | 320 | 640 | 960 | 1280;

export type StatusDashboard = "terbuka" | "akan" | "selesai";

export type EdisiDashboard = {
  id: string;
  akronim: string;
  nama: string;
  tahun: string;
  slug: string;
  logo: string | null;
  /** Gambar lebar 3:2 — foto acara, bukan poster. */
  banner: string | null;
  /**
   * Tautan pendaftaran di situs LAIN, kalau ajang ini tidak mendaftar lewat
   * dashboard. Lihat catatan `bisaDaftar` di bawah.
   */
  pendaftaranUrl: string | null;
  /**
   * Situs resmi ajangnya — gyiif.or.id, iymia.or.id.
   *
   * Tujuan tombol daftar kalau ada, sebelum jatuh ke dasbor. Formulirnya
   * memang ada di sana: ia sisipan yang dilayani dasbor yang sama, jadi
   * mengantar pengunjung ke rumah ajangnya bukan mengalihkan mereka keluar.
   */
  situs: string | null;
  mulai: string | null;
  selesai: string | null;
  pendaftaranBuka: string | null;
  pendaftaranTutup: string | null;
  pendaftaranDibuka: boolean;
  lingkup: "international" | "national" | null;
  moda: "online" | "offline" | "hybrid" | null;
  status: StatusDashboard;
  /** Seluruh tahun edisi yang tercatat untuk seri ini, terbaru dulu. */
  tahunEdisi: string[];
  /** Singkatan lembaga penyelenggara (IYSA, YPBI, IYORA, ICGI); null bila belum ditetapkan. */
  lembaga: string | null;
};

/**
 * Lembaga yang ajangnya tampil di situs IYSA. Seri IYORA (olimpiade) dan ICGI
 * punya portal sendiri; `_seri` tanpa saringan memuat semuanya.
 */
const LEMBAGA_SITUS = new Set(["IYSA", "YPBI"]);
export const milikSitus = (e: EdisiDashboard) => !e.lembaga || LEMBAGA_SITUS.has(e.lembaga.toUpperCase());

type Seksi = { key: string; isi: unknown };

const teks = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
};

/**
 * Tambahkan lebar ke URL gambar dashboard.
 *
 * Bukan penghematan kecil: logo asli dikirim sebagai PNG 336 KB, dan versi
 * `?w=256` keluar sebagai WebP 36 KB — sembilan kali lebih ringan untuk
 * sesuatu yang tidak pernah tampil lebih besar dari itu. Lebar di luar daftar
 * tertutup proxy-nya diabaikan diam-diam, jadi nilainya tidak boleh dikarang.
 */
export function gambarDashboard(url: string, lebar: LebarSah): string {
  return `${url}${url.includes("?") ? "&" : "?"}w=${lebar}`;
}

/**
 * Apakah ajang ini masih bisa didaftari.
 *
 * ── Dua jalur pendaftaran, dua penanda ───────────────────────────────────
 *
 * Sebagian ajang IYSA mendaftar lewat dashboard itu sendiri; sisanya lewat
 * situsnya masing-masing — nyiia.or.id, wice.or.id, isif.or.id, dan
 * seterusnya. Keduanya tidak bisa memakai penanda yang sama:
 *
 *   pendaftaranDibuka → saklar di dashboard. Ia juga yang dipakai backend
 *                       untuk MENERIMA atau MENOLAK pendaftaran, jadi ia
 *                       hanya menyala untuk ajang yang formulirnya di sana.
 *   pendaftaranUrl    → formulirnya di situs lain. Dashboard sengaja
 *                       membiarkan saklarnya mati supaya tidak ada dua pintu
 *                       masuk untuk satu ajang.
 *
 * Karena itu ajang jenis kedua dinilai dari TANGGAL TUTUPNYA. Yang tidak
 * punya tanggal tutup dianggap masih buka selama acaranya belum lewat —
 * situs lama pun menampilkannya begitu.
 */
function bisaDaftar(
  dibuka: boolean,
  url: string | null,
  tutup: string | null,
  akhirAcara: string | null,
  kini: Date,
): boolean {
  if (dibuka) return true;
  if (!url) return false;
  if (tutup) return new Date(`${tutup}T23:59:59Z`) >= kini;
  return akhirAcara ? new Date(`${akhirAcara}T23:59:59Z`) >= kini : false;
}

function hitungStatus(
  terbuka: boolean,
  mulai: string | null,
  selesai: string | null,
  kini: Date,
): StatusDashboard {
  if (terbuka) return "terbuka";
  const akhir = selesai ?? mulai;
  if (akhir && new Date(`${akhir}T23:59:59Z`) < kini) return "selesai";
  return "akan";
}

async function ambilJson(url: string): Promise<unknown | null> {
  try {
    const r = await fetch(url, { next: { revalidate: SEGAR } });
    if (!r.ok) return null; // 404 = seri belum dipin; itu keadaan wajar
    return await r.json();
  } catch {
    // Dashboard tidak terjangkau saat halaman dibangun. Situs tetap harus
    // terbit — pemanggilnya kembali ke data warisan.
    return null;
  }
}

/** Satu seri. `null` kalau serinya belum dipin atau API-nya tidak terjangkau. */
export async function ambilSeriDashboard(akronim: string): Promise<EdisiDashboard | null> {
  const [utama, daftar] = await Promise.all([
    ambilJson(`${PANGKAL}/${encodeURIComponent(akronim)}?sections=identitas,pendaftaran`),
    ambilJson(`${PANGKAL}/${encodeURIComponent(akronim)}/edisi`),
  ]);

  const seksi = (utama as { data?: { sections?: Seksi[] } })?.data?.sections;
  if (!Array.isArray(seksi)) return null;

  const isi = Object.fromEntries(seksi.map((s) => [s.key, s.isi])) as Record<
    string,
    Record<string, unknown> | undefined
  >;
  const id = isi.identitas;
  const daf = isi.pendaftaran;
  if (!id || typeof id.id !== "string") return null;

  const lingkup = teks(id.lingkup);
  const moda = teks(daf?.moda);

  const edisi = (daftar as { data?: { edisi?: { tahun?: string }[] } })?.data?.edisi;
  const tahunEdisi = Array.isArray(edisi)
    ? edisi.map((e) => teks(e.tahun)).filter((x): x is string => x !== null)
    : [];

  const mulai = teks(id.mulai);
  const selesai = teks(id.selesai);
  const tutup = teks(id.pendaftaran_tutup);
  const pUrl = teks(id.pendaftaran_url);
  const kini = new Date();
  const dibuka = bisaDaftar(id.pendaftaran_dibuka === true, pUrl, tutup, selesai ?? mulai, kini);

  return {
    id: id.id,
    akronim: teks(id.akronim) ?? akronim.toUpperCase(),
    nama: teks(id.nama) ?? "",
    tahun: teks(id.tahun) ?? "",
    slug: teks(id.slug) ?? "",
    logo: teks(id.logo),
    banner: teks(id.banner),
    pendaftaranUrl: teks(id.pendaftaran_url),
    situs: teks(id.situs),
    mulai,
    selesai,
    pendaftaranBuka: teks(id.pendaftaran_buka),
    pendaftaranTutup: tutup,
    pendaftaranDibuka: dibuka,
    lingkup: lingkup === "international" || lingkup === "national" ? lingkup : null,
    moda: moda === "online" || moda === "offline" || moda === "hybrid" ? moda : null,
    status: hitungStatus(dibuka, mulai, selesai, kini),
    tahunEdisi,
    lembaga: teks((id.lembaga as Record<string, unknown> | null | undefined)?.singkatan),
  };
}

/**
 * Semua seri sekaligus, satu permintaan.
 *
 * ── Kenapa bukan satu panggilan per seri ─────────────────────────────────
 *
 * Versi pertama memanggil `/{akronim}` untuk tiap akronim yang diketahui
 * situs. Waktu itu hanya tujuh seri yang disiarkan, jadi ongkosnya tak terasa.
 * Setelah seluruh edisi situs lama dipindahkan ke dashboard, jumlahnya jadi
 * enam puluh — seratus dua puluh permintaan untuk merender satu halaman, tiap
 * kali singgahannya kedaluwarsa.
 *
 * `/_seri` mengirim semuanya dalam satu jawaban, hanya ruas yang dipakai untuk
 * memilih dan mendaftar. Yang butuh rincian satu seri tetap memakai
 * `ambilSeriDashboard`.
 */
export async function ambilSemuaSeriDashboard(): Promise<Map<string, EdisiDashboard>> {
  const jawaban = await ambilJson(`${PANGKAL}/_seri`);
  const daftar = (jawaban as { data?: { seri?: Record<string, unknown>[] } })?.data?.seri;
  if (!Array.isArray(daftar)) return new Map();

  const kini = new Date();
  const peta = new Map<string, EdisiDashboard>();
  for (const r of daftar) {
    const akronim = teks(r.akronim);
    const id = teks(r.id);
    if (!akronim || !id) continue;

    const mulai = teks(r.mulai);
    const selesai = teks(r.selesai);
    const tutup = teks(r.pendaftaran_tutup);
    const pUrl = teks(r.pendaftaran_url);
    const lingkup = teks(r.lingkup);
    const moda = teks(r.moda);
    const dibuka = bisaDaftar(r.pendaftaran_dibuka === true, pUrl, tutup, selesai ?? mulai, kini);

    peta.set(akronim.toUpperCase(), {
      id,
      akronim,
      nama: teks(r.nama) ?? "",
      tahun: teks(r.tahun) ?? "",
      slug: teks(r.slug) ?? "",
      logo: teks(r.logo),
      banner: teks(r.banner),
      pendaftaranUrl: pUrl,
      situs: teks(r.situs),
      mulai,
      selesai,
      pendaftaranBuka: teks(r.pendaftaran_buka),
      pendaftaranTutup: tutup,
      pendaftaranDibuka: dibuka,
      lingkup: lingkup === "international" || lingkup === "national" ? lingkup : null,
      moda: moda === "online" || moda === "offline" || moda === "hybrid" ? moda : null,
      status: hitungStatus(dibuka, mulai, selesai, kini),
      tahunEdisi: [],
      lembaga: teks(r.lembaga),
    });
  }
  return peta;
}

/**
 * Pendaftaran edisi sudah ditutup menurut tanggal tutupnya (WIB), walau
 * acaranya belum berlangsung. Edisi seperti ini tidak disebut "akan datang"
 * di situs (2026-11-20, permintaan Pras: I2ASPO/NASPO tutup 3 Nov, acara Des).
 */
export function pendaftaranLewat(e: EdisiDashboard, hariIni: string): boolean {
  return !e.pendaftaranDibuka && e.pendaftaranTutup != null && e.pendaftaranTutup < hariIni;
}

/** Satu edisi dalam daftar seri — bahan kisi edisi di halaman seri. */
export type EdisiRingkas = {
  tahun: string;
  nama: string;
  slug: string | null;
  dipin: boolean;
  /** Status edisi di dasbor (completed, active, published, …). */
  status: string | null;
  logo: string | null;
  banner: string | null;
  mulai: string | null;
  selesai: string | null;
  moda: "online" | "offline" | "hybrid" | null;
};

/**
 * Seluruh edisi satu seri, terbaru dulu, masing-masing dengan bannernya.
 *
 * Draf dibuang: edisi yang belum disetujui (atau salinan kerja ganda seperti
 * NSPC 2027) tidak punya tempat di arsip publik. `null` kalau serinya belum
 * dipin atau API tidak terjangkau — halaman seri lalu kembali ke data warisan.
 */
export async function ambilEdisiDashboard(akronim: string): Promise<EdisiRingkas[] | null> {
  const j = await ambilJson(`${PANGKAL}/${encodeURIComponent(akronim)}/edisi`);
  const edisi = (j as { data?: { edisi?: Record<string, unknown>[] } })?.data?.edisi;
  if (!Array.isArray(edisi)) return null;
  const hasil: EdisiRingkas[] = [];
  const tahunTerpakai = new Set<string>();
  for (const r of edisi) {
    const tahun = teks(r.tahun);
    if (!tahun || teks(r.status) === "draft") continue;
    // Satu kartu per tahun; yang dipin menang bila ada dua baris setahun.
    if (tahunTerpakai.has(tahun) && r.dipin !== true) continue;
    tahunTerpakai.add(tahun);
    const moda = teks(r.moda);
    const baru: EdisiRingkas = {
      tahun,
      nama: teks(r.nama) ?? "",
      slug: teks(r.slug),
      dipin: r.dipin === true,
      status: teks(r.status),
      logo: teks(r.logo),
      banner: teks(r.banner),
      mulai: teks(r.mulai),
      selesai: teks(r.selesai),
      moda: moda === "online" || moda === "offline" || moda === "hybrid" ? moda : null,
    };
    const i = hasil.findIndex((x) => x.tahun === tahun);
    if (i >= 0) hasil[i] = baru;
    else hasil.push(baru);
  }
  return hasil.sort((a, b) => b.tahun.localeCompare(a.tahun));
}

/**
 * Banner seragam buatan dasbor (17 Nov 2026): logo + akronim + tahun di atas
 * latar navy, dipasang untuk edisi yang tidak punya poster asli. Isinya sama
 * persis dengan teks kartu di bawahnya, dan dua belas kartu navy berjejer
 * membuat kisi tampak seragam — jadi kartu situs menggantinya dengan ubin
 * logo ringan. Begitu panitia mengunggah poster asli, nama berkasnya berubah
 * dan poster itu tampil seperti biasa.
 */
export const bannerSeragam = (url: string | null | undefined): boolean =>
  !!url && /\/events\/[^/]+\/banner-\d{13}\.webp(?:[?#]|$)/.test(url);

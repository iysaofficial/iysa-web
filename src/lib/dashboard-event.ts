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
 * ── Yang TIDAK tersedia ─────────────────────────────────────────────────
 *
 * Banner/poster tidak dikirim API publik ini — hanya `logo`. Kolom bannernya
 * ada di basis data (`events.image_url`) tapi tidak pernah ikut dirakit. Satu-
 * satunya jalan tanpa token adalah lewat terjemahan event
 * (`banner_image_url`), dan untuk edisi-edisi ini terjemahannya masih kosong.
 * Karena itu gambar besar di kartu event tetap memakai poster warisan situs
 * lama; logo dari dashboard dipakai sebagai penanda merek di sampingnya.
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
};

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
 * Status pendaftaran.
 *
 * `pendaftaran_dibuka` adalah saklar sungguhan di dashboard dan satu-satunya
 * penentu buka/tutup — backend-nya pun menolak pendaftaran berdasarkan kolom
 * itu, bukan berdasarkan tanggal. Tanggal hanya dipakai untuk membedakan yang
 * "akan datang" dari yang sudah lewat.
 */
function hitungStatus(
  dibuka: boolean,
  mulai: string | null,
  selesai: string | null,
  kini: Date,
): StatusDashboard {
  if (dibuka) return "terbuka";
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
  const dibuka = id.pendaftaran_dibuka === true;

  return {
    id: id.id,
    akronim: teks(id.akronim) ?? akronim.toUpperCase(),
    nama: teks(id.nama) ?? "",
    tahun: teks(id.tahun) ?? "",
    slug: teks(id.slug) ?? "",
    logo: teks(id.logo),
    mulai,
    selesai,
    pendaftaranBuka: teks(id.pendaftaran_buka),
    pendaftaranTutup: teks(id.pendaftaran_tutup),
    pendaftaranDibuka: dibuka,
    lingkup: lingkup === "international" || lingkup === "national" ? lingkup : null,
    moda: moda === "online" || moda === "offline" || moda === "hybrid" ? moda : null,
    status: hitungStatus(dibuka, mulai, selesai, new Date()),
    tahunEdisi,
  };
}

/**
 * Semua seri yang bisa diambil, dipetakan menurut akronim huruf besar.
 *
 * Dipanggil dengan seluruh akronim yang diketahui situs, lalu yang menjawab
 * 404 dibuang. Permintaannya berbarengan dan jawabannya disinggahi sejam, jadi
 * biayanya satu gelombang per jam, bukan per kunjungan.
 */
export async function ambilSemuaSeriDashboard(
  akronim: string[],
): Promise<Map<string, EdisiDashboard>> {
  const unik = [...new Set(akronim.map((a) => a.toUpperCase()))];
  const hasil = await Promise.all(unik.map((a) => ambilSeriDashboard(a)));
  return new Map(
    hasil.filter((x): x is EdisiDashboard => x !== null).map((x) => [x.akronim.toUpperCase(), x]),
  );
}

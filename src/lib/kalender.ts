/**
 * Kalender kegiatan — dari dasbor IYSA (`GET /api/public/v1/_kalender`).
 *
 * Isinya jadwal kegiatan peserta (opening, penjurian, awarding) dan tanggal
 * penting (tutup pendaftaran, batas bayar, pengumuman) semua edisi IYSA/YPBI.
 * Panitia mengubahnya di dasbor (Setting tanggal edisi); situs ini mengikuti
 * paling lambat 15 menit kemudian. Tonggak kerja panitia tidak ikut.
 */

const PANGKAL = process.env.IYSA_API_BASE ?? "https://api-dashboard.iysa.or.id/api/public/v1";
const SEGAR = 900;

export type AgendaKalender = {
  tanggal: string;
  judul: string;
  /** 'kegiatan' = acara; 'penting' = tanggal penting (tutup pendaftaran, pengumuman). */
  jenis: "kegiatan" | "penting";
  jalur: string;
  lokasi: string;
  jam_mulai: string;
  jam_selesai: string;
};

export type EdisiKalender = {
  akronim: string;
  nama: string;
  tahun: string;
  slug: string;
  logo: string | null;
  situs: string | null;
  mulai: string | null;
  selesai: string | null;
  moda: string | null;
  lingkup: string | null;
  pendaftaran_dibuka: boolean;
  agenda: AgendaKalender[];
};

/** Satu entri kalender: agenda + edisi pemiliknya. */
export type Entri = AgendaKalender & { edisi: EdisiKalender };

/** `bahasa` = bahasa halaman: judul kegiatan diterjemahkan dasbor (tersimpan, lalu glosarium). */
export async function ambilKalender(dari: string, sampai: string, bahasa: "id" | "en"): Promise<EdisiKalender[] | null> {
  try {
    const r = await fetch(`${PANGKAL}/_kalender?lembaga=IYSA,YPBI&dari=${dari}&sampai=${sampai}&bahasa=${bahasa}`, {
      next: { revalidate: SEGAR, tags: ["kalender"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { status?: string; data?: { edisi?: EdisiKalender[] } };
    return j.status === "success" && Array.isArray(j.data?.edisi) ? j.data!.edisi! : null;
  } catch {
    return null;
  }
}

/** "2026-11" → { tahun, bulan } yang sah; selain itu bulan berjalan (WIB). */
export function bacaBulan(v: string | undefined, kini = new Date()) {
  const m = v?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const t = Number(m[1]), b = Number(m[2]);
    if (t >= 2018 && t <= 2100 && b >= 1 && b <= 12) return { tahun: t, bulan: b };
  }
  const [t, b] = kini.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }).split("-").map(Number);
  return { tahun: t, bulan: b };
}

export const kunciBulan = (tahun: number, bulan: number) => `${tahun}-${String(bulan).padStart(2, "0")}`;

export function geserBulan(tahun: number, bulan: number, langkah: number) {
  const d = new Date(Date.UTC(tahun, bulan - 1 + langkah, 1));
  return { tahun: d.getUTCFullYear(), bulan: d.getUTCMonth() + 1 };
}

/** Sel kisi bulan (Senin pertama), 5 atau 6 minggu. `null` = di luar bulan. */
export function kisiBulan(tahun: number, bulan: number): (string | null)[] {
  const pertama = new Date(Date.UTC(tahun, bulan - 1, 1));
  const geser = (pertama.getUTCDay() + 6) % 7; // Senin = 0
  const jumlah = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  const sel: (string | null)[] = Array(geser).fill(null);
  for (let h = 1; h <= jumlah; h++) sel.push(`${kunciBulan(tahun, bulan)}-${String(h).padStart(2, "0")}`);
  while (sel.length % 7) sel.push(null);
  return sel;
}

/** Ratakan edisi → entri per tanggal, urut tanggal lalu akronim. */
export function ratakan(edisi: EdisiKalender[]): Entri[] {
  return edisi
    .flatMap((e) => e.agenda.map((a) => ({ ...a, edisi: e })))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.edisi.akronim.localeCompare(b.edisi.akronim));
}

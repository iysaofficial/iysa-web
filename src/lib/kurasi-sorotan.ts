/**
 * Hasil kurasi Puspresnas per edisi dari dasbor (Divisi RnD › Curation /
 * Proses Kurasi, tabel `event_kurasi_progres`), lewat `GET /_kurasi`.
 *
 * Seksi kurasi beranda (2026-11-20, permintaan Pras) memakai angka dan
 * sorotan per event dari sini, menggantikan angka tarikan SIMT statis
 * (`content/generated/kurasi-simt.json`, kini hanya cadangan bila dasbor
 * tidak terjangkau).
 */

const PANGKAL = "https://api-dashboard.iysa.or.id/api/public/v1";
const SEGAR = 900;

export type EdisiKurasiRingkas = {
  akronim: string;
  nama: string;
  tahun: string;
  slug: string;
  logo: string | null;
  status: string;
  selesai: boolean;
  bintang: number | null;
  skor: number | null;
  tanggal: string | null;
};

export type RingkasanKurasi = {
  seri: number;
  edisi: number;
  tahunAwal: string;
  sedang: number;
  /** Edisi terbaik tiap seri yang sudah berbintang, hasil terbesar dulu. */
  sorotan: EdisiKurasiRingkas[];
};

export async function ambilRingkasanKurasi(batas = 8): Promise<RingkasanKurasi | null> {
  try {
    const r = await fetch(`${PANGKAL}/_kurasi?lembaga=IYSA,YPBI`, { next: { revalidate: SEGAR } });
    if (!r.ok) return null;
    const j = (await r.json()) as { data?: { edisi?: EdisiKurasiRingkas[] } };
    const semua = j.data?.edisi;
    if (!Array.isArray(semua) || semua.length === 0) return null;

    const selesai = semua.filter((e) => e.selesai);
    if (selesai.length === 0) return null;
    const tahunAwal = selesai.map((e) => e.tahun).filter(Boolean).sort()[0] ?? "";

    /* Satu kartu per seri: edisi dengan hasil terbaik (bintang, lalu skor,
       lalu tahun terbaru). Urutan kartu: hasil terbesar dulu (permintaan
       Pras, 2026-11-20). */
    const lebihBaik = (a: EdisiKurasiRingkas, b: EdisiKurasiRingkas) =>
      (b.bintang ?? 0) - (a.bintang ?? 0) || (b.skor ?? 0) - (a.skor ?? 0) || b.tahun.localeCompare(a.tahun);
    const perSeri = new Map<string, EdisiKurasiRingkas>();
    for (const e of selesai) {
      if (!e.bintang || e.bintang < 1) continue;
      const ada = perSeri.get(e.akronim);
      if (!ada || lebihBaik(e, ada) < 0) perSeri.set(e.akronim, e);
    }
    const sorotan = [...perSeri.values()].sort(lebihBaik).slice(0, batas);

    return {
      seri: new Set(selesai.map((e) => e.akronim)).size,
      edisi: selesai.length,
      tahunAwal,
      sedang: semua.filter((e) => !e.selesai).length,
      sorotan,
    };
  } catch {
    return null;
  }
}

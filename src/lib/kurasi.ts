/**
 * Kurasi Puspresnas — dari dasbor IYSA.
 *
 * Dua seksi API publik per seri (sama dengan portal NESF/IESF dan gelembung
 * kurasi.js di situs-situs event IYSA):
 *
 *   - `kurasi_progres` : linimasa pengajuan kurasi ke Puspresnas per edisi,
 *                        dicatat tim RnD di dasbor.
 *   - `berkas_kurasi`  : berkas kurasi satu edisi yang ditandai boleh disiarkan.
 *
 * Daftar seri = seri berlembaga IYSA yang sudah dipin (`_seri?lembaga=IYSA`).
 * Seri yang belum dipin tidak menjawab dan tidak ikut tampil — itu bukan galat.
 *
 * Setiap pembacaan menelan kegagalan: halaman tetap ter-render (kosong atau
 * dengan arsip Drive lama) kalau dasbor sedang tidak menjawab.
 */

const PANGKAL = process.env.IYSA_API_BASE ?? "https://api-dashboard.iysa.or.id/api/public/v1";
const SEGAR = 900; // 15 menit

export type Nada = "selesai" | "berjalan" | "gagal" | "belum";

export interface LangkahKurasi {
  langkah: string;
  label: string;
  tercatat: boolean;
  status: string | null;
  nada: Nada;
  terjadi_pada: string | null;
  catatan: string | null;
  diperbarui?: string | null;
  bintang: number | null;
  skor: number | null;
}
export interface EdisiKurasi { tahun: string; persiapan: boolean; isi: LangkahKurasi[] }
export interface BerkasKurasi { slot: string; jenis: string; nama: string; url: string | null; kategori: string | null }
export interface ButirKurasi { nomor: number; butir: string; berkas: BerkasKurasi[] }

export interface SeriKurasi {
  akronim: string;
  /** Segmen URL: huruf kecil, selain huruf/angka jadi "-" ("IWC & I3C" → "iwc-i3c"). */
  slug: string;
  nama: string;
  logo: string | null;
  edisi: EdisiKurasi[];
}

export const slugSeri = (akronim: string) =>
  akronim.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function ambil<T>(jalur: string): Promise<T | null> {
  try {
    const r = await fetch(`${PANGKAL}/${jalur}`, {
      next: { revalidate: SEGAR, tags: ["kurasi"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { status?: string; data?: T };
    return j.status === "error" || j.data == null ? null : j.data;
  } catch {
    return null;
  }
}

type SeksiProgres = {
  sections?: Array<{ key: string; edisi?: string; persiapan?: boolean; isi?: LangkahKurasi[]; edisi_list?: EdisiKurasi[] }>;
};

async function progres(akronim: string): Promise<EdisiKurasi[]> {
  const d = await ambil<SeksiProgres>(`${encodeURIComponent(akronim)}?sections=kurasi_progres`);
  const s = d?.sections?.find((x) => x.key === "kurasi_progres");
  if (!s) return [];
  if (s.edisi_list?.length) return s.edisi_list.filter((e) => e.tahun);
  return s.isi?.length ? [{ tahun: s.edisi ?? "", persiapan: !!s.persiapan, isi: s.isi }] : [];
}

/** Semua seri IYSA yang punya edisi di linimasa kurasi, urut akronim. */
export async function semuaSeriKurasi(): Promise<SeriKurasi[]> {
  const d = await ambil<{ seri: Array<{ akronim: string; nama: string; logo: string | null }> }>("_seri?lembaga=IYSA");
  if (!d?.seri) return [];
  const hasil = await Promise.all(
    d.seri.map(async (s) => ({
      akronim: s.akronim,
      slug: slugSeri(s.akronim),
      nama: s.nama,
      logo: s.logo,
      edisi: await progres(s.akronim),
    })),
  );
  return hasil
    .filter((s) => s.edisi.length > 0)
    .sort((a, b) => a.akronim.localeCompare(b.akronim));
}

export async function seriKurasiBySlug(slug: string) {
  return (await semuaSeriKurasi()).find((s) => s.slug === slug) ?? null;
}

/** Berkas kurasi satu edisi yang boleh disiarkan, per butir. */
export async function berkasEdisi(akronim: string, tahun: string): Promise<ButirKurasi[]> {
  const d = await ambil<{ sections?: Array<{ key: string; isi: unknown }> }>(
    `${encodeURIComponent(akronim)}?tahun=${encodeURIComponent(tahun)}&sections=berkas_kurasi`,
  );
  const isi = d?.sections?.find((s) => s.key === "berkas_kurasi")?.isi;
  return Array.isArray(isi) ? (isi as ButirKurasi[]) : [];
}

/**
 * Satu kartu per slot. Dokumen yang terbit per kategori disembunyikan bila
 * slotnya punya berkas gabungan (tanpa kategori / "Semua") — aturan yang sama
 * dengan situs event IYSA dan portal ICGI.
 */
export function berkasTampil(butir: ButirKurasi[]): Array<BerkasKurasi & { nomor: number }> {
  const gabungan = (f: BerkasKurasi) => !f.kategori || f.kategori === "Semua";
  const perSlot = new Map<string, Array<BerkasKurasi & { nomor: number }>>();
  for (const b of butir) for (const f of b.berkas ?? []) {
    if (!f.url) continue;
    perSlot.set(f.slot, [...(perSlot.get(f.slot) ?? []), { ...f, nomor: b.nomor }]);
  }
  const hasil: Array<BerkasKurasi & { nomor: number }> = [];
  for (const berkas of perSlot.values()) {
    const utama = berkas.filter(gabungan);
    hasil.push(...(utama.length > 0 ? utama : berkas));
  }
  return hasil;
}

export const adaCatatan = (e: EdisiKurasi) => !e.persiapan && e.isi.some((k) => k.tercatat !== false);

/** Langkah tercatat paling jauh satu edisi. */
export function ringkasEdisi(ed: EdisiKurasi) {
  const tercatat = ed.isi.filter((k) => k.tercatat !== false);
  const terakhir = tercatat[tercatat.length - 1] ?? null;
  return { terakhir, nomor: terakhir ? ed.isi.indexOf(terakhir) + 1 : 0, total: ed.isi.length };
}

/** Warna tiap nada, dari token situs. */
export const WARNA_NADA: Record<Nada, string> = {
  selesai: "var(--teal)",
  berjalan: "var(--coral)",
  gagal: "var(--coral)",
  belum: "var(--ink-faint)",
};

export function tanggalKurasi(iso: string, locale: "id" | "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta",
  });
}

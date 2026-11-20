/**
 * Master institusi mitra dari dasbor (Divisi Kemitraan › Master Data ›
 * Institusi mitra), lewat `GET /api/public/v1/_mitra`.
 *
 * Seksi partner beranda dan `/mitra#institusi` membaca daftar ini sejak
 * 2026-11-20 (permintaan Pras), menggantikan 59 logo statis peninggalan situs
 * lama. Bila dasbor tidak terjangkau, pemanggil kembali ke data warisan.
 *
 * IYSA sendiri (dan IIIO) tercatat di master (dipakai berkas kerja sama), tapi bukan
 * "mitra" bagi situsnya sendiri, jadi dibuang di sini.
 */

const PANGKAL = "https://api-dashboard.iysa.or.id/api/public/v1";
const SEGAR = 900;

export type MitraMaster = {
  id: string;
  nama: string;
  singkatan: string | null;
  unsur: string;
  cakupan: "nasional" | "internasional" | string;
  lokasi: string | null;
  situs: string | null;
  logo: string | null;
};

/* IIIO juga disembunyikan (2026-11-20, permintaan Pras): ajang IYSA sendiri,
   dan logonya di master adalah gambar logo IYSA. */
const BUKAN_MITRA = new Set([
  "IYSA",
  "INDONESIAN YOUNG SCIENTIST ASSOCIATION",
  "IIIO",
  "INDONESIA INTERNATIONAL IOT OLYMPIAD",
]);

export async function ambilMitraMaster(): Promise<MitraMaster[] | null> {
  try {
    const r = await fetch(`${PANGKAL}/_mitra`, { next: { revalidate: SEGAR } });
    if (!r.ok) return null;
    const j = (await r.json()) as { data?: { mitra?: MitraMaster[] } };
    const daftar = j.data?.mitra;
    if (!Array.isArray(daftar) || daftar.length === 0) return null;
    const iysa = (m: MitraMaster) =>
      BUKAN_MITRA.has((m.singkatan ?? "").toUpperCase()) || BUKAN_MITRA.has(m.nama.toUpperCase());
    return daftar.filter((m) => !iysa(m));
  } catch {
    return null;
  }
}

/** Situs mitra sebagai tautan yang sah, atau null. */
export function situsMitra(m: MitraMaster): string | null {
  const s = (m.situs ?? "").trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

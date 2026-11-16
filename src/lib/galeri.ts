/**
 * Galeri — data dan perapian judul.
 *
 * Foto: album dokumentasi per edisi dari dasbor (`GET /api/public/v1/_dokumentasi`),
 * diunggah panitia lengkap dengan keterangannya.
 * Video: daftar warisan situs lama (videos.json), diputar dari YouTube.
 */

const PANGKAL = process.env.IYSA_API_BASE ?? "https://api-dashboard.iysa.or.id/api/public/v1";

export type FotoAlbum = { gambar: string; label: string; jenis: "luring" | "daring" | "sarpras" | string };
export type Album = {
  akronim: string;
  nama: string;
  tahun: string;
  slug: string;
  logo: string | null;
  mulai: string | null;
  foto: FotoAlbum[];
  tautan: { luring: string | null; daring: string | null; sarpras: string | null };
};

export async function ambilAlbum(): Promise<Album[] | null> {
  try {
    const r = await fetch(`${PANGKAL}/_dokumentasi?lembaga=IYSA,YPBI`, {
      next: { revalidate: 900, tags: ["galeri"] },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { status?: string; data?: { album?: Album[] } };
    return j.status === "success" && Array.isArray(j.data?.album) ? j.data!.album! : null;
  } catch {
    return null;
  }
}

/** Gambar dasbor diperkecil lewat proksi /media (?w= dari daftar tertutup). */
export const kecil = (url: string, w: 320 | 640 | 960 | 1280) => `${url}${url.includes("?") ? "&" : "?"}w=${w}`;

/* Kata umum yang ditulis KAPITAL di judul video warisan. Selain kata-kata ini,
   kata kapital dianggap akronim (ISPC, GLOCOLIS, IYSA) dan dibiarkan. */
const KATA_UMUM = new Set([
  "AFTER", "EVENT", "EVENTS", "OPENING", "CEREMONY", "AWARDING", "AWARD", "AWARDS", "DAY", "ONLINE", "OFFLINE",
  "JUDGING", "HIGHLIGHT", "HIGHLIGHTS", "RECAP", "TEASER", "TRAILER", "OFFICIAL", "VIDEO", "THE", "OF", "AND", "IN",
  "FOR", "WITH", "WINNERS", "WINNER", "ANNOUNCEMENT", "SESSION", "PART", "INTERNATIONAL", "NATIONAL", "COMPETITION",
  "FAIR", "SCIENCE", "INVENTION", "INNOVATION", "YOUNG", "SCIENTIST", "ASSOCIATION", "EXHIBITION", "DOCUMENTATION",
  "ACARA", "PEMBUKAAN", "PENGHARGAAN", "PENJURIAN", "DOKUMENTASI", "DAN", "HARI", "KOMPETISI", "LOMBA",
]);

/** "AFTER EVENT ISPC & GLOCOLIS 2025" → "After Event ISPC & GLOCOLIS 2025". */
export function rapikanJudul(judul: string): string {
  const bersih = judul.replace(/\bNRTC\s*&\s*NRTC\b/g, "NRTC & IRTC").replace(/\s+/g, " ").trim();
  const huruf = bersih.replace(/[^A-Za-z]/g, "");
  if (!huruf || huruf !== huruf.toUpperCase()) return bersih; // bukan judul kapital semua
  return bersih
    .split(" ")
    .map((k, i) => {
      const inti = k.replace(/[^A-Z]/g, "");
      if (!KATA_UMUM.has(inti)) return k;
      const kecilSemua = k.toLowerCase();
      if (i > 0 && ["of", "and", "in", "for", "with", "the", "dan"].includes(kecilSemua)) return kecilSemua;
      return kecilSemua.charAt(0).toUpperCase() + kecilSemua.slice(1);
    })
    .join(" ");
}

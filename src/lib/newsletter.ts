/**
 * Terbitan newsletter — dari dasbor IYSA, dengan cuplikan lama sebagai cadangan.
 *
 * ── Sumber ──────────────────────────────────────────────────────────────
 *
 * `GET /api/public/v1/_newsletter?lembaga=IYSA` (dasbor, sejak 13 Nov 2026):
 * sampul dan PDF yang diunggah panitia ke dasbor. Sebelumnya daftar ini hanya
 * JSON hasil kikisan situs lama dengan PDF di Google Drive.
 *
 * ── Cara menggabungkan ──────────────────────────────────────────────────
 *
 * Terbitan dicocokkan lewat NAMA ("Newsletter July Edition 2023",
 * "Newsletter Batch 3 2026"), bukan tanggal: sebagian kolom tanggal di dasbor
 * salah ketik (edisi Juli 2023 bertanggal 2027). Nama → bulan/batch + tahun →
 * slug yang sama dengan situs lama, jadi alamat yang sudah terindeks tetap
 * hidup.
 *
 * - Terbitan yang ada di keduanya: sampul dan PDF dari dasbor.
 * - Hanya di cuplikan lama (mis. Jan–Mei 2022 tanpa PDF): tetap tampil.
 * - Hanya di dasbor (terbitan baru): ditambahkan.
 *
 * Kalau dasbor tidak menjawab, situs memakai cuplikan lama apa adanya.
 */

import issuesRaw from "@/content/generated/newsletter-issues.json";
import type { NewsletterIssue } from "@/lib/data";
import { coverUrl } from "@/lib/assets";

const PANGKAL = process.env.IYSA_API_BASE ?? "https://api-dashboard.iysa.or.id/api/public/v1";
const SEGAR = 900; // 15 menit

export type Terbitan = NewsletterIssue & {
  /** Sampul dari dasbor (URL penuh). Kosong → pakai `cover` lama. */
  sampul?: string | null;
  /** PDF dari dasbor (URL penuh). */
  pdfUrl?: string | null;
  halaman?: number | null;
  sumber: "dashboard" | "lama";
};

type BarisApi = {
  id: string;
  nama: string;
  halaman: number | null;
  sampul: string | null;
  pdf: string | null;
};

const BULAN: Record<string, number> = {
  january: 1, januari: 1, february: 2, februari: 2, march: 3, maret: 3,
  april: 4, may: 5, mei: 5, june: 6, juni: 6, july: 7, juli: 7,
  august: 8, agustus: 8, september: 9, october: 10, oktober: 10,
  november: 11, december: 12, desember: 12,
};
const SLUG_BULAN = ["", "januari", "februari", "maret", "april", "mei", "juni", "juli",
  "agustus", "september", "oktober", "november", "desember"];
const BULAN_EN = ["", "January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

/** "Newsletter July Edition 2023" → { kind, year, month, batch, slug }. Null bila tak terbaca. */
export function uraiNama(nama: string) {
  const s = nama.toLowerCase();
  const tahun = s.match(/\b(20\d{2})\b/);
  if (!tahun) return null;
  const year = Number(tahun[1]);
  const batch = s.match(/batch\s*(\d+)/);
  if (batch) {
    const n = Number(batch[1]);
    return { kind: "batch" as const, year, month: null, batch: n, slug: `edisi-batch-${n}-${year}` };
  }
  for (const kata of s.split(/[^a-z]+/)) {
    const m = BULAN[kata];
    if (m) return { kind: "monthly" as const, year, month: m, batch: null, slug: `${SLUG_BULAN[m]}-${year}` };
  }
  return null;
}

const lama = (issuesRaw as NewsletterIssue[]).map((i): Terbitan => ({ ...i, sumber: "lama" }));

async function ambilApi(): Promise<BarisApi[] | null> {
  try {
    const r = await fetch(`${PANGKAL}/_newsletter?lembaga=IYSA`, {
      next: { revalidate: SEGAR, tags: ["newsletter"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { status?: string; data?: { newsletter?: BarisApi[] } };
    return j.status === "success" && Array.isArray(j.data?.newsletter) ? j.data!.newsletter! : null;
  } catch {
    return null;
  }
}

function urut(a: Terbitan, b: Terbitan) {
  if (a.year !== b.year) return b.year - a.year;
  // Batch terbit sesudah edisi bulanan di tahun yang sama (2025: Jan–Jun, lalu Batch 1–4).
  const ka = a.batch ? 100 + a.batch : (a.month ?? 0);
  const kb = b.batch ? 100 + b.batch : (b.month ?? 0);
  return kb - ka;
}

/** Semua terbitan, terbaru dulu. */
export async function semuaTerbitan(): Promise<{ terbitan: Terbitan[]; sumber: "dashboard" | "lama" }> {
  const api = await ambilApi();
  if (!api) return { terbitan: [...lama].sort(urut), sumber: "lama" };

  const peta = new Map(lama.map((i) => [i.slug, { ...i }]));
  for (const b of api) {
    const u = uraiNama(b.nama);
    if (!u || !b.pdf) continue;
    const ada = peta.get(u.slug);
    if (ada) {
      peta.set(u.slug, { ...ada, sampul: b.sampul ?? null, pdfUrl: b.pdf, halaman: b.halaman, hasPdf: true, sumber: "dashboard" });
    } else {
      peta.set(u.slug, {
        legacyKey: `dashboard:${b.id}`,
        slug: u.slug,
        year: u.year,
        month: u.month,
        batch: u.batch,
        kind: u.kind,
        title: u.kind === "batch" ? `IYSA Newsletter Batch ${u.batch} ${u.year}` : `IYSA Newsletter ${BULAN_EN[u.month!]}`,
        cover: null,
        driveId: null,
        pdfPreview: null,
        hasPdf: true,
        sampul: b.sampul ?? null,
        pdfUrl: b.pdf,
        halaman: b.halaman,
        sumber: "dashboard",
      });
    }
  }
  return { terbitan: [...peta.values()].sort(urut), sumber: "dashboard" };
}

export async function terbitanBySlug(slug: string) {
  return (await semuaTerbitan()).terbitan.find((i) => i.slug === slug) ?? null;
}

/** Sampul yang ditampilkan: dasbor dulu, lalu aset lama. */
export const sampulTerbitan = (i: Terbitan) => i.sampul ?? coverUrl(i.cover);

/**
 * Alamat PDF untuk dibaca di halaman (sematan) dan untuk diunduh.
 *
 * PDF dasbor besar (median 35 MB, terbesar 78 MB) dan sematan <iframe> akan
 * mengunduhnya utuh setiap kali halaman dibuka. Pratinjau Google Drive
 * mengalirkan per halaman, jadi ia tetap dipakai untuk membaca di tempat bila
 * ada; unduhan selalu dari dasbor. Terbitan yang hanya ada di dasbor tidak
 * disematkan — pembaca membukanya lewat tombol.
 */
export function pdfTerbitan(i: Terbitan): { sematan: string | null; unduh: string | null } {
  const drive = i.hasPdf && i.pdfPreview ? i.pdfPreview : null;
  const driveView = i.driveId ? `https://drive.google.com/file/d/${i.driveId}/view` : null;
  return { sematan: drive, unduh: i.pdfUrl ?? (drive ? driveView : null) };
}

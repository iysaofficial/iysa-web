/**
 * Klien API dasbor.
 *
 * Keadaan saat berkas ini ditulis (13 September 2026): seluruh rute di bawah
 * /api/public/v1 menjawab dengan satu galat yang sama —
 *
 *   {"status":"error","code":"seri_ini_belum_menetapkan_edisi_yang_disiarkan"}
 *
 * Host hidup (/health → 200) dan header X-Organization-Slug: iysa diterima,
 * tapi tidak ada seri yang menetapkan edisi siaran, jadi API publik belum
 * mengeluarkan data apa pun. Itu urusan konfigurasi di sisi dasbor.
 *
 * Karena itu setiap pembacaan di sini MEMBUNGKUS kegagalan, bukan melemparnya:
 * halaman tetap ter-render dari cuplikan statis hasil migrasi, dan begitu
 * dasbor menyiarkan edisinya, sumber data berpindah tanpa mengubah halaman.
 * `source` pada hasil menyatakan dari mana data datang, supaya ini bisa
 * diperiksa di produksi alih-alih ditebak.
 */

const BASE = process.env.IYSA_API_BASE ?? "https://api-dashboard.iysa.or.id/api/public/v1";
const SLUG = process.env.IYSA_API_ORG_SLUG ?? "iysa";

/** Berapa lama hasil API ditahan sebelum diambil ulang. */
const REVALIDATE = 900; // 15 menit

export type Source = "api" | "snapshot";

export type Result<T> = {
  data: T;
  source: Source;
  /** Terisi kalau API gagal — dipakai halaman diagnostik, tidak pernah tampil ke pengunjung. */
  error?: string;
};

type FetchOptions = {
  /** Dipakai untuk revalidasi bertarget lewat revalidateTag(). */
  tags?: string[];
};

/**
 * Satu-satunya tempat situs ini menyentuh jaringan.
 *
 * Mengembalikan null — tidak pernah melempar — supaya satu endpoint yang mati
 * tidak menjatuhkan seluruh halaman. Pemanggil wajib menyediakan cadangan.
 */
async function get<T>(path: string, opts: FetchOptions = {}): Promise<T | null> {
  const url = `${BASE}/${path.replace(/^\//, "")}`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Organization-Slug": SLUG,
        Accept: "application/json",
      },
      next: { revalidate: REVALIDATE, tags: opts.tags },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[api] ${res.status} ${url}`);
      }
      return null;
    }

    const body = (await res.json()) as unknown;

    // Dasbor memakai dua bentuk sampul: {status:"error"} untuk galat domain,
    // dan {result:"Gagal"} untuk galat header. Keduanya datang dengan HTTP 200
    // di sebagian rute, jadi isinya harus diperiksa, bukan cuma status HTTP.
    if (isEnvelopeError(body)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[api] galat domain di ${path}: ${describeError(body)}`);
      }
      return null;
    }

    return unwrap<T>(body);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[api] gagal menghubungi ${url}: ${(err as Error).message}`);
    }
    return null;
  }
}

function isEnvelopeError(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return b.status === "error" || b.result === "Gagal";
}

function describeError(body: unknown): string {
  const b = body as Record<string, unknown>;
  return String(b.message ?? b.detail ?? b.code ?? "tanpa keterangan");
}

/** Lepas sampul {data:…} kalau ada; kalau tidak, pakai badan apa adanya. */
function unwrap<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in (body as object)) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/**
 * Bacaan dengan cadangan. Inilah satu-satunya bentuk yang dipakai halaman.
 *
 *   const { data, source } = await withFallback("events", snapshotEvents, map);
 */
export async function withFallback<TApi, TOut>(
  path: string,
  fallback: TOut,
  transform: (api: TApi) => TOut,
  opts: FetchOptions = {},
): Promise<Result<TOut>> {
  const raw = await get<TApi>(path, opts);
  if (raw == null) {
    return { data: fallback, source: "snapshot", error: `tidak ada data dari /${path}` };
  }
  try {
    return { data: transform(raw), source: "api" };
  } catch (err) {
    // Bentuk dari API berubah dan tidak cocok lagi: lebih baik tampilkan
    // cuplikan yang benar daripada halaman rusak.
    return { data: fallback, source: "snapshot", error: `bentuk tak terduga: ${(err as Error).message}` };
  }
}

/** Dipakai halaman /status untuk memeriksa kesehatan API tanpa menebak. */
export async function apiHealth(): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch("https://api-dashboard.iysa.or.id/health", {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const body = await res.text();
    return { ok: res.ok, detail: body.slice(0, 200) };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}

export const apiConfig = { base: BASE, slug: SLUG, revalidate: REVALIDATE };

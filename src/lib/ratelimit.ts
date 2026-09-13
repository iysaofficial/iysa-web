/**
 * Pembatas laju sederhana di memori proses.
 *
 * Bukan pengganti pembatas terdistribusi — pada Vercel setiap instance punya
 * memorinya sendiri, jadi batas nyata adalah batas-ini × jumlah instance. Itu
 * sudah cukup untuk menahan formulir disemprot naskah sederhana, dan tidak
 * menambah layanan pihak ketiga hanya demi dua formulir.
 *
 * Kalau suatu saat formulir jadi sasaran serius, ganti isi fungsi ini dengan
 * Vercel KV; pemanggilnya tidak perlu berubah.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 menit
const MAX = 5;

const hits = new Map<string, number[]>();

export function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  // Jaga peta tidak tumbuh tanpa batas di instance yang hidup lama.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }

  return false;
}

/** Ambil IP pengunjung dari header proxy Vercel. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "tanpa-ip";
}

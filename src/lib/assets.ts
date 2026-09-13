/**
 * Menerjemahkan jalur aset lama ke jalur baru.
 *
 * Data hasil migrasi masih menyimpan jalur seperti
 * "./assets/images/poster/bisf.WebP" — dipertahankan apa adanya supaya bisa
 * dilacak kembali ke sumbernya. Peta di asset-map.json, hasil
 * scripts/build-assets.mjs, yang mengubahnya jadi "/media/poster/bisf.webp".
 *
 * Mengembalikan null untuk berkas yang tidak ada di repo lama (ada tujuh —
 * lihat laporan build-assets). Komponen wajib menangani null, bukan memasang
 * <img> yang pasti 404 seperti situs lama.
 */

import assetMap from "@/content/generated/asset-map.json";

const map = assetMap as Record<string, string>;

export function assetUrl(legacyPath: string | null | undefined): string | null {
  if (!legacyPath) return null;
  const key = legacyPath.replace(/^\.?\//, "");
  return map[key] ?? null;
}

/** Alias yang menyatakan maksud di tempat pemakaian. */
export const posterUrl = assetUrl;
export const coverUrl = assetUrl;
export const logoUrl = assetUrl;
export const photoUrl = assetUrl;

/** Jumlah aset yang rujukannya menggantung — dipakai halaman /status. */
export function assetStats() {
  return { mapped: Object.keys(map).length };
}

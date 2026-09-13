import { defineRouting } from "next-intl/routing";

/**
 * Dua bahasa dengan prefiks rute (/en/..., /id/...).
 *
 * Bukan state di peramban: mesin pencari harus bisa mengindeks kedua versi
 * secara terpisah, dan tautan yang dibagikan harus membuka bahasa yang sama
 * seperti yang dilihat pengirimnya. Situs lama tidak punya bahasa kedua sama
 * sekali padahal separuh eventnya nasional.
 *
 * Bawaan Indonesia — pengunjung terbanyak pelajar Indonesia — tapi prefiks
 * tetap selalu ditulis supaya tidak ada satu URL pun yang ambigu.
 */
export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

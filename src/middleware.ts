import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  /**
   * Lewati apa pun yang bukan halaman berbahasa.
   *
   * `og` WAJIB ada di daftar ini. Tanpa itu, middleware mengalihkan /og ke
   * /id/og dan perakit gambar Open Graph menjawab 307, bukan PNG — sehingga
   * setiap tautan yang dibagikan ke WhatsApp tampil tanpa gambar. Persis
   * masalah yang penulisan ulang ini seharusnya membereskan.
   *
   * Pola `.*\..*` sudah menangkap /sitemap.xml, /robots.txt, dan /favicon.ico
   * karena bertitik; /og tidak bertitik, jadi harus disebut sendiri.
   */
  matcher: ["/((?!api|og|_next|_vercel|.*\\..*).*)"],
};

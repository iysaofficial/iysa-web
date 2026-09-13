import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import legacyRedirects from "./src/content/generated/redirects.json";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const config: NextConfig = {
  reactStrictMode: true,

  // Aset di situs lama disajikan dari repo. Yang baru mengandalkan pengoptimal
  // gambar Next: satu berkas sumber, banyak ukuran, format modern otomatis.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "api-dashboard.iysa.or.id" },
    ],
  },

  async redirects() {
    // 280 redirect dibangun scripts/build-redirects.mjs dari App.js lama.
    // Skrip itu gagal kalau ada satu rute lama tanpa tujuan, jadi daftar ini
    // tidak pernah separuh jadi.
    return legacyRedirects;
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default withNextIntl(config);

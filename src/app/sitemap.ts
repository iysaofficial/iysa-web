import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/seo";
import { allStaticPaths } from "@/lib/nav";
import { allEvents, allIssues, allAffiliates } from "@/lib/data";
import { curation } from "@/content/external";

/**
 * Sitemap. Situs lama tidak punya satu pun — 80 halaman tanpa peta, sehingga
 * mesin pencari harus menemukannya dengan menjelajah tautan saja.
 *
 * Setiap URL terbit dalam dua bahasa, dengan alternates hreflang-nya, supaya
 * versi Indonesia dan Inggris terindeks sebagai halaman setara dan bukan
 * sebagai duplikat.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const paths: { path: string; priority: number }[] = [
    ...allStaticPaths
      // /tim/staf-ahli hanya mengalihkan ke /tim/ahli; halaman pengalihan tidak
      // pantas masuk sitemap.
      .filter((p) => p !== "/tim/staf-ahli")
      .map((p) => ({ path: p, priority: p === "/" ? 1 : 0.7 })),

    ...allEvents().map((e) => ({ path: `/event/${e.slug}`, priority: 0.8 })),
    ...allIssues().map((i) => ({ path: `/newsletter/${i.slug}`, priority: 0.5 })),
    ...allAffiliates().map((a) => ({ path: `/mitra/${a.slug}`, priority: 0.6 })),
    ...curation.folders.map((f) => ({ path: `/kurasi/${f.key}`, priority: 0.4 })),
  ];

  return paths.flatMap(({ path, priority }) =>
    routing.locales.map((locale) => {
      const clean = path === "/" ? "" : path;
      return {
        url: `${siteUrl}/${locale}${clean}`,
        lastModified: now,
        changeFrequency: (path === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
        priority,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${siteUrl}/${l}${clean}`]),
          ),
        },
      };
    }),
  );
}

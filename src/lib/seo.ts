/**
 * Metadata, kanonik, dan hreflang.
 *
 * Situs lama: satu <title> global untuk 80 halaman, tanpa meta description,
 * tanpa Open Graph, tanpa sitemap, tanpa structured data. Delapan puluh
 * halaman tampil identik di hasil pencarian dan saat dibagikan ke WhatsApp.
 *
 * Di sini tiap halaman memanggil `pageMetadata()` dan dapat judul, deskripsi,
 * kanonik, hreflang dua bahasa, dan OG image-nya sendiri.
 */

import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { org, addressLine } from "@/content/org";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://iysa.or.id";

/**
 * Kanonik + hreflang untuk satu path (tanpa prefiks locale).
 * `x-default` menunjuk ke Indonesia, bahasa bawaan situs.
 */
export function alternatesFor(path: string, locale: Locale): Metadata["alternates"] {
  const clean = path === "/" ? "" : `/${path.replace(/^\/|\/$/g, "")}`;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `${siteUrl}/${l}${clean}`;
  languages["x-default"] = `${siteUrl}/${routing.defaultLocale}${clean}`;

  return { canonical: `${siteUrl}/${locale}${clean}`, languages };
}

type PageMetaInput = {
  locale: Locale;
  /** Path tanpa prefiks locale, mis. "event/ospc-2024". */
  path: string;
  title: string;
  description: string;
  /** Judul OG kalau perlu beda dari judul halaman. */
  ogTitle?: string;
  /** Parameter untuk OG image dinamis; kalau kosong, pakai gambar bawaan. */
  og?: { eyebrow?: string; heading?: string; meta?: string };
  /** Halaman yang tidak boleh diindeks (mis. halaman diagnostik). */
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
};

export function pageMetadata({
  locale,
  path,
  title,
  description,
  ogTitle,
  og,
  noIndex,
  type = "website",
  publishedTime,
}: PageMetaInput): Metadata {
  const url = `${siteUrl}/${locale}${path === "/" ? "" : `/${path.replace(/^\//, "")}`}`;

  const ogImage = buildOgUrl({
    eyebrow: og?.eyebrow ?? org.shortName,
    heading: og?.heading ?? title,
    meta: og?.meta,
    locale,
  });

  return {
    title,
    description,
    alternates: alternatesFor(path, locale),
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type,
      url,
      siteName: org.shortName,
      locale: locale === "id" ? "id_ID" : "en_US",
      title: ogTitle ?? title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? title,
      description,
      images: [ogImage],
    },
  };
}

/** OG image dirakit di tepi jaringan oleh app/og/route.tsx. */
export function buildOgUrl(params: {
  eyebrow?: string;
  heading: string;
  meta?: string;
  locale: Locale;
}) {
  const q = new URLSearchParams();
  q.set("h", params.heading.slice(0, 120));
  if (params.eyebrow) q.set("e", params.eyebrow.slice(0, 48));
  if (params.meta) q.set("m", params.meta.slice(0, 64));
  q.set("l", params.locale);
  return `${siteUrl}/og?${q.toString()}`;
}

/* ── structured data ───────────────────────────────────────────────── */

export function organizationJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: org.name,
    alternateName: org.shortName,
    url: `${siteUrl}/${locale}`,
    email: org.email,
    foundingDate: org.founded,
    founder: { "@type": "Person", name: org.founder },
    address: {
      "@type": "PostalAddress",
      streetAddress: `${org.address.street}, ${org.address.district}`,
      addressLocality: org.address.city,
      addressRegion: org.address.region,
      postalCode: org.address.postalCode,
      addressCountry: org.address.country,
    },
    sameAs: org.social.map((s) => s.url),
  };
}

export function eventJsonLd(e: {
  title: string;
  slug: string;
  dates: string | null;
  city: string | null;
  mode: string | null;
  registrationUrl: string | null;
  venueName: string | null;
}, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    url: `${siteUrl}/${locale}/event/${e.slug}`,
    // Tanggal di data lama berupa teks bebas ("1 - 14 Agustus 2024"), belum
    // tanggal terstruktur. Diisi sebagai deskripsi sampai dasbor menyajikan
    // startDate/endDate yang sebenarnya.
    description: e.dates ?? undefined,
    eventAttendanceMode:
      e.mode === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : e.mode === "hybrid"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    location:
      e.mode === "online"
        ? { "@type": "VirtualLocation", url: e.registrationUrl ?? `${siteUrl}/${locale}` }
        : {
            "@type": "Place",
            name: e.venueName ?? e.city ?? "Indonesia",
            address: e.city ?? addressLine,
          },
    organizer: { "@type": "Organization", name: org.name, url: siteUrl },
    ...(e.registrationUrl
      ? { offers: { "@type": "Offer", url: e.registrationUrl, availability: "https://schema.org/InStock" } }
      : {}),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[], locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${siteUrl}/${locale}${t.path === "/" ? "" : `/${t.path.replace(/^\//, "")}`}`,
    })),
  };
}

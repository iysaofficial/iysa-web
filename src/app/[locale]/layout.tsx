import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing, type Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GulirHalus } from "@/components/gulir-halus";
import { ThemeScript } from "@/components/theme-script";
import { TemaTetap } from "@/components/tema-tetap";
import { siteUrl, alternatesFor, organizationJsonLd } from "@/lib/seo";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      // Judul per halaman mengisi %s. Situs lama memakai satu <title> global
      // untuk 80 halaman — semuanya tampil identik di hasil pencarian.
      default: "IYSA — Indonesian Young Scientist Association",
      template: "%s — IYSA",
    },
    description: t("heroBody"),
    applicationName: "IYSA",
    alternates: alternatesFor("/", locale as Locale),
    openGraph: {
      type: "website",
      siteName: "IYSA",
      locale: locale === "id" ? "id_ID" : "en_US",
      alternateLocale: locale === "id" ? "en_US" : "id_ID",
      url: `${siteUrl}/${locale}`,
      title: "IYSA — Indonesian Young Scientist Association",
      description: t("heroBody"),
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
    /*
     * `icons` sengaja TIDAK dideklarasikan di sini.
     *
     * Deklarasi eksplisit MENGGANTIKAN konvensi berkas, bukan menambahinya.
     * Selama baris `icons: { icon: "/favicon.ico" }` ada, Next hanya memancarkan
     * <link> ke favicon.ico dan `src/app/icon.svg` tidak pernah dirujuk sama
     * sekali — peramban modern kehilangan versi vektor yang ikut tema gelap,
     * dan permintaan langsung ke /icon.svg malah dilayani halaman 404 lalu
     * hasilnya ikut tersimpan di cache prerender.
     *
     * Dibiarkan kosong, Next menemukan sendiri favicon.ico, icon.svg, dan
     * apple-icon.png dari src/app/ dan memancarkan ketiganya.
     */
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Wajib supaya komponen server di bawahnya bisa dirender statis.
  setRequestLocale(locale);

  const t = await getTranslations("nav");

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script
          type="application/ld+json"
          // Data organisasi untuk hasil pencarian. Situs lama tidak punya
          // structured data sama sekali.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(locale as Locale)) }}
        />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider>
          <TemaTetap />
          <GulirHalus />
          <a
            href="#isi"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-[var(--navy)] focus:px-4 focus:py-2 focus:text-[var(--on-navy)]"
          >
            {t("skipToContent")}
          </a>
          <SiteHeader />
          <main id="isi">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

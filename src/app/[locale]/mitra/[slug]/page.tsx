import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

import { BackLink, ButtonLink, Pill, Section } from "@/components/ui";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { allAffiliates, affiliateBySlug } from "@/lib/data";
import { logoUrl } from "@/lib/assets";
import { affiliateCopy, affiliateCountry, affiliateNames, unverifiedCountry } from "@/content/affiliates";

/** 13 komponen React → satu rute. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    allAffiliates().map((a) => ({ locale, slug: a.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = affiliateBySlug(slug);
  if (!a) return {};

  const name = affiliateNames[a.slug] ?? a.name;
  const copy = affiliateCopy[a.slug]?.[locale] ?? a.description;
  const country = affiliateCountry[a.slug];

  return pageMetadata({
    locale,
    path: `/mitra/${a.slug}`,
    title: name,
    // Deskripsi dipotong di batas kata, bukan di tengah kata.
    description: copy.replace(/\s+/g, " ").slice(0, 300).replace(/\s\S*$/, ""),
    og: {
      eyebrow: "IYSA",
      heading: name,
      meta: country && !unverifiedCountry.has(a.slug) ? country[locale] : undefined,
    },
    type: "article",
  });
}

export default async function AffiliateDetail({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const a = affiliateBySlug(slug);
  if (!a) notFound();

  const t = await getTranslations("partners");
  const logo = logoUrl(a.logo);
  const name = affiliateNames[a.slug] ?? a.name;
  const copy = affiliateCopy[a.slug]?.[locale] ?? a.description;
  const country = affiliateCountry[a.slug];
  const showCountry = country && !unverifiedCountry.has(a.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              [
                { name: "IYSA", path: "/" },
                { name: t("title"), path: "/mitra" },
                { name, path: `/mitra/${a.slug}` },
              ],
              locale,
            ),
          ),
        }}
      />

      <div className="shell pt-8">
        <BackLink href="/mitra">{t("backToPartners")}</BackLink>
      </div>

      <header className="border-b border-[var(--line)]">
        <div className="shell py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-8">
              {showCountry && <Pill tone="teal">{country[locale]}</Pill>}
              <h1 className="rise mt-4 text-display text-[var(--navy)]">{name}</h1>
              <div className="prose-ink mt-6 text-lead">
                {copy.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {logo && (
              <div className="md:col-span-4 md:pt-2">
                <Image
                  src={logo}
                  alt={name}
                  width={360}
                  height={200}
                  sizes="(max-width: 768px) 60vw, 280px"
                  className="h-auto w-40 object-contain object-left md:w-full md:max-w-[260px]"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Video after-event, kalau ada. */}
      {a.videos.length > 0 && (
        <Section eyebrow={t("afterEvent")} title={a.sections[0] ?? t("afterEvent")}>
          <ul className="grid gap-8 md:grid-cols-2">
            {a.videos.map((id) => (
              <li key={id}>
                <div className="aspect-video overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={`${name} — ${t("afterEvent")}`}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Galeri — tetap di Drive; dokumentasinya tidak dipindah tanpa diminta. */}
      {a.gallery.length > 0 && (
        <Section eyebrow={t("gallery")} title={t("gallery")} sunk>
          <div className="flex flex-wrap gap-3">
            {a.gallery.map((url) => (
              <ButtonLink key={url} href={url} tone="outline" external>
                {t("openGallery")}
              </ButtonLink>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { PageHeader, Pill } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { allAffiliates } from "@/lib/data";
import { logoUrl } from "@/lib/assets";
import { affiliateCopy, affiliateCountry, affiliateNames, unverifiedCountry } from "@/content/affiliates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partners" });
  return pageMetadata({
    locale,
    path: "/mitra",
    title: t("title"),
    description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title"), meta: t("count", { count: allAffiliates().length }) },
  });
}

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("partners");
  const items = allAffiliates();

  return (
    <>
      <PageHeader
        eyebrow={t("international")}
        title={t("title")}
        lead={t("lead")}
        count={items.length}
        countLabel={t("count", { count: items.length })}
      />

      <div className="shell py-12 md:py-16">
        <ul
          className="rise-stagger grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((a) => {
            const logo = logoUrl(a.logo);
            const country = affiliateCountry[a.slug];
            const showCountry = country && !unverifiedCountry.has(a.slug);
            const copy = affiliateCopy[a.slug]?.[locale] ?? a.description;
            const name = affiliateNames[a.slug] ?? a.name;

            return (
              <li key={a.slug} className="bg-[var(--bg)]">
                <Link
                  href={`/mitra/${a.slug}`}
                  className="group flex h-full flex-col gap-4 p-6 transition-colors duration-[var(--gerak-cepat)] hover:bg-[var(--bg-sunk)]"
                >
                  {/* Logo dibatasi tingginya supaya 13 logo berbeda rasio tetap
                      terbaca sebagai satu baris, bukan tinggi-rendah acak. */}
                  <div className="flex h-12 items-start">
                    {logo ? (
                      <Image
                        src={logo}
                        alt=""
                        width={180}
                        height={48}
                        sizes="180px"
                        className="h-12 w-auto object-contain object-left"
                      />
                    ) : (
                      <span className="eyebrow">{name.slice(0, 3).toUpperCase()}</span>
                    )}
                  </div>

                  {showCountry && <Pill tone="teal">{country[locale]}</Pill>}

                  <h2 className="text-[16.5px] leading-snug font-semibold text-[var(--ink)] transition-colors duration-[var(--gerak-cepat)] group-hover:text-[var(--navy)]">
                    {name}
                  </h2>

                  <p className="line-clamp-3 text-[14px] leading-relaxed text-[var(--ink-muted)]">
                    {copy}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

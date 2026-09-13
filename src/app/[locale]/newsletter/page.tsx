import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { PageHeader, Pill, Section } from "@/components/ui";
import { SubscribeForm } from "@/components/subscribe-form";
import { pageMetadata } from "@/lib/seo";
import { allIssues, issueYears, issuesByYear } from "@/lib/data";
import { coverUrl } from "@/lib/assets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsletter" });
  return pageMetadata({
    locale,
    path: "/newsletter",
    title: t("title"),
    description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title"), meta: t("count", { count: allIssues().length }) },
  });
}

export default async function NewsletterIndex({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("newsletter");
  const years = issueYears();

  return (
    <>
      <PageHeader
        eyebrow="Newsletter"
        title={t("title")}
        lead={t("lead")}
        count={allIssues().length}
        countLabel={t("count", { count: allIssues().length })}
        aside={
          <>
            {/* Tautan lompat per tahun — 48 terbitan terlalu banyak untuk digulir buta. */}
            <nav aria-label={t("year")} className="flex flex-wrap gap-1.5 md:justify-end">
              {years.map((y) => (
                <a
                  key={y}
                  href={`#tahun-${y}`}
                  className="tnum rounded-full border border-[var(--border)] px-2.5 py-0.5 font-mono text-[11.5px] text-[var(--ink-muted)] transition-colors duration-[var(--gerak-cepat)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
                >
                  {y}
                </a>
              ))}
            </nav>
          </>
        }
      />

      {years.map((year) => {
        const items = issuesByYear(year);
        return (
          <section key={year} id={`tahun-${year}`} className="scroll-mt-20">
            <div className="shell py-12">
              <div className="mb-8 flex items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
                <h2 className="tnum font-mono text-[26px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">
                  {year}
                </h2>
                <p className="text-[13px] text-[var(--ink-faint)]">
                  {t("count", { count: items.length })}
                </p>
              </div>

              <ul className="rise-stagger grid gap-7 sm:grid-cols-3 lg:grid-cols-5">
                {items.map((issue) => {
                  const cover = coverUrl(issue.cover);
                  return (
                    <li key={issue.slug}>
                      <Link href={`/newsletter/${issue.slug}`} className="group block">
                        <div className="relative aspect-[3/4] overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
                          {cover ? (
                            <Image
                              src={cover}
                              alt={issue.title}
                              fill
                              sizes="(max-width: 640px) 50vw, 20vw"
                              className="object-cover transition-transform duration-[var(--gerak-sedang)] group-hover:scale-[1.03]"
                            />
                          ) : (
                            <span className="absolute inset-0 grid place-items-center px-2 text-center font-mono text-[10.5px] text-[var(--ink-faint)]">
                              {issue.title}
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-[14px] leading-snug font-medium text-[var(--ink)] transition-colors duration-[var(--gerak-cepat)] group-hover:text-[var(--navy)]">
                          {issue.title}
                        </p>
                        {!issue.hasPdf && (
                          <span className="mt-1.5 inline-block">
                            <Pill>{t("noPdfShort")}</Pill>
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}

      <Section eyebrow={t("subscribe")} title={t("subscribe")} lead={t("subscribeLead")} sunk>
        <div className="max-w-md">
          <SubscribeForm />
        </div>
      </Section>
    </>
  );
}

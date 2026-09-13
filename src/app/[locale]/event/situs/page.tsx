import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section, BackLink } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { eventSites } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return pageMetadata({ locale, path: "/event/situs", title: t("sites"), description: t("sitesLead"),
    og: { eyebrow: "IYSA", heading: t("sites"), meta: `${eventSites().length} ${locale === "id" ? "domain" : "domains"}` } });
}

export default async function EventSitesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("events");
  const sites = eventSites();

  return (
    <>
      <div className="shell pt-8"><BackLink href="/event">{t("backToEvents")}</BackLink></div>
      <PageHeader eyebrow="Ekosistem" title={t("sites")} lead={t("sitesLead")}
        aside={
          <div className="flex flex-col gap-1">
            <p className="tnum font-mono text-[34px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">{sites.length}</p>
            <p className="text-[13px] text-[var(--ink-faint)]">{locale === "id" ? "domain terdaftar" : "registered domains"}</p>
          </div>
        }
      />
      <Section>
        {/* Satu-satunya tempat seluruh ekosistem domain IYSA tercatat. */}
        <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => (
            <li key={`${s.name}-${s.url}`} className="bg-[var(--bg)]">
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer"
                   className="group flex h-full flex-col gap-2 p-5 transition-colors duration-150 hover:bg-[var(--bg-sunk)]">
                  <span className="text-[15px] leading-snug font-semibold text-[var(--ink)] group-hover:text-[var(--navy)]">{s.name}</span>
                  {s.type && <span className="eyebrow">{s.type}</span>}
                  <span className="mt-1 truncate font-mono text-[11.5px] text-[var(--teal)]">
                    {s.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                </a>
              ) : (
                <div className="flex h-full flex-col gap-2 p-5">
                  <span className="text-[15px] font-semibold text-[var(--ink)]">{s.name}</span>
                  {s.type && <span className="eyebrow">{s.type}</span>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

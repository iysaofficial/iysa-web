import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section, BackLink, SelPengisi } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { eventSites } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return pageMetadata({ locale, path: "/event/situs", title: t("sites"), description: t("sitesLead"),
    og: { eyebrow: "IYSA", heading: t("sites"), meta: `${eventSites().length} ${t("registeredDomains")}` } });
}

export default async function EventSitesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("events");
  const sites = eventSites();
  const labelTipe = (tipe: string | null) => {
    if (!tipe) return null;
    if (/interna/i.test(tipe)) return t("levelInternational");
    if (/nasional|national/i.test(tipe)) return t("levelNational");
    return tipe;
  };

  return (
    <>
      <div className="shell pt-8"><BackLink href="/event">{t("backToEvents")}</BackLink></div>
      <PageHeader
        eyebrow={t("ecosystemEyebrow")}
        title={t("sites")}
        lead={t("sitesLead")}
        count={sites.length}
        countLabel={t("registeredDomains")}
      />
      <Section>
        {/* Satu-satunya tempat seluruh ekosistem domain IYSA tercatat. */}
        <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => (
            <li key={`${s.name}-${s.url}`} className="bg-[var(--bg)]">
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer"
                   className="group flex h-full flex-col gap-2 p-5 transition-colors duration-[var(--gerak-cepat)] hover:bg-[var(--bg-sunk)]">
                  <span className="font-serif text-[16px] leading-snug font-bold text-[var(--ink)] group-hover:text-[var(--navy)]">{s.name}</span>
                  {s.type && <span className="eyebrow">{labelTipe(s.type)}</span>}
                  <span className="mt-1 truncate font-sans text-[12px] text-[var(--teal)]">
                    {s.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                </a>
              ) : (
                <div className="flex h-full flex-col gap-2 p-5">
                  <span className="font-serif text-[16px] font-bold text-[var(--ink)]">{s.name}</span>
                  {s.type && <span className="eyebrow">{labelTipe(s.type)}</span>}
                </div>
              )}
            </li>
          ))}
          <SelPengisi jumlah={sites.length} kolom={2} />
          <SelPengisi jumlah={sites.length} kolom={3} />
        </ul>
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section, BackLink, MoreLink, SelPengisi } from "@/components/ui";
import { EventCard } from "@/components/event-card";
import { pageMetadata } from "@/lib/seo";
import { eventsByOrigin } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  const p = await getTranslations({ locale, namespace: "partners" });
  return pageMetadata({ locale, path: "/event/afiliasi", title: p("title"), description: t("affiliateNote"),
    og: { eyebrow: "IYSA", heading: p("title") } });
}

export default async function AffiliateEventsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("events");
  const p = await getTranslations("partners");
  // Saring duplikat E-NNOVATE 2025 (legacyId 1 dan 5 memiliki judul, tanggal, dan poster identik)
  const items = eventsByOrigin("affiliate").filter(
    (e) => e.slug !== "international-innovation-summit-2025-e-nnovate-2",
  );

  return (
    <>
      <div className="shell pt-8"><BackLink href="/event">{t("backToEvents")}</BackLink></div>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={p("title")}
        lead={t("affiliateNote")}
        count={items.length}
        countLabel={t("count", { count: items.length })}
      />
      <Section action={<MoreLink href="/mitra">{p("backToPartners")}</MoreLink>}>
        <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <li key={e.slug} className="bg-[var(--bg)]"><EventCard event={e} /></li>
          ))}
          <SelPengisi jumlah={items.length} kolom={2} />
          <SelPengisi jumlah={items.length} kolom={3} />
        </ul>
      </Section>
    </>
  );
}

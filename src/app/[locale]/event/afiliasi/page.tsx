import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section, BackLink, MoreLink } from "@/components/ui";
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
  const items = eventsByOrigin("affiliate");

  return (
    <>
      <div className="shell pt-8"><BackLink href="/event">{t("backToEvents")}</BackLink></div>
      <PageHeader eyebrow="Event" title={p("title")} lead={t("affiliateNote")} />
      <Section action={<MoreLink href="/mitra">{p("backToPartners")}</MoreLink>}>
        <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <li key={e.slug} className="bg-[var(--bg)]"><EventCard event={e} /></li>
          ))}
        </ul>
      </Section>
    </>
  );
}

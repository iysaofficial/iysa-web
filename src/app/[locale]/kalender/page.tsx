import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section, ButtonLink } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { eventCalendar } from "@/content/external";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calendar" });
  return pageMetadata({ locale, path: "/kalender", title: t("title"), description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title"), meta: String(eventCalendar.year) } });
}

export default async function CalendarPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("calendar");

  return (
    <>
      <PageHeader eyebrow={String(eventCalendar.year)} title={t("title")} lead={t("lead")} />
      <Section>
        {/* Satu iframe Heyzine — dan satu-satunya kalender yang situs ini punya.
            Tautan luar disediakan karena iframe pihak ketiga bisa gagal muat
            tanpa memberi tahu apa pun. */}
        <div className="aspect-[4/3] w-full overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)] md:aspect-[16/10]">
          <iframe src={eventCalendar.embedUrl} title={t("title")} loading="lazy" allowFullScreen className="h-full w-full" />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <ButtonLink href={eventCalendar.embedUrl} tone="outline" external>{t("openExternal")}</ButtonLink>
          <p className="max-w-[48ch] text-[13.5px] leading-relaxed text-[var(--ink-faint)]">{t("fallback")}</p>
        </div>
      </Section>
    </>
  );
}

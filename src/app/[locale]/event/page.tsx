import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

import { PageHeader, EmptyState, MoreLink } from "@/components/ui";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { pageMetadata } from "@/lib/seo";
import { filterEvents, eventFacets, allEvents, type EventLevel, type EventMode } from "@/lib/data";

type Search = { level?: string; mode?: string; q?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return pageMetadata({
    locale,
    path: "/event",
    title: t("title"),
    description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title"), meta: t("count", { count: allEvents().length }) },
  });
}

const isLevel = (v?: string): v is EventLevel =>
  v === "national" || v === "international";
const isMode = (v?: string): v is EventMode =>
  v === "online" || v === "onsite" || v === "hybrid";

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations("events");

  const level = isLevel(sp.level) ? sp.level : undefined;
  const mode = isMode(sp.mode) ? sp.mode : undefined;
  const q = sp.q?.trim() || undefined;

  const results = filterEvents({ level, mode, q });
  const facets = eventFacets();
  const filtered = Boolean(level || mode || q);

  return (
    <>
      <PageHeader
        eyebrow="Event"
        title={t("title")}
        lead={t("lead")}
        aside={
          <div className="flex flex-col gap-2">
            <p className="tnum font-mono text-[34px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">
              {results.length}
            </p>
            <p className="text-[13px] text-[var(--ink-faint)]">
              {filtered
                ? `${t("count", { count: results.length })} · ${allEvents().length} ${locale === "id" ? "total" : "in total"}`
                : t("count", { count: results.length })}
            </p>
          </div>
        }
      />

      <div className="shell py-10 md:py-14">
        <EventFilters facets={facets} active={{ level, mode, q }} />

        {results.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title={t("empty")}
              action={<MoreLink href="/event">{t("reset")}</MoreLink>}
            />
          </div>
        ) : (
          <ul className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {results.map((e) => (
              <li key={e.slug} className="bg-[var(--bg)]">
                <EventCard event={e} />
              </li>
            ))}
          </ul>
        )}

        {/* Ekosistem domain — satu-satunya tempat 34 situs event IYSA tercatat. */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-8">
          <div>
            <p className="eyebrow">{t("sites")}</p>
            <p className="mt-2 max-w-[52ch] text-[15px] text-[var(--ink-muted)]">
              {t("sitesLead")}
            </p>
          </div>
          <MoreLink href="/event/situs">{t("sites")}</MoreLink>
        </div>
      </div>
    </>
  );
}

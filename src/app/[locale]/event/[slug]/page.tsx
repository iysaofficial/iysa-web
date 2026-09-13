import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

import { BackLink, ButtonLink, DefList, Pill, Section } from "@/components/ui";
import { pageMetadata, eventJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { allEvents, eventBySlug } from "@/lib/data";
import { posterUrl } from "@/lib/assets";

/**
 * 61 event yang dulu satu komponen per halaman, kini satu rute.
 * generateStaticParams membuat semuanya ter-render saat build.
 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    allEvents().map((e) => ({ locale, slug: e.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const e = eventBySlug(slug);
  if (!e) return {};

  const t = await getTranslations({ locale, namespace: "events" });

  const bits = [
    e.level === "international" ? t("levelInternational") : t("levelNational"),
    e.dates,
    e.city ?? (e.mode === "online" ? t("modeOnline") : null),
  ].filter(Boolean);

  return pageMetadata({
    locale,
    path: `/event/${e.slug}`,
    title: e.title,
    // Deskripsi dibangun dari ruas yang ada — tiap halaman dapat kalimatnya
    // sendiri, bukan satu deskripsi global seperti di situs lama.
    description:
      locale === "id"
        ? `${e.title} — ${bits.join(" · ")}. Diselenggarakan ${e.category ?? "IYSA"}.`
        : `${e.title} — ${bits.join(" · ")}. Organised by ${e.category ?? "IYSA"}.`,
    og: { eyebrow: e.category ?? "IYSA", heading: e.title, meta: bits.join(" · ") },
    type: "article",
  });
}

export default async function EventDetail({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const e = eventBySlug(slug);
  if (!e) notFound();

  const t = await getTranslations("events");
  const poster = posterUrl(e.poster);

  const levelLabel =
    e.level === "international"
      ? t("levelInternational")
      : e.level === "national"
        ? t("levelNational")
        : null;

  const modeLabel =
    e.mode === "online"
      ? t("modeOnline")
      : e.mode === "hybrid"
        ? t("modeHybrid")
        : e.mode === "onsite"
          ? t("modeOnsite")
          : null;

  const rows = [
    e.dates && { label: t("dates"), value: e.dates },
    levelLabel && { label: t("level"), value: levelLabel },
    modeLabel && {
      label: t("mode"),
      value: e.city ? `${modeLabel} · ${e.city}` : modeLabel,
    },
    e.category && { label: t("category"), value: e.category },
    e.venueName && { label: t("venue"), value: e.venueName },
    e.registrationEnds && { label: t("registerEnds", { date: "" }).replace(/\s*$/, ""), value: e.registrationEnds },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(e, locale)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              [
                { name: "IYSA", path: "/" },
                { name: t("title"), path: "/event" },
                { name: e.title, path: `/event/${e.slug}` },
              ],
              locale,
            ),
          ),
        }}
      />

      <div className="shell pt-8">
        <BackLink href="/event">{t("backToEvents")}</BackLink>
      </div>

      <header className="border-b border-[var(--line)]">
        <div className="shell py-10 md:py-14">
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                {levelLabel && (
                  <Pill tone={e.level === "international" ? "teal" : "navy"}>{levelLabel}</Pill>
                )}
                {modeLabel && <Pill>{modeLabel}</Pill>}
                {e.origin === "affiliate" && <Pill tone="coral">{t("filterAll")}</Pill>}
              </div>

              <h1 className="rise mt-4 text-display text-[var(--navy)]">{e.title}</h1>

              {e.origin === "affiliate" && (
                <p className="mt-4 max-w-[52ch] text-[15px] text-[var(--ink-muted)]">
                  {t("affiliateNote")}
                </p>
              )}

              <div className="mt-8">
                {e.registrationUrl ? (
                  <ButtonLink href={e.registrationUrl} tone="primary" external>
                    {t("register")}
                  </ButtonLink>
                ) : (
                  <p className="text-[14px] text-[var(--ink-faint)]">{t("registerClosed")}</p>
                )}
              </div>

              {e.hashtags.length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-x-3 gap-y-1.5">
                  {e.hashtags.map((h) => (
                    <li key={h} className="font-mono text-[12px] text-[var(--ink-faint)]">
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Poster: satu gambar per halaman, lewat pengoptimal Next. */}
            {poster && (
              <div className="md:col-span-5">
                <Image
                  src={poster}
                  alt={e.title}
                  width={900}
                  height={1200}
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="h-auto w-full border border-[var(--line)]"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <Section>
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <DefList items={rows} />
          </div>

          {(e.mapsEmbed || e.mapsUrl) && (
            <div className="md:col-span-5">
              <p className="eyebrow mb-3">{t("location")}</p>
              {e.mapsEmbed && (
                <iframe
                  src={e.mapsEmbed}
                  title={e.venueName ?? t("location")}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-[4/3] w-full border border-[var(--line)]"
                />
              )}
              {e.mapsUrl && (
                <a
                  href={e.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-[14px] text-[var(--teal)] underline decoration-1 underline-offset-2"
                >
                  {t("viewMaps")}
                </a>
              )}
            </div>
          )}
        </div>
      </Section>
    </>
  );
}

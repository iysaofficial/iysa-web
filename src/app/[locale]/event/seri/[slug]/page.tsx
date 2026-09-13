import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

import { PageHeader, Section, BackLink } from "@/components/ui";
import { EventCard } from "@/components/event-card";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { allEvents } from "@/lib/data";
import { kelompokkanSeri, seriBySlug } from "@/lib/event-seri";

/**
 * Satu seri beserta seluruh edisinya.
 *
 * Empat puluh lima halaman — satu per seri — yang sebelumnya tidak ada sama
 * sekali. Sebelum ini, orang yang mencari "WICE" hanya menemukan tiga kartu
 * terserak di daftar 66 event, tanpa cara melihat bahwa ketiganya satu seri
 * yang sudah berjalan tiga tahun.
 *
 * Serinya disimpulkan dari judul, bukan dari data: `events.json` tidak punya
 * medan seri maupun nomor edisi. Kalau dasbor nanti menyiarkan strukturnya
 * lewat `/api/public/v1`, halaman ini seharusnya membaca dari sana.
 */

export function generateStaticParams() {
  const seri = kelompokkanSeri(allEvents());
  return routing.locales.flatMap((locale) => seri.map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const seri = seriBySlug(allEvents(), slug);
  if (!seri) return {};

  const t = await getTranslations({ locale, namespace: "events" });
  const judul = seri.nama ? `${seri.akronim} — ${seri.nama}` : seri.akronim;

  return pageMetadata({
    locale,
    path: `event/seri/${slug}`,
    title: judul,
    description: seri.nama
      ? `${seri.nama}. ${t("editions", { count: seri.edisi.length })}.`
      : t("editions", { count: seri.edisi.length }),
    og: {
      eyebrow: t("seriesOne"),
      heading: seri.akronim,
      meta: t("editions", { count: seri.edisi.length }),
    },
  });
}

export default async function SeriPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const seri = seriBySlug(allEvents(), slug);
  if (!seri) notFound();

  const t = await getTranslations("events");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              [
                { name: t("title"), path: "/event" },
                { name: seri.akronim, path: `/event/seri/${seri.slug}` },
              ],
              locale,
            ),
          ),
        }}
      />

      <PageHeader
        eyebrow={t("seriesOne")}
        title={seri.akronim}
        lead={seri.nama ?? undefined}
        aside={
          <div className="flex flex-col gap-1">
            <p className="tnum font-mono text-[34px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">
              {seri.edisi.length}
            </p>
            <p className="text-[13px] text-[var(--ink-faint)]">
              {t("editions", { count: seri.edisi.length })}
            </p>
          </div>
        }
      />

      <Section>
        <div className="mb-8">
          <BackLink href="/event">{t("backToSeries")}</BackLink>
        </div>

        <ul className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3">
          {seri.edisi.map((e) => (
            <li key={e.slug} className="bg-[var(--bg)]">
              <EventCard event={e} />
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

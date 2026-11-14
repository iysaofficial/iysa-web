import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

import { BackLink, ButtonLink, DefList, Pill, Section } from "@/components/ui";
import { pageMetadata, eventJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { allEvents, eventBySlug } from "@/lib/data";
import { posterUrl, assetUrl } from "@/lib/assets";
import {
  judulEvent,
  kotaSingkat,
  tempatBersih,
  urlPeta,
  formatTanggalEvent,
} from "@/lib/teks-event";
import { statusEvent } from "@/lib/event-seri";

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
  const judul = judulEvent(e.title);
  const kota = kotaSingkat(e.city);
  const tanggal = formatTanggalEvent(e.dates, locale);

  const bits = [
    e.level === "international" ? t("levelInternational") : t("levelNational"),
    tanggal,
    kota?.tampil ?? (e.mode === "online" ? t("modeOnline") : null),
  ].filter(Boolean);

  return pageMetadata({
    locale,
    path: `/event/${e.slug}`,
    title: judul,
    // Deskripsi dibangun dari ruas yang ada — tiap halaman dapat kalimatnya
    // sendiri, bukan satu deskripsi global seperti di situs lama.
    description:
      locale === "id"
        ? `${judul} — ${bits.join(" · ")}. Diselenggarakan ${e.category ?? "IYSA"}.`
        : `${judul} — ${bits.join(" · ")}. Organised by ${e.category ?? "IYSA"}.`,
    og: { eyebrow: e.category ?? "IYSA", heading: judul, meta: bits.join(" · ") },
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
  const judul = judulEvent(e.title);
  const kota = kotaSingkat(e.city);
  const tempat = tempatBersih(e.venueName);
  const tanggalAcara = formatTanggalEvent(e.dates, locale);
  const tanggalTutup = formatTanggalEvent(e.registrationEnds, locale);
  const petaEmbed = urlPeta(e.mapsEmbed);
  const status = statusEvent(e);
  const poster = posterUrl(e.poster);
  // 27 dari 30 rujukan foto venue benar-benar ada; tiga sisanya null dan
  // blok fotonya tidak dirender sama sekali.
  const venue = assetUrl(e.venueImage);

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
    tanggalAcara && { label: t("dates"), value: tanggalAcara },
    levelLabel && { label: t("level"), value: levelLabel },
    modeLabel && {
      label: t("mode"),
      value: kota ? `${modeLabel} · ${kota.penuh}` : modeLabel,
    },
    e.category && { label: t("category"), value: e.category },
    tempat && { label: t("venue"), value: tempat },
    tanggalTutup && { label: t("registrationDeadline"), value: tanggalTutup },
  ].filter(Boolean) as { label: string; value: string }[];

  const adalahSitusResmi =
    Boolean(e.registrationUrl) &&
    !/docs\.google\.com\/forms|forms\.gle|bit\.ly/i.test(e.registrationUrl ?? "");

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
                { name: judul, path: `/event/${e.slug}` },
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
                {e.origin === "affiliate" && <Pill tone="navy">{t("originAffiliate")}</Pill>}
                <Pill tone={status === "terbuka" ? "teal" : status === "akan" ? "coral" : "neutral"}>
                  {status === "terbuka"
                    ? t("statusOpen")
                    : status === "akan"
                      ? t("statusUpcoming")
                      : t("statusDone")}
                </Pill>
              </div>

              <h1 className="rise mt-4 font-serif text-display text-[var(--navy)]">{judul}</h1>

              {e.origin === "affiliate" && (
                <p className="mt-4 max-w-[52ch] text-[15px] text-[var(--ink-muted)]">
                  {t("affiliateNote")}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-4">
                {status !== "selesai" && e.registrationUrl ? (
                  <ButtonLink href={e.registrationUrl} tone="primary" external>
                    {t("register")}
                  </ButtonLink>
                ) : (
                  <>
                    <p className="text-[14px] text-[var(--ink-faint)]">{t("registerClosed")}</p>
                    {adalahSitusResmi && e.registrationUrl && (
                      <ButtonLink href={e.registrationUrl} tone="outline" external>
                        {t("visitSite")}
                      </ButtonLink>
                    )}
                  </>
                )}
              </div>

              {e.hashtags.length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-x-3 gap-y-1.5">
                  {e.hashtags.map((h) => (
                    <li key={h} className="font-sans text-[12px] text-[var(--ink-faint)]">
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
                  alt={judul}
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

          {(petaEmbed || e.mapsUrl || venue) && (
            <div className="md:col-span-5">
              <p className="eyebrow mb-3">{t("location")}</p>

              {/*
                Foto venue. Sudah ikut migrasi aset sejak awal — 27 event
                punya — tapi belum pernah dirender karena rasionya tidak
                seragam: sebagian potret gedung, sebagian lencana kampus,
                tersebar di tiga folder berbeda.

                Kotak rasio tetap 16:9 dengan `object-cover` menyelesaikan itu
                tanpa perlu menyentuh berkasnya: apa pun rasio aslinya, yang
                tampil selalu pita selebar kolom. Gambar yang terpotong lebih
                baik daripada baris yang tinggi-rendah acak — dan foto venue
                di sini keterangan, bukan subjek.
              */}
              {venue && (
                <Image
                  src={venue}
                  alt=""
                  width={640}
                  height={360}
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="mb-3 aspect-video w-full border border-[var(--line)] object-cover"
                />
              )}

              {petaEmbed && (
                <iframe
                  src={petaEmbed}
                  title={tempat ?? t("location")}
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

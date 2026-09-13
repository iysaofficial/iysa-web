import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

import { PageHeader, EmptyState, MoreLink, Section } from "@/components/ui";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { SeriBaris } from "@/components/seri-baris";
import { pageMetadata } from "@/lib/seo";
import { filterEvents, eventFacets, allEvents, type EventLevel, type EventMode } from "@/lib/data";
import { statusEvent, waktuEvent, kelompokkanSeri } from "@/lib/event-seri";

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

const isLevel = (v?: string): v is EventLevel => v === "national" || v === "international";
const isMode = (v?: string): v is EventMode =>
  v === "online" || v === "onsite" || v === "hybrid";

/**
 * Halaman event.
 *
 * ── Kenapa susunannya begini ─────────────────────────────────────────────
 *
 * Versi sebelumnya: 66 kartu dalam satu kisi rata, diurutkan menurut ID
 * internal, sehingga event 2024 dan 2026 berselang-seling. Tidak ada cara
 * menjawab dua pertanyaan yang paling sering dibawa pengunjung — "apa yang
 * bisa saya ikuti sekarang?" dan "seri ini sudah jalan berapa kali?"
 *
 * Sekarang halaman menjawab keduanya berurutan:
 *
 *   1. Pendaftaran terbuka — dihitung dari tanggal, bukan ditandai tangan
 *   2. Akan datang         — sudah terjadwal tapi pendaftarannya tidak buka
 *   3. Semua seri          — 45 seri, tiap edisinya berjejer dari yang terbaru
 *
 * Tidak ada yang disembunyikan: seluruh 66 edisi tetap tampil, termasuk yang
 * sudah lama selesai. Yang berubah cuma urutannya jadi punya arti.
 *
 * ── Saat saringan aktif ──────────────────────────────────────────────────
 *
 * Susunan bertingkat itu dilewati dan hasilnya ditampilkan rata. Orang yang
 * mengetik pencarian sedang mencari satu hal tertentu; mengelompokkannya lagi
 * per seri justru menyembunyikan yang dia cari di balik satu lapis lagi.
 */
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
  const menyaring = Boolean(level || mode || q);

  const hasil = filterEvents({ level, mode, q });
  const facets = eventFacets();

  const kini = new Date();
  const semua = allEvents();
  const terbuka = semua
    .filter((e) => statusEvent(e, kini) === "terbuka")
    .sort((a, b) => waktuEvent(a) - waktuEvent(b));
  const akan = semua
    .filter((e) => statusEvent(e, kini) === "akan")
    .sort((a, b) => waktuEvent(a) - waktuEvent(b));
  const seri = kelompokkanSeri(semua);

  return (
    <>
      <PageHeader
        eyebrow="Event"
        title={t("title")}
        lead={t("lead")}
        aside={
          <div className="flex flex-col gap-2">
            <p className="tnum font-mono text-[34px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">
              {menyaring ? hasil.length : semua.length}
            </p>
            <p className="text-[13px] text-[var(--ink-faint)]">
              {menyaring
                ? `${t("count", { count: hasil.length })} · ${semua.length} ${locale === "id" ? "total" : "in total"}`
                : `${t("count", { count: semua.length })} · ${t("seriesCount", { count: seri.length })}`}
            </p>
          </div>
        }
      />

      <div className="shell py-10 md:py-14">
        <EventFilters facets={facets} active={{ level, mode, q }} />
      </div>

      {menyaring ? (
        <div className="shell pb-16">
          {hasil.length === 0 ? (
            <EmptyState title={t("empty")} action={<MoreLink href="/event">{t("reset")}</MoreLink>} />
          ) : (
            <ul className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3">
              {hasil.map((e) => (
                <li key={e.slug} className="bg-[var(--bg)]">
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {terbuka.length > 0 && (
            <Section eyebrow={t("nowEyebrow")} title={t("openTitle")} lead={t("openLead")}>
              <ul className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3">
                {terbuka.map((e) => (
                  <li key={e.slug} className="bg-[var(--bg)]">
                    <EventCard event={e} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {akan.length > 0 && (
            <Section eyebrow={t("scheduledEyebrow")} title={t("upcomingTitle")} lead={t("upcomingLead")} sunk>
              <ul className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3">
                {akan.map((e) => (
                  <li key={e.slug} className="bg-[var(--bg)]">
                    <EventCard event={e} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section eyebrow={t("archiveEyebrow")} title={t("seriesTitle")} lead={t("seriesLead")}>
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {seri.map((s) => (
                <SeriBaris key={s.slug} seri={s} />
              ))}
            </div>
          </Section>
        </>
      )}

      <div className="shell pb-16">
        {/* Ekosistem domain — satu-satunya tempat 34 situs event IYSA tercatat. */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-8">
          <div>
            <p className="eyebrow">{t("sites")}</p>
            <p className="mt-2 max-w-[52ch] text-[15px] text-[var(--ink-muted)]">{t("sitesLead")}</p>
          </div>
          <MoreLink href="/event/situs">{t("sites")}</MoreLink>
        </div>
      </div>
    </>
  );
}

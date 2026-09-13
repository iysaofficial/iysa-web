import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { Section, StatRow, ButtonLink, MoreLink, Pill } from "@/components/ui";
import { SubscribeForm } from "@/components/subscribe-form";
import { EventCard } from "@/components/event-card";
import { HeroAtom } from "@/components/hero-atom";
import { statusEvent, waktuEvent } from "@/lib/event-seri";
import { PartnerWall } from "@/components/partner-wall";
import { KurasiPanel } from "@/components/kurasi-panel";
import { pageMetadata } from "@/lib/seo";
import { stats, allEvents, allIssues, allAffiliates } from "@/lib/data";
import { intro, vision, mission, goals } from "@/content/profile";
import { affiliateNames } from "@/content/affiliates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return pageMetadata({
    locale,
    path: "/",
    title: t("heroTitle"),
    description: t("heroBody"),
    ogTitle: "Indonesian Young Scientist Association",
    og: { eyebrow: "IYSA", heading: t("heroTitle"), meta: t("heroLead") },
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const s = stats();

  /* Enam event untuk seksi "Yang sedang berjalan".
   *
   * Versi sebelumnya mengurutkan menurut ada-tidaknya `registrationUrl` —
   * dan KE-66 event punya URL pendaftaran, jadi pengurutannya tidak berefek
   * apa pun. Yang tampil enam event pertama menurut ID internal: semuanya
   * 2024, semuanya sudah selesai, di bawah judul "Yang sedang berjalan".
   *
   * Sekarang urutannya memakai status yang dihitung dari tanggal: pendaftaran
   * terbuka dulu, lalu yang akan datang, lalu yang paling baru selesai —
   * masing-masing dari yang paling dekat waktunya. Judulnya jadi benar.
   */
  const events = allEvents();
  const peringkat = { terbuka: 0, akan: 1, selesai: 2 } as const;
  const kini = new Date();
  const featured = [...events]
    .sort((a, b) => {
      const beda = peringkat[statusEvent(a, kini)] - peringkat[statusEvent(b, kini)];
      if (beda !== 0) return beda;
      // Dalam kelompok yang sama: yang belum lewat diurut dari yang terdekat,
      // yang sudah lewat dari yang paling baru.
      return statusEvent(a, kini) === "selesai"
        ? waktuEvent(b) - waktuEvent(a)
        : waktuEvent(a) - waktuEvent(b);
    })
    .slice(0, 6);

  const latestIssue = allIssues().find((i) => i.hasPdf);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--line)]">
        <div className="shell py-16 md:py-28">
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-8">
              <p className="eyebrow rise">{t("eyebrow")}</p>
              <h1 className="rise mt-4 text-hero text-[var(--navy)]">{t("heroTitle")}</h1>
              <p className="rise mt-6 max-w-[54ch] text-lead text-[var(--ink-muted)]">
                {t("heroBody")}
              </p>
              <div className="rise mt-9 flex flex-wrap gap-3">
                {/* Satu coral di layar ini — ajakan utama. */}
                <ButtonLink href="/event" tone="primary">
                  {t("ctaEvents")}
                </ButtonLink>
                <ButtonLink href="/profil" tone="outline">
                  {t("ctaProfile")}
                </ButtonLink>
              </div>
            </div>

            <div className="md:col-span-4 md:pt-4">
              {/* Lambang IYSA dalam tiga dimensi. Dekoratif sepenuhnya —
                  aria-hidden, dan three.js baru diunduh setelah beranda
                  terpasang, jadi ia tidak pernah menahan judul hero tampil. */}
              <HeroAtom className="mb-8 md:-mt-6 md:ml-auto" />
              <p className="max-w-[40ch] text-[15px] leading-relaxed text-[var(--ink-muted)]">
                {intro[locale]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Angka ─────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--line)]">
        <div className="shell py-12 md:py-16">
          <p className="eyebrow mb-8">{t("statsEyebrow")}</p>
          <StatRow
            items={[
              { value: s.events, label: t("statEvents") },
              { value: s.affiliates, label: t("statAffiliates") },
              { value: s.partners, label: t("statPartners") },
              { value: `${s.countries}+`, label: t("statCountries") },
              { value: s.issues, label: t("statIssues") },
              { value: s.people, label: t("statPeople") },
            ]}
          />
        </div>
      </section>

      {/* ── Event ─────────────────────────────────────────────────── */}
      <Section
        eyebrow={t("eventsEyebrow")}
        title={t("eventsTitle")}
        action={<MoreLink href="/event">{t("eventsAll")}</MoreLink>}
      >
        <ul
          className="rise-stagger grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3"
        >
          {featured.map((e) => (
            <li key={e.slug} className="bg-[var(--bg)]">
              <EventCard event={e} />
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Kurasi Puspresnas ─────────────────────────────────────────
          Duduk tepat setelah daftar event: di situlah pengunjung sedang
          menimbang mau ikut atau tidak, dan pengakuan resmi kementerian
          adalah yang membedakan ajang IYSA dari lomba biasa. Isinya, dan
          alasan ia satu-satunya blok berwarna penuh di halaman ini, ada di
          komponennya. */}
      <KurasiPanel />

      {/* ── Visi, misi, tujuan ────────────────────────────────────── */}
      <Section eyebrow={t("visionEyebrow")} title={t("visionTitle")} sunk>
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <h3 className="eyebrow">{t("vision")}</h3>
            <p className="mt-3 text-lead leading-snug text-[var(--ink)]">{vision[locale]}</p>
          </div>

          <div className="md:col-span-7 md:grid md:grid-cols-2 md:gap-10">
            <div>
              <h3 className="eyebrow">{t("mission")}</h3>
              <ol className="mt-3 flex flex-col gap-3">
                {mission.map((m, i) => (
                  <li key={i} className="flex gap-3 text-[15px] text-[var(--ink-muted)]">
                    <span className="tnum shrink-0 font-mono text-[12px] text-[var(--teal)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {m[locale]}
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-8 md:mt-0">
              <h3 className="eyebrow">{t("goals")}</h3>
              <ol className="mt-3 flex flex-col gap-3">
                {goals.map((g, i) => (
                  <li key={i} className="flex gap-3 text-[15px] text-[var(--ink-muted)]">
                    <span className="tnum shrink-0 font-mono text-[12px] text-[var(--teal)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {g[locale]}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Mitra ─────────────────────────────────────────────────── */}
      <Section
        eyebrow={t("partnersEyebrow")}
        title={t("partnersTitle")}
        action={<MoreLink href="/mitra">{`${allAffiliates().length} →`}</MoreLink>}
      >
        {/* Mitra internasional: bernama, karena tiap satunya punya halaman
            sendiri berisi profil dan galeri. */}
        <ul className="flex flex-wrap gap-2">
          {allAffiliates().map((a) => (
            <li key={a.slug}>
              <Link
                href={`/mitra/${a.slug}`}
                className="inline-flex rounded-full border border-[var(--line)] px-3.5 py-1.5 text-[13.5px] text-[var(--ink-muted)] transition-colors duration-[var(--gerak-cepat)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
              >
                {affiliateNames[a.slug] ?? a.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Institusi pendukung — 59 logo, diambil dari daftar yang benar-benar
            tampil di situs lama (dua komponen afiliasi), bukan dari
            AffiliationLogo.json yang rusak. */}
        <div className="mt-12">
          <h3 className="eyebrow">{t("partnersWallTitle")}</h3>
          <p className="mt-2 mb-6 max-w-[52ch] text-[14.5px] text-[var(--ink-muted)]">
            {t("partnersWallLead", { count: s.partners })}
          </p>
          <PartnerWall />
        </div>
      </Section>

      {/* ── Newsletter ────────────────────────────────────────────── */}
      <Section sunk>
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <p className="eyebrow">{t("newsletterEyebrow")}</p>
            <h2 className="mt-2 text-title text-[var(--ink)]">{t("newsletterTitle")}</h2>
            <p className="mt-3 max-w-[52ch] text-[var(--ink-muted)]">{t("newsletterBody")}</p>
            {latestIssue && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Pill tone="teal">{latestIssue.year}</Pill>
                <MoreLink href={`/newsletter/${latestIssue.slug}`}>{latestIssue.title}</MoreLink>
              </div>
            )}
            <div className="mt-7">
              <MoreLink href="/newsletter">{t("newsletterAll")}</MoreLink>
            </div>
          </div>
          <div className="md:col-span-5">
            <SubscribeForm />
          </div>
        </div>
      </Section>
    </>
  );
}

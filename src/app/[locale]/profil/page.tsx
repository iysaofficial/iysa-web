import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

import { PageHeader, Section, DefList, MoreLink, StatRow } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { stats } from "@/lib/data";
import { org } from "@/content/org";
import {
  intro, founding, reach, vision, mission, goals, community, experts,
  partnersNational, partnersInternational, programmes, programmeLabels,
} from "@/content/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return pageMetadata({
    locale,
    path: "/profil",
    title: t("title"),
    description: intro[locale].slice(0, 300),
    og: { eyebrow: "IYSA", heading: org.name, meta: t("lead") },
  });
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("profile");
  const h = await getTranslations("home");
  const s = stats();

  return (
    <>
      <PageHeader eyebrow={org.name} title={t("title")} lead={t("lead")} />

      {/* Profil */}
      <Section>
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <div className="prose-ink text-lead">
              <p>{intro[locale]}</p>
              <p>{founding[locale]}</p>
              <p>{reach[locale]}</p>
            </div>
          </div>
          <div className="md:col-span-5">
            <DefList
              items={[
                { label: t("founded"), value: "November 2018" },
                { label: t("founder"), value: org.founder },
                {
                  label: t("legalStatus"),
                  value: org.legalNote[locale],
                },
              ]}
            />
          </div>
        </div>
      </Section>

      {/* Angka */}
      <Section sunk>
        <StatRow
          items={[
            { value: s.events, label: h("statEvents") },
            { value: s.affiliates, label: h("statAffiliates") },
            { value: s.partners, label: h("statPartners") },
            { value: `${s.countries}+`, label: h("statCountries") },
            { value: s.eventSites, label: t("statEventSites") },
            { value: s.people, label: h("statPeople") },
          ]}
        />
      </Section>

      {/* Visi, misi, tujuan */}
      <Section eyebrow={h("visionEyebrow")} title={t("visionMission")}>
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <h3 className="eyebrow">{h("vision")}</h3>
            <p className="mt-3 text-lead leading-snug text-[var(--ink)]">{vision[locale]}</p>
          </div>
          <div className="md:col-span-7 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="eyebrow">{h("mission")}</h3>
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
            <div>
              <h3 className="eyebrow">{h("goals")}</h3>
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

      {/* Program — di situs lama cuma deretan akronim tanpa keterangan. */}
      <Section eyebrow={t("programmesEyebrow")} title={t("programmes")} lead={t("programmesLead")} sunk>
        <div className="flex flex-col gap-8">
          {(Object.keys(programmes) as (keyof typeof programmes)[]).map((key) => (
            <div key={key}>
              <h3 className="eyebrow">{programmeLabels[key][locale]}</h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {programmes[key].map((p) => (
                  <li
                    key={p}
                    className="rounded border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 font-mono text-[12px] text-[var(--ink-muted)]"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Komunitas, tim ahli, mitra */}
      <Section>
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="eyebrow">{t("community")}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-muted)]">
              {community[locale]}
            </p>
          </div>
          <div>
            <h3 className="eyebrow">{t("experts")}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-muted)]">
              {experts[locale]}
            </p>
            <div className="mt-4">
              <MoreLink href="/tim/ahli">{t("experts")}</MoreLink>
            </div>
          </div>
          <div>
            <h3 className="eyebrow">{t("partners")}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-muted)]">
              {partnersNational[locale]}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-muted)]">
              {partnersInternational[locale]}
            </p>
            <div className="mt-4">
              <MoreLink href="/mitra">{t("partners")}</MoreLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

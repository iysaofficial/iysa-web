import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

import { PageHeader, Section, MoreLink } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { orgStructure, flattenPeople, type Person } from "@/lib/data";
import { photoUrl } from "@/lib/assets";
import { experts } from "@/content/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "team" });
  return pageMetadata({
    locale,
    path: "/tim",
    title: t("title"),
    description: t("lead"),
    og: {
      eyebrow: "IYSA",
      heading: t("title"),
      meta: t("people", { count: flattenPeople().length }),
    },
  });
}

/**
 * Hierarki 5 tingkat dari situs lama dipertahankan utuh, tapi ditampilkan
 * sebagai tingkatan yang jelas, bukan pohon bercabang — di ponsel, pohon
 * organisasi 22 orang dengan 5 tingkat tidak mungkin terbaca.
 */
function levelsOf(nodes: Person[]): Person[][] {
  const out: Person[][] = [];
  let current = nodes;
  while (current.length) {
    out.push(current);
    current = current.flatMap((n) => n.children);
  }
  return out;
}

function PersonCard({ person, lead = false }: { person: Person; lead?: boolean }) {
  const photo = photoUrl(person.photo);
  return (
    <div className="flex flex-col gap-3">
      <div
        className={`relative overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)] ${
          lead ? "aspect-[4/5]" : "aspect-square"
        }`}
      >
        {photo ? (
          <Image
            src={photo}
            alt={person.name}
            fill
            sizes={lead ? "(max-width: 768px) 60vw, 280px" : "(max-width: 640px) 45vw, 180px"}
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-mono text-[20px] text-[var(--ink-faint)]">
            {person.name
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
        )}
      </div>
      <div>
        <p
          className={`leading-snug font-semibold text-[var(--ink)] ${
            lead ? "text-[18px]" : "text-[14.5px]"
          }`}
        >
          {person.name}
        </p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--ink-faint)]">
          {person.position}
        </p>
      </div>
    </div>
  );
}

export default async function TeamPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("team");
  const levels = levelsOf(orgStructure());
  const total = flattenPeople().length;

  return (
    <>
      <PageHeader
        eyebrow="Tim"
        title={t("title")}
        lead={t("lead")}
        aside={
          <div className="flex flex-col gap-1">
            <p className="tnum font-mono text-[34px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">
              {total}
            </p>
            <p className="text-[13px] text-[var(--ink-faint)]">{t("people", { count: total })}</p>
          </div>
        }
      />

      {levels.map((people, depth) => (
        <Section key={depth} sunk={depth % 2 === 1}>
          <div
            /* Tingkat 0 (pimpinan) tidak bertahap: isinya empat kartu besar
               yang selalu terlihat begitu seksinya dibuka. `data-reveal` hanya
               dipasang di tingkat yang memang beranimasi bertahap. */
            data-reveal={depth === 0 ? undefined : ""}
            className={
              depth === 0
                ? "grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
                : "rise-stagger grid grid-cols-2 gap-7 sm:grid-cols-3 lg:grid-cols-6"
            }
          >
            {people.map((p) => (
              <PersonCard key={`${p.name}-${p.position}`} person={p} lead={depth === 0} />
            ))}
          </div>
        </Section>
      ))}

      <Section eyebrow={t("expertTitle")} title={t("expertTitle")}>
        <p className="max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--ink-muted)]">
          {experts[locale]}
        </p>
        <div className="mt-5">
          <MoreLink href="/tim/ahli">{t("expertTitle")}</MoreLink>
        </div>
      </Section>
    </>
  );
}

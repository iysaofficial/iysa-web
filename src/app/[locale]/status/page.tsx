import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

import { PageHeader, Section, DefList, Pill } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { apiHealth, apiConfig } from "@/lib/api";
import { mailConfigured } from "@/lib/mail";
import { stats } from "@/lib/data";
import { assetStats } from "@/lib/assets";
import { allIssues } from "@/lib/data";
import legacyRedirects from "@/content/generated/redirects.json";

/**
 * Halaman diagnostik. Tidak ditautkan dari mana pun dan ditolak robots.txt.
 *
 * Gunanya satu: menjawab "apakah situs sedang mengambil data dari dasbor atau
 * dari cuplikan statis?" tanpa harus menebak atau membuka log. Situs lama
 * tidak punya cara apa pun untuk mengetahui bahwa 7 poster dan satu PDF-nya
 * sudah lama 404.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/status",
    title: "Status",
    description: "Diagnostik internal.",
    noIndex: true,
  });
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const health = await apiHealth();
  const s = stats();

  const id = locale === "id";

  return (
    <>
      <PageHeader
        eyebrow="Internal"
        title="Status"
        lead={id ? "Halaman diagnostik. Tidak diindeks." : "Internal diagnostics page. Not indexed."}
      />

      <Section eyebrow={id ? "API dasbor" : "Dashboard API"} title={id ? "Sumber data" : "Data sources"}>
        <DefList
          items={[
            { label: id ? "Basis" : "Base URL", value: <code className="font-mono text-[13px]">{apiConfig.base}</code> },
            { label: "Slug", value: <code className="font-mono text-[13px]">{apiConfig.slug}</code> },
            {
              label: "/health",
              value: (
                <span className="flex flex-wrap items-center gap-2">
                  <Pill tone={health.ok ? "teal" : "coral"}>
                    {health.ok ? (id ? "hidup" : "online") : id ? "mati" : "offline"}
                  </Pill>
                  <code className="font-mono text-[12px] text-[var(--ink-faint)]">{health.detail}</code>
                </span>
              ),
            },
            {
              label: id ? "Data event" : "Event data",
              value: (
                <span className="flex flex-wrap items-center gap-2">
                  <Pill tone="coral">{id ? "cuplikan statis" : "static snapshot"}</Pill>
                  <span className="text-[13.5px] text-[var(--ink-muted)]">
                    {id
                      ? "API publik dikombinasikan dengan arsip statis warisan"
                      : "Public API combined with static legacy archive"}
                  </span>
                </span>
              ),
            },
            {
              label: id ? "Surel (Resend)" : "Email (Resend)",
              value: (
                <Pill tone={mailConfigured() ? "teal" : "coral"}>
                  {mailConfigured()
                    ? id
                      ? "terkonfigurasi"
                      : "configured"
                    : id
                      ? "belum diset"
                      : "not set"}
                </Pill>
              ),
            },
          ]}
        />
      </Section>

      <Section eyebrow={id ? "Isi" : "Content"} title={id ? "Yang terbawa dari situs lama" : "Migrated legacy content"} sunk>
        <DefList
          items={[
            { label: id ? "Event" : "Events", value: `${s.events}` },
            {
              label: id ? "Terbitan" : "Issues",
              value: `${allIssues().length} (${allIssues().filter((i) => !i.hasPdf).length} ${id ? "tanpa PDF" : "without PDF"})`,
            },
            { label: id ? "Mitra" : "Affiliates", value: `${s.affiliates}` },
            { label: id ? "Orang" : "People", value: `${s.people}` },
            { label: id ? "Video" : "Videos", value: `${s.videos}` },
            { label: id ? "Situs event" : "Event sites", value: `${s.eventSites}` },
            { label: id ? "Aset terpetakan" : "Mapped assets", value: `${assetStats().mapped}` },
            { label: id ? "Redirect aktif" : "Active redirects", value: `${(legacyRedirects as unknown[]).length}` },
          ]}
        />
      </Section>
    </>
  );
}

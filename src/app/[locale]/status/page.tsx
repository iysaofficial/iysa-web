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

  return (
    <>
      <PageHeader eyebrow="Internal" title="Status" lead="Halaman diagnostik. Tidak diindeks." />

      <Section eyebrow="API dasbor" title="Sumber data">
        <DefList
          items={[
            { label: "Basis", value: <code className="font-mono text-[13px]">{apiConfig.base}</code> },
            { label: "Slug", value: <code className="font-mono text-[13px]">{apiConfig.slug}</code> },
            {
              label: "/health",
              value: (
                <span className="flex flex-wrap items-center gap-2">
                  <Pill tone={health.ok ? "teal" : "coral"}>{health.ok ? "hidup" : "mati"}</Pill>
                  <code className="font-mono text-[12px] text-[var(--ink-faint)]">{health.detail}</code>
                </span>
              ),
            },
            {
              label: "Data event",
              value: (
                <span className="flex flex-wrap items-center gap-2">
                  <Pill tone="coral">cuplikan statis</Pill>
                  <span className="text-[13.5px] text-[var(--ink-muted)]">
                    API publik menjawab &quot;seri belum menetapkan edisi yang disiarkan&quot;
                  </span>
                </span>
              ),
            },
            {
              label: "Surel (Resend)",
              value: (
                <Pill tone={mailConfigured() ? "teal" : "coral"}>
                  {mailConfigured() ? "terkonfigurasi" : "belum diset"}
                </Pill>
              ),
            },
          ]}
        />
      </Section>

      <Section eyebrow="Isi" title="Yang terbawa dari situs lama" sunk>
        <DefList
          items={[
            { label: "Event", value: `${s.events}` },
            { label: "Terbitan", value: `${allIssues().length} (${allIssues().filter((i) => !i.hasPdf).length} tanpa PDF)` },
            { label: "Mitra", value: `${s.affiliates}` },
            { label: "Orang", value: `${s.people}` },
            { label: "Video", value: `${s.videos}` },
            { label: "Situs event", value: `${s.eventSites}` },
            { label: "Aset terpetakan", value: `${assetStats().mapped}` },
            { label: "Redirect aktif", value: `${(legacyRedirects as unknown[]).length}` },
          ]}
        />
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { curation, curationLabels } from "@/content/external";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "curation" });
  return pageMetadata({ locale, path: "/kurasi", title: t("title"), description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title") } });
}

export default async function CurationPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("curation");

  return (
    <>
      <PageHeader eyebrow="Kurasi" title={t("title")} lead={t("lead")} />
      <Section>
        <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {curation.folders.map((f) => (
            <li key={f.key} className="bg-[var(--bg)]">
              <a href={f.url} target="_blank" rel="noreferrer"
                 className="group flex h-full flex-col justify-between gap-8 p-7 transition-colors duration-150 hover:bg-[var(--bg-sunk)]">
                <span className="text-[16.5px] leading-snug font-semibold text-[var(--ink)] group-hover:text-[var(--navy)]">
                  {curationLabels[f.key]?.[locale] ?? f.key}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--teal)]">
                  {t("openFolder")}
                  <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">↗</span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        {/* curation.pdf sengaja null: berkas yang ditautkan situs lama
            (Kurasi.pdf) tidak pernah ada di repo, jadi tombolnya selama ini
            mengarah ke 404. Tidak dipasang lagi sampai berkasnya ada. */}
        {curation.pdf && (
          <div className="mt-8">
            <a href={curation.pdf} target="_blank" rel="noreferrer"
               className="text-[14.5px] font-medium text-[var(--teal)] underline decoration-1 underline-offset-2">
              {t("openDocument")}
            </a>
          </div>
        )}
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section, SelPengisi } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { curation, curationLabels, ptkDocuments, ptkDocumentLabels } from "@/content/external";

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
      <PageHeader eyebrow="Puspresnas" title={t("title")} lead={t("lead")} />
      <Section>
        <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {curation.folders.map((f) => (
            <li key={f.key} className="bg-[var(--bg)]">
              <a href={f.url} target="_blank" rel="noreferrer"
                 className="group flex h-full flex-col justify-between gap-8 p-7 transition-colors duration-[var(--gerak-cepat)] hover:bg-[var(--bg-sunk)]">
                <span className="font-serif text-[17px] leading-snug font-bold text-[var(--ink)] group-hover:text-[var(--navy)]">
                  {curationLabels[f.key]?.[locale] ?? f.key}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--teal)]">
                  {t("openFolder")}
                  <span aria-hidden className="transition-transform duration-[var(--gerak-cepat)] group-hover:translate-x-0.5">↗</span>
                </span>
              </a>
            </li>
          ))}
          <SelPengisi jumlah={curation.folders.length} kolom={2} />
          <SelPengisi jumlah={curation.folders.length} kolom={3} />
        </ul>

        {/* Dokumen resmi Lomba Invensi & PTK.
            Di situs lama keduanya hanya ada di dropdown navbar "Event Info",
            yang tidak ikut pindah — jadi sejak penulisan ulang, dua berkas ini
            tidak bisa dijangkau dari mana pun. Tempatnya di sini: halaman ini
            memang halaman dokumen resmi. */}
        <div className="mt-10 border-t border-[var(--line)] pt-8">
          <h2 className="eyebrow">{t("documentsTitle")}</h2>
          <ul className="mt-4 flex flex-col">
            {ptkDocuments.map((d) => (
              <li key={d.key} className="border-b border-[var(--line)] last:border-0">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
                >
                  <span className="font-serif text-[16px] leading-snug font-bold text-[var(--ink)] transition-colors duration-[var(--gerak-cepat)] group-hover:text-[var(--teal)]">
                    {ptkDocumentLabels[d.key]?.[locale] ?? d.key}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tnum font-sans text-[13px] text-[var(--ink-faint)]">
                      {d.year}
                    </span>
                    <span
                      aria-hidden
                      className="text-[12px] text-[var(--teal)] transition-transform duration-[var(--gerak-cepat)] group-hover:translate-x-0.5"
                    >
                      ↗
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

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

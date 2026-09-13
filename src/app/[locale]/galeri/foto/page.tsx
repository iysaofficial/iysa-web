import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { photoFolders } from "@/content/external";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return pageMetadata({ locale, path: "/galeri/foto", title: t("photoTitle"), description: t("photoLead"),
    og: { eyebrow: "IYSA", heading: t("photoTitle"), meta: `${photoFolders.length} ${locale === "id" ? "tahun" : "years"}` } });
}

export default async function PhotoGallery({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gallery");

  return (
    <>
      <PageHeader eyebrow="Galeri" title={t("photoTitle")} lead={t("photoLead")} />
      <Section>
        {/* Dokumentasi foto tetap di Drive. Memindahkannya ke penyimpanan lain
            adalah keputusan IYSA, bukan keputusan penulisan ulang situs. */}
        <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {photoFolders.map((f) => (
            <li key={f.year} className="bg-[var(--bg)]">
              <a href={f.url} target="_blank" rel="noreferrer"
                 className="group flex h-full flex-col justify-between gap-6 p-7 transition-colors duration-150 hover:bg-[var(--bg-sunk)]">
                <span className="tnum font-mono text-[34px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">{f.year}</span>
                <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--teal)]">
                  {t("openFolder", { year: f.year })}
                  <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">↗</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

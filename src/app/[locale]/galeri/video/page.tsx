import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { videos, videoYears } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return pageMetadata({ locale, path: "/galeri/video", title: t("videoTitle"), description: t("videoLead"),
    og: { eyebrow: "IYSA", heading: t("videoTitle"), meta: t("count", { count: videos().length }) } });
}

export default async function VideoGallery({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gallery");
  const all = videos();
  const years = videoYears();

  return (
    <>
      <PageHeader eyebrow="Galeri" title={t("videoTitle")} lead={t("videoLead")}
        count={all.length}
        countLabel={t("count", { count: all.length })}
        aside={
          <nav aria-label={t("year")} className="flex flex-wrap gap-1.5 md:justify-end">
            {years.map((y) => (
              <a key={y} href={`#tahun-${y}`} className="tnum rounded-full border border-[var(--border)] px-2.5 py-0.5 font-mono text-[11.5px] text-[var(--ink-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)]">{y}</a>
            ))}
          </nav>
        }
      />

      {years.map((year, i) => (
        <Section key={year} sunk={i % 2 === 1}>
          <div id={`tahun-${year}`} className="scroll-mt-20">
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
              <h2 className="tnum font-mono text-[26px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">{year}</h2>
              <p className="text-[13px] text-[var(--ink-faint)]">{t("count", { count: all.filter((v) => v.year === year).length })}</p>
            </div>
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {all.filter((v) => v.year === year).map((v, idx) => (
                <li key={`${v.youtubeId ?? "x"}-${idx}`} className="flex flex-col gap-3">
                  <div className="aspect-video overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
                    {v.youtubeId ? (
                      /* youtube-nocookie: tidak memasang cookie pelacak sebelum
                         pengunjung menekan putar. */
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                        title={v.title} loading="lazy" allowFullScreen
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        className="h-full w-full"
                      />
                    ) : (
                      <span className="grid h-full place-items-center font-mono text-[11px] text-[var(--ink-faint)]">—</span>
                    )}
                  </div>
                  <p className="text-[15px] leading-snug font-medium text-[var(--ink)]">{v.title}</p>
                  {v.description && <p className="text-[13.5px] leading-relaxed text-[var(--ink-muted)]">{v.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ))}
    </>
  );
}

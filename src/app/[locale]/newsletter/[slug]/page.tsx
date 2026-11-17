import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Link, redirect } from "@/i18n/navigation";
import { BackLink, ButtonLink } from "@/components/ui";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { semuaTerbitan, sampulTerbitan, pdfTerbitan, labelTerbitan } from "@/lib/newsletter";
import { judulNewsletter } from "@/lib/teks-event";

export const revalidate = 900;
/** Terbitan baru di dasbor tetap bisa dibuka sebelum build berikutnya. */
export const dynamicParams = true;

export async function generateStaticParams() {
  const { terbitan } = await semuaTerbitan();
  return routing.locales.flatMap((locale) => terbitan.map((i) => ({ locale, slug: i.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const issue = (await semuaTerbitan()).terbitan.find((i) => i.slug === slug);
  if (!issue) return {};
  const t = await getTranslations({ locale, namespace: "newsletter" });
  const judul = judulNewsletter(issue, locale);
  const label = labelTerbitan(issue, locale);
  return pageMetadata({
    locale, path: `/newsletter/${issue.slug}`, title: judul,
    description: locale === "id" ? `${label} — terbitan newsletter IYSA. ${t("lead")}` : `${label} — IYSA newsletter issue. ${t("lead")}`,
    og: { eyebrow: "Newsletter", heading: judul, meta: label }, type: "article",
  });
}

const BAHASA: Record<string, Record<Locale, string>> = {
  en: { id: "Inggris", en: "English" },
  id: { id: "Indonesia", en: "Indonesian" },
  "id-en": { id: "Indonesia & Inggris", en: "Indonesian & English" },
};

/** Halaman baca satu terbitan: sampul + info di kiri, pembaca PDF di kanan, navigasi terbitan. */
export default async function IssuePage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const { terbitan } = await semuaTerbitan();
  const idx = terbitan.findIndex((i) => i.slug === slug);
  /* Alamat terbitan lama yang tidak ada lagi (mis. Jan–Apr 2022 tanpa PDF) → daftar. */
  if (idx < 0) redirect({ href: "/newsletter", locale });
  const issue = terbitan[idx];
  const lebihBaru = idx > 0 ? terbitan[idx - 1] : null;
  const lebihLama = idx < terbitan.length - 1 ? terbitan[idx + 1] : null;

  const t = await getTranslations("newsletter");
  const cover = sampulTerbitan(issue);
  const judul = judulNewsletter(issue, locale);
  const label = labelTerbitan(issue, locale);
  const pdf = pdfTerbitan(issue);
  const bahasa = issue.bahasa ? BAHASA[issue.bahasa]?.[locale] ?? issue.bahasa : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
        { name: "IYSA", path: "/" }, { name: t("title"), path: "/newsletter" }, { name: judul, path: `/newsletter/${issue.slug}` },
      ], locale)) }} />

      <div className="shell py-8 md:py-10">
        <BackLink href="/newsletter">{t("backToNewsletter")}</BackLink>

        <div className="mt-6 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
          {/* ── Sampul + info ── */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
            <div className="flex gap-5 lg:flex-col">
              <div className="relative aspect-[3/4] w-32 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-sunk)] shadow-sm lg:w-full">
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={judul} className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <p className="text-[12px] font-semibold tracking-wide text-[var(--teal)] uppercase">{label}</p>
                <h1 className="mt-1.5 font-serif text-[24px] leading-tight font-bold text-[var(--navy)] lg:text-[28px]">{judul}</h1>
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[var(--ink-muted)]">
                  {issue.halaman ? <div><dt className="inline text-[var(--ink-faint)]">{t("pagesLabel")}: </dt><dd className="inline tnum">{issue.halaman}</dd></div> : null}
                  {bahasa && <div><dt className="inline text-[var(--ink-faint)]">{t("language")}: </dt><dd className="inline">{bahasa}</dd></div>}
                </dl>
              </div>
            </div>
            {pdf.unduh && (
              <ButtonLink href={pdf.unduh} tone="primary" external>{t("download")}</ButtonLink>
            )}
          </aside>

          {/* ── Pembaca ── */}
          <div>
            {pdf.sematan ? (
              <iframe src={pdf.sematan} title={judul} loading="lazy" allow="autoplay"
                className="aspect-[3/4] w-full rounded-lg border border-[var(--line)] bg-[var(--bg-sunk)] md:aspect-[4/5]" />
            ) : pdf.unduh ? (
              <div className="flex aspect-[4/5] flex-col items-center justify-center gap-5 rounded-lg border border-dashed border-[var(--border)] px-8 text-center">
                <p className="max-w-[36ch] text-[15px] leading-relaxed text-[var(--ink-muted)]">{t("readPdfLead", { pages: issue.halaman ?? 0 })}</p>
                <ButtonLink href={pdf.unduh} tone="navy" external>{t("readPdf")}</ButtonLink>
              </div>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-lg border border-dashed border-[var(--border)] px-8">
                <p className="max-w-[36ch] text-center text-[15px] text-[var(--ink-muted)]">{t("noPdf")}</p>
              </div>
            )}

            {/* ── Navigasi terbitan ── */}
            <nav className="mt-6 grid gap-3 sm:grid-cols-2">
              {lebihLama ? (
                <Link href={`/newsletter/${lebihLama.slug}`} className="group rounded-lg border border-[var(--line)] p-4 transition-colors hover:border-[var(--teal)]">
                  <span className="text-[12px] text-[var(--ink-faint)]">← {t("prevIssue")}</span>
                  <span className="mt-1 block font-serif text-[15px] font-bold text-[var(--ink)] group-hover:text-[var(--navy)]">{labelTerbitan(lebihLama, locale)}</span>
                </Link>
              ) : <span />}
              {lebihBaru && (
                <Link href={`/newsletter/${lebihBaru.slug}`} className="group rounded-lg border border-[var(--line)] p-4 text-right transition-colors hover:border-[var(--teal)]">
                  <span className="text-[12px] text-[var(--ink-faint)]">{t("nextIssue")} →</span>
                  <span className="mt-1 block font-serif text-[15px] font-bold text-[var(--ink)] group-hover:text-[var(--navy)]">{labelTerbitan(lebihBaru, locale)}</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

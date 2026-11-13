import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

import { BackLink, ButtonLink, Pill, Section } from "@/components/ui";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { semuaTerbitan, terbitanBySlug, sampulTerbitan, pdfTerbitan } from "@/lib/newsletter";
import { judulNewsletter } from "@/lib/teks-event";

const MONTH: Record<Locale, string[]> = {
  id: ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  en: ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/**
 * Inilah pengganti 42 komponen React yang isinya identik — masing-masing hanya
 * membaca kunci JSON yang berbeda. Menambah terbitan baru sekarang berarti
 * menambah satu baris data, bukan menulis berkas dan mendaftarkan rute.
 */
export async function generateStaticParams() {
  const { terbitan } = await semuaTerbitan();
  return routing.locales.flatMap((locale) =>
    terbitan.map((i) => ({ locale, slug: i.slug })),
  );
}

/** Terbitan baru di dasbor tetap bisa dibuka sebelum build berikutnya. */
export const dynamicParams = true;
export const revalidate = 900;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const issue = await terbitanBySlug(slug);
  if (!issue) return {};

  const t = await getTranslations({ locale, namespace: "newsletter" });
  const judul = judulNewsletter(issue, locale);
  const label = issue.batch
    ? t("batchOf", { batch: issue.batch, year: issue.year })
    : issue.month
      ? t("issueOf", { month: MONTH[locale][issue.month], year: issue.year })
      : String(issue.year);

  return pageMetadata({
    locale,
    path: `/newsletter/${issue.slug}`,
    title: judul,
    description:
      locale === "id"
        ? `${label} — terbitan newsletter IYSA. ${t("lead")}`
        : `${label} — IYSA newsletter issue. ${t("lead")}`,
    og: { eyebrow: "Newsletter", heading: judul, meta: label },
    type: "article",
  });
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const issue = await terbitanBySlug(slug);
  if (!issue) notFound();

  const t = await getTranslations("newsletter");
  const cover = sampulTerbitan(issue);
  const judul = judulNewsletter(issue, locale);

  const label = issue.batch
    ? t("batchOf", { batch: issue.batch, year: issue.year })
    : issue.month
      ? t("issueOf", { month: MONTH[locale][issue.month], year: issue.year })
      : String(issue.year);

  // PDF dari dasbor bila ada; kalau tidak, tautan Drive lama (/preview untuk
  // disematkan, /view untuk diunduh).
  const pdf = pdfTerbitan(issue);
  const viewUrl = pdf.unduh;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              [
                { name: "IYSA", path: "/" },
                { name: t("title"), path: "/newsletter" },
                { name: judul, path: `/newsletter/${issue.slug}` },
              ],
              locale,
            ),
          ),
        }}
      />

      <div className="shell pt-8">
        <BackLink href="/newsletter">{t("backToNewsletter")}</BackLink>
      </div>

      <Section>
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          {/* Sampul */}
          <div className="md:col-span-4">
            <div className="relative aspect-[3/4] overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
              {cover ? (
                <Image
                  src={cover}
                  alt={judul}
                  fill
                  sizes="(max-width: 768px) 100vw, 30vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <span className="absolute inset-0 grid place-items-center px-4 text-center font-serif text-[13px] font-bold text-[var(--ink-faint)]">
                  {judul}
                </span>
              )}
            </div>

            <div className="mt-5">
              <Pill tone="teal">{label}</Pill>
            </div>

            <h1 className="mt-4 text-title text-[var(--navy)]">{judul}</h1>

            {/*
              Penghitung pembaca dari situs lama dihapus. Ia memasang Firebase
              Firestore — paket 12 MB dan satu layanan pihak ketiga — hanya
              untuk satu angka yang tidak dipakai siapa pun untuk mengambil
              keputusan apa pun.
            */}

            {viewUrl && (
              <div className="mt-6">
                <ButtonLink href={viewUrl} tone="primary" external>
                  {t("download")}
                </ButtonLink>
              </div>
            )}
          </div>

          {/* Pembaca PDF */}
          <div className="md:col-span-8">
            {pdf.sematan ? (
              <iframe
                src={pdf.sematan}
                title={judul}
                loading="lazy"
                className="aspect-[3/4] w-full border border-[var(--line)] bg-[var(--bg-sunk)] md:aspect-[4/5]"
                allow="autoplay"
              />
            ) : viewUrl ? (
              <div className="flex aspect-[4/5] flex-col items-center justify-center gap-5 border border-dashed border-[var(--border)] px-8">
                <p className="max-w-[36ch] text-center text-[15px] leading-relaxed text-[var(--ink-muted)]">
                  {t("readPdfLead", { pages: issue.halaman ?? 0 })}
                </p>
                <ButtonLink href={viewUrl} tone="navy" external>{t("readPdf")}</ButtonLink>
              </div>
            ) : (
              /*
                Lima terbitan awal 2022 tercatat di situs lama tanpa tautan PDF
                sama sekali. Entrinya dipertahankan — judul dan sampulnya nyata
                dan alamatnya sudah terindeks — tapi pembaca kosong tidak
                disajikan seolah-olah ada isinya.
              */
              <div className="flex aspect-[4/5] items-center justify-center border border-dashed border-[var(--border)] px-8">
                <p className="max-w-[36ch] text-center text-[15px] leading-relaxed text-[var(--ink-muted)]">
                  {t("noPdf")}
                </p>
              </div>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}

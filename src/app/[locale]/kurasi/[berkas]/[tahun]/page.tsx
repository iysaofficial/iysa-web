import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section, BackLink, EmptyState, SelPengisi } from "@/components/ui";
import { KurasiLinimasa } from "@/components/kurasi-linimasa";
import { pageMetadata } from "@/lib/seo";
import { seriKurasiBySlug, berkasEdisi, berkasTampil } from "@/lib/kurasi";

export const revalidate = 900;

/**
 * Dokumen kurasi satu edisi (seksi `berkas_kurasi` dasbor) + linimasanya.
 * Tidak dirender di muka: ±200 edisi berarti ±200 panggilan API saat build.
 * Halaman dibuat saat pertama dibuka, lalu disimpan 15 menit (ISR).
 */
export async function generateStaticParams() {
  return [] as { locale: string; berkas: string; tahun: string }[];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; berkas: string; tahun: string }> }): Promise<Metadata> {
  const { locale, berkas, tahun } = await params;
  const s = await seriKurasiBySlug(berkas);
  if (!s) return {};
  const t = await getTranslations({ locale, namespace: "curation" });
  const judul = `${t("documents")} ${s.akronim} ${tahun}`;
  return pageMetadata({ locale, path: `/kurasi/${berkas}/${tahun}`, title: judul, description: `${s.nama} ${tahun} — ${t("seriesLead")}`,
    og: { eyebrow: t("title"), heading: `${s.akronim} ${tahun}` } });
}

export default async function CurationEdition({ params }: { params: Promise<{ locale: Locale; berkas: string; tahun: string }> }) {
  const { locale, berkas, tahun } = await params;
  setRequestLocale(locale);
  const s = await seriKurasiBySlug(berkas);
  if (!s) notFound();
  const edisi = s.edisi.find((e) => e.tahun === tahun);
  if (!edisi) notFound();

  const t = await getTranslations("curation");
  const berkasList = berkasTampil(await berkasEdisi(s.akronim, tahun));

  return (
    <>
      <div className="shell pt-8"><BackLink href={`/kurasi/${s.slug}`}>{`${t("title")} ${s.akronim}`}</BackLink></div>
      <PageHeader eyebrow={`${t("title")} · ${s.akronim}`} title={`${s.nama} ${tahun}`}
        count={berkasList.length || undefined}
        countLabel={berkasList.length ? t("documentsCount", { count: berkasList.length }) : undefined} />

      <Section eyebrow={t("title")} title={t("documents")} padat>
        {berkasList.length === 0 ? (
          <EmptyState title={t("noDocuments")} />
        ) : (
          <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {berkasList.map((f) => (
              <li key={`${f.slot}-${f.url}`} className="bg-[var(--bg)]">
                <a href={f.url!} target="_blank" rel="noreferrer"
                  className="group flex h-full flex-col justify-between gap-6 p-6 transition-colors duration-[var(--gerak-cepat)] hover:bg-[var(--bg-sunk)]">
                  <div>
                    <p className="font-sans text-[11.5px] font-bold tracking-wide text-[var(--ink-faint)]">
                      {String(f.nomor).padStart(2, "0")} · {f.jenis === "dokumentasi" ? t("documentation") : t("administration")}
                      {f.kategori && f.kategori !== "Semua" ? ` · ${f.kategori}` : ""}
                    </p>
                    <p className="mt-2 font-serif text-[15.5px] leading-snug font-bold text-[var(--ink)] group-hover:text-[var(--navy)]">{f.slot}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--teal)]">
                    {t("openPdf")}
                    <span aria-hidden className="transition-transform duration-[var(--gerak-cepat)] group-hover:translate-x-0.5">↗</span>
                  </span>
                </a>
              </li>
            ))}
            <SelPengisi jumlah={berkasList.length} kolom={2} />
            <SelPengisi jumlah={berkasList.length} kolom={3} />
          </ul>
        )}
      </Section>

      <Section eyebrow={t("seriesEyebrow")} title={t("edition", { tahun })}>
        <KurasiLinimasa edisi={edisi} locale={locale} />
      </Section>
    </>
  );
}

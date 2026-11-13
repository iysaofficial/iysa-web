import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHeader, Section, ButtonLink, BackLink } from "@/components/ui";
import { KurasiLinimasa } from "@/components/kurasi-linimasa";
import { pageMetadata } from "@/lib/seo";
import { curation, curationLabels } from "@/content/external";
import { semuaSeriKurasi, seriKurasiBySlug } from "@/lib/kurasi";

export const revalidate = 900;

/**
 * Dua jenis halaman di satu segmen:
 *   - folder arsip Drive lama (`ospc-2021`, `lktin-2022`, …) — /CurationLKTIN
 *     dan /CurationOSPC situs lama;
 *   - satu ajang dari dasbor (`isif`, `wice`, …) — linimasa kurasi tiap edisi.
 * Kunci folder selalu berakhiran tahun, slug ajang tidak, jadi keduanya tidak bertabrakan.
 */
export async function generateStaticParams() {
  const seri = await semuaSeriKurasi();
  return routing.locales.flatMap((locale) => [
    ...curation.folders.map((f) => ({ locale, berkas: f.key })),
    ...seri.map((s) => ({ locale, berkas: s.slug })),
  ]);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; berkas: string }> }): Promise<Metadata> {
  const { locale, berkas } = await params;
  const t = await getTranslations({ locale, namespace: "curation" });
  const label = curationLabels[berkas]?.[locale];
  if (label) {
    return pageMetadata({ locale, path: `/kurasi/${berkas}`, title: label, description: `${label} — ${t("lead")}`,
      og: { eyebrow: t("title"), heading: label } });
  }
  const s = await seriKurasiBySlug(berkas);
  if (!s) return {};
  const judul = `${t("title")} ${s.akronim}`;
  return pageMetadata({ locale, path: `/kurasi/${berkas}`, title: judul, description: `${s.nama} — ${t("seriesLead")}`,
    og: { eyebrow: t("title"), heading: s.nama } });
}

export default async function CurationItem({ params }: { params: Promise<{ locale: Locale; berkas: string }> }) {
  const { locale, berkas } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("curation");

  const folder = curation.folders.find((f) => f.key === berkas);
  if (folder) {
    const label = curationLabels[berkas]?.[locale] ?? berkas;
    return (
      <>
        <div className="shell pt-8"><BackLink href="/kurasi">{t("title")}</BackLink></div>
        <PageHeader eyebrow={t("title")} title={label} />
        <Section>
          <ButtonLink href={folder.url} tone="primary" external>{t("openFolder")}</ButtonLink>
        </Section>
      </>
    );
  }

  const s = await seriKurasiBySlug(berkas);
  if (!s) notFound();
  const edisi = s.edisi;

  return (
    <>
      <div className="shell pt-8"><BackLink href="/kurasi">{t("title")}</BackLink></div>
      <PageHeader eyebrow={`${t("title")} · ${s.akronim}`} title={s.nama} lead={t("seriesLead")}
        aside={s.logo ? (
          <div className="relative ml-auto h-20 w-20"><Image src={s.logo} alt="" fill sizes="80px" className="object-contain" /></div>
        ) : undefined} />
      {edisi.map((e, i) => (
        <Section key={e.tahun} eyebrow={t("edition", { tahun: e.tahun })} padat={i === 0}
          action={<Link href={`/kurasi/${s.slug}/${e.tahun}`}
            className="text-[14px] font-medium text-[var(--teal)] underline decoration-1 underline-offset-2">{t("viewDocuments")} →</Link>}>
          <KurasiLinimasa edisi={e} locale={locale} />
        </Section>
      ))}
    </>
  );
}

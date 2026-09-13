import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { PageHeader, Section, ButtonLink, BackLink } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { curation, curationLabels } from "@/content/external";

/** /CurationLKTIN dan /CurationOSPC lama adalah dua komponen; kini satu rute. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    curation.folders.map((f) => ({ locale, berkas: f.key })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; berkas: string }> }): Promise<Metadata> {
  const { locale, berkas } = await params;
  const label = curationLabels[berkas]?.[locale];
  if (!label) return {};
  const t = await getTranslations({ locale, namespace: "curation" });
  return pageMetadata({ locale, path: `/kurasi/${berkas}`, title: label, description: `${label} — ${t("lead")}`,
    og: { eyebrow: t("title"), heading: label } });
}

export default async function CurationItem({ params }: { params: Promise<{ locale: Locale; berkas: string }> }) {
  const { locale, berkas } = await params;
  setRequestLocale(locale);
  const folder = curation.folders.find((f) => f.key === berkas);
  if (!folder) notFound();
  const t = await getTranslations("curation");
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

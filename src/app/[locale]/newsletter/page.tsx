import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Section } from "@/components/ui";
import { SubscribeForm } from "@/components/subscribe-form";
import { pageMetadata } from "@/lib/seo";
import { semuaTerbitan, sampulTerbitan, labelTerbitan } from "@/lib/newsletter";
import { judulNewsletter } from "@/lib/teks-event";
import { NewsletterDaftar, type KartuTerbitan } from "@/components/newsletter-daftar";

export const revalidate = 900;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsletter" });
  const { terbitan } = await semuaTerbitan();
  return pageMetadata({ locale, path: "/newsletter", title: t("title"), description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title"), meta: t("count", { count: terbitan.length }) } });
}

const kecil = (url: string | null) =>
  url && url.includes("api-dashboard.iysa.or.id") ? `${url}${url.includes("?") ? "&" : "?"}w=640` : url;

/**
 * Newsletter IYSA — semua terbitan dari dasbor (`_newsletter`): terbitan
 * terbaru ditonjolkan, sisanya kisi sampul yang bisa disaring per tahun.
 */
export default async function NewsletterIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("newsletter");
  const { terbitan } = await semuaTerbitan();

  const kartu: KartuTerbitan[] = terbitan.map((i) => ({
    slug: i.slug,
    judul: judulNewsletter(i, locale),
    label: labelTerbitan(i, locale),
    tahun: i.year,
    sampul: kecil(sampulTerbitan(i)),
    halaman: i.halaman ?? null,
  }));

  return (
    <>
      <header className="border-b border-[var(--line)]">
        <div className="shell flex flex-col gap-2 py-8 md:flex-row md:items-end md:justify-between md:py-10">
          <div>
            <p className="eyebrow">IYSA</p>
            <h1 className="mt-1.5 text-title text-[var(--navy)]">{t("title")}</h1>
          </div>
          <p className="text-[13.5px] text-[var(--ink-muted)]">{t("count", { count: terbitan.length })} · 2022–{terbitan[0]?.year ?? ""}</p>
        </div>
      </header>

      <Section padat>
        <NewsletterDaftar terbitan={kartu}
          teks={{
            terbaru: t("latest"), baca: t("read"), semua: t("allYears"), lead: t("latestLead"),
            halaman: t("pages", { count: 2 }).replace("2", "#"), jumlah: t("count", { count: 2 }).replace("2", "#"),
          }} />
      </Section>

      <Section eyebrow={t("subscribeEyebrow")} title={t("subscribeTitle")} lead={t("subscribeLead")} sunk>
        <div className="max-w-md">
          <SubscribeForm />
        </div>
      </Section>
    </>
  );
}

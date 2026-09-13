import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { photoUrl } from "@/lib/assets";
import { experts } from "@/content/profile";
import expertImages from "@/content/generated/expert-images.json";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "team" });
  return pageMetadata({ locale, path: "/tim/ahli", title: t("expertTitle"), description: t("expertLead"),
    og: { eyebrow: "IYSA", heading: t("expertTitle") } });
}

export default async function ExpertTeamPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("team");

  /* expertTeam.json di situs lama hanya senarai NAMA BERKAS — tidak ada nama
     orang, jabatan, atau institusi sama sekali. Jadi di sini yang bisa
     ditampilkan baru gambarnya. Dasbor sudah punya 29 orang lengkap dengan CV;
     begitu API publiknya menyajikan data, halaman ini yang pertama pindah. */
  const images = (expertImages as string[]).map((f) => photoUrl(`./assets/images/team/${f}`)).filter(Boolean) as string[];

  return (
    <>
      <PageHeader eyebrow="Tim" title={t("expertTitle")} lead={t("expertLead")} />
      <Section>
        <p className="max-w-[66ch] text-[15.5px] leading-relaxed text-[var(--ink-muted)]">{experts[locale]}</p>
        {images.length > 0 && (
          <ul className="rise-stagger mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {images.map((src) => (
              <li key={src} className="relative aspect-[4/5] overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
                <Image src={src} alt="" fill sizes="(max-width: 640px) 45vw, 200px" className="object-cover" />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section, MoreLink } from "@/components/ui";
import { pageMetadata, faqJsonLd } from "@/lib/seo";
import { ambilFaq, ambilGrupFaq } from "@/content/faq";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const daftar = ambilFaq(locale);
  return pageMetadata({
    locale, path: "/faq", title: t("title"), description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title"), meta: `${daftar.length} ${locale === "id" ? "pertanyaan" : "questions"}` },
  });
}

const GROUP_KEY: Record<string, string> = {
  registration: "groupRegistration",
  presentation: "groupPresentation",
  results: "groupResults",
};

export default async function FaqPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const daftar = ambilFaq(locale);
  const groups = ambilGrupFaq(locale);

  return (
    <>
      {/* FAQPage structured data — bisa muncul langsung di hasil pencarian. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(daftar)) }} />

      <PageHeader
        eyebrow="FAQ"
        title={t("title")}
        lead={t("lead")}
        count={daftar.length}
        countLabel={locale === "id" ? "pertanyaan umum" : "questions answered"}
      />

      {groups.map((g, i) => (
        <Section key={g.group} eyebrow={GROUP_KEY[g.group] ? t(GROUP_KEY[g.group]) : g.group} sunk={i % 2 === 1}>
          <ul className="flex flex-col">
            {g.items.map((item) => (
              <li key={item.question} className="border-b border-[var(--line)] last:border-0">
                {/* <details> — terbuka di hasil cetak dan tanpa JavaScript. */}
                <details className="group py-5">
                  <summary className="flex cursor-pointer items-start gap-4 font-serif text-[17px] leading-snug font-bold text-[var(--ink)] marker:content-none">
                    <span className="flex-1">{item.question}</span>
                    <span aria-hidden className="mt-0.5 shrink-0 font-sans text-[var(--teal)] transition-transform duration-[var(--gerak-cepat)] group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-[68ch] text-[15.5px] leading-relaxed text-[var(--ink-muted)]">{item.answer}</p>
                </details>
              </li>
            ))}
          </ul>
        </Section>
      ))}

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-8">
          <p className="font-serif text-[17px] font-bold text-[var(--ink)]">{t("stillAsking")}</p>
          <MoreLink href="/kontak">{t("contactUs")}</MoreLink>
        </div>
      </Section>
    </>
  );
}

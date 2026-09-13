import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section, DefList } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";
import { pageMetadata } from "@/lib/seo";
import { org, addressLine, primaryWhatsapp } from "@/content/org";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageMetadata({ locale, path: "/kontak", title: t("title"), description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title"), meta: org.address.city } });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <>
      <PageHeader eyebrow="Kontak" title={t("title")} lead={t("lead")} />
      <Section>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <h2 className="eyebrow mb-6">{t("formTitle")}</h2>
            <ContactForm />
          </div>

          <div className="md:col-span-5">
            <DefList
              items={[
                { label: t("office"), value: (
                  <a href={org.address.mapsUrl} target="_blank" rel="noreferrer" className="leading-relaxed hover:text-[var(--teal)]">{addressLine}</a>
                )},
                { label: t("email"), value: (
                  <a href={`mailto:${org.email}`} className="break-all hover:text-[var(--teal)]">{org.email}</a>
                )},
                { label: t("whatsapp"), value: (
                  <a href={`https://wa.me/${primaryWhatsapp.number}`} target="_blank" rel="noreferrer" className="tnum hover:text-[var(--teal)]">{primaryWhatsapp.display}</a>
                )},
                { label: t("social"), value: (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {org.social.map((s) => (
                      <li key={s.label}>
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-[14px] text-[var(--teal)] underline decoration-1 underline-offset-2">{s.label}</a>
                      </li>
                    ))}
                  </ul>
                )},
              ]}
            />

            {/* Peta kantor — ada di situs lama, hilang di versi pertama situs
                baru. Dimuat malas: iframe pihak ketiga di paro bawah halaman
                tidak perlu ikut menahan muat awal. */}
            <div className="mt-8 aspect-[4/3] w-full overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
              <iframe
                src={org.address.mapsEmbed}
                title={t("office")}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { primaryNav } from "@/lib/nav";
import { org, addressLine, primaryWhatsapp } from "@/content/org";
import { SubscribeForm } from "./subscribe-form";
import { IysaWordmark } from "./iysa-logo";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");

  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-[var(--bg-sunk)]">
      <div className="shell py-14">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Identitas */}
          <div className="md:col-span-4">
            {/* Lambang di kaki halaman lebih besar daripada di header (36px):
                di sini ia satu-satunya tanda merek di layar, bukan pendamping
                navigasi, dan di 36px meridian bola dunianya ikut terbaca. */}
            <IysaWordmark size={36} />
            <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-[var(--ink-muted)]">
              {t("tagline")}
            </p>
            <p className="eyebrow mt-5">{org.name}</p>
          </div>

          {/* Tautan */}
          <nav aria-label={t("explore")} className="md:col-span-3">
            <h2 className="eyebrow">{t("explore")}</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {primaryNav.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.path}
                    className="text-[15px] text-[var(--ink-muted)] transition-colors duration-[var(--gerak-cepat)] hover:text-[var(--teal)]"
                  >
                    {nav(item.key)}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={org.dashboardUrl}
                  className="text-[15px] font-medium text-[var(--teal)] underline decoration-1 underline-offset-2"
                >
                  {nav("dashboard")}
                </a>
              </li>
            </ul>
          </nav>

          {/* Kontak */}
          <div className="md:col-span-2">
            <h2 className="eyebrow">{t("contact")}</h2>
            <ul className="mt-4 flex flex-col gap-3 text-[15px] text-[var(--ink-muted)]">
              <li>
                <a
                  href={org.address.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="leading-relaxed transition-colors duration-[var(--gerak-cepat)] hover:text-[var(--teal)]"
                >
                  {addressLine}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${org.email}`}
                  className="break-all transition-colors duration-[var(--gerak-cepat)] hover:text-[var(--teal)]"
                >
                  {org.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${primaryWhatsapp.number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tnum transition-colors duration-[var(--gerak-cepat)] hover:text-[var(--teal)]"
                >
                  {primaryWhatsapp.display}
                </a>
              </li>
            </ul>
          </div>

          {/* Langganan + sosial */}
          <div className="md:col-span-3">
            <h2 className="eyebrow">{t("subscribe")}</h2>
            <div className="mt-4">
              <SubscribeForm compact />
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
              {org.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[12px] tracking-wide text-[var(--ink-faint)] transition-colors duration-[var(--gerak-cepat)] hover:text-[var(--teal)]"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--line)] pt-6 font-mono text-[11.5px] text-[var(--ink-faint)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {org.shortName}. {t("rights")}
          </p>
          <p>{t("builtBy")}</p>
        </div>
      </div>
    </footer>
  );
}

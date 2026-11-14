import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <div className="shell flex min-h-[60vh] flex-col justify-center py-20">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-serif text-display text-[var(--navy)]">{t("notFoundTitle")}</h1>
      <p className="mt-5 max-w-[48ch] font-sans text-lead text-[var(--ink-muted)]">{t("notFoundBody")}</p>
      <div className="mt-8"><ButtonLink href="/" tone="navy">{t("backHome")}</ButtonLink></div>
    </div>
  );
}

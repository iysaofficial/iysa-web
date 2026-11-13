"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { useTransition } from "react";

const LABEL: Record<Locale, string> = { id: "ID", en: "EN" };
const FULL: Record<Locale, string> = { id: "Bahasa Indonesia", en: "English" };

/**
 * Tetap di halaman yang sama saat bahasa berganti — `usePathname` dari
 * next-intl memberi path tanpa prefiks locale, jadi /id/event/ospc-2024
 * berpindah ke /en/event/ospc-2024, bukan kembali ke beranda.
 */
export function LocaleSwitch() {
  const t = useTranslations("nav");
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="radiogroup"
      aria-label={t("switchLanguage")}
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] p-0.5"
      data-pending={pending || undefined}
    >
      {routing.locales.map((l) => {
        const current = l === active;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={current}
            aria-label={FULL[l]}
            lang={l}
            disabled={current || pending}
            onClick={() =>
              startTransition(() => {
                router.replace(pathname, { locale: l });
              })
            }
            className={`rounded-full px-2.5 py-1 font-sans text-[11px] font-bold tracking-wider transition-colors duration-[var(--gerak-cepat)] ${
              current
                ? "bg-[var(--navy)] text-[var(--on-navy)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            {LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}

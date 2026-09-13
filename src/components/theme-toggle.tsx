"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  setTheme,
  type ThemeMode,
} from "@/lib/theme-store";

/**
 * Tiga keadaan, bukan dua. "Ikut sistem" adalah bawaan dan harus bisa dipilih
 * kembali — kalau tombolnya cuma terang/gelap, pengunjung yang sudah
 * menekannya sekali kehilangan preferensi sistemnya selamanya.
 */
export function ThemeToggle() {
  const t = useTranslations("nav");
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const options: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "light", label: t("themeLight"), icon: "☀" },
    { value: "dark", label: t("themeDark"), icon: "☾" },
    { value: "system", label: t("themeSystem"), icon: "⌁" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t("theme")}
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] p-0.5"
    >
      {options.map((o) => {
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => setTheme(o.value)}
            className={`grid h-7 w-7 place-items-center rounded-full text-[13px] transition-colors duration-[var(--gerak-cepat)] ${
              active
                ? "bg-[var(--navy)] text-[var(--on-navy)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            <span aria-hidden>{o.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

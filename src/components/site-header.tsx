"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { primaryNav } from "@/lib/nav";
import { org } from "@/content/org";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitch } from "./locale-switch";
import { IysaWordmark } from "./iysa-logo";

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/88 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-4">
        {/* Lambang + wordmark. Lambangnya SVG sebaris, bukan <Image>: di 28px
            ia hanya ~1 KB di dalam HTML, tidak menambah satu pun permintaan
            jaringan, dan ikut berganti warna saat tema berubah tanpa perlu
            menukar berkas. */}
        <Link
          href="/"
          className="shrink-0 transition-opacity duration-[var(--gerak-cepat)] hover:opacity-80"
          onClick={() => setOpen(false)}
        >
          <IysaWordmark size={28} sub="Young Scientist" />
        </Link>

        {/* Menu utama — hanya layar lebar. */}
        <nav aria-label={t("menu")} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.path}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={`rounded px-2.5 py-1.5 text-[14px] font-medium transition-colors duration-[var(--gerak-cepat)] ${
                    isActive(item.path)
                      ? "text-[var(--navy)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex md:items-center md:gap-2">
            <LocaleSwitch />
            <ThemeToggle />
          </div>

          {/*
            Dasbor naik ke navigasi utama. Di situs lama tautan ini hanya ada
            di kaki halaman, dan pengembangnya sendiri mencatat bahwa peserta
            yang mencari unggah karya atau unduh sertifikat berakhir di sana
            karena menu atas tidak menjawab kebutuhan itu.
          */}
          <a
            href={org.dashboardUrl}
            className="hidden rounded-full bg-[var(--navy)] px-4 py-2 text-[13px] font-semibold whitespace-nowrap text-[var(--on-navy)] transition-opacity duration-[var(--gerak-cepat)] hover:opacity-90 sm:inline-block"
          >
            {t("dashboard")}
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-ponsel"
            className="grid h-9 w-9 place-items-center rounded border border-[var(--border)] lg:hidden"
          >
            <span className="sr-only">{open ? t("close") : t("menu")}</span>
            <span aria-hidden className="text-[15px] leading-none">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {/* Panel ponsel. Ponsel yang utama — peserta mendaftar dari HP. */}
      {open && (
        <div id="menu-ponsel" className="border-t border-[var(--line)] lg:hidden">
          <nav aria-label={t("menu")} className="shell py-4">
            <ul className="flex flex-col">
              {primaryNav.map((item) => (
                <li key={item.key} className="border-b border-[var(--line)] last:border-0">
                  <Link
                    href={item.path}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.path) ? "page" : undefined}
                    className={`flex items-center justify-between py-3 text-[17px] font-medium ${
                      isActive(item.path) ? "text-[var(--navy)]" : "text-[var(--ink)]"
                    }`}
                  >
                    {t(item.key)}
                    <span aria-hidden className="text-[var(--ink-faint)]">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <LocaleSwitch />
              <ThemeToggle />
            </div>

            <a
              href={org.dashboardUrl}
              className="mt-4 block rounded-full bg-[var(--navy)] px-4 py-3 text-center text-[15px] font-semibold text-[var(--on-navy)]"
            >
              {t("dashboard")}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

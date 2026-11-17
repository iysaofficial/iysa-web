"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

export type KartuTerbitan = {
  slug: string;
  judul: string;
  label: string;
  tahun: number;
  sampul: string | null;
  halaman: number | null;
};

/**
 * Daftar terbitan: terbitan terbaru ditonjolkan, sisanya kisi sampul yang bisa
 * disaring per tahun. Semua data datang dari dasbor lewat halaman server.
 */
export function NewsletterDaftar({
  terbitan, teks,
}: {
  terbitan: KartuTerbitan[];
  teks: { terbaru: string; baca: string; semua: string; halaman: string; jumlah: string; lead: string };
}) {
  const tahun = [...new Set(terbitan.map((t) => t.tahun))].sort((a, b) => b - a);
  const [pilih, setPilih] = useState<number | null>(null);
  const [utama, ...lain] = terbitan;
  const tampil = pilih === null ? lain : terbitan.filter((t) => t.tahun === pilih);

  const chip = (aktif: boolean) =>
    `tnum rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
      aktif ? "bg-[var(--navy)] text-[var(--on-navy)]" : "border border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
    }`;
  const hal = (n: number | null) => (n ? teks.halaman.replace("#", String(n)) : null);

  return (
    <>
      {/* ── Terbitan terbaru ── */}
      {utama && pilih === null && (
        <Link href={`/newsletter/${utama.slug}`}
          className="group mb-14 grid overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-sunk)] transition-colors hover:border-[var(--teal)] sm:grid-cols-[minmax(0,260px)_1fr]">
          <div className="relative aspect-[4/3] bg-[var(--bg)] sm:aspect-[3/4]">
            {utama.sampul && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={utama.sampul} alt={utama.judul} className="h-full w-full object-cover object-top" />
            )}
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
            <span className="w-fit rounded-full bg-[var(--teal)] px-3 py-1 text-[11.5px] font-bold tracking-wide text-[var(--on-teal)] uppercase">
              {teks.terbaru}
            </span>
            <h2 className="font-serif text-[28px] leading-tight font-bold text-[var(--navy)] sm:text-[34px]">{utama.judul}</h2>
            <p className="max-w-[48ch] text-[15px] leading-relaxed text-[var(--ink-muted)]">{teks.lead}</p>
            <p className="text-[13px] text-[var(--ink-faint)]">
              {utama.label}{hal(utama.halaman) ? ` · ${hal(utama.halaman)}` : ""}
            </p>
            <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--navy)] px-5 py-2.5 text-[14px] font-semibold text-[var(--on-navy)] transition-transform group-hover:translate-x-0.5">
              {teks.baca} →
            </span>
          </div>
        </Link>
      )}

      {/* ── Saring tahun ── */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setPilih(null)} className={chip(pilih === null)} aria-pressed={pilih === null}>{teks.semua}</button>
        {tahun.map((t) => (
          <button key={t} type="button" onClick={() => setPilih(t)} className={chip(pilih === t)} aria-pressed={pilih === t}>{t}</button>
        ))}
        <span className="ml-auto text-[13px] text-[var(--ink-faint)]">
          {teks.jumlah.replace("#", String(pilih === null ? terbitan.length : tampil.length))}
        </span>
      </div>

      {/* ── Kisi sampul ── */}
      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {tampil.map((t) => (
          <li key={t.slug}>
            <Link href={`/newsletter/${t.slug}`} className="group block">
              <span className="relative block aspect-[3/4] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-sunk)] shadow-sm transition-all duration-[var(--gerak-sedang)] group-hover:-translate-y-1 group-hover:shadow-lg">
                {t.sampul ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.sampul} alt={t.judul} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center px-3 text-center text-[12px] text-[var(--ink-faint)]">{t.judul}</span>
                )}
              </span>
              <span className="mt-3 block text-[11.5px] font-semibold tracking-wide text-[var(--teal)] uppercase">{t.label}</span>
              <span className="mt-0.5 block font-serif text-[14.5px] leading-snug font-bold text-[var(--ink)] group-hover:text-[var(--navy)]">
                {t.judul}
              </span>
              {hal(t.halaman) && <span className="mt-0.5 block text-[12px] text-[var(--ink-faint)]">{hal(t.halaman)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

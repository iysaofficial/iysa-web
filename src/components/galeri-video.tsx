"use client";

import { useEffect, useState } from "react";

export type VideoGaleri = { id: string; judul: string; tahun: number };

/**
 * Kisi video: thumbnail ringan, pemutar YouTube baru dimuat saat diklik.
 * Sebelumnya 49 iframe dimuat sekaligus (halaman 6.700 px, berat di ponsel).
 */
export function GaleriVideo({
  video, tahun, teks,
}: {
  video: VideoGaleri[];
  tahun: number[];
  teks: { semua: string; tutup: string; putar: string; jumlah: string };
}) {
  const [pilihTahun, setPilihTahun] = useState<number | null>(tahun[0] ?? null);
  const [main, setMain] = useState<VideoGaleri | null>(null);
  const tampil = pilihTahun === null ? video : video.filter((v) => v.tahun === pilihTahun);

  useEffect(() => {
    if (!main) return;
    const tutup = (e: KeyboardEvent) => e.key === "Escape" && setMain(null);
    window.addEventListener("keydown", tutup);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", tutup); document.body.style.overflow = ""; };
  }, [main]);

  const chip = (aktif: boolean) =>
    `tnum rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
      aktif ? "bg-[var(--navy)] text-[var(--on-navy)]" : "border border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
    }`;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {tahun.map((t) => (
          <button key={t} type="button" onClick={() => setPilihTahun(t)} className={chip(pilihTahun === t)} aria-pressed={pilihTahun === t}>
            {t}
          </button>
        ))}
        <button type="button" onClick={() => setPilihTahun(null)} className={chip(pilihTahun === null)} aria-pressed={pilihTahun === null}>
          {teks.semua}
        </button>
        <span className="ml-auto text-[13px] text-[var(--ink-faint)]">{teks.jumlah.replace("#", String(tampil.length))}</span>
      </div>

      <ul className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {tampil.map((v) => (
          <li key={v.id}>
            <button type="button" onClick={() => setMain(v)} className="group block w-full text-left" aria-label={`${teks.putar}: ${v.judul}`}>
              <span className="relative block aspect-video overflow-hidden rounded-lg bg-[var(--bg-sunk)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[var(--gerak-sedang)] group-hover:scale-[1.04]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                <span className="absolute top-1/2 left-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[var(--navy)] shadow-lg transition-transform group-hover:scale-110">
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden><path d="M8 5.5v13l11-6.5z" /></svg>
                </span>
                <span className="tnum absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">{v.tahun}</span>
              </span>
              <span className="mt-2.5 block font-serif text-[15px] leading-snug font-bold text-[var(--ink)] group-hover:text-[var(--teal)]">
                {v.judul}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {main && (
        <div role="dialog" aria-modal="true" aria-label={main.judul}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(4,7,18,0.92)] p-4" onClick={() => setMain(null)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <p className="font-serif text-[17px] font-bold text-white">{main.judul}</p>
              <button type="button" onClick={() => setMain(null)} aria-label={teks.tutup}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-xl text-white hover:bg-white/25">×</button>
            </div>
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe src={`https://www.youtube-nocookie.com/embed/${main.id}?autoplay=1&rel=0`} title={main.judul}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="h-full w-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

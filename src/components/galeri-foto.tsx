"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Album } from "@/lib/galeri";

const kecil = (url: string, w: number) => `${url}${url.includes("?") ? "&" : "?"}w=${w}`;

/**
 * Album dokumentasi per event + penampil foto (‹ ›, panah keyboard, Esc).
 */
export function GaleriFoto({
  album, teks,
}: {
  album: Album[];
  teks: { foto: string; tutup: string; sebelum: string; sesudah: string; folder: string; luring: string; daring: string; sarpras: string };
}) {
  const [buka, setBuka] = useState<{ a: number; i: number } | null>(null);
  const a = buka ? album[buka.a] : null;

  const geser = useCallback((d: number) => {
    setBuka((b) => (b ? { a: b.a, i: (b.i + d + album[b.a].foto.length) % album[b.a].foto.length } : b));
  }, [album]);

  useEffect(() => {
    if (!buka) return;
    const kunci = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(null);
      if (e.key === "ArrowRight") geser(1);
      if (e.key === "ArrowLeft") geser(-1);
    };
    window.addEventListener("keydown", kunci);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", kunci); document.body.style.overflow = ""; };
  }, [buka, geser]);

  /* Sampul: foto kegiatan (bukan foto gedung/lokasi), dan tidak sama dengan
     sampul album lain — ajang yang digelar bersamaan berbagi dokumentasi. */
  const sampulIdx = useMemo(() => {
    /* Sampul: foto kegiatan (bukan foto gedung/lokasi). Ajang yang digelar
       bersamaan berbagi dokumentasi yang diunggah terpisah (alamat dan
       keterangan bisa sedikit berbeda), jadi album dikelompokkan menurut
       tanggal mulai + jumlah foto, dan tiap album dalam kelompok mengambil
       foto kegiatan dengan urutan berbeda. */
    const tempat = /^(gedung|building|venue|lokasi|tempat|kampus|campus)\b/i;
    const urutan = new Map<string, number>();
    return album.map((al) => {
      const kandidat = al.foto
        .map((f, i) => ({ f, i }))
        .sort((x, y) => Number(tempat.test(x.f.label)) - Number(tempat.test(y.f.label)) || Number(x.f.jenis === "sarpras") - Number(y.f.jenis === "sarpras") || x.i - y.i);
      if (kandidat.length === 0) return 0;
      const grup = `${al.mulai ?? al.tahun}|${al.foto.length}`;
      const ke = urutan.get(grup) ?? 0;
      urutan.set(grup, ke + 1);
      return kandidat[(ke * 3) % kandidat.length].i;
    });
  }, [album]);

  const label = (j: string) => (j === "luring" ? teks.luring : j === "daring" ? teks.daring : j === "sarpras" ? teks.sarpras : j);

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {album.map((al, ai) => {
          const sampul = al.foto[sampulIdx[ai]];
          const folder = al.tautan.luring ?? al.tautan.daring ?? al.tautan.sarpras;
          return (
            <li key={`${al.akronim}-${al.tahun}`} className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg)]">
              {sampul ? (
                <button type="button" onClick={() => setBuka({ a: ai, i: sampulIdx[ai] })} className="group relative block aspect-[4/3] w-full overflow-hidden bg-[var(--bg-sunk)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={kecil(sampul.gambar, 640)} alt={sampul.label} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[var(--gerak-sedang)] group-hover:scale-[1.04]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="tnum absolute right-2.5 bottom-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] font-semibold text-white">
                    {teks.foto.replace("#", String(al.foto.length))}
                  </span>
                </button>
              ) : (
                <a href={folder ?? "#"} target="_blank" rel="noreferrer"
                  className="grid aspect-[4/3] w-full place-items-center bg-[var(--bg-sunk)] text-[13px] text-[var(--teal)]">
                  {teks.folder} ↗
                </a>
              )}
              <div className="flex items-center gap-3 px-4 py-3">
                {al.logo && (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-white p-0.5 ring-1 ring-[var(--line)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={kecil(al.logo, 320)} alt="" className="h-full w-full object-contain" loading="lazy" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[15.5px] leading-tight font-bold text-[var(--ink)]">{al.akronim} {al.tahun}</p>
                  <p className="truncate text-[12.5px] text-[var(--ink-muted)]">{al.nama}</p>
                </div>
                {folder && sampul && (
                  <a href={folder} target="_blank" rel="noreferrer" title={teks.folder}
                    className="shrink-0 rounded-full border border-[var(--border)] px-2.5 py-1 text-[12px] text-[var(--ink-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)]">
                    Drive ↗
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {a && buka && (
        <div role="dialog" aria-modal="true" aria-label={`${a.akronim} ${a.tahun}`}
          className="fixed inset-0 z-[60] flex flex-col bg-[#05080f] text-white" onClick={() => setBuka(null)}>
          <div className="flex items-center justify-between gap-4 px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-[16px] font-bold">
              {a.akronim} {a.tahun}
              <span className="tnum ml-3 font-sans text-[13px] font-normal text-white/60">{buka.i + 1} / {a.foto.length}</span>
            </p>
            <button type="button" onClick={() => setBuka(null)} aria-label={teks.tutup}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xl hover:bg-white/25">×</button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={a.foto[buka.i].gambar} src={kecil(a.foto[buka.i].gambar, 1280)} alt={a.foto[buka.i].label}
              className="max-h-full max-w-full rounded object-contain" />
            {a.foto.length > 1 && (
              <>
                <button type="button" onClick={() => geser(-1)} aria-label={teks.sebelum}
                  className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-2xl hover:bg-white/30">‹</button>
                <button type="button" onClick={() => geser(1)} aria-label={teks.sesudah}
                  className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-2xl hover:bg-white/30">›</button>
              </>
            )}
          </div>

          <div className="px-4 pt-3 pb-4" onClick={(e) => e.stopPropagation()}>
            <p className="mx-auto max-w-3xl text-center text-[14px] leading-relaxed text-white/85">
              <span className="mr-2 rounded-full bg-white/15 px-2 py-0.5 text-[11px] uppercase tracking-wide">{label(a.foto[buka.i].jenis)}</span>
              {a.foto[buka.i].label}
            </p>
            {a.foto.length > 1 && (
              <div className="mx-auto mt-3 flex max-w-4xl gap-2 overflow-x-auto pb-1">
                {a.foto.map((f, i) => (
                  <button key={i} type="button" onClick={() => setBuka({ a: buka.a, i })}
                    className={`h-14 w-20 shrink-0 overflow-hidden rounded ${i === buka.i ? "ring-2 ring-white" : "opacity-55 hover:opacity-100"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={kecil(f.gambar, 320)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

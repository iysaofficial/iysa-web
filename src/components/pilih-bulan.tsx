"use client";

import { useRouter } from "@/i18n/navigation";

/**
 * Kontrol bulan kalender dalam satu baris: ‹ [bulan] [tahun] › Bulan ini.
 * Mengganti bulan/tahun langsung membuka ?bulan=YYYY-MM, tanpa tombol kirim.
 */
export function PilihBulan({
  tahun, bulan, namaBulan, tahunPilihan, label,
}: {
  tahun: number;
  bulan: number;
  namaBulan: string[];
  tahunPilihan: number[];
  label: { bulan: string; tahun: string; sebelum: string; sesudah: string; kini: string };
}) {
  const router = useRouter();
  const buka = (t: number, b: number) => {
    const d = new Date(Date.UTC(t, b - 1, 1));
    router.push(`/kalender?bulan=${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`, { scroll: false });
  };

  const tombol =
    "grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] text-[var(--ink-muted)] transition-colors hover:border-[var(--teal)] hover:text-[var(--teal)]";
  const pilih =
    "h-9 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 text-[13.5px] font-medium text-[var(--ink)] hover:border-[var(--teal)] focus:border-[var(--teal)] focus:outline-none";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" aria-label={label.sebelum} onClick={() => buka(tahun, bulan - 1)} className={tombol}>‹</button>
      <select aria-label={label.bulan} value={bulan} onChange={(e) => buka(tahun, Number(e.target.value))} className={pilih}>
        {namaBulan.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
      </select>
      <select aria-label={label.tahun} value={tahun} onChange={(e) => buka(Number(e.target.value), bulan)} className={`${pilih} tnum`}>
        {tahunPilihan.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <button type="button" aria-label={label.sesudah} onClick={() => buka(tahun, bulan + 1)} className={tombol}>›</button>
      <button type="button" onClick={() => router.push("/kalender", { scroll: false })}
        className="h-9 rounded-full px-3 text-[13.5px] font-medium text-[var(--teal)] hover:bg-[var(--bg-sunk)]">
        {label.kini}
      </button>
    </div>
  );
}

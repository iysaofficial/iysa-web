"use client";

import { useRouter } from "@/i18n/navigation";

/**
 * Pemilih bulan + tahun kalender. Mengganti salah satunya langsung membuka
 * bulan itu (?bulan=YYYY-MM) — tanpa tombol kirim.
 */
export function PilihBulan({
  tahun, bulan, namaBulan, tahunPilihan, labelBulan, labelTahun,
}: {
  tahun: number;
  bulan: number;
  namaBulan: string[];
  tahunPilihan: number[];
  labelBulan: string;
  labelTahun: string;
}) {
  const router = useRouter();
  const buka = (t: number, b: number) =>
    router.push(`/kalender?bulan=${t}-${String(b).padStart(2, "0")}`, { scroll: false });

  const kelas =
    "rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-[13px] text-[var(--ink)] hover:border-[var(--teal)] focus:border-[var(--teal)] focus:outline-none";

  return (
    <div className="flex items-center gap-2">
      <select aria-label={labelBulan} value={bulan} onChange={(e) => buka(tahun, Number(e.target.value))} className={kelas}>
        {namaBulan.map((n, i) => (
          <option key={i} value={i + 1}>{n}</option>
        ))}
      </select>
      <select aria-label={labelTahun} value={tahun} onChange={(e) => buka(Number(e.target.value), bulan)} className={`${kelas} tnum`}>
        {tahunPilihan.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { type EdisiKurasi, WARNA_NADA, ringkasEdisi, tanggalKurasi } from "@/lib/kurasi";

/**
 * Linimasa kurasi Puspresnas satu edisi.
 *
 * Label langkah dan status TIDAK diterjemahkan: itu istilah resmi Puspresnas,
 * dan pembaca mencocokkannya dengan laman pengajuan kurasi.
 */
export async function KurasiLinimasa({ edisi, locale }: { edisi: EdisiKurasi; locale: Locale }) {
  const t = await getTranslations("curation");
  const { nomor, total } = ringkasEdisi(edisi);

  if (edisi.persiapan || nomor === 0) {
    return <p className="text-[14px] text-[var(--ink-muted)]">{t("preparationLead")}</p>;
  }

  return (
    <div>
      <p className="tnum font-mono text-[12px] text-[var(--ink-faint)]">{t("stepOf", { n: nomor, total })}</p>
      <ol className="mt-4 flex flex-col">
        {edisi.isi.map((k, i) => {
          const tercatat = k.tercatat !== false;
          const warna = tercatat ? WARNA_NADA[k.nada] ?? WARNA_NADA.berjalan : WARNA_NADA.belum;
          const akhir = i === edisi.isi.length - 1;
          return (
            <li key={k.langkah} className="relative flex gap-4 pb-5 last:pb-0">
              {!akhir && (
                <span aria-hidden className="absolute top-4 left-[5px] h-full w-px bg-[var(--line)]" />
              )}
              <span
                aria-hidden
                className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2"
                style={{ borderColor: warna, background: tercatat ? warna : "var(--bg)" }}
              />
              <div className="min-w-0">
                <p className={`text-[14.5px] leading-snug font-medium ${tercatat ? "text-[var(--ink)]" : "text-[var(--ink-faint)]"}`}>
                  {k.label}
                </p>
                {tercatat ? (
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[var(--ink-muted)]">
                    {k.status && <span style={{ color: warna }} className="font-medium">{k.status}</span>}
                    {k.terjadi_pada && <span className="tnum">{tanggalKurasi(k.terjadi_pada, locale)}</span>}
                    {k.bintang != null && k.bintang > 0 && (
                      <span aria-label={t("ratingStars", { n: k.bintang })}>
                        {"★".repeat(k.bintang)}
                        <span className="opacity-25">{"★".repeat(Math.max(0, 5 - k.bintang))}</span>
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-[13px] text-[var(--ink-faint)]">{t("notStarted")}</p>
                )}
                {tercatat && k.catatan && (
                  <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-[var(--ink-muted)]">{k.catatan}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Section, EmptyState } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { photoFolders } from "@/content/external";
import { GaleriKepala } from "@/components/galeri-kepala";
import { GaleriFoto } from "@/components/galeri-foto";
import { ambilAlbum } from "@/lib/galeri";

export const revalidate = 900;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return pageMetadata({ locale, path: "/galeri/foto", title: t("photoTitle"), description: t("photoLead"),
    og: { eyebrow: "IYSA", heading: t("photoTitle") } });
}

/**
 * Galeri foto — album dokumentasi per event dari dasbor (`_dokumentasi`),
 * dipilih per tahun (?tahun=). Folder Drive per tahun dari situs lama tetap
 * ditautkan sebagai arsip lengkap.
 */
export default async function PhotoGallery({
  params, searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ tahun?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gallery");

  const semua = (await ambilAlbum()) ?? [];
  const daftarTahun = [...new Set(semua.map((a) => a.tahun).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const diminta = (await searchParams).tahun;
  const tahun = diminta && daftarTahun.includes(diminta) ? diminta : daftarTahun[0];
  const album = semua
    .filter((a) => a.tahun === tahun)
    .sort((a, b) => b.foto.length - a.foto.length || a.akronim.localeCompare(b.akronim));

  const chip = (aktif: boolean) =>
    `tnum rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
      aktif ? "bg-[var(--navy)] text-[var(--on-navy)]" : "border border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
    }`;

  return (
    <>
      <GaleriKepala judul={t("photoTitle")} aktif="foto" label={{ eyebrow: t("eyebrow"), foto: t("photoTab"), video: t("videoTab") }} />

      <Section padat>
        {daftarTahun.length === 0 ? (
          <EmptyState title={t("unavailable")} />
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-center gap-2">
              {daftarTahun.map((y) => (
                <Link key={y} href={`/galeri/foto?tahun=${y}`} scroll={false} className={chip(y === tahun)} aria-current={y === tahun ? "page" : undefined}>
                  {y}
                </Link>
              ))}
              <span className="ml-auto text-[13px] text-[var(--ink-faint)]">{t("albumCount", { count: album.length })}</span>
            </div>
            <GaleriFoto key={tahun} album={album}
              teks={{ foto: t("photoCount", { count: 2 }).replace("2", "#"), tutup: t("close"), sebelum: t("prev"), sesudah: t("next"),
                folder: t("driveFolder"), luring: t("offline"), daring: t("online"), sarpras: t("venue") }} />
          </>
        )}

        {/* Arsip lengkap per tahun di Google Drive (situs lama). */}
        <div className="mt-14 border-t border-[var(--line)] pt-6">
          <p className="text-[13px] text-[var(--ink-muted)]">{t("archiveLead")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {photoFolders.map((f) => (
              <a key={f.year} href={f.url} target="_blank" rel="noreferrer"
                className="tnum rounded-full border border-[var(--border)] px-3 py-1 text-[12.5px] text-[var(--ink-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)]">
                {f.year} ↗
              </a>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

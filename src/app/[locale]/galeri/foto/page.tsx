import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section, MoreLink, SelPengisi } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { photoFolders } from "@/content/external";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return pageMetadata({ locale, path: "/galeri/foto", title: t("photoTitle"), description: t("photoLead"),
    og: { eyebrow: "IYSA", heading: t("photoTitle"), meta: `${photoFolders.length} ${locale === "id" ? "tahun" : "years"}` } });
}

/**
 * Tujuh kartu tahun, tanpa gambar — dan itu keputusan, bukan kekosongan yang
 * belum sempat diisi.
 *
 * Halaman ini sempat dibuat bergambar, memakai poster event lalu sampul
 * newsletter sebagai thumbnail per tahun. Keduanya dibatalkan setelah
 * dihitung terhadap data yang benar-benar ada:
 *
 *   poster event      2 dari 7 tahun  (events.json hanya memuat 2024–2026)
 *   sampul newsletter 4 dari 7 tahun  (terbitan baru mulai 2022)
 *
 * Tidak ada satu pun sumber yang menutup 2019–2025. Hasilnya kartu yang
 * sebagian bergambar dan sebagian kosong — lebih buruk daripada tujuh kartu
 * seragam, karena ketidakhadiran gambar jadi terbaca sebagai kerusakan.
 *
 * Menambalnya dengan gambar dari tahun lain bukan pilihan: kartu 2021 yang
 * menampilkan poster 2025 adalah keterangan yang salah, dan di halaman arsip
 * justru di situ ia paling menyesatkan. Aturan yang sama sudah berlaku untuk
 * lima poster event yang hilang.
 *
 * Kalau nanti dokumentasi fotonya pindah dari Drive, satu gambar sampul per
 * tahun bisa diambil dari sana dan halaman ini tinggal merendernya.
 */
export default async function PhotoGallery({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gallery");

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("photoTitle")}
        lead={t("photoLead")}
        count={photoFolders.length}
        countLabel={locale === "id" ? "tahun dokumentasi" : "years of archives"}
        aside={<MoreLink href="/galeri/video">{t("videoTitle")}</MoreLink>}
      />
      <Section>
        {/* Dokumentasi foto tetap di Drive. Memindahkannya ke penyimpanan lain
            adalah keputusan IYSA, bukan keputusan penulisan ulang situs. */}
        <ul
          className="rise-stagger grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4"
        >
          {photoFolders.map((f) => (
            <li key={f.year} className="bg-[var(--bg)]">
              <a href={f.url} target="_blank" rel="noreferrer"
                 className="group flex h-full flex-col justify-between gap-6 p-7 transition-colors duration-[var(--gerak-cepat)] hover:bg-[var(--bg-sunk)]">
                <span className="tnum font-mono text-[34px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">{f.year}</span>
                <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--teal)]">
                  {t("openFolder", { year: f.year })}
                  <span aria-hidden className="transition-transform duration-[var(--gerak-cepat)] group-hover:translate-x-0.5">↗</span>
                </span>
              </a>
            </li>
          ))}
          <SelPengisi jumlah={photoFolders.length} kolom={2} />
          <SelPengisi jumlah={photoFolders.length} kolom={4} />
        </ul>
      </Section>
    </>
  );
}

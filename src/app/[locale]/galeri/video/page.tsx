import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { videos, videoYears } from "@/lib/data";
import { rapikanJudul } from "@/lib/galeri";
import { GaleriKepala } from "@/components/galeri-kepala";
import { GaleriVideo, type VideoGaleri } from "@/components/galeri-video";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return pageMetadata({ locale, path: "/galeri/video", title: t("videoTitle"), description: t("videoLead"),
    og: { eyebrow: "IYSA", heading: t("videoTitle"), meta: t("count", { count: videos().length }) } });
}

/** Galeri video — kisi thumbnail per tahun; pemutar dimuat saat diklik. */
export default async function VideoGallery({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gallery");

  const daftar: VideoGaleri[] = videos()
    .filter((v) => v.youtubeId && v.year)
    .map((v) => ({ id: v.youtubeId as string, judul: rapikanJudul(v.title), tahun: v.year as number }));

  return (
    <>
      <GaleriKepala judul={t("videoTitle")} aktif="video" label={{ eyebrow: t("eyebrow"), foto: t("photoTab"), video: t("videoTab") }} />
      <Section padat>
        <GaleriVideo video={daftar} tahun={videoYears()}
          teks={{ semua: t("all"), tutup: t("close"), putar: t("watch"), jumlah: t("count", { count: 2 }).replace("2", "#") }} />
      </Section>
    </>
  );
}

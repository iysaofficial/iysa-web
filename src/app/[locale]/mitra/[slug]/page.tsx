import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

import { BackLink, ButtonLink, Pill, Section } from "@/components/ui";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { allAffiliates, affiliateBySlug } from "@/lib/data";
import { assetUrl, logoUrl } from "@/lib/assets";
import {
  affiliateCopy,
  affiliateCountry,
  affiliateNames,
  unverifiedCountry,
} from "@/content/affiliates";

/** 13 komponen React → satu rute. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    allAffiliates().map((a) => ({ locale, slug: a.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = affiliateBySlug(slug);
  if (!a) return {};

  const name = affiliateNames[a.slug] ?? a.name;
  const copy = affiliateCopy[a.slug]?.[locale] ?? a.description;
  const country = affiliateCountry[a.slug];

  return pageMetadata({
    locale,
    path: `/mitra/${a.slug}`,
    title: name,
    // Deskripsi dipotong di batas kata, bukan di tengah kata.
    description: copy
      .replace(/\s+/g, " ")
      .slice(0, 300)
      .replace(/\s\S*$/, ""),
    og: {
      eyebrow: "IYSA",
      heading: name,
      meta:
        country && !unverifiedCountry.has(a.slug) ? country[locale] : undefined,
    },
    type: "article",
  });
}

export default async function AffiliateDetail({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const a = affiliateBySlug(slug);
  if (!a) notFound();

  const t = await getTranslations("partners");
  const logo = logoUrl(a.logo);
  const name = affiliateNames[a.slug] ?? a.name;
  const copy = affiliateCopy[a.slug]?.[locale] ?? a.description;
  const country = affiliateCountry[a.slug];
  const showCountry = country && !unverifiedCountry.has(a.slug);

  // Foto dokumentasi acara; hanya MIYIO yang punya (dua buah). Yang berkasnya
  // tidak ada di repo lama disaring di sini, bukan dirender jadi kotak 404.
  const dokumentasi = a.images
    .map((p) => assetUrl(p))
    .filter((u): u is string => Boolean(u));

  /**
   * Judul seksi tautan mengikuti isinya.
   *
   * Tautan Drive mitra tidak semuanya galeri: MIYIO hanya menautkan panduan
   * peserta, jadi memberi judul "Galeri" pada seksinya menjanjikan sesuatu yang
   * tidak ada di balik tombolnya. Folder Drive = galeri; berkas tunggal (siaran
   * pers, panduan) bukan.
   */
  const adaGaleri = a.links.some((l) => l.url.includes("/drive/folders/"));
  const judulTautan = adaGaleri ? t("gallery") : t("links");

  const labelTautan = (judulAsli: string | null) => {
    if (!judulAsli) return t("openGallery");
    // Perbaikan salah salin di data warisan: halaman PISF menuliskan "Gallery BYSCC"
    const bersih =
      a.slug === "phatthalung-international-science-fair" &&
      /BYSCC/i.test(judulAsli)
        ? judulAsli.replace(/BYSCC/gi, "PISF")
        : judulAsli;
    if (locale === "id") {
      return bersih
        .replace(/^Gallery\b/i, "Galeri")
        .replace(/^Press Release\b/i, "Siaran Pers")
        .replace(/^Guidebook\b/i, "Buku Panduan");
    }
    return bersih;
  };

  const judulVideo = a.sections[0]
    ? locale === "id"
      ? a.sections[0].replace(/^After Event\b/i, "Dokumentasi")
      : a.sections[0]
    : t("afterEvent");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              [
                { name: "IYSA", path: "/" },
                { name: t("title"), path: "/mitra" },
                { name, path: `/mitra/${a.slug}` },
              ],
              locale,
            ),
          ),
        }}
      />

      <div className="shell pt-8">
        <BackLink href="/mitra">{t("backToPartners")}</BackLink>
      </div>

      <header className="border-b border-[var(--line)]">
        <div className="shell py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-8">
              {showCountry && <Pill tone="teal">{country[locale]}</Pill>}
              <h1 className="rise mt-4 text-display text-[var(--navy)]">
                {name}
              </h1>
              <div className="prose-ink mt-6 text-lead">
                {copy.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {logo && (
              <div className="md:col-span-4 md:pt-2">
                <Image
                  src={logo}
                  alt={name}
                  width={360}
                  height={200}
                  sizes="(max-width: 768px) 60vw, 280px"
                  className="h-auto w-40 object-contain object-left md:w-full md:max-w-[260px]"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Video after-event, kalau ada. */}
      {a.videos.length > 0 && (
        <Section eyebrow={t("afterEvent")} title={judulVideo}>
          <ul className="grid gap-8 md:grid-cols-2">
            {a.videos.map((id) => (
              <li key={id}>
                <div className="aspect-video overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={`${name} — ${t("afterEvent")}`}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Foto dokumentasi. Di situs lama dua foto ini terpasang di badan
          halaman MIYIO di bawah judul "Dokumentasi", tapi ekstraktor hanya
          memanen <img> pertama sebagai logo sehingga keduanya ikut tertinggal
          waktu migrasi. */}
      {dokumentasi.length > 0 && (
        <Section eyebrow={t("documentationEyebrow")} title={t("documentation")}>
          {/* Rasio 4/5 mengikuti berkasnya (1080×1350), bukan sebaliknya:
              dengan bingkai mendatar, baris bawah kedua gambar — nama sekolah
              dan asal delegasi — terpotong habis. Lebarnya dibatasi supaya dua
              gambar tegak berdampingan tidak menjadi pita setinggi dua layar. */}
          <ul className="grid max-w-[760px] gap-8 sm:grid-cols-2">
            {dokumentasi.map((src, i) => (
              <li key={src}>
                <div className="relative aspect-[4/5] overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
                  <Image
                    src={src}
                    alt={`${name} — ${t("documentation")} ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 92vw, 360px"
                    className="object-contain"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Tautan Drive — berkasnya tetap di Drive; tidak dipindah tanpa diminta.
          Labelnya memakai judul asli tiap tautan ("Press Release 2025",
          "Gallery 2025", "Guidebook"). Sebelumnya ketiganya berlabel sama,
          "Buka galeri di Google Drive", jadi satu-satunya cara tahu bahwa
          sebuah tombol membuka siaran pers dan bukan galeri adalah mengkliknya. */}
      {a.links.length > 0 && (
        <Section eyebrow={t("resourcesEyebrow")} title={judulTautan} sunk>
          <div className="flex flex-wrap gap-3">
            {a.links.map((l) => (
              <ButtonLink key={l.url} href={l.url} tone="outline" external>
                {labelTautan(l.title)}
              </ButtonLink>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

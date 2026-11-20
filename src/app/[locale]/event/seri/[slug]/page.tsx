import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

import { PageHeader, Section, BackLink, SelPengisi } from "@/components/ui";
import { EventCard } from "@/components/event-card";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { allEvents } from "@/lib/data";
import { kelompokkanSeri, gabungSeriDashboard, type Seri } from "@/lib/event-seri";
import { ambilSeriDashboard, ambilSemuaSeriDashboard, ambilEdisiDashboard, milikSitus, gambarDashboard, bannerSeragam } from "@/lib/dashboard-event";
import { EdisiBannerKartu } from "@/components/edisi-banner-kartu";
import { tahunEvent } from "@/lib/teks-event";
import { EdisiDashboardKartu } from "@/components/edisi-dashboard-kartu";

/** Seri warisan + seri yang hanya ada di dasbor (lihat gabungSeriDashboard). */
async function semuaSeri(): Promise<Seri[]> {
  const dash = [...(await ambilSemuaSeriDashboard()).values()].filter(milikSitus);
  return gabungSeriDashboard(kelompokkanSeri(allEvents()), dash);
}
const cariSeri = async (slug: string) => (await semuaSeri()).find((s) => s.slug === slug) ?? null;

export const revalidate = 3600;

/**
 * Satu seri beserta seluruh edisinya.
 *
 * Empat puluh lima halaman — satu per seri — yang sebelumnya tidak ada sama
 * sekali. Sebelum ini, orang yang mencari "WICE" hanya menemukan tiga kartu
 * terserak di daftar 66 event, tanpa cara melihat bahwa ketiganya satu seri
 * yang sudah berjalan tiga tahun.
 *
 * Serinya disimpulkan dari judul, bukan dari data: `events.json` tidak punya
 * medan seri maupun nomor edisi. Kalau dasbor nanti menyiarkan strukturnya
 * lewat `/api/public/v1`, halaman ini seharusnya membaca dari sana.
 */

export async function generateStaticParams() {
  const seri = await semuaSeri();
  return routing.locales.flatMap((locale) =>
    seri.map((s) => ({ locale, slug: s.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const seri = await cariSeri(slug);
  if (!seri) return {};

  const t = await getTranslations({ locale, namespace: "events" });
  const judul = seri.nama ? `${seri.akronim} — ${seri.nama}` : seri.akronim;

  return pageMetadata({
    locale,
    path: `event/seri/${slug}`,
    title: judul,
    description: seri.nama
      ? `${seri.nama}. ${t("editions", { count: seri.edisi.length })}.`
      : t("editions", { count: seri.edisi.length }),
    og: {
      eyebrow: t("seriesOne"),
      heading: seri.akronim,
      meta: t("editions", { count: seri.edisi.length }),
    },
  });
}

export default async function SeriPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const seri = await cariSeri(slug);
  if (!seri) notFound();

  const t = await getTranslations("events");

  const [dash, edisiDash] = await Promise.all([ambilSeriDashboard(seri.akronim), ambilEdisiDashboard(seri.akronim)]);
  /* Edisi warisan per tahun — tujuan klik kartu edisi dasbor yang punya halaman detail lama. */
  const warisanPerTahun = new Map(seri.edisi.map((e) => [tahunEvent(e.title) ?? "", `/event/${e.slug}`]));
  const jumlahEdisi = edisiDash?.length || seri.edisi.length || Math.max(1, dash?.tahunEdisi.length ?? 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              [
                { name: t("title"), path: "/event" },
                { name: seri.akronim, path: `/event/seri/${seri.slug}` },
              ],
              locale,
            ),
          ),
        }}
      />

      <PageHeader
        eyebrow={t("seriesOne")}
        title={seri.akronim}
        lead={seri.nama ?? undefined}
        count={jumlahEdisi}
        countLabel={t("editions", { count: jumlahEdisi })}
      />

      {/* Gambar dari dashboard, kalau serinya sudah dipin di sana. Ini
          satu-satunya tempat di situs yang punya ruang untuk menampilkannya
          sebesar ini — dan bannernya biasanya foto acaranya sendiri, bukan
          poster, jadi ia menjawab "seperti apa sih ajang ini" dalam satu
          pandang. Seri yang belum dipin melewati blok ini tanpa jejak. */}
      {/* Banner seragam tidak dipajang besar: isinya logo + nama yang sudah
          tertulis di kepala halaman. Logo tetap tampil di bawah. */}
      {(dash?.banner || dash?.logo) && (
        <div className="border-b border-[var(--line)]">
          <div className="shell py-8">
            {dash.banner && !bannerSeragam(dash.banner) && (
              <>
                {/* 5:2, bukan panji tipis. Bannernya foto rombongan peserta dan
                orangnya ada di separuh bawah bingkai; dipotong lebih ketat,
                yang tersisa cuma langit-langit aula. Sumbernya 3:2, jadi ini
                sudah pemotongan paling ringan yang masih muat jadi kepala
                halaman. */}
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-[var(--bg-sunk)] sm:aspect-[5/2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gambarDashboard(dash.banner, 1280)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              </>
            )}
            {dash.logo && (
              /* Tinggi tetap, lebar mengikuti. Logo ajang IYSA bercampur
                 bentuknya: sebagian lambang persegi, sebagian lockup
                 memanjang seperti IYMIA. Dijejalkan ke ubin persegi, yang
                 memanjang menyusut jadi seujung kuku. */
              <div
                className={`inline-flex h-14 items-center rounded bg-white px-3 ${dash.banner && !bannerSeragam(dash.banner) ? "mt-5" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gambarDashboard(dash.logo, 256)}
                  alt=""
                  className="h-9 w-auto max-w-[220px] object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <Section>
        <div className="mb-8">
          <BackLink href="/event">{t("backToSeries")}</BackLink>
        </div>

        {/* Seluruh edisi dari dasbor, masing-masing dengan bannernya sendiri.
            Data warisan hanya dipakai bila dasbor tidak menjawab. */}
        {edisiDash && edisiDash.length > 0 ? (
          <ul className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3">
            {edisiDash.map((e) => (
              <li key={e.tahun} className="flex">
                <EdisiBannerKartu
                  akronim={seri.akronim}
                  edisi={e}
                  dash={dash}
                  hrefWarisan={warisanPerTahun.get(e.tahun) ?? null}
                />
              </li>
            ))}
            <SelPengisi jumlah={edisiDash.length} kolom={2} tampak="block lg:hidden" />
            <SelPengisi jumlah={edisiDash.length} kolom={3} />
          </ul>
        ) : (<>
        {/* Seri yang hanya ada di dasbor: kartu edisi berjalan dari dasbor. */}
        {seri.edisi.length === 0 && dash && (
          <div className="flex max-w-md">
            <EdisiDashboardKartu edisi={dash} />
          </div>
        )}

        {seri.edisi.length > 0 && (
        <ul className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3">
          {seri.edisi.map((e) => (
            <li key={e.slug} className="bg-[var(--bg)]">
              <EventCard event={e} />
            </li>
          ))}
          <SelPengisi jumlah={seri.edisi.length} kolom={2} tampak="block lg:hidden" />
          <SelPengisi jumlah={seri.edisi.length} kolom={3} />
        </ul>
        )}
        </>)}
      </Section>
    </>
  );
}

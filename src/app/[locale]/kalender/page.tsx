import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Section, EmptyState } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { slugSeri } from "@/lib/event-seri";
import { PilihBulan } from "@/components/pilih-bulan";
import { KalenderInteraktif, type EntriKalender } from "@/components/kalender-interaktif";
import { ambilKalender, bacaBulan, kisiBulan, kunciBulan, ratakan } from "@/lib/kalender";

export const revalidate = 900;

type Search = { bulan?: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calendar" });
  return pageMetadata({ locale, path: "/kalender", title: t("title"), description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title") } });
}

const HARI: Record<Locale, string[]> = {
  id: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

/**
 * Kalender kegiatan IYSA — dari dasbor (`_kalender`): jadwal kegiatan dan
 * tanggal penting tiap edisi. Satu layar: kalender bulan + panel hari terpilih
 * + ringkasan event bulan ini, bukan daftar agenda sepanjang halaman.
 */
export default async function CalendarPage({
  params, searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("calendar");
  const { tahun, bulan } = bacaBulan((await searchParams).bulan);

  const kunci = kunciBulan(tahun, bulan);
  const akhir = `${kunci}-${String(new Date(Date.UTC(tahun, bulan, 0)).getUTCDate()).padStart(2, "0")}`;
  const data = await ambilKalender(`${kunci}-01`, akhir, locale);
  const entri: EntriKalender[] = (data ? ratakan(data) : []).map((e) => ({
    tanggal: e.tanggal,
    judul: e.judul,
    jenis: e.jenis,
    jalur: e.jalur,
    lokasi: e.lokasi,
    jam: e.jam_mulai ? `${e.jam_mulai}${e.jam_selesai ? `–${e.jam_selesai}` : ""}` : "",
    akronim: e.edisi.akronim,
    tahun: e.edisi.tahun,
    logo: e.edisi.logo,
    situs: e.edisi.situs,
    seri: slugSeri(e.edisi.akronim),
  }));

  const hariIni = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const tahunKini = Number(hariIni.slice(0, 4));
  const tahunPilihan = Array.from({ length: tahunKini + 2 - 2018 + 1 }, (_, i) => 2018 + i);
  if (!tahunPilihan.includes(tahun)) tahunPilihan.push(tahun);
  tahunPilihan.sort((a, b) => b - a);
  const loc = locale === "en" ? "en-GB" : "id-ID";
  const namaBulan = Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2000, i, 1)).toLocaleDateString(loc, { month: "long", timeZone: "UTC" }));

  return (
    <>
      <header className="border-b border-[var(--line)]">
        <div className="shell flex flex-col gap-4 py-8 md:flex-row md:items-end md:justify-between md:py-10">
          <div>
            <p className="eyebrow">IYSA</p>
            <h1 className="mt-1.5 text-title text-[var(--navy)]">{t("title")}</h1>
          </div>
          <PilihBulan tahun={tahun} bulan={bulan} namaBulan={namaBulan} tahunPilihan={tahunPilihan}
            label={{ bulan: t("pickMonth"), tahun: t("pickYear"), sebelum: t("prev"), sesudah: t("next"), kini: t("today") }} />
        </div>
      </header>

      <Section padat>
        {data === null ? (
          <EmptyState title={t("unavailable")} />
        ) : (
          <KalenderInteraktif
            key={kunci}
            kisi={kisiBulan(tahun, bulan)}
            entri={entri}
            hariIni={hariIni}
            locale={locale}
            teks={{
              hari: HARI[locale],
              kosongHari: t("emptyDay"),
              kosongBulan: t("empty"),
              eventBulanIni: t("eventsThisMonth"),
              agendaSatu: t("count", { count: 1 }).replace("1", "#"),
              agendaBanyak: t("count", { count: 2 }).replace("2", "#"),
              lagi: t("more"),
              penting: t("deadline"),
              kegiatan: t("activity"),
              daring: t("online"),
              luring: t("offline"),
              situsResmi: t("officialSite"),
              legendaKegiatan: t("legendActivityShort"),
              legendaPenting: t("legendDeadlineShort"),
            }}
          />
        )}

      </Section>
    </>
  );
}

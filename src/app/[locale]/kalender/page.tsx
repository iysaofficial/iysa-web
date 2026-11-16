import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHeader, Section, EmptyState } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { eventCalendar } from "@/content/external";
import { slugSeri } from "@/lib/event-seri";
import { gambarDashboard } from "@/lib/dashboard-event";
import { PilihBulan } from "@/components/pilih-bulan";
import {
  ambilKalender, bacaBulan, geserBulan, kisiBulan, kunciBulan, ratakan, type Entri,
} from "@/lib/kalender";

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

function namaBulan(tahun: number, bulan: number, locale: Locale) {
  return new Date(Date.UTC(tahun, bulan - 1, 1)).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
    month: "long", year: "numeric", timeZone: "UTC",
  });
}

function tanggalPanjang(iso: string, locale: Locale) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
}

const WARNA = {
  kegiatan: "border-[var(--teal)] text-[var(--teal)]",
  penting: "border-[var(--coral)] text-[var(--coral)]",
} as const;

/**
 * Kalender kegiatan IYSA — dari dasbor.
 *
 * Sebelumnya halaman ini satu iframe Heyzine: flipbook statis yang harus
 * dibuat ulang setiap jadwal bergeser, dan tidak bisa dicari. Sekarang isinya
 * jadwal kegiatan + tanggal penting tiap edisi yang panitia isi di dasbor,
 * per bulan. Flipbook tetap ditautkan untuk yang mencarinya.
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
  const sp = await searchParams;

  const { tahun, bulan } = bacaBulan(sp.bulan);
  const awal = `${kunciBulan(tahun, bulan)}-01`;
  const akhir = `${kunciBulan(tahun, bulan)}-${String(new Date(Date.UTC(tahun, bulan, 0)).getUTCDate()).padStart(2, "0")}`;
  const data = await ambilKalender(awal, akhir);
  const entri = data ? ratakan(data) : [];

  const perTanggal = new Map<string, Entri[]>();
  for (const e of entri) perTanggal.set(e.tanggal, [...(perTanggal.get(e.tanggal) ?? []), e]);

  const sebelum = geserBulan(tahun, bulan, -1);
  const sesudah = geserBulan(tahun, bulan, 1);
  const hariIni = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const kisi = kisiBulan(tahun, bulan);
  const judulBulan = namaBulan(tahun, bulan, locale);

  /* Pilihan tahun: sejak IYSA berdiri (2018) sampai dua tahun ke depan, dan
     selalu memuat tahun yang sedang dibuka. */
  const tahunKini = Number(hariIni.slice(0, 4));
  const tahunPilihan = Array.from({ length: tahunKini + 2 - 2018 + 1 }, (_, i) => 2018 + i);
  if (!tahunPilihan.includes(tahun)) tahunPilihan.push(tahun);
  tahunPilihan.sort((a, b) => b - a);
  const daftarNamaBulan = Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2000, i, 1)).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { month: "long", timeZone: "UTC" }));

  const navBulan = (
    <nav aria-label={t("monthNav")} className="flex flex-col gap-2 md:items-end">
      <PilihBulan tahun={tahun} bulan={bulan} namaBulan={daftarNamaBulan} tahunPilihan={tahunPilihan}
        labelBulan={t("pickMonth")} labelTahun={t("pickYear")} />
      <div className="flex flex-wrap items-center gap-2">
      <Link href={`/kalender?bulan=${kunciBulan(sebelum.tahun, sebelum.bulan)}`} scroll={false}
        className="rounded-full border border-[var(--border)] px-3 py-1 text-[13px] text-[var(--ink-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)]">
        ← {t("prev")}
      </Link>
      <Link href="/kalender" scroll={false}
        className="rounded-full border border-[var(--border)] px-3 py-1 text-[13px] text-[var(--ink-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)]">
        {t("today")}
      </Link>
      <Link href={`/kalender?bulan=${kunciBulan(sesudah.tahun, sesudah.bulan)}`} scroll={false}
        className="rounded-full border border-[var(--border)] px-3 py-1 text-[13px] text-[var(--ink-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)]">
        {t("next")} →
      </Link>
      </div>
    </nav>
  );

  return (
    <>
      <PageHeader eyebrow={judulBulan} title={t("title")}
        count={entri.length} countLabel={t("count", { count: entri.length })} aside={navBulan} />

      <Section padat>
        {/* Kisi bulan — layar sedang ke atas. */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 border-t border-l border-[var(--line)]">
            {HARI[locale].map((h) => (
              <div key={h} className="border-r border-b border-[var(--line)] bg-[var(--bg-sunk)] px-2 py-1.5 font-sans text-[11.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
                {h}
              </div>
            ))}
            {kisi.map((tgl, i) => {
              const isi = tgl ? perTanggal.get(tgl) ?? [] : [];
              return (
                <div key={i} className={`min-h-[96px] border-r border-b border-[var(--line)] p-1.5 ${tgl ? "" : "bg-[var(--bg-sunk)]/50"}`}>
                  {tgl && (
                    <>
                      <span className={`tnum inline-grid h-6 w-6 place-items-center rounded-full text-[12.5px] ${
                        tgl === hariIni ? "bg-[var(--navy)] font-bold text-[var(--on-navy)]" : "text-[var(--ink-muted)]"}`}>
                        {Number(tgl.slice(8))}
                      </span>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {isi.slice(0, 3).map((e, k) => (
                          <li key={k}>
                            <a href={`#t-${tgl}`} title={`${e.edisi.akronim} — ${e.judul}`}
                              className={`block truncate border-l-2 pl-1.5 text-[11.5px] leading-snug font-medium ${WARNA[e.jenis]}`}>
                              {e.edisi.akronim}
                            </a>
                          </li>
                        ))}
                        {isi.length > 3 && (
                          <li><a href={`#t-${tgl}`} className="text-[11px] text-[var(--ink-faint)]">+{isi.length - 3} {t("more")}</a></li>
                        )}
                      </ul>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex flex-wrap gap-5 text-[12.5px] text-[var(--ink-muted)]">
            <span className="flex items-center gap-2"><span className="h-3 w-0.5 bg-[var(--teal)]" />{t("legendActivity")}</span>
            <span className="flex items-center gap-2"><span className="h-3 w-0.5 bg-[var(--coral)]" />{t("legendDeadline")}</span>
          </p>
        </div>

        {/* Daftar agenda bulan ini — semua layar. */}
        <div className="mt-10 md:mt-14">
          <h2 className="font-serif text-[22px] font-bold text-[var(--ink)]">{t("agendaTitle", { month: judulBulan })}</h2>
          {data === null ? (
            <div className="mt-6"><EmptyState title={t("unavailable")} /></div>
          ) : entri.length === 0 ? (
            <div className="mt-6"><EmptyState title={t("empty")} /></div>
          ) : (
            <ol className="mt-6 flex flex-col">
              {[...perTanggal.entries()].map(([tgl, isi]) => (
                <li key={tgl} id={`t-${tgl}`} className="scroll-mt-24 border-t border-[var(--line)] py-5 md:grid md:grid-cols-[200px_1fr] md:gap-8">
                  <p className={`font-serif text-[15px] font-bold ${tgl === hariIni ? "text-[var(--teal)]" : "text-[var(--navy)]"}`}>
                    {tanggalPanjang(tgl, locale)}
                  </p>
                  <ul className="mt-3 flex flex-col gap-4 md:mt-0">
                    {isi.map((e, k) => (
                      <li key={k} className="flex gap-3">
                        {e.edisi.logo ? (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-white p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={gambarDashboard(e.edisi.logo, 64)} alt="" width={36} height={36} loading="lazy" className="h-full w-full object-contain" />
                          </span>
                        ) : <span className="h-10 w-10 shrink-0 rounded-sm bg-[var(--bg-sunk)]" />}
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Link href={`/event/seri/${slugSeri(e.edisi.akronim)}`}
                              className="font-sans text-[13px] font-bold text-[var(--navy)] hover:text-[var(--teal)]">
                              {e.edisi.akronim} {e.edisi.tahun}
                            </Link>
                            <span className={`rounded-full border px-2 py-px text-[10.5px] font-bold uppercase tracking-wide ${WARNA[e.jenis]}`}>
                              {e.jenis === "penting" ? t("deadline") : t("activity")}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[15px] leading-snug text-[var(--ink)]">{e.judul}</p>
                          <p className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-[var(--ink-muted)]">
                            {e.jam_mulai && <span className="tnum">{e.jam_mulai}{e.jam_selesai ? `–${e.jam_selesai}` : ""} WIB</span>}
                            {e.jalur && <span>{e.jalur === "online" ? t("online") : e.jalur === "offline" ? t("offline") : e.jalur}</span>}
                            {e.lokasi && <span>{e.lokasi}</span>}
                            {e.edisi.situs && (
                              <a href={e.edisi.situs} target="_blank" rel="noreferrer" className="text-[var(--teal)] hover:underline">
                                {t("officialSite")} ↗
                              </a>
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Flipbook lama tetap tersedia. */}
        <p className="mt-12 border-t border-[var(--line)] pt-6 text-[13.5px] text-[var(--ink-faint)]">
          {t("flipbook", { year: eventCalendar.year })}{" "}
          <a href={eventCalendar.embedUrl} target="_blank" rel="noreferrer" className="text-[var(--teal)] hover:underline">
            {t("openExternal")} ↗
          </a>
        </p>
      </Section>
    </>
  );
}

import { getTranslations, getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { org } from "@/content/org";
import { gambarDashboard, bannerSeragam, type EdisiDashboard } from "@/lib/dashboard-event";

/**
 * Kartu satu edisi dari dashboard: beranda (Pendaftaran terbuka, Akan datang),
 * halaman /event, dan halaman seri.
 *
 * Versi 2026-11-20 (permintaan Pras, "agar tidak kaku"): kartu berdiri
 * sendiri dengan sudut membulat dan jarak antarkartu — bukan sel kisi bergaris
 * —, banner bergradasi dengan lencana status dan tahun, logo menumpang di tepi
 * bawah banner, sisa hari pendaftaran, dan ajakan daftar berbentuk tombol.
 * Kartu ini dipasang di dalam `<KisiKartuEdisi>` (bawah berkas ini).
 *
 * Edisi tanpa banner, atau yang bannernya banner seragam buatan dasbor (logo
 * + nama di atas navy — mengulang isi kartu), memakai bidang gradasi navy→biru
 * dengan logonya di tengah, bukan tulisan akronim besar.
 */

const MODA = {
  online: "modeOnline",
  offline: "modeOnsite",
  hybrid: "modeHybrid",
} as const;

const HARI = 86_400_000;

function IkonKalender() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function IkonGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" />
    </svg>
  );
}

export async function EdisiDashboardKartu({ edisi }: { edisi: EdisiDashboard }) {
  const t = await getTranslations("events");
  const f = await getFormatter();

  const tanggal = (nilai: string | null) =>
    nilai
      ? f.dateTime(new Date(`${nilai}T00:00:00Z`), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
      : null;

  const mulai = tanggal(edisi.mulai);
  const selesai = tanggal(edisi.selesai);
  const rentang = mulai && selesai && mulai !== selesai ? `${mulai} – ${selesai}` : (mulai ?? selesai);
  const tutup = tanggal(edisi.pendaftaranTutup);

  /* Sisa hari pendaftaran (WIB). Halaman disegarkan ISR tiap jam, jadi
     angkanya paling banyak tertinggal sejam — cukup untuk hitungan hari. */
  const hariIni = Date.parse(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }));
  const sisaHari =
    edisi.pendaftaranDibuka && edisi.pendaftaranTutup
      ? Math.round((Date.parse(edisi.pendaftaranTutup) - hariIni) / HARI)
      : null;

  const berlangsung =
    !edisi.pendaftaranDibuka &&
    edisi.mulai != null &&
    Date.parse(edisi.mulai) <= hariIni &&
    Date.parse(edisi.selesai ?? edisi.mulai) >= hariIni;

  const status = edisi.pendaftaranDibuka
    ? { teks: t("statusRegOpen"), kelas: "bg-emerald-500 text-white", titik: true }
    : berlangsung
      ? { teks: t("statusOngoing"), kelas: "bg-amber-400 text-[#1b1300]", titik: true }
      : edisi.status === "selesai"
        ? { teks: t("statusDone"), kelas: "bg-white/85 text-[#0b2948]", titik: false }
        : { teks: t("statusUpcoming"), kelas: "bg-white/90 text-[#0b2948]", titik: false };

  const seragam = bannerSeragam(edisi.banner);
  const adaBanner = Boolean(edisi.banner) && !seragam;
  const hrefDaftar = edisi.pendaftaranUrl ?? edisi.situs ?? org.dashboardUrl;
  const hrefSeri = `/event/seri/${edisi.akronim.toLowerCase()}`;

  return (
    <article className="group/kartu relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg)] shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-[var(--teal)]/50 hover:shadow-[0_18px_40px_-18px_rgb(11_41_72/0.45)]">
      {/* ── Media ── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0b2948]">
        {adaBanner ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gambarDashboard(edisi.banner ?? "", 640)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/kartu:scale-[1.05]"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#06182c]/80 via-[#06182c]/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#0a2443_0%,#123d6f_55%,#1f5fae_100%)]">
            <span aria-hidden className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <span aria-hidden className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-[#8ec5ff]/15 blur-2xl" />
            {edisi.logo ? (
              <span className="relative flex h-20 items-center rounded-xl bg-white px-5 py-3 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gambarDashboard(edisi.logo, 256)} alt="" loading="lazy" className="h-full w-auto max-w-[160px] object-contain" />
              </span>
            ) : (
              <span className="relative font-serif text-[40px] leading-none tracking-[-0.01em] text-white">{edisi.akronim}</span>
            )}
          </div>
        )}

        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold tracking-[0.02em] shadow-sm ${status.kelas}`}>
          {status.titik && (
            <span aria-hidden className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
          )}
          {status.teks}
        </span>
        <span className="tnum absolute top-3 right-3 rounded-full bg-black/35 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur-sm">
          {edisi.tahun}
        </span>
      </div>

      {/* ── Isi ── */}
      <div className="relative flex flex-1 flex-col gap-3 px-5 pt-5 pb-5">
        {/* Logo menumpang di tepi banner — hanya bila banner berupa foto; bila
            bidang gradasi, logonya sudah di tengah media. */}
        {adaBanner && edisi.logo && (
          <span className="absolute -top-8 left-5 flex h-14 items-center rounded-xl border border-[var(--line)] bg-white px-3 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gambarDashboard(edisi.logo, 256)} alt="" loading="lazy" className="h-9 w-auto max-w-[120px] object-contain" />
          </span>
        )}

        <div className={adaBanner && edisi.logo ? "pt-6" : ""}>
          <p className="font-sans text-[12px] leading-none font-bold tracking-[0.08em] text-[var(--teal)] uppercase">
            {edisi.akronim}
          </p>
          <h3 className="mt-2 font-serif text-[18px] leading-snug text-[var(--ink)]">
            <Link href={hrefSeri} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {edisi.nama}
            </Link>
          </h3>
        </div>

        <ul className="flex flex-col gap-1.5 text-[13.5px] text-[var(--ink-muted)]">
          {rentang && (
            <li className="flex items-center gap-2">
              <IkonKalender />
              <span className="tnum">{rentang}</span>
            </li>
          )}
          {(edisi.lingkup || edisi.moda) && (
            <li className="flex items-center gap-2">
              <IkonGlobe />
              <span>
                {[
                  edisi.lingkup && t(edisi.lingkup === "international" ? "levelInternational" : "levelNational"),
                  edisi.moda && t(MODA[edisi.moda]),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          )}
        </ul>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
          {edisi.pendaftaranDibuka ? (
            <>
              <p className="tnum text-[12.5px] leading-snug text-[var(--ink-faint)]">
                {sisaHari != null && sisaHari >= 0 && sisaHari <= 60
                  ? sisaHari === 0
                    ? t("closesToday")
                    : t("closesIn", { count: sisaHari })
                  : tutup
                    ? t("registerUntil", { date: tutup })
                    : null}
              </p>
              {/* Ke situs ajangnya sendiri kalau pendaftarannya di sana; dasbor
                  hanya untuk ajang yang formulirnya memang dilayani di sana.
                  `relative z-10` supaya tombol ini menang atas tautan kartu. */}
              <a
                href={hrefDaftar}
                className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-[var(--teal)] px-4 py-2 text-[13.5px] font-bold text-[var(--bg)] transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.98]"
              >
                {t("register")}
                <span aria-hidden className="transition-transform duration-200 group-hover/kartu:translate-x-0.5">
                  →
                </span>
              </a>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--ink-muted)] transition-colors duration-200 group-hover/kartu:text-[var(--teal)]">
              {t("allEditions")}
              <span aria-hidden className="transition-transform duration-200 group-hover/kartu:translate-x-0.5">
                →
              </span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/** Kisi kartu edisi: kartu terpisah berjarak, 1/2/3 kolom. */
export function KisiKartuEdisi({ jumlah, children }: { jumlah: number; children: React.ReactNode }) {
  const kolom = jumlah === 1 ? "max-w-md" : jumlah === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return <ul className={`grid gap-5 lg:gap-6 ${kolom}`}>{children}</ul>;
}

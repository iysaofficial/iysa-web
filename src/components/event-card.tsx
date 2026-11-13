import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { IysaEvent } from "@/lib/data";
import { posterUrl } from "@/lib/assets";
import {
  judulEvent,
  kotaSingkat,
  formatTanggalEvent,
  akronimEvent,
  tahunEvent,
} from "@/lib/teks-event";
import { statusEvent } from "@/lib/event-seri";
import { Pill } from "./ui";

/**
 * Kartu event.
 *
 * ── Kenapa sekarang berposter ────────────────────────────────────────────
 *
 * Dulu kartu ini sengaja tanpa gambar: di situs lama beranda memuat 61 poster
 * PNG 2–4 MB sekaligus, dan itu alasan yang sah untuk melarangnya. Alasan itu
 * sudah tidak berlaku — posternya kini WebP rata-rata 128 KB, disajikan lewat
 * pengoptimal gambar Next dengan `loading="lazy"` bawaan, jadi yang di bawah
 * lipatan tidak pernah diunduh sampai digulir.
 *
 * Dan tanpa gambar, halaman event jadi 66 kartu teks yang nyaris identik —
 * tidak bisa dipindai sama sekali. Poster adalah satu-satunya pembeda visual
 * yang dimiliki event-event ini.
 *
 * ── Rasio ────────────────────────────────────────────────────────────────
 *
 * Seluruh 28 poster berukuran 1080×1350 tanpa kecuali, jadi `aspect-[4/5]`
 * dengan `object-cover` tidak memotong satu pun. Diperiksa, bukan dikira.
 *
 * ── Yang posternya tidak ada ─────────────────────────────────────────────
 *
 * Lima event tidak punya poster — berkasnya memang tidak pernah ada di repo
 * lama. Alih-alih kotak kosong, kartunya diisi akronim event dalam huruf mono
 * besar. Semua judul IYSA menaruh akronimnya di dalam kurung, jadi bahannya
 * memang ada; kalau suatu saat tidak, huruf awal kata-kata pentingnya dipakai.
 * Poster tahun lain TIDAK pernah dipinjam — poster yang salah lebih buruk
 * daripada tidak ada poster.
 */
export async function EventCard({ event }: { event: IysaEvent }) {
  const t = await getTranslations("events");
  const locale = (await getLocale()) as Locale;

  const poster = posterUrl(event.poster);
  const judul = judulEvent(event.title);
  const kota = kotaSingkat(event.city);
  const tanggalAcara = formatTanggalEvent(event.dates, locale);
  const tutup = formatTanggalEvent(event.registrationEnds, locale);
  const status = statusEvent(event);

  const levelLabel =
    event.level === "national"
      ? t("levelNational")
      : event.level === "international"
        ? t("levelInternational")
        : null;

  const modeLabel =
    event.mode === "online"
      ? t("modeOnline")
      : event.mode === "hybrid"
        ? t("modeHybrid")
        : event.mode === "onsite"
          ? (kota?.tampil ?? t("modeOnsite"))
          : null;

  return (
    <Link
      href={`/event/${event.slug}`}
      className="group flex h-full flex-col transition-colors duration-[var(--gerak-cepat)] hover:bg-[var(--bg-sunk)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bg-sunk)]">
        {poster ? (
          <Image
            src={poster}
            alt=""
            fill
            /* Tanpa `sizes`: untuk kartu berukuran tetap, `sizes` memaksa Next
               memancarkan srcset dari seluruh daftar deviceSizes untuk SETIAP
               gambar, dan di halaman 66 kartu itu membengkakkan HTML-nya. */
            className="object-cover transition-transform duration-[var(--gerak-sedang)] group-hover:scale-[1.03]"
          />
        ) : (
          /* Ubin pengganti harus terbaca sebagai pilihan, bukan sebagai
             kekosongan. Tiga dari lima event tanpa poster kebetulan duduk
             paling atas di daftar, jadi ubin inilah yang membuka halaman.

             Isinya: akronim event dalam huruf mono besar, tahunnya, dan
             lambang IYSA samar di sudut sebagai tanda bahwa kartu ini memang
             dirancang. Poster tahun lain tidak pernah dipinjam. */
          <div className="absolute inset-0 grid place-items-center px-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/logo/iysa-mark-traced.svg"
              alt=""
              aria-hidden
              className="absolute right-4 bottom-4 w-9 opacity-[0.18]"
            />
            <div>
              <p
                className={`font-serif text-[38px] leading-none font-bold tracking-[-0.02em] ${
                  event.level === "international" ? "text-[var(--teal)]" : "text-[var(--navy)]"
                }`}
              >
                {akronimEvent(event.title)}
              </p>
              {tahunEvent(event.title) && (
                <p className="tnum mt-3 font-sans text-[13px] font-bold tracking-[0.08em] text-[var(--ink-faint)]">
                  {tahunEvent(event.title)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {levelLabel && (
            <Pill tone={event.level === "international" ? "teal" : "navy"}>{levelLabel}</Pill>
          )}
          {modeLabel && (
            <span title={kota?.penuh}>
              <Pill>{modeLabel}</Pill>
            </span>
          )}
          {event.origin === "affiliate" && <Pill tone="navy">{t("originAffiliate")}</Pill>}
        </div>

        <h3 className="font-serif text-[15.5px] leading-snug font-bold text-[var(--ink)] transition-colors duration-[var(--gerak-cepat)] group-hover:text-[var(--navy)] sm:text-[17px]">
          {judul}
        </h3>

        <div className="mt-auto flex flex-col gap-1 pt-2">
          {tanggalAcara && (
            <p className="font-sans text-[12px] leading-snug text-[var(--ink-faint)]">
              {tanggalAcara}
            </p>
          )}
          {/*
            Label pendaftaran dulu sama untuk dua keadaan yang berlawanan:
            "Pendaftaran ditutup 19 Juli, 2024" dipakai baik untuk event yang
            sudah lewat maupun yang pendaftarannya masih dibuka. Sekarang
            statusnya dihitung dari tanggal, jadi kalimatnya ikut berubah.
          */}
          {status === "terbuka" ? (
            <p className="text-[13px] font-medium text-[var(--teal)]">
              {tutup ? t("registerUntil", { date: tutup }) : t("register")}
            </p>
          ) : status === "akan" ? (
            <p className="text-[13px] font-medium text-[var(--navy)]">{t("statusUpcoming")}</p>
          ) : (
            <p className="text-[13px] text-[var(--ink-faint)]">{t("statusDone")}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

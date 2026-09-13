import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { IysaEvent } from "@/lib/data";
import { posterUrl } from "@/lib/assets";
import { judulEvent, kotaSingkat, tanggalSah, akronimEvent, tahunEvent } from "@/lib/teks-event";
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

  const poster = posterUrl(event.poster);
  const judul = judulEvent(event.title);
  const kota = kotaSingkat(event.city);
  const tutup = tanggalSah(event.registrationEnds);

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
                className={`font-mono text-[38px] leading-none font-medium tracking-[-0.04em] ${
                  event.level === "international" ? "text-[var(--teal)]" : "text-[var(--navy)]"
                }`}
              >
                {akronimEvent(event.title)}
              </p>
              {tahunEvent(event.title) && (
                <p className="tnum mt-3 font-mono text-[13px] tracking-[0.08em] text-[var(--ink-faint)]">
                  {tahunEvent(event.title)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {levelLabel && (
            <Pill tone={event.level === "international" ? "teal" : "navy"}>{levelLabel}</Pill>
          )}
          {modeLabel && (
            <span title={kota?.penuh}>
              <Pill>{modeLabel}</Pill>
            </span>
          )}
        </div>

        <h3 className="text-[16.5px] leading-snug font-semibold text-[var(--ink)] transition-colors duration-[var(--gerak-cepat)] group-hover:text-[var(--navy)]">
          {judul}
        </h3>

        <div className="mt-auto flex flex-col gap-1 pt-2">
          {event.dates && (
            <p className="font-mono text-[12px] leading-snug text-[var(--ink-faint)]">
              {event.dates}
            </p>
          )}
          {event.registrationUrl ? (
            <p className="text-[13px] font-medium text-[var(--teal)]">
              {/* Tanggal penutupan hanya ditampilkan kalau bentuknya masuk akal.
                  Satu event membawa ", 2026" dan dirender apa adanya jadi
                  "Pendaftaran ditutup , 2026". */}
              {tutup ? t("registerEnds", { date: tutup }) : t("register")}
            </p>
          ) : (
            <p className="text-[13px] text-[var(--ink-faint)]">{t("registerClosed")}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { IysaEvent } from "@/lib/data";
import { Pill } from "./ui";

/**
 * Kartu event. Tanpa bayangan dan tanpa sudut besar — pembatas berupa garis
 * 1px dari grid induknya, jadi daftar terbaca sebagai satu tabel, bukan
 * tumpukan kartu melayang.
 *
 * Poster sengaja TIDAK ditampilkan di kartu: di situs lama tiap poster PNG
 * 2–4 MB dan beranda memuat semuanya sekaligus. Di halaman detail poster
 * tampil penuh, satu per halaman, lewat pengoptimal gambar Next.
 */
export async function EventCard({ event }: { event: IysaEvent }) {
  const t = await getTranslations("events");

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
          ? (event.city ?? t("modeOnsite"))
          : null;

  return (
    <Link
      href={`/event/${event.slug}`}
      className="group flex h-full flex-col gap-3 p-6 transition-colors duration-150 hover:bg-[var(--bg-sunk)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        {levelLabel && (
          <Pill tone={event.level === "international" ? "teal" : "navy"}>{levelLabel}</Pill>
        )}
        {modeLabel && <Pill>{modeLabel}</Pill>}
      </div>

      <h3 className="text-[17px] leading-snug font-semibold text-[var(--ink)] transition-colors duration-150 group-hover:text-[var(--navy)]">
        {event.title}
      </h3>

      <div className="mt-auto flex flex-col gap-1 pt-2">
        {event.dates && (
          <p className="font-mono text-[12px] text-[var(--ink-faint)]">{event.dates}</p>
        )}
        {event.registrationUrl ? (
          <p className="text-[13px] font-medium text-[var(--teal)]">
            {event.registrationEnds
              ? t("registerEnds", { date: event.registrationEnds })
              : t("register")}
          </p>
        ) : (
          <p className="text-[13px] text-[var(--ink-faint)]">{t("registerClosed")}</p>
        )}
      </div>
    </Link>
  );
}

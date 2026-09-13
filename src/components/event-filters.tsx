import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { EventLevel, EventMode } from "@/lib/data";

type Active = { level?: EventLevel; mode?: EventMode; q?: string };

/** Bangun URL saringan berikutnya dari keadaan sekarang plus satu perubahan. */
function buildHref(active: Active, patch: Partial<Active>) {
  const next = { ...active, ...patch };
  const q = new URLSearchParams();
  if (next.level) q.set("level", next.level);
  if (next.mode) q.set("mode", next.mode);
  if (next.q) q.set("q", next.q);
  const s = q.toString();
  return `/event${s ? `?${s}` : ""}`;
}

const chip =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] transition-colors duration-[var(--gerak-cepat)]";
const chipOn = "border-[var(--navy)] bg-[var(--navy)] text-[var(--on-navy)]";
const chipOff =
  "border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--teal)] hover:text-[var(--teal)]";

/**
 * Satu kelompok saringan.
 *
 * Didefinisikan di lingkup modul, bukan di dalam EventFilters: komponen yang
 * dibuat ulang tiap render adalah tipe baru bagi React setiap kalinya, jadi
 * seluruh subpohonnya di-unmount dan dipasang ulang.
 */
function FilterGroup<T extends string>({
  label,
  options,
  activeValue,
  labels,
  param,
  active,
  allLabel,
}: {
  label: string;
  options: Map<T, number>;
  activeValue?: T;
  labels: Record<T, string>;
  param: "level" | "mode";
  active: Active;
  allLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow mr-1">{label}</span>

      <Link
        href={buildHref(active, { [param]: undefined } as Partial<Active>)}
        aria-current={!activeValue ? "true" : undefined}
        className={`${chip} ${!activeValue ? chipOn : chipOff}`}
      >
        {allLabel}
      </Link>

      {[...options.entries()].map(([value, count]) => {
        const on = activeValue === value;
        return (
          <Link
            key={value}
            href={buildHref(active, { [param]: on ? undefined : value } as Partial<Active>)}
            aria-current={on ? "true" : undefined}
            className={`${chip} ${on ? chipOn : chipOff}`}
          >
            {labels[value]}
            <span className={`tnum font-mono text-[10.5px] ${on ? "opacity-70" : "opacity-55"}`}>
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Saringan sebagai tautan biasa, bukan state di peramban.
 *
 * Alasannya dua: setiap kombinasi jadi URL yang bisa dibagikan dan diindeks,
 * dan saringan tetap bekerja sebelum JavaScript termuat — penting untuk
 * pengunjung di jaringan ponsel yang lambat, yang jadi mayoritas di sini.
 */
export async function EventFilters({
  facets,
  active,
}: {
  facets: { level: Map<EventLevel, number>; mode: Map<EventMode, number> };
  active: Active;
}) {
  const t = await getTranslations("events");

  const levelLabel: Record<EventLevel, string> = {
    national: t("levelNational"),
    international: t("levelInternational"),
  };
  const modeLabel: Record<EventMode, string> = {
    online: t("modeOnline"),
    onsite: t("modeOnsite"),
    hybrid: t("modeHybrid"),
  };

  /* Satu baris yang membungkus, bukan tiga baris bertumpuk.
     Tiga kelompok saringan yang masing-masing memakan satu baris penuh
     menghabiskan ~180px tepat di tempat yang seharusnya sudah memperlihatkan
     data — di layar laptop 820px, kartu event pertama jadi berada di bawah
     lipatan. Dijadikan satu baris, ketiganya cukup dalam dua baris pendek. */
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <FilterGroup
        label={t("filterLevel")}
        options={facets.level}
        activeValue={active.level}
        labels={levelLabel}
        param="level"
        active={active}
        allLabel={t("filterAll")}
      />
      <FilterGroup
        label={t("filterMode")}
        options={facets.mode}
        activeValue={active.mode}
        labels={modeLabel}
        param="mode"
        active={active}
        allLabel={t("filterAll")}
      />

      {/* GET biasa — tidak butuh JavaScript sama sekali. */}
      <form action="/event" method="get" className="flex flex-1 flex-wrap items-center gap-2">
        <label htmlFor="cari" className="sr-only">
          {t("search")}
        </label>
        {active.level && <input type="hidden" name="level" value={active.level} />}
        {active.mode && <input type="hidden" name="mode" value={active.mode} />}
        <input
          id="cari"
          name="q"
          type="search"
          defaultValue={active.q ?? ""}
          placeholder={t("searchPlaceholder")}
          className="min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] sm:max-w-xs"
        />
        <button
          type="submit"
          className="rounded-full border border-[var(--border)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--ink)] transition-colors duration-[var(--gerak-cepat)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
        >
          {t("search")}
        </button>
        {(active.level || active.mode || active.q) && (
          <Link
            href="/event"
            className="text-[13px] text-[var(--ink-faint)] underline decoration-1 underline-offset-2 hover:text-[var(--teal)]"
          >
            {t("reset")}
          </Link>
        )}
      </form>
    </div>
  );
}

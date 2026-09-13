import { getTranslations, getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { org } from "@/content/org";
import { gambarDashboard, type EdisiDashboard } from "@/lib/dashboard-event";
import { Pill } from "./ui";

/** Moda dashboard → kunci terjemahan yang sudah ada di situs. */
const MODA = { online: "modeOnline", offline: "modeOnsite", hybrid: "modeHybrid" } as const;

/**
 * Satu edisi event dari database dashboard.
 *
 * ── Kenapa kartunya tidak seperti kartu event yang lain ──────────────────
 *
 * Kartu event warisan dibangun di sekitar posternya: gambar 3:2 di atas,
 * teks di bawah. Dashboard tidak mengirim poster — API publiknya hanya
 * menyertakan `logo`, dan kolom bannernya tidak pernah ikut dirakit. Memaksa
 * bentuk yang sama berarti menyediakan lubang gambar yang selalu kosong.
 *
 * Jadi kartunya dirancang untuk data yang MEMANG ada: logo sebagai penanda
 * merek, lalu tanggal sungguhan. Dan justru di sinilah keunggulan data
 * dashboard terlihat — tanggalnya kolom tanggal betulan, bukan kalimat
 * "2th November - 6th November, 2026 (Offline)" yang harus ditebak maknanya,
 * jadi untuk pertama kalinya situs bisa menulis rentang tanggal yang benar
 * dalam bahasa pembacanya sendiri.
 *
 * Edisi yang logonya belum diunggah tetap tampil utuh; yang hilang cuma
 * ubinnya, bukan kartunya.
 */
export async function EdisiDashboardKartu({ edisi }: { edisi: EdisiDashboard }) {
  const t = await getTranslations("events");
  const f = await getFormatter();

  const tanggal = (nilai: string | null) =>
    nilai ? f.dateTime(new Date(`${nilai}T00:00:00Z`), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : null;

  const mulai = tanggal(edisi.mulai);
  const selesai = tanggal(edisi.selesai);
  const rentang = mulai && selesai && mulai !== selesai ? `${mulai} – ${selesai}` : (mulai ?? selesai);
  const tutup = tanggal(edisi.pendaftaranTutup);

  return (
    <article className="flex h-full w-full flex-col gap-4 bg-[var(--bg)] p-6">
      <div className="flex items-start gap-4">
        {edisi.logo ? (
          // Ubin terang: logo event dirancang untuk latar putih, dan di tema
          // gelap situs ini sebagian besar akan lenyap tanpa alasnya sendiri.
          // Pola yang sama dipakai dinding logo mitra.
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded bg-white p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gambarDashboard(edisi.logo, 128)}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[15px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">
            {edisi.akronim} <span className="tnum text-[var(--ink-faint)]">{edisi.tahun}</span>
          </p>
          <h3 className="mt-2 text-[16px] leading-snug font-semibold text-[var(--ink)]">
            {edisi.nama}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {edisi.lingkup && (
          <Pill tone={edisi.lingkup === "international" ? "teal" : "neutral"}>
            {t(edisi.lingkup === "international" ? "levelInternational" : "levelNational")}
          </Pill>
        )}
        {edisi.moda && <Pill>{t(MODA[edisi.moda])}</Pill>}
      </div>

      <dl className="mt-auto flex flex-col gap-1.5 border-t border-[var(--line)] pt-3 text-[13.5px]">
        {rentang && (
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--ink-faint)]">{t("dates")}</dt>
            <dd className="tnum text-right text-[var(--ink-muted)]">{rentang}</dd>
          </div>
        )}
      </dl>

      {/* `registerUntil` sudah berupa kalimat utuh berisi tanggalnya
          ("Daftar sampai {date}"), jadi ia berdiri sendiri — bukan pasangan
          istilah-dan-nilai seperti baris tanggal di atas. */}
      {edisi.pendaftaranDibuka && tutup && (
        <p className="tnum text-[13.5px] font-medium text-[var(--teal)]">
          {t("registerUntil", { date: tutup })}
        </p>
      )}

      {edisi.pendaftaranDibuka ? (
        <a
          href={org.dashboardUrl}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--teal)] underline decoration-1 underline-offset-2"
        >
          {t("register")}
          <span aria-hidden className="text-[12px]">
            ↗
          </span>
        </a>
      ) : (
        <Link
          href={`/event/seri/${edisi.akronim.toLowerCase()}`}
          className="text-[14px] font-medium text-[var(--ink-muted)] transition-colors duration-[var(--gerak-cepat)] hover:text-[var(--teal)]"
        >
          {t("allEditions")}
        </Link>
      )}
    </article>
  );
}

import { getTranslations, getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { org } from "@/content/org";
import { gambarDashboard, type EdisiDashboard } from "@/lib/dashboard-event";
import { Pill } from "./ui";

/** Moda dashboard → kunci terjemahan yang sudah ada di situs. */
const MODA = {
  online: "modeOnline",
  offline: "modeOnsite",
  hybrid: "modeHybrid",
} as const;

/**
 * Satu edisi event dari database dashboard.
 *
 * ── Kartunya menyesuaikan gambar yang ada, bukan sebaliknya ──────────────
 *
 * Ada dua bentuk, dan yang menentukan datanya:
 *
 *   - Punya banner → gambar 3:2 di atas, teks di bawah. Sama persis dengan
 *     kartu event warisan, jadi kedua kisi terbaca sebagai satu keluarga.
 *     Bedanya isinya: banner dashboard biasanya FOTO acaranya sendiri, bukan
 *     selembar poster, dan itu memperlihatkan skala ajangnya jauh lebih baik.
 *   - Belum punya banner → logo jadi penanda mereknya, teks mengisi sisanya.
 *
 * Menyediakan lubang gambar yang kosong akan lebih buruk daripada tidak
 * menyediakannya sama sekali, jadi tidak ada rangka kosong di bentuk kedua.
 *
 * Yang tetap sama di keduanya: tanggalnya kolom tanggal betulan, bukan
 * kalimat "2th November - 6th November, 2026 (Offline)" yang harus ditebak
 * maknanya. Untuk pertama kalinya situs bisa menulis rentang tanggal yang
 * benar dalam bahasa pembacanya sendiri.
 */
export async function EdisiDashboardKartu({
  edisi,
}: {
  edisi: EdisiDashboard;
}) {
  const t = await getTranslations("events");
  const f = await getFormatter();

  const tanggal = (nilai: string | null) =>
    nilai
      ? f.dateTime(new Date(`${nilai}T00:00:00Z`), {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
      : null;

  const mulai = tanggal(edisi.mulai);
  const selesai = tanggal(edisi.selesai);
  const rentang =
    mulai && selesai && mulai !== selesai
      ? `${mulai} – ${selesai}`
      : (mulai ?? selesai);
  const tutup = tanggal(edisi.pendaftaranTutup);

  return (
    <article className="flex h-full w-full flex-col bg-[var(--bg)]">
      {edisi.banner && (
        /* Banner dashboard bukan poster — ia foto acaranya sendiri, 3:2, dan
           memperlihatkan skala ajangnya jauh lebih baik daripada selembar
           poster. Rasio yang sama dengan kartu event warisan, jadi kedua kisi
           tetap terbaca sebagai satu keluarga. */
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-[var(--bg-sunk)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gambarDashboard(edisi.banner, 640)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-start gap-4">
          {edisi.logo ? (
            // Ubin terang: logo event dirancang untuk latar putih, dan di tema
            // gelap situs ini sebagian besar akan lenyap tanpa alasnya sendiri.
            // Pola yang sama dipakai dinding logo mitra.
            <span className="inline-flex h-12 shrink-0 items-center rounded bg-white px-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gambarDashboard(edisi.logo, 256)}
                alt=""
                loading="lazy"
                className="h-8 w-auto max-w-[110px] object-contain"
              />
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[15px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)]">
              {edisi.akronim}{" "}
              <span className="tnum text-[var(--ink-faint)]">
                {edisi.tahun}
              </span>
            </p>
            <h3 className="mt-2 text-[16px] leading-snug font-semibold text-[var(--ink)]">
              {edisi.nama}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {edisi.lingkup && (
            <Pill tone={edisi.lingkup === "international" ? "teal" : "neutral"}>
              {t(
                edisi.lingkup === "international"
                  ? "levelInternational"
                  : "levelNational",
              )}
            </Pill>
          )}
          {edisi.moda && <Pill>{t(MODA[edisi.moda])}</Pill>}
        </div>

        <dl className="mt-auto flex flex-col gap-1.5 border-t border-[var(--line)] pt-3 text-[13.5px]">
          {rentang && (
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--ink-faint)]">{t("dates")}</dt>
              <dd className="tnum text-right text-[var(--ink-muted)]">
                {rentang}
              </dd>
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
          /* Ke situs ajangnya sendiri kalau pendaftarannya memang di sana —
             nyiia.or.id, wice.or.id, dan seterusnya. Dashboard hanya jadi
             tujuan untuk ajang yang formulirnya memang dilayani di sana;
             mengarahkan semua orang ke dashboard akan membuat mereka mencari
             formulir yang tidak pernah ada di situ. */
          <a
            href={edisi.pendaftaranUrl ?? org.dashboardUrl}
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
      </div>
    </article>
  );
}

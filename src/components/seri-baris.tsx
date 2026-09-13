import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { posterUrl } from "@/lib/assets";
import { statusEvent, uraiTanggal, type Seri } from "@/lib/event-seri";
import { akronimEvent, tahunEvent } from "@/lib/teks-event";
import { Pill } from "./ui";

/**
 * Satu seri beserta seluruh edisinya.
 *
 * ── Kenapa arsipnya per seri, bukan per tahun ────────────────────────────
 *
 * Daftar rata 66 event tidak memperlihatkan bahwa NYIIA, WICE, dan IICYMS
 * masing-masing sudah berjalan tiga tahun berturut-turut — edisinya terserak
 * di tiga tempat berbeda. Dikelompokkan per seri, rekam jejak itu terbaca
 * dalam satu baris, dan pengunjung yang mencari satu lomba tertentu menemukan
 * semua edisinya sekaligus.
 *
 * Barisnya sengaja ringkas: poster kecil, bukan kartu penuh. Empat puluh lima
 * seri dengan kartu berukuran penuh akan jadi belasan ribu piksel gulir, dan
 * arsip memang untuk dipindai, bukan dipelototi.
 */
export async function SeriBaris({ seri }: { seri: Seri }) {
  const t = await getTranslations("events");
  const kini = new Date();

  return (
    <div className="grid gap-5 py-7 md:grid-cols-12 md:gap-8">
      <div className="md:col-span-4">
        <Link
          href={`/event/seri/${seri.slug}`}
          className="group inline-flex flex-col gap-1"
        >
          <span className="font-mono text-[22px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)] transition-colors duration-[var(--gerak-cepat)] group-hover:text-[var(--teal)]">
            {seri.akronim}
          </span>
          {seri.nama && (
            <span className="max-w-[40ch] text-[14px] leading-snug text-[var(--ink-muted)]">
              {seri.nama}
            </span>
          )}
          <span className="eyebrow mt-1.5">{t("editions", { count: seri.edisi.length })}</span>
        </Link>
      </div>

      <ul className="flex flex-wrap gap-4 md:col-span-8">
        {seri.edisi.map((e) => {
          const poster = posterUrl(e.poster);
          const status = statusEvent(e, kini);
          /* Tahun dari judul kalau ada; kalau tidak, dari tanggal acaranya
             lewat pengurai yang sama dengan penghitung status.

             `new Date(e.dates)` TIDAK bisa dipakai di sini: tanggalnya
             berbentuk "2th November - 6th November, 2026 (Offline)" dan
             menghasilkan Invalid Date, sehingga edisi terbaru — yang justru
             judulnya paling sering tanpa tahun — tampil tanpa tahun sama
             sekali. */
          const tahun =
            tahunEvent(e.title) ?? uraiTanggal(e.dates)?.getFullYear().toString() ?? null;

          return (
            <li key={e.slug}>
              <Link href={`/event/${e.slug}`} className="group block w-[104px]">
                <div className="relative aspect-[4/5] overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
                  {poster ? (
                    <Image
                      src={poster}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-[var(--gerak-sedang)] group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center px-1 text-center font-mono text-[13px] leading-tight text-[var(--ink-faint)]">
                      {akronimEvent(e.title)}
                    </span>
                  )}
                </div>
                {tahun && (
                  <p className="tnum mt-2 font-mono text-[12px] text-[var(--ink-muted)]">{tahun}</p>
                )}
                {status !== "selesai" && (
                  <span className="mt-1 inline-block">
                    <Pill tone={status === "terbuka" ? "teal" : "navy"}>
                      {status === "terbuka" ? t("statusOpen") : t("statusUpcoming")}
                    </Pill>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { getTranslations, getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { gambarDashboard, type EdisiRingkas, type EdisiDashboard } from "@/lib/dashboard-event";
import { Pill } from "./ui";

const MODA = { online: "modeOnline", offline: "modeOnsite", hybrid: "modeHybrid" } as const;

/**
 * Satu edisi di halaman seri: banner 3:2 dari dasbor di atas, tahun dan
 * tanggal di bawah.
 *
 * Bannernya diisi panitia per edisi di dasbor (`events.image_url`) — poster
 * resmi tahun itu kalau ada, kalau tidak banner seragam berlogo. Jadi tiap
 * kartu memperlihatkan gambar MILIK tahunnya sendiri, bukan poster pinjaman.
 *
 * Tujuan klik: halaman detail warisan kalau edisi itu punya (2024–2026),
 * situs resmi ajangnya untuk edisi yang sedang disiarkan, selain itu kartu
 * diam — lebih baik daripada tautan ke halaman yang tidak ada.
 */
export async function EdisiBannerKartu({
  akronim,
  edisi,
  dash,
  hrefWarisan,
}: {
  akronim: string;
  edisi: EdisiRingkas;
  /** Edisi yang sedang disiarkan, untuk status pendaftaran dan situs resmi. */
  dash: EdisiDashboard | null;
  hrefWarisan: string | null;
}) {
  const t = await getTranslations("events");
  const f = await getFormatter();
  const tgl = (v: string | null) =>
    v ? f.dateTime(new Date(`${v}T00:00:00Z`), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : null;
  const mulai = tgl(edisi.mulai);
  const selesai = tgl(edisi.selesai);
  const rentang = mulai && selesai && mulai !== selesai ? `${mulai} – ${selesai}` : (mulai ?? selesai);

  const hariIni = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const akhir = edisi.selesai ?? edisi.mulai;
  /* Edisi lama yang tanggalnya tidak tercatat di dasbor dinilai dari tahunnya. */
  const lewat =
    edisi.status === "completed" || (akhir ? akhir < hariIni : Number(edisi.tahun) < Number(hariIni.slice(0, 4)));
  const status = edisi.dipin && dash?.pendaftaranDibuka ? "terbuka" : lewat ? "selesai" : "akan";

  const isi = (
    <>
      <div className="relative aspect-[3/2] overflow-hidden bg-[var(--bg-sunk)]">
        {edisi.banner ? (
          /* Poster resmi umumnya persegi atau tegak, banner seragam 3:2.
             Gambar utuh di depan (`contain`, teks poster tidak terpotong),
             salinannya yang buram mengisi sisa bingkai. */
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gambarDashboard(edisi.banner, 320)}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gambarDashboard(edisi.banner, 640)}
              alt={`${akronim} ${edisi.tahun}`}
              loading="lazy"
              className="relative h-full w-full object-contain transition-transform duration-[var(--gerak-sedang)] group-hover:scale-[1.03]"
            />
          </>
        ) : (
          <div className="grid h-full place-items-center">
            <p className="font-serif text-[34px] leading-none font-bold text-[var(--navy)]">{akronim}</p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {edisi.moda && <Pill>{t(MODA[edisi.moda])}</Pill>}
        </div>
        <h3 className="font-serif text-[17px] leading-snug font-bold text-[var(--ink)] transition-colors duration-[var(--gerak-cepat)] group-hover:text-[var(--navy)]">
          {akronim} {edisi.tahun}
        </h3>
        <div className="mt-auto flex flex-col gap-1 pt-1">
          {rentang && <p className="tnum font-sans text-[12px] text-[var(--ink-faint)]">{rentang}</p>}
          {status === "terbuka" ? (
            <p className="text-[13px] font-medium text-[var(--teal)]">{t("statusOpen")}</p>
          ) : status === "akan" ? (
            <p className="text-[13px] font-medium text-[var(--navy)]">{t("statusUpcoming")}</p>
          ) : (
            <p className="text-[13px] text-[var(--ink-faint)]">{t("statusDone")}</p>
          )}
        </div>
      </div>
    </>
  );

  const kelas = "group flex h-full w-full flex-col bg-[var(--bg)] transition-colors duration-[var(--gerak-cepat)] hover:bg-[var(--bg-sunk)]";
  if (hrefWarisan) return <Link href={hrefWarisan} className={kelas}>{isi}</Link>;
  if (edisi.dipin && dash?.situs)
    return <a href={dash.situs} target="_blank" rel="noreferrer" className={kelas}>{isi}</a>;
  return <div className={kelas}>{isi}</div>;
}

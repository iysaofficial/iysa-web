import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { statusEvent, uraiTanggal, type Seri } from "@/lib/event-seri";
import { tahunEvent } from "@/lib/teks-event";
import { gambarDashboard, type EdisiDashboard } from "@/lib/dashboard-event";

/**
 * Satu seri sebagai kartu ringkas — bahan kisi arsip.
 *
 * ── Kenapa kartu, bukan baris ────────────────────────────────────────────
 *
 * Versi sebelumnya memberi tiap seri satu baris selebar halaman berisi poster
 * seluruh edisinya. Dengan 45 seri hasilnya arsip sepanjang belasan ribu
 * piksel, dan pengunjung harus menggulir lama hanya untuk tahu seri apa saja
 * yang ada — padahal itu pertanyaan pertamanya.
 *
 * Arsip dipakai untuk MEMINDAI, bukan membaca. Jadi kartunya memuat hanya yang
 * dipakai mata saat memindai — akronim, nama, berapa edisi, rentang tahun —
 * dan edisinya baru muncul setelah serinya diklik. Dalam satu layar kini
 * terbaca belasan seri sekaligus alih-alih dua.
 *
 * Tidak ada poster di kartu ini, dan itu disengaja. Empat puluh lima gambar
 * membuat kisinya ramai persis di tempat yang tugasnya menenangkan, dan
 * akronimlah yang sebenarnya dikenali orang — itu nama yang mereka ketik di
 * mesin pencari.
 *
 * Logo event adalah perkecualiannya — kalau dashboard punya. Ia kecil, satu
 * per seri, dan justru menguatkan akronim alih-alih bersaing dengannya. Seri
 * yang belum dipin di dashboard, atau yang logonya belum diunggah, tampil
 * tanpa logo dan tidak kehilangan apa pun selain itu.
 */
export async function SeriKartu({ seri, dash }: { seri: Seri; dash?: EdisiDashboard }) {
  const t = await getTranslations("events");
  const kini = new Date();

  /* Rentang tahun dari judul kalau ada, kalau tidak dari tanggal acaranya.
     `new Date(e.dates)` tidak bisa dipakai: tanggalnya berbentuk
     "2th November - 6th November, 2026 (Offline)" dan menghasilkan Invalid
     Date. */
  const tahun = seri.edisi
    .map((e) => {
      const dariJudul = tahunEvent(e.title);
      if (dariJudul) return Number(dariJudul);
      const diurai = uraiTanggal(e.dates);
      return diurai ? diurai.getFullYear() : null;
    })
    .filter((x): x is number => x !== null);

  const awal = tahun.length ? Math.min(...tahun) : null;
  const tahunDash = dash?.tahun ? Number(dash.tahun) : null;
  const awalGab = [awal, tahun.length ? Math.max(...tahun) : null, tahunDash].filter((x): x is number => x !== null && Number.isFinite(x));
  const lo = awalGab.length ? Math.min(...awalGab) : null;
  const hi = awalGab.length ? Math.max(...awalGab) : null;
  const rentang = lo === null ? null : lo === hi ? `${lo}` : `${lo}–${hi}`;
  /* Seri yang hanya ada di dasbor belum punya edisi warisan; jumlahnya dari dasbor. */
  const jumlahEdisi = seri.edisi.length || Math.max(1, dash?.tahunEdisi.length ?? 0);

  // Satu penanda saja, dan yang paling mendesak yang menang: seri dengan edisi
  // yang pendaftarannya masih buka lebih penting daripada yang baru terjadwal.
  /* Status dari dasbor bila serinya sudah di-pin — togel dan tanggal sungguhan,
     bukan tebakan dari kalimat tanggal warisan. */
  const status = dash ? [dash.status] : seri.edisi.map((e) => statusEvent(e, kini));
  const tanda = status.includes("terbuka")
    ? { teks: t("statusOpen"), warna: "text-[var(--teal)]", titik: "bg-[var(--teal)]" }
    : status.includes("akan")
      ? { teks: t("statusUpcoming"), warna: "text-[var(--coral)]", titik: "bg-[var(--coral)]" }
      : null;

  return (
    <Link
      href={`/event/seri/${seri.slug}`}
      className="group flex h-full w-full flex-col gap-2 bg-[var(--bg)] p-4 transition-colors duration-[var(--gerak-cepat)] hover:bg-[var(--bg-sunk)] sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2.5">
          {dash?.logo && (
            // Ubin terang: logo event dirancang untuk latar putih dan sebagian
            // besar akan lenyap di tema gelap tanpa alasnya sendiri.
            <span className="grid h-7 w-7 shrink-0 place-items-center self-center rounded-sm bg-white p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gambarDashboard(dash.logo, 64)}
                alt=""
                width={28}
                height={28}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </span>
          )}
          <span className="font-serif text-[19px] leading-none font-bold tracking-[-0.02em] text-[var(--navy)] transition-colors duration-[var(--gerak-cepat)] group-hover:text-[var(--teal)]">
            {seri.akronim}
          </span>
        </span>
        <span className="tnum shrink-0 font-sans text-[11.5px] text-[var(--ink-faint)]">
          {t("editions", { count: jumlahEdisi })}
        </span>
      </div>

      {seri.nama && (
        <span className="line-clamp-2 text-[13.5px] leading-snug text-[var(--ink-muted)]">
          {seri.nama}
        </span>
      )}

      {/* Didorong ke dasar kartu supaya baris tahun tiap kartu sejajar,
          betapa pun berbedanya panjang namanya. */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
        <span className="tnum font-sans text-[12px] text-[var(--ink-faint)]">{rentang}</span>
        {tanda && (
          <span className={`flex items-center gap-1.5 text-[11.5px] font-medium ${tanda.warna}`}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${tanda.titik}`} />
            {tanda.teks}
          </span>
        )}
      </div>
    </Link>
  );
}

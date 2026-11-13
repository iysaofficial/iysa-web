import { getTranslations } from "next-intl/server";
import kurasi from "@/content/generated/kurasi-simt.json";

/**
 * Seksi kurasi Puspresnas — nilai jual utama ajang IYSA.
 *
 * ── Kenapa ia satu-satunya blok berwarna penuh di beranda ──────────────
 *
 * Versi pertama seksi ini tiga kartu putih bernomor yang menjelaskan alur
 * administrasi: diajukan per cabang, dinilai per edisi, terbit di SIMT. Semua
 * benar, dan semuanya urusan belakang meja. Orang tua yang sedang menimbang
 * mau mendaftarkan anaknya tidak menanyakan bagaimana IYSA mengurus berkas —
 * ia menanyakan apa gunanya sertifikat ini nanti.
 *
 * Jadi isinya dibalik: klaimnya dulu, buktinya, baru artinya buat peserta.
 * Dan karena ini yang membedakan ajang IYSA dari lomba biasa, ia diberi satu
 * perlakuan yang tidak dipakai seksi lain mana pun — bidang --navy penuh
 * selebar layar. Itu langkah paling berani yang tersedia di dalam palet
 * tertutup situs ini, dan ia hanya dibelanjakan sekali, di sini.
 *
 * Bidangnya benar di kedua tema tanpa perlu aturan tambahan: di tema gelap
 * --navy justru jadi biru terang dan --on-navy jadi tinta gelap, jadi
 * panelnya membalik sendiri dan tetap terbaca sebagai sorotan.
 *
 * ── Kenapa bintang IYSA sendiri tidak dipajang ─────────────────────────
 *
 * Angka cakupan di sini ditarik dari SIMT (lihat scripts/tarik-kurasi.mjs),
 * dan dari sumber yang sama sebenarnya terbaca juga predikat bintang tiap
 * cabang ajang IYSA. Itu sengaja tidak ditampilkan di beranda.
 *
 * Sebabnya bukan malu-malu: kurasi dinilai PER CABANG, dan satu edisi bisa
 * punya bintang berbeda antar bidang lomba. Tidak ada satu angka jujur yang
 * bisa ditulis sebagai "bintang edisi ini". Memilih yang tertinggi berarti
 * memetik ceri dari pangkalan data yang bisa dibuka siapa saja lewat tautan
 * yang seksi ini sendiri pajang — cara tercepat kehilangan kepercayaan yang
 * justru sedang dibangun halaman ini. Predikat per cabang tempatnya nanti di
 * halaman tiap edisi, bukan di sini.
 */

/** Satu bintang. Dipakai berulang; bentuknya tetap, hanya isiannya berubah. */
function Bintang({ penuh }: { penuh: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 shrink-0 ${penuh ? "" : "opacity-25"}`}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.44l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95z" />
    </svg>
  );
}

/** Skala predikat resmi: 5 bintang = 85–100, turun sampai 1 bintang = < 40. */
const SKALA = [
  { bintang: 5, nilai: "85 – 100" },
  { bintang: 4, nilai: "70 – 85" },
  { bintang: 3, nilai: "55 – 70" },
  { bintang: 2, nilai: "40 – 55" },
  { bintang: 1, nilai: "< 40" },
] as const;

export async function KurasiPanel() {
  const t = await getTranslations("home");

  const angka = [
    { nilai: kurasi.seri, label: t("curationStatSeries") },
    { nilai: kurasi.edisi, label: t("curationStatEditions") },
    { nilai: kurasi.tahunAwal, label: t("curationStatSince") },
  ];

  const manfaat = [
    ["curationB1Title", "curationB1Body"],
    ["curationB2Title", "curationB2Body"],
    ["curationB3Title", "curationB3Body"],
    ["curationB4Title", "curationB4Body"],
  ] as const;

  return (
    // `relative z-30`: sama seperti kaki halaman, panel ini berada DI ATAS
    // lapisan lambang 3D yang melayang (z-20). Tanpa itu lambangnya melintas
    // tepat di atas angka SIMT dan tautan pemeriksaannya — dua hal yang paling
    // tidak boleh terhalang di halaman ini. Sekarang ia lewat di belakang
    // panel, lalu muncul lagi di bawahnya.
    <section className="relative z-30 border-y border-[var(--line)] bg-[var(--navy)] text-[var(--on-navy)]">
      <div className="shell py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-12 md:gap-14">
          {/* Klaim dan buktinya */}
          <div className="md:col-span-7">
            <p className="font-sans text-[11px] font-bold tracking-[0.14em] text-[var(--on-navy)]/70 uppercase">
              {t("curationEyebrow")}
            </p>
            <h2 className="mt-2 font-serif text-title">{t("curationTitle")}</h2>
            <p className="mt-4 max-w-[56ch] leading-relaxed text-[var(--on-navy)]/85">
              {t("curationLead")}
            </p>

            {/* Angka dari SIMT — bukti yang bisa dibuka sendiri, jadi ia
                berdiri tepat di sebelah tautan pemeriksaannya. */}
            <dl className="mt-9 grid grid-cols-3 gap-x-6 gap-y-4">
              {angka.map((a) => (
                <div key={a.label} className="border-t border-[var(--on-navy)]/25 pt-3">
                  <dd className="tnum font-serif text-[30px] leading-none font-bold tracking-[-0.02em] md:text-[38px]">
                    {a.nilai}
                  </dd>
                  <dt className="mt-1.5 text-[13px] leading-snug text-[var(--on-navy)]/70">
                    {a.label}
                  </dt>
                </div>
              ))}
            </dl>

            <a
              href="https://simt.kemendikdasmen.go.id/kurasi/advanced-search"
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-1.5 border-b border-[var(--on-navy)]/40 pb-0.5 text-[14.5px] font-medium transition-colors duration-[var(--gerak-cepat)] hover:border-[var(--on-navy)]"
            >
              {t("curationVerify")}
              <span aria-hidden className="text-[12px]">
                ↗
              </span>
            </a>
          </div>

          {/* Skala predikat */}
          <div className="md:col-span-5">
            <div className="border border-[var(--on-navy)]/25 p-6">
              <h3 className="font-sans text-[11px] font-bold tracking-[0.14em] text-[var(--on-navy)]/70 uppercase">
                {t("curationScaleTitle")}
              </h3>
              <ul className="mt-4 flex flex-col">
                {SKALA.map((s) => (
                  <li
                    key={s.bintang}
                    className="flex items-center gap-3 border-t border-[var(--on-navy)]/15 py-2.5 first:border-t-0 first:pt-0"
                  >
                    <span className="flex gap-0.5" aria-hidden>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Bintang key={i} penuh={i <= s.bintang} />
                      ))}
                    </span>
                    <span className="flex-1 text-[14px]">
                      {t(`curationScale${s.bintang}`)}
                    </span>
                    <span className="tnum font-sans text-[12.5px] font-bold text-[var(--on-navy)]/70">
                      {s.nilai}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12.5px] leading-relaxed text-[var(--on-navy)]/65">
                {t("curationScaleNote")}
              </p>
            </div>
          </div>
        </div>

        {/* Apa artinya buat peserta — jawaban atas "lalu sertifikat ini
            gunanya apa", yang justru tidak dijawab versi sebelumnya. */}
        <ul className="mt-12 grid gap-px border border-[var(--on-navy)]/25 bg-[var(--on-navy)]/25 sm:grid-cols-2 lg:grid-cols-4">
          {manfaat.map(([judul, isi]) => (
            <li key={judul} className="flex flex-col gap-2 bg-[var(--navy)] p-6">
              <h3 className="font-serif text-[15.5px] leading-snug font-bold">{t(judul)}</h3>
              <p className="text-[14px] leading-relaxed text-[var(--on-navy)]/80">{t(isi)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Lambang IYSA — dari hasil tracing berkas aslinya.
 *
 * ── Kenapa berkas, bukan SVG sebaris ─────────────────────────────────────
 *
 * Versi sebelumnya menyusun lambang dari geometri: tiga elips, tiga lingkaran,
 * satu bola dunia berangka. Bentuknya mendekati dan ringan (~1 KB sebaris),
 * tapi tetap tiruan — dan pemilik situs menyadarinya di navbar maupun di tab
 * peramban.
 *
 * Sekarang sumbernya `iysa-mark-traced.svg`, hasil `npm run trace:logo` atas
 * berkas lambang asli IYSA. Data path-nya 18 KB; di-inline ia ikut di SETIAP
 * halaman, jadi ia dipakai sebagai berkas: satu permintaan, disinggahi
 * peramban, dan sama persis dengan yang dipakai objek 3D di hero.
 *
 * ── Satu keterbatasan yang diketahui ─────────────────────────────────────
 *
 * SVG di dalam `<img>` tidak bisa membaca atribut `data-theme` halaman, jadi
 * ia mengikuti `prefers-color-scheme` lewat @media di dalam berkasnya sendiri.
 * Kalau pengunjung memaksa tema terang sementara sistemnya gelap (atau
 * sebaliknya), bola dunianya memakai pasangan warna tema yang lain. Ketiga
 * orbitnya tetap terbaca di kedua latar, jadi dampaknya kecil — dan itu harga
 * yang dibayar untuk tidak menambah 18 KB ke setiap halaman.
 */

/** Sisi kotak lambang dalam piksel. */
type Props = {
  size?: number;
  /**
   * Teks alternatif. Kosongkan kalau lambang berdiri tepat di sebelah tulisan
   * "IYSA" — kalau tidak, pembaca layar menyebut nama yang sama dua kali.
   */
  alt?: string;
  className?: string;
};

export function IysaLogo({ size = 32, alt = "", className = "" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/media/logo/iysa-mark-traced.svg"
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden={alt ? undefined : true}
    />
  );
}

/**
 * Lockup resmi IYSA apa adanya: lambang + "IYSA" + baris "Indonesian Young
 * Scientist Association", satu gambar, tanpa teks tambahan dari situs.
 *
 * Dipakai di navbar lebar. Sumbernya `iysa-lockup.svg`, hasil `npm run
 * trace:logo` atas berkas lockup asli — bukan PNG-nya langsung, karena seluruh
 * teks di lockup itu gelap dan akan lenyap ke latar di tema gelap situs ini.
 * Versi telusurannya berkelas, dan @media di dalam berkasnya menukar palet
 * teks serta orbitnya sendiri.
 *
 * Ia tidak dipakai di lebar ponsel: baris keterangannya sudah di ambang
 * keterbacaan pada tinggi navbar desktop, dan di bawahnya ia jadi bubur. Di
 * sana yang tampil `IysaWordmark`.
 */
export function IysaLockup({
  height = 44,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/media/logo/iysa-lockup.svg"
      alt="IYSA — Indonesian Young Scientist Association"
      /* Rasio lockup terpotong: 1153×502. Lebar ikut tinggi, dan ditulis
         eksplisit supaya tata letak navbar tidak bergeser saat berkasnya
         selesai diunduh. */
      width={Math.round(height * 2.297)}
      height={height}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}

/**
 * Lambang + tulisan "IYSA". Satu komponen supaya jarak dan perataan garis
 * dasarnya identik di header dan kaki halaman — di situs lama keduanya
 * menulis ulang gayanya sendiri dan akhirnya berbeda tipis.
 */
export function IysaWordmark({
  size = 28,
  sub,
  className = "",
}: {
  size?: number;
  /** Baris kecil di sebelah nama, mis. "Young Scientist". */
  sub?: string;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <IysaLogo size={size} />
      <span className="flex items-center gap-2">
        {/*
          Huruf "IYSA" adalah letterform merek yang sesungguhnya, ditelusuri
          dari berkas lockup dan dipasang sebagai mask supaya warnanya ikut
          tema. Sebelumnya di sini Plus Jakarta Sans tebal — rapi, tapi bukan
          huruf IYSA.

          Baris "Indonesian Young Scientist Association" dari lockup aslinya
          sengaja tidak ikut: pada tinggi navbar ia jadi ~5px dan tak terbaca.
        */}
        <span
          className="wordmark-iysa"
          style={{ height: Math.round(size * 0.54) }}
          role="img"
          aria-label="IYSA"
        />
        {sub && (
          <span className="hidden text-[11px] leading-none text-[var(--ink-faint)] sm:inline">
            {sub}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Lambang IYSA — digambar ulang sebagai SVG.
 *
 * ── Kenapa digambar ulang, bukan dilacak ──────────────────────────────────
 *
 * Tidak ada versi vektor lambang IYSA di mana pun: repo lama hanya punya PNG
 * dan WebP raster, dan satu-satunya .svg di sana (`.old/src/logo.svg`) adalah
 * logo React bawaan create-react-app — viewBox 841.9×595.3, isian #61DAFB.
 * Bukan logo IYSA sama sekali.
 *
 * Jadi bentuk di bawah disusun dari geometri, bukan auto-trace PNG 472×512.
 * Auto-trace menghasilkan ratusan titik bézier yang bergerigi saat diperbesar
 * dan tetap berat saat diperkecil. Konstruksi geometris tetap tajam di 16px
 * maupun 1200px — dan lambang ini dipakai dari favicon sampai gambar Open
 * Graph.
 *
 * ── Bentuknya ────────────────────────────────────────────────────────────
 *
 * Tiga orbit elips berjarak 60° (−30°, +30°, 90°), masing-masing dengan satu
 * simpul bulat di ujungnya, mengelilingi bola dunia di pusat.
 *
 * Urutan gambarnya penting dan bukan kebetulan: teal dan coral dulu, lalu
 * bola dunia menutupinya, lalu navy digambar DI ATAS bola. Itu yang membuat
 * navy terbaca lewat di depan dan dua orbit lain lewat di belakang —
 * kedalaman yang sama dengan logo aslinya. Kalau ketiganya digambar sebelum
 * bola, lambangnya jadi rata dan bola dunianya tampak menempel di atas semua.
 *
 * ── Kenapa ada dua varian ────────────────────────────────────────────────
 *
 * Di bawah 40px, garis meridian bola dunia berubah jadi kotak abu bergaris —
 * diuji dengan merender 32px lalu memperbesarnya tanpa penghalusan. Jadi
 * `polos` membuang meridian dan menyisakan bola pejal, yang di ukuran favicon
 * justru terbaca sebagai inti. Ambangnya dipilih otomatis dari `size`.
 *
 * ── Warna ────────────────────────────────────────────────────────────────
 *
 * Memakai token `--logo-*`, bukan `--navy/--teal/--coral` milik situs. Palet
 * situs dipilih supaya lolos WCAG sebagai TEKS, jadi lebih gelap dan lebih
 * redam daripada lambangnya; lambang tidak memikul beban itu.
 *
 * Warna asli logo juga tidak dipakai mentah, karena keduanya gagal di salah
 * satu tema — dihitung, bukan dikira:
 *
 *   teal asli #30B4B4 di atas putih   2,53:1  → hilang di tema terang
 *   navy asli #305490 di atas #0c1220 2,49:1  → tenggelam di tema gelap
 *
 * Nilai di `--logo-*` adalah versi yang digeser seperlunya sampai ketiganya
 * ≥3:1 di kedua tema, tanpa kehilangan rupa aslinya.
 */

type Props = {
  /** Sisi kotak dalam piksel. Lambangnya bujur sangkar. */
  size?: number;
  /**
   * Teks alternatif. Kalau diisi, lambang jadi `role="img"` berjudul; kalau
   * kosong, ia disembunyikan dari pembaca layar — yang benar ketika lambang
   * berdiri tepat di sebelah tulisan "IYSA", karena kalau tidak pembaca layar
   * menyebut nama yang sama dua kali.
   */
  title?: string;
  /**
   * Paksa varian. Biarkan kosong untuk memilih otomatis dari `size`:
   * di bawah 40px meridian dibuang.
   */
  polos?: boolean;
  className?: string;
};

/* ── Geometri ───────────────────────────────────────────────────────────
   Angka-angka ini juga ada di scripts/build-icons.mjs, yang tidak bisa
   mengimpor berkas .tsx. Kalau di sini berubah, ubah di sana juga — skrip
   itu punya penjaga yang membandingkan keduanya dan gagal kalau berbeda. */
export const GEOMETRI = {
  C: 256, // pusat
  RX: 200, // sumbu panjang orbit
  RY: 66, // sumbu pendek orbit
  SW: 27, // tebal garis orbit
  NODE: 30, // jari-jari simpul
  GLOBE: 54, // jari-jari bola dunia
} as const;

const { C, RX, RY, SW, NODE, GLOBE } = GEOMETRI;

/** Urutan = urutan gambar. Navy terakhir supaya lewat di depan bola dunia. */
export const ORBITS = [
  { rot: 30, warna: "var(--logo-teal)", simpul: 180 },
  { rot: 90, warna: "var(--logo-coral)", simpul: 180 },
  { rot: -30, warna: "var(--logo-navy)", simpul: 0 },
] as const;

/** Titik ujung orbit tempat simpul duduk, setelah orbit diputar `rot` derajat. */
export function titikSimpul(rot: number, deg: number) {
  const a = ((rot + deg) * Math.PI) / 180;
  return { x: C + RX * Math.cos(a), y: C + RX * Math.sin(a) };
}

export function IysaLogo({ size = 32, title, polos, className = "" }: Props) {
  const tanpaMeridian = polos ?? size < 40;
  const [teal, coral, navy] = ORBITS;

  const orbit = (o: (typeof ORBITS)[number]) => (
    <ellipse
      cx={C}
      cy={C}
      rx={RX}
      ry={RY}
      fill="none"
      stroke={o.warna}
      strokeWidth={SW}
      transform={`rotate(${o.rot} ${C} ${C})`}
    />
  );

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}

      {orbit(teal)}
      {orbit(coral)}

      {/* Bola dunia menutup dua orbit di belakangnya. Benua aslinya tidak
          ditiru: di 16px ia jadi noda, dan satu meridian sudah cukup untuk
          terbaca sebagai bola. */}
      <circle cx={C} cy={C} r={GLOBE} fill="var(--logo-globe)" />
      {!tanpaMeridian && (
        <g fill="none" stroke="var(--logo-globe-garis)" strokeWidth={6}>
          <line x1={C - GLOBE} y1={C} x2={C + GLOBE} y2={C} />
          <ellipse cx={C} cy={C} rx={GLOBE * 0.45} ry={GLOBE} />
        </g>
      )}

      {orbit(navy)}

      {ORBITS.map((o) => {
        const p = titikSimpul(o.rot, o.simpul);
        return <circle key={o.rot} cx={p.x} cy={p.y} r={NODE} fill={o.warna} />;
      })}
    </svg>
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
      <span className="flex items-baseline gap-2">
        <span className="text-[19px] font-extrabold tracking-[-0.04em] text-[var(--navy)]">
          IYSA
        </span>
        {sub && (
          <span className="hidden text-[11px] leading-none text-[var(--ink-faint)] sm:inline">
            {sub}
          </span>
        )}
      </span>
    </span>
  );
}

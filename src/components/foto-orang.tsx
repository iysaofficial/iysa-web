import Image from "next/image";

/**
 * Foto anggota tim yang bisa diganti — tanpa satu baris JavaScript pun.
 *
 * ── Kenapa bukan komponen klien ──────────────────────────────────────────
 *
 * Tiap orang difoto sampai empat kali; situs lama memutar foto-foto itu saat
 * kartunya diklik. Meniru itu dengan `useState` berarti mengirim JavaScript ke
 * setiap pengunjung halaman tim demi satu perilaku hiasan, dan menjadikan
 * seluruh pohon kartunya komponen klien.
 *
 * Radio yang disembunyikan mengerjakan hal yang sama di CSS: tiap foto punya
 * satu radio, bingkai kecilnya `<label>` yang menunjuk radio itu, dan lapisan
 * fotonya hanya tampak saat radionya terpilih. Nol byte JavaScript, dan
 * bonusnya ia bisa dijalankan dari papan ketik — radio dalam satu grup memang
 * berpindah dengan tombol panah, gratis dari peramban.
 *
 * ── Kenapa kelasnya ditulis satu per satu ────────────────────────────────
 *
 * Tailwind memindai kelas sebagai teks, jadi `peer-checked/p${i}` yang disusun
 * saat berjalan tidak pernah ikut tergenerasi. Empat pasang ditulis literal di
 * `LAPIS` — empat memang batas atasnya: berkas terbanyak yang dimiliki satu
 * orang ada empat.
 */

const LAPIS = [
  { peer: "peer/p0", tampak: "peer-checked/p0:opacity-100" },
  { peer: "peer/p1", tampak: "peer-checked/p1:opacity-100" },
  { peer: "peer/p2", tampak: "peer-checked/p2:opacity-100" },
  { peer: "peer/p3", tampak: "peer-checked/p3:opacity-100" },
] as const;

export function FotoOrang({
  nama,
  urls,
  id,
  sizes,
  lebarBingkai,
  posisiBingkai = "absolute right-1.5 bottom-1.5",
}: {
  nama: string;
  /** Foto utama lebih dulu. Lebih dari empat diabaikan — lihat catatan. */
  urls: string[];
  /** Pembeda grup radio; harus unik dalam satu halaman. */
  id: string;
  sizes: string;
  lebarBingkai: string;
  posisiBingkai?: string;
}) {
  const foto = urls.slice(0, LAPIS.length);

  if (foto.length === 0) {
    return (
      <span className="absolute inset-0 grid place-items-center font-mono text-[22px] text-[var(--ink-faint)]">
        {nama
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join("")}
      </span>
    );
  }

  return (
    <>
      {foto.map((u, i) => (
        <span key={u} className="contents">
          <input
            type="radio"
            name={`foto-${id}`}
            id={`foto-${id}-${i}`}
            defaultChecked={i === 0}
            aria-label={`${nama} — foto ${i + 1}`}
            className={`sr-only ${LAPIS[i].peer}`}
          />
          <span
            className={`absolute inset-0 opacity-0 transition-opacity duration-[var(--gerak-sedang)] ${LAPIS[i].tampak}`}
          >
            <Image
              src={u}
              alt={i === 0 ? nama : ""}
              fill
              sizes={sizes}
              className="object-cover object-top"
            />
          </span>
        </span>
      ))}

      {foto.length > 1 && (
        /* Bingkainya berlatar --bg, bukan --line: garis rambut yang biasa
           memisahkan dua kotak putih hilang begitu ia berdiri di atas foto. */
        <span className={`z-10 flex gap-px bg-[var(--bg)] p-px ${posisiBingkai}`}>
          {foto.map((u, i) => (
            <label
              key={u}
              htmlFor={`foto-${id}-${i}`}
              className={`relative aspect-[4/5] cursor-pointer overflow-hidden bg-[var(--bg-sunk)] opacity-70 transition-opacity duration-[var(--gerak-cepat)] hover:opacity-100 ${lebarBingkai}`}
            >
              <Image src={u} alt="" fill sizes="80px" className="object-cover object-top" />
            </label>
          ))}
        </span>
      )}
    </>
  );
}

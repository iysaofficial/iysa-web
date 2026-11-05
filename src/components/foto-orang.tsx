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
 * satu radio, indikator pil di sudut atas (`━ • • •`) maupun klik langsung pada
 * foto memindahkan radio ke foto berikutnya, dan lapisan fotonya hanya tampak
 * saat radionya terpilih.
 *
 * ── Kenapa `unoptimized` & `object-cover object-top` ────────────────────
 *
 * Berkas di `public/media/allimg/` sudah berupa WebP beresolusi tinggi
 * (~600×890px hingga 1400px). Memasukkannya lagi ke pengoptimal `/_next/image`
 * dengan `sizes` kecil membuat Next.js mengecilkannya ke 256px/384px dan
 * mengompresinya untuk kedua kali pada `quality=75`, sehingga wajah tampak
 * pecah/kabur. Dengan `unoptimized` dan `object-cover object-top`, resolusi
 * asli disajikan utuh tanpa kompresi ganda dan bagian kepala/bahu selalu
 * sejajar rapi dari atas bingkai.
 */

const LAPIS = [
  {
    peer: "peer/p0",
    tampak: "pointer-events-none opacity-0 peer-checked/p0:pointer-events-auto peer-checked/p0:opacity-100",
    titikAktif: "peer-checked/p0:[&>[data-i='0']]:w-5 peer-checked/p0:[&>[data-i='0']]:bg-white",
  },
  {
    peer: "peer/p1",
    tampak: "pointer-events-none opacity-0 peer-checked/p1:pointer-events-auto peer-checked/p1:opacity-100",
    titikAktif: "peer-checked/p1:[&>[data-i='1']]:w-5 peer-checked/p1:[&>[data-i='1']]:bg-white",
  },
  {
    peer: "peer/p2",
    tampak: "pointer-events-none opacity-0 peer-checked/p2:pointer-events-auto peer-checked/p2:opacity-100",
    titikAktif: "peer-checked/p2:[&>[data-i='2']]:w-5 peer-checked/p2:[&>[data-i='2']]:bg-white",
  },
  {
    peer: "peer/p3",
    tampak: "pointer-events-none opacity-0 peer-checked/p3:pointer-events-auto peer-checked/p3:opacity-100",
    titikAktif: "peer-checked/p3:[&>[data-i='3']]:w-5 peer-checked/p3:[&>[data-i='3']]:bg-white",
  },
] as const;

export function FotoOrang({
  nama,
  urls,
  id,
  sizes,
  posisiIndikator = "top-2.5 right-2.5",
}: {
  nama: string;
  /** Foto utama lebih dulu. Lebih dari empat diabaikan — lihat catatan. */
  urls: string[];
  /** Pembeda grup radio; harus unik dalam satu halaman. */
  id: string;
  sizes?: string;
  lebarBingkai?: string;
  posisiBingkai?: string;
  posisiIndikator?: string;
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

  const semuaTitikAktif = LAPIS.slice(0, foto.length)
    .map((l) => l.titikAktif)
    .join(" ");

  return (
    <>
      {foto.map((u, i) => (
        <input
          key={`radio-${u}`}
          type="radio"
          name={`foto-${id}`}
          id={`foto-${id}-${i}`}
          defaultChecked={i === 0}
          aria-label={`${nama} — foto ${i + 1}`}
          className={`sr-only ${LAPIS[i].peer}`}
        />
      ))}

      {foto.map((u, i) => {
        const idBerikutnya = `foto-${id}-${(i + 1) % foto.length}`;
        return (
          <label
            key={`img-${u}`}
            htmlFor={foto.length > 1 ? idBerikutnya : undefined}
            className={`absolute inset-0 transition-opacity duration-[var(--gerak-sedang)] ${
              foto.length > 1 ? "cursor-pointer" : ""
            } ${LAPIS[i].tampak}`}
          >
            <Image
              src={u}
              alt={i === 0 ? nama : ""}
              fill
              sizes={sizes}
              unoptimized
              className="object-cover object-top"
            />
          </label>
        );
      })}

      {foto.length > 1 && (
        <span
          className={`absolute z-10 flex items-center gap-1.5 rounded-full bg-[#0d192b]/65 px-2.5 py-1.5 backdrop-blur-[2px] ${posisiIndikator} ${semuaTitikAktif}`}
        >
          {foto.map((u, i) => (
            <label
              key={`dot-${u}`}
              data-i={i}
              htmlFor={`foto-${id}-${i}`}
              title={`${nama} — ${i + 1}/${foto.length}`}
              className="h-1.5 w-1.5 cursor-pointer rounded-full bg-white/50 transition-all duration-[var(--gerak-cepat)] hover:bg-white/85"
            />
          ))}
        </span>
      )}
    </>
  );
}

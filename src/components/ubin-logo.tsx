import { gambarDashboard } from "@/lib/dashboard-event";

/**
 * Pengganti gambar kartu untuk edisi tanpa poster asli: logo ajang di atas
 * ubin terang 3:2, tahun di sudut. Rasionya sama dengan poster, jadi kisi
 * tetap rata, tetapi warnanya tidak ikut menyeragamkan deretan kartu.
 */
export function UbinLogo({ logo, akronim, tahun }: { logo: string | null; akronim: string; tahun: string }) {
  return (
    <div className="relative grid aspect-[3/2] w-full place-items-center overflow-hidden bg-[var(--bg-sunk)]">
      <span
        aria-hidden
        className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_80%_10%,var(--line)_0,transparent_45%),radial-gradient(circle_at_10%_90%,var(--line)_0,transparent_40%)]"
      />
      {logo ? (
        /* Ukuran tetap: tinggi persen di dalam kotak ber-aspect-ratio tidak
           terselesaikan, dan logo tampil sebesar berkas aslinya. */
        <span className="relative flex h-20 items-center rounded-lg bg-white px-4 py-3 shadow-sm sm:h-24 sm:px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gambarDashboard(logo, 256)} alt="" loading="lazy" className="h-full w-auto max-w-[120px] object-contain sm:max-w-[170px]" />
        </span>
      ) : (
        <span className="relative font-serif text-[34px] leading-none font-bold text-[var(--navy)]">{akronim}</span>
      )}
      <span className="tnum absolute top-3 right-3 rounded-full bg-[var(--bg)] px-2.5 py-1 text-[12px] font-bold text-[var(--navy)]">
        {tahun}
      </span>
    </div>
  );
}

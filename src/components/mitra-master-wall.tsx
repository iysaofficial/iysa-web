import { type MitraMaster } from "@/lib/mitra-dashboard";

/**
 * Dinding logo institusi mitra dari master data dasbor. Pola visualnya sama
 * dengan `PartnerWall` (kotak seragam, logo diredam abu-abu sampai disentuh),
 * tapi kini namanya ada sebagai data, jadi tiap logo diberi `alt` dan
 * keterangan nama di bawahnya.
 *
 * Logo dilayani `/logo/master-mitra/:id?v=` dasbor (disinggahkan setahun),
 * bukan lewat next/image — alamatnya di luar pola gambar remote situs.
 */
export function MitraMasterWall({ mitra }: { mitra: MitraMaster[] }) {
  const items = mitra.filter((m): m is MitraMaster & { logo: string } => Boolean(m.logo));
  return (
    <ul className="rise-stagger grid grid-cols-2 border-t border-l border-[var(--line)] sm:grid-cols-3 lg:grid-cols-6">
      {items.map((m) => (
        <li key={m.id} className="border-r border-b border-[var(--line)] bg-[var(--bg)]">
          <div className="sel-logo flex h-28 items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.logo}
              alt={m.nama}
              width={160}
              height={96}
              loading="lazy"
              decoding="async"
              className="logo-mitra max-h-full w-auto max-w-full object-contain"
            />
          </div>
          <p className="border-t border-[var(--line)] px-3 py-2.5 text-center text-[12.5px] leading-snug text-[var(--ink-muted)]">
            {m.singkatan && m.singkatan.length <= 12 && m.singkatan !== m.nama ? `${m.nama} (${m.singkatan})` : m.nama}
          </p>
        </li>
      ))}
    </ul>
  );
}

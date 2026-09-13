import Image from "next/image";
import { logoUrl } from "@/lib/assets";
import { partners } from "@/lib/data";

/**
 * Dinding logo institusi mitra.
 *
 * Empat puluh satu logo sudah ikut migrasi aset sejak awal — 41 dari 41
 * terpetakan di asset-map.json — tapi belum pernah dirender di mana pun.
 * Beranda menampilkan angka "41 institusi mitra" tanpa satu logo pun, yang
 * membuat klaimnya terbaca sebagai angka kosong.
 *
 * ── Kenapa logonya dibuat abu-abu ────────────────────────────────────────
 *
 * Empat puluh satu logo institusi berarti empat puluh satu palet yang tidak
 * saling kenal — merah tua, biru tua, emas, hijau — dan kalau dipasang apa
 * adanya, dindingnya berteriak lebih keras daripada seluruh halaman dan
 * merampok perhatian dari satu-satunya ajakan coral di layar. `grayscale`
 * menyatukannya jadi satu bidang, dan warna aslinya kembali saat disentuh,
 * jadi logo yang sedang dilihat tetap tampil sebagaimana pemiliknya
 * merancangnya.
 *
 * Itu juga sebabnya tiap logo duduk di kotak rasio tetap dengan
 * `object-contain`: logo institusi datang dalam rasio yang sangat berbeda
 * (lencana bundar, spanduk memanjang), dan tanpa kotak yang seragam barisnya
 * jadi tinggi-rendah acak.
 */
export function PartnerWall({ scope }: { scope?: "national" | "international" }) {
  const items = partners().filter((p) => (scope ? p.scope === scope : true));

  return (
    <ul
      data-reveal
      className="rise-stagger grid grid-cols-3 gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4 lg:grid-cols-6"
    >
      {items.map((p, i) => {
        const src = logoUrl(p.logo);
        // Nama institusi tidak ada di data — partners.json hanya {scope, logo}.
        // Jadi alt dikosongkan dan logonya dekoratif: menebak nama dari nama
        // berkas ("UINUJ") menghasilkan label yang salah atas nama institusi
        // orang lain. Daftar bernama yang sebenarnya ada di /mitra.
        if (!src) return null;

        return (
          <li key={`${p.logo}-${i}`} className="bg-[var(--bg)]">
            <div className="flex aspect-[3/2] items-center justify-center p-4">
              <Image
                src={src}
                alt=""
                width={160}
                height={96}
                sizes="(min-width: 1024px) 160px, (min-width: 640px) 22vw, 30vw"
                className="max-h-full w-auto object-contain opacity-80 grayscale transition-all duration-[var(--gerak-sedang)] hover:opacity-100 hover:grayscale-0"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

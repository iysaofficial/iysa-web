import Image from "next/image";
import { logoUrl } from "@/lib/assets";
import { partners } from "@/lib/data";

/**
 * Dinding logo institusi mitra — 59 logo, 30 nasional dan 29 internasional.
 *
 * ── Dari mana daftarnya ──────────────────────────────────────────────────
 *
 * Dari dua komponen situs lama, `National-affiliation.js` dan
 * `International-affiliation.js`, yang meng-hardcode daftar `<img>`-nya.
 * BUKAN dari `AffiliationLogo.json` — berkas itu sisa yang tidak terpakai dan
 * isinya rusak: 41 entri yang hanya menunjuk 9 berkas, 26 di antaranya logo
 * IYSA sendiri. Dinding versi pertama dibangun dari sana dan hasilnya memajang
 * lambang IYSA 26 kali; dicabut, lalu dibangun ulang dari sumber yang benar.
 *
 * Entri yang dikomentari di kedua komponen itu tidak ikut — ada sepuluh di
 * daftar nasional dan lima di internasional yang memang sengaja disembunyikan
 * pemiliknya.
 *
 * ── Kenapa tanpa nama ────────────────────────────────────────────────────
 *
 * `alt` sengaja kosong dan tidak ada teks nama di bawah logo. Nama institusi
 * tidak pernah ada sebagai data — yang ada cuma nama berkas, dan sebagiannya
 * bukan nama sama sekali (`pohon`, `burung`, `red g`, `img`, `2020`).
 * Menebak dari nama berkas berarti memasang label keliru atas nama institusi
 * orang lain.
 *
 * Situs lama pun memakai `alt=""` di setiap logo, jadi ini bukan kemunduran —
 * ini setia pada sumbernya. Kalau IYSA nanti menyediakan daftar bernama,
 * tinggal petakan lewat berkas di `src/content/`, pola yang sama dengan
 * `affiliateNames`.
 *
 * ── Kenapa logonya diredam ───────────────────────────────────────────────
 *
 * Lima puluh sembilan logo institusi berarti lima puluh sembilan palet yang
 * tidak saling kenal — merah tua, biru dongker, emas, hijau. Dipasang apa
 * adanya, dindingnya berteriak lebih keras daripada seluruh halaman dan
 * merampok perhatian dari satu-satunya ajakan coral di layar. `grayscale`
 * menyatukannya jadi satu bidang, dan warna aslinya kembali saat disentuh.
 *
 * Tiap logo duduk di kotak rasio tetap dengan `object-contain` karena logo
 * institusi datang dalam rasio yang sangat berbeda — lencana bundar, spanduk
 * memanjang — dan tanpa kotak seragam barisnya jadi tinggi-rendah acak.
 */
export function PartnerWall({ scope }: { scope?: "national" | "international" }) {
  const items = partners().filter((p) => (scope ? p.scope === scope : true));

  return (
    <ul
      className="rise-stagger grid grid-cols-3 gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4 lg:grid-cols-6"
    >
      {items.map((p, i) => {
        const src = logoUrl(p.logo);
        // Setiap komponen wajib menangani null; di sini sel-nya tidak
        // dirender sama sekali, bukan kotak kosong yang terbaca sebagai rusak.
        if (!src) return null;

        return (
          <li key={`${p.logo}-${i}`} className="bg-[var(--bg)]">
            {/*
              Tinggi tetap, BUKAN `aspect-[3/2]`.

              Rasio menghasilkan tinggi pecahan — di lebar penuh sekitar
              114,67px per sel — dan celah `gap-px` 1px yang jatuh di batas
              subpiksel kadang hilang sama sekali saat dilukis. Akibatnya dua
              baris tampak menyatu jadi satu blok tinggi tanpa pemisah.

              Terukur di tangkapan produksi: garis pemisah ada di y=2958 dan
              y=3188 — berjarak 230px untuk baris setinggi 115px, jadi satu
              garis di antaranya memang tidak pernah tergambar.
            */}
            <div className="sel-logo flex h-28 items-center justify-center p-4">
              {/*
                Tanpa `sizes`, dan itu disengaja. Dengan `sizes`, Next
                memancarkan srcset penuh dari seluruh daftar deviceSizes untuk
                SETIAP gambar — 59 logo membuat HTML beranda melar dari 94 KB
                jadi 211 KB. Untuk gambar berukuran tetap sekecil ini, srcset
                1x/2x sudah cukup, dan itulah yang dipancarkan Next kalau
                `sizes` dihilangkan.
              */}
              <Image
                src={src}
                alt=""
                width={160}
                height={96}
                className="logo-mitra max-h-full w-auto object-contain"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

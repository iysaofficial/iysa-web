import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

import { PageHeader, Section, MoreLink, Pill } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { orgStructure, flattenPeople, type Person } from "@/lib/data";
import { photoUrl } from "@/lib/assets";
import { experts } from "@/content/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "team" });
  return pageMetadata({
    locale,
    path: "/tim",
    title: t("title"),
    description: t("lead"),
    og: {
      eyebrow: "IYSA",
      heading: t("title"),
      meta: t("people", { count: flattenPeople().length }),
    },
  });
}

/* ── Membaca bagan organisasi ───────────────────────────────────────────
 *
 * Versi sebelumnya menampilkan orang berdasarkan KEDALAMAN pohon: satu seksi
 * untuk tiap tingkat. Hasilnya tiga pita berturut-turut yang masing-masing
 * berisi SATU orang di kisi empat kolom — tiga perempat lebarnya kosong — lalu
 * satu kisi terakhir berisi empat belas staf dari tiga divisi berbeda,
 * tercampur tanpa penanda apa pun.
 *
 * Kedalaman pohon bukan informasi yang dicari pengunjung. Yang dicari: siapa
 * yang memimpin, dan siapa mengerjakan apa. Jadi bagannya dibaca ulang jadi
 * dua bentuk itu.
 */

/** Tiga tingkat teratas: pendiri, manajer umum, supervisor. */
function pimpinan(nodes: Person[]): Person[] {
  const out: Person[] = [];
  let kini = nodes;
  for (let i = 0; i < 3 && kini.length; i++) {
    out.push(...kini);
    kini = kini.flatMap((n) => n.children);
  }
  return out;
}

type Divisi = { nama: string; koordinator: Person | null; anggota: Person[] };

/**
 * Divisi = simpul di bawah supervisor. Yang punya anak jadi koordinator
 * divisinya; yang tidak punya anak berdiri sendiri sebagai divisi satu orang
 * (di bagan sekarang: IT).
 */
function divisiDari(nodes: Person[]): Divisi[] {
  let kini = nodes;
  for (let i = 0; i < 3 && kini.length; i++) kini = kini.flatMap((n) => n.children);

  return (
    kini
      .map((n) =>
        n.children.length
          ? { nama: namaDivisi(n.position), koordinator: n, anggota: n.children }
          : { nama: namaDivisi(n.position), koordinator: null, anggota: [n] },
      )
      /* Divisi terbesar lebih dulu. Di bagan sekarang IT hanya satu orang;
         tanpa pengurutan ia muncul mendahului divisi tujuh orang dan halaman
         dibuka oleh bloknya yang paling tipis. */
      .sort((a, b) => b.anggota.length - a.anggota.length)
  );
}

/**
 * Nama divisi diambil dari jabatan koordinatornya, bukan ditulis tangan:
 * "Administration Team Coordinator" → "Administration", "IT Staff" → "IT".
 * Dengan begitu bagan yang berubah tidak meninggalkan label basi di kode.
 */
function namaDivisi(jabatan: string) {
  return jabatan
    .replace(/\s*Team\s*Coordinator\s*$/i, "")
    .replace(/\s*Coordinator\s*$/i, "")
    .replace(/\s*Staff\s*$/i, "")
    .trim();
}

/* ── Kartu orang ────────────────────────────────────────────────────────
 *
 * Dua puluh dua orang, dua puluh dua foto studio berlatar seragam — aset yang
 * sebelumnya tidak dimanfaatkan. Semuanya dalam rasio yang sama, dengan
 * `object-top` supaya wajah tidak pernah terpotong berapa pun tinggi fotonya.
 */
function KartuOrang({
  person,
  ukuran = "biasa",
  label,
  ringkas = false,
}: {
  person: Person;
  ukuran?: "besar" | "sedang" | "biasa";
  label?: string;
  /** Tata letak mendatar untuk divisi satu orang: foto kecil, teks di sisinya. */
  ringkas?: boolean;
}) {
  const photo = photoUrl(person.photo);

  const namaKelas =
    ukuran === "besar"
      ? "text-title text-[var(--navy)]"
      : ukuran === "sedang"
        ? "text-[17px] font-semibold text-[var(--ink)]"
        : "text-[14.5px] font-semibold text-[var(--ink)]";

  if (ringkas) {
    return (
      <div className="group flex items-center gap-5">
        <div className="relative aspect-[4/5] w-[104px] shrink-0 overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
          {photo ? (
            <Image
              src={photo}
              alt={person.name}
              fill
              sizes="104px"
              className="object-cover object-top transition-transform duration-[var(--gerak-sedang)] group-hover:scale-[1.03]"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center font-mono text-[16px] text-[var(--ink-faint)]">
              {person.name
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </span>
          )}
        </div>
        <div>
          <p className="text-[17px] leading-snug font-semibold text-[var(--ink)]">{person.name}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-[var(--ink-faint)]">
            {person.position}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
        {photo ? (
          <Image
            src={photo}
            alt={person.name}
            fill
            sizes={
              ukuran === "besar"
                ? "(max-width: 768px) 90vw, 420px"
                : ukuran === "sedang"
                  ? "(max-width: 768px) 45vw, 260px"
                  : "(max-width: 640px) 45vw, 200px"
            }
            className="object-cover object-top transition-transform duration-[var(--gerak-sedang)] group-hover:scale-[1.03]"
          />
        ) : (
          // Sekarang semua orang berfoto, tapi penjaga tetap dipasang: satu
          // orang baru tanpa foto tidak boleh meninggalkan kotak kosong.
          <span className="absolute inset-0 grid place-items-center font-mono text-[22px] text-[var(--ink-faint)]">
            {person.name
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
        )}
      </div>

      <div>
        {label && (
          <span className="mb-1.5 inline-block">
            <Pill tone="teal">{label}</Pill>
          </span>
        )}
        <p className={`leading-snug ${namaKelas}`}>{person.name}</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--ink-faint)]">
          {person.position}
        </p>
      </div>
    </div>
  );
}

export default async function TeamPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("team");
  const bagan = orgStructure();
  const [pendiri, ...atasan] = pimpinan(bagan);
  const divisi = divisiDari(bagan);
  const total = flattenPeople().length;

  return (
    <>
      <PageHeader
        eyebrow="Tim"
        title={t("title")}
        lead={t("lead")}
        count={total}
        countLabel={t("people", { count: total })}
      />

      {/* ── Pimpinan ───────────────────────────────────────────────────
          Satu pita terkomposisi, bukan tiga pita berisi satu orang. Pendiri
          mengambil lima kolom dengan namanya dalam ukuran judul; dua atasan
          berikutnya berbagi sisanya. */}
      <Section eyebrow={t("leadershipEyebrow")} title={t("leadershipTitle")}>
        {/*
          Tiga kartu berukuran sama dalam satu baris.

          Percobaan pertama memberi pendiri lima kolom dan dua lainnya berbagi
          tujuh — hasilnya fotonya jauh lebih tinggi daripada dua tetangganya
          dan meninggalkan lubang kosong besar di kanan bawah. Penonjolan
          pendiri sekarang lewat ukuran namanya, bukan ukuran fotonya; barisnya
          jadi rata dan terbaca sebagai satu kesatuan.
        */}
        {/* Dua kolom di ponsel, bukan satu. Selebar layar, tiap foto jadi
            ~460px tinggi dan tiga di antaranya memenuhi hampir dua layar penuh
            sebelum divisi pertama terlihat. */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:gap-10">
          {pendiri && <KartuOrang person={pendiri} ukuran="besar" />}
          {atasan.map((p) => (
            <KartuOrang key={`${p.name}-${p.position}`} person={p} ukuran="sedang" />
          ))}
        </div>
      </Section>

      {/* ── Divisi ─────────────────────────────────────────────────────
          Tiap divisi jadi bloknya sendiri: koordinator ditonjolkan di kiri,
          anggotanya di kanan, dengan jumlah anggota sebagai angka mono besar.
          Sebelumnya keempat belas staf ini tercampur dalam satu kisi tanpa
          penanda divisi sama sekali. */}
      {divisi.map((d, i) => (
        <Section key={d.nama} sunk={i % 2 === 0}>
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{t("divisionsEyebrow")}</p>
              <h2 className="mt-2 text-title text-[var(--ink)]">{d.nama}</h2>
            </div>
            {/* Angkanya sekali saja. Percobaan pertama memasangkan angka mono
                besar DENGAN `t("members", {count})` yang sudah memuat angka
                itu juga — di layar terbaca "7  7 anggota". */}
            <p className="tnum font-mono text-[30px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)] md:text-[38px]">
              {d.anggota.length}
              <span className="ml-2.5 font-sans text-[13px] font-normal text-[var(--ink-faint)]">
                {t("membersWord")}
              </span>
            </p>
          </div>

          {/*
            Divisi satu orang tidak diberi kisi selebar halaman.

            Zaidan sendirian di divisi IT; dengan tata letak yang sama seperti
            divisi tujuh orang, lima per enam barisnya kosong — persis cacat
            yang seksi ini ada untuk memperbaiki. Jadi divisi sekecil itu
            dirender mendatar: foto kecil di kiri, nama dan jabatan di kanan.
          */}
          {d.anggota.length === 1 && !d.koordinator ? (
            <KartuOrang person={d.anggota[0]} ringkas />
          ) : (
            <div className="grid gap-8 md:grid-cols-12 md:gap-10">
              {d.koordinator && (
                // Di ponsel dibatasi separuh lebar supaya sebanding dengan
                // kartu anggota di bawahnya; selebar layar ia jadi dua kali
                // lebih besar dan hierarkinya berubah jadi teriakan.
                <div className="w-1/2 pr-3 md:col-span-3 md:w-auto md:pr-0">
                  <KartuOrang person={d.koordinator} ukuran="sedang" label={t("coordinator")} />
                </div>
              )}
              <ul
                className={`rise-stagger grid grid-cols-2 gap-6 sm:grid-cols-3 ${
                  d.koordinator ? "md:col-span-9 lg:grid-cols-4" : "md:col-span-12 lg:grid-cols-6"
                }`}
              >
                {d.anggota.map((p) => (
                  <li key={`${p.name}-${p.position}`}>
                    <KartuOrang person={p} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      ))}

      <Section eyebrow={t("expertTitle")} title={t("expertTitle")}>
        <p className="max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--ink-muted)]">
          {experts[locale]}
        </p>
        <div className="mt-5">
          <MoreLink href="/tim/ahli">{t("expertTitle")}</MoreLink>
        </div>
      </Section>
    </>
  );
}

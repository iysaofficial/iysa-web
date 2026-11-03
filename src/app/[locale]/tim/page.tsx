import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

import { PageHeader, Section, MoreLink, Pill } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { orgStructure, flattenPeople, type Person } from "@/lib/data";
import { photoUrl } from "@/lib/assets";
import { FotoOrang } from "@/components/foto-orang";
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

type Divisi = { kunci: string; koordinator: Person; anggota: Person[] };

/**
 * Divisi = simpul di bawah supervisor. Setiap simpul mengepalai divisinya
 * (koordinator/penanggung jawab divisi) dan ditempatkan di kartu utama kiri
 * dengan ukuran dan struktur yang seragam, termasuk divisi satu orang (IT).
 */
function divisiDari(nodes: Person[]): Divisi[] {
  let kini = nodes;
  for (let i = 0; i < 3 && kini.length; i++) kini = kini.flatMap((n) => n.children);

  return kini
    .map((n) => ({
      kunci: namaDivisi(n.position),
      koordinator: n,
      anggota: n.children,
    }))
    .sort((a, b) => b.anggota.length - a.anggota.length);
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

const NAMA_DIVISI_TERJEMAHAN: Record<string, { id: string; en: string }> = {
  Administration: { id: "Administrasi", en: "Administration" },
  "Promotion & Publication": { id: "Promosi & Publikasi", en: "Promotion & Publication" },
  "Research and Development": { id: "Riset & Pengembangan", en: "Research & Development" },
  IT: { id: "IT", en: "IT" },
};

function terjemahDivisi(kunci: string, locale: Locale): string {
  return NAMA_DIVISI_TERJEMAHAN[kunci]?.[locale] ?? kunci;
}

const JABATAN_TERJEMAHAN: Record<string, { id: string; en: string }> = {
  "Founder & Owner": { id: "Pendiri & Pemilik", en: "Founder & Owner" },
  "General Manager": { id: "Manajer Umum", en: "General Manager" },
  Supervisor: { id: "Supervisor", en: "Supervisor" },
  "Administration Team Coordinator": {
    id: "Koordinator Tim Administrasi",
    en: "Administration Team Coordinator",
  },
  "Administration Staff": { id: "Staf Administrasi", en: "Administration Staff" },
  "Promotion & Publication Team Coordinator": {
    id: "Koordinator Tim Promosi & Publikasi",
    en: "Promotion & Publication Team Coordinator",
  },
  "Promotion & Publication Staff": {
    id: "Staf Promosi & Publikasi",
    en: "Promotion & Publication Staff",
  },
  "Research and Development Team Coordinator": {
    id: "Koordinator Tim Riset & Pengembangan",
    en: "Research & Development Team Coordinator",
  },
  "Research and Development Staff": {
    id: "Staf Riset & Pengembangan",
    en: "Research & Development Staff",
  },
  "IT Staff": { id: "Staf IT", en: "IT Staff" },
};

function terjemahJabatan(jabatan: string, locale: Locale): string {
  return JABATAN_TERJEMAHAN[jabatan.trim()]?.[locale] ?? jabatan;
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
  idKartu,
  locale,
}: {
  person: Person;
  ukuran?: "besar" | "sedang" | "biasa";
  label?: string;
  idKartu: string;
  locale: Locale;
}) {
  /* Disaring lewat photoUrl dulu: berkas yang tidak ada di repo lama
     mengembalikan null, dan bingkai kosong lebih buruk daripada bingkai yang
     tidak pernah dipasang. */
  const semuaFoto = person.photos
    .map((p) => photoUrl(p))
    .filter((u): u is string => Boolean(u));

  const namaKelas =
    ukuran === "besar"
      ? "text-title text-[var(--navy)]"
      : ukuran === "sedang"
        ? "text-[17px] font-semibold text-[var(--ink)]"
        : "text-[14.5px] font-semibold text-[var(--ink)]";

  return (
    <div className="group flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden border border-[var(--line)] bg-[var(--bg-sunk)]">
        <FotoOrang
          nama={person.name}
          urls={semuaFoto}
          id={idKartu}
          sizes={
            ukuran === "besar"
              ? "(max-width: 768px) 90vw, 420px"
              : ukuran === "sedang"
                ? "(max-width: 768px) 45vw, 260px"
                : "(max-width: 640px) 45vw, 200px"
          }
          lebarBingkai={ukuran === "biasa" ? "w-8 sm:w-9" : "w-9 sm:w-11"}
        />
      </div>

      <div>
        {label && (
          <span className="mb-1.5 inline-block">
            <Pill tone="teal">{label}</Pill>
          </span>
        )}
        <p className={`leading-snug ${namaKelas}`}>{person.name}</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--ink-faint)]">
          {terjemahJabatan(person.position, locale)}
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
        eyebrow={t("title")}
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
          {pendiri && (
            <KartuOrang
              person={pendiri}
              ukuran="besar"
              idKartu="pimpinan-pendiri"
              locale={locale}
            />
          )}
          {atasan.map((p, idx) => (
            <KartuOrang
              key={`${p.name}-${p.position}`}
              person={p}
              ukuran="sedang"
              idKartu={`pimpinan-${idx}`}
              locale={locale}
            />
          ))}
        </div>
      </Section>

      {/* ── Divisi ─────────────────────────────────────────────────────
          Tiap divisi jadi bloknya sendiri: koordinator ditonjolkan di kiri,
          anggotanya di kanan, dengan jumlah anggota sebagai angka mono besar.
          Sebelumnya keempat belas staf ini tercampur dalam satu kisi tanpa
          penanda divisi sama sekali. */}
      {divisi.map((d, i) => {
        const jumlahOrang = 1 + d.anggota.length;
        const idDivisi = d.kunci.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return (
          <Section key={d.kunci} sunk={i % 2 === 0}>
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{t("divisionsEyebrow")}</p>
                <h2 className="mt-2 text-title text-[var(--ink)]">
                  {terjemahDivisi(d.kunci, locale)}
                </h2>
              </div>
              <p className="tnum font-mono text-[30px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)] md:text-[38px]">
                {jumlahOrang}
                <span className="ml-2.5 font-sans text-[13px] font-normal text-[var(--ink-faint)]">
                  {jumlahOrang === 1 ? t("memberOne") : t("membersWord")}
                </span>
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-12 md:gap-10">
              <div className="w-1/2 pr-3 md:col-span-3 md:w-auto md:pr-0">
                <KartuOrang
                  person={d.koordinator}
                  ukuran="sedang"
                  label={t("coordinator")}
                  idKartu={`koord-${idDivisi}`}
                  locale={locale}
                />
              </div>
              {d.anggota.length > 0 && (
                <ul className="rise-stagger grid grid-cols-2 gap-6 sm:grid-cols-3 md:col-span-9 lg:grid-cols-4">
                  {d.anggota.map((p, idx) => (
                    <li key={`${p.name}-${p.position}`}>
                      <KartuOrang
                        person={p}
                        idKartu={`anggota-${idDivisi}-${idx}`}
                        locale={locale}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>
        );
      })}

      <Section eyebrow={t("expertEyebrow")} title={t("expertTitle")}>
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

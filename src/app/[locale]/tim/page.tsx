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
  "Promotion and Publication": { id: "Promosi & Publikasi", en: "Promotion & Publication" },
  "Research & Development": { id: "Riset & Pengembangan", en: "Research & Development" },
  "Research and Development": { id: "Riset & Pengembangan", en: "Research & Development" },
  IT: { id: "IT", en: "IT" },
};

function terjemahDivisi(kunci: string, locale: Locale): string {
  return NAMA_DIVISI_TERJEMAHAN[kunci]?.[locale] ?? kunci;
}

const JABATAN_TERJEMAHAN: Record<string, { id: string; en: string }> = {
  "Owner & Founder": { id: "Pendiri & Pemilik", en: "Owner & Founder" },
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
  "Promotion and Publication Team Coordinator": {
    id: "Koordinator Tim Promosi & Publikasi",
    en: "Promotion & Publication Team Coordinator",
  },
  "Promotion & Publication Staff": {
    id: "Staf Promosi & Publikasi",
    en: "Promotion & Publication Staff",
  },
  "Promotion and Publication Staff": {
    id: "Staf Promosi & Publikasi",
    en: "Promotion & Publication Staff",
  },
  "Research & Development Team Coordinator": {
    id: "Koordinator Tim Riset & Pengembangan",
    en: "Research & Development Team Coordinator",
  },
  "Research and Development Team Coordinator": {
    id: "Koordinator Tim Riset & Pengembangan",
    en: "Research & Development Team Coordinator",
  },
  "Research & Development Staff": {
    id: "Staf Riset & Pengembangan",
    en: "Research & Development Staff",
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

/* ── Kartu orang (Tata Letak Hybrid) ────────────────────────────────────
 *
 * Menggabungkan keunggulan editorial grid situs baru dengan hierarki visual
 * jelas antara Pimpinan/Koordinator dan Staf:
 * - Pimpinan, Koordinator Divisi, dan IT tampil dalam kartu TEGAK (potret 4:5)
 *   di sebelah kiri dengan lencana peran.
 * - Staf divisi tampil dalam kartu MENDATAR (foto di kiri, nama & jabatan di
 *   kanan) dalam kisi 2 kolom di sebelah kanan, sehingga hierarki langsung
 *   terbaca dan ruang kanan terisi seimbang.
 * - Seluruh bingkai foto diberi gradasi studio halus berbasis `--navy` agar
 *   aset foto PNG transparan tampil hidup baik di tema terang maupun gelap.
 */

const LATAR_STUDIO =
  "bg-[var(--bg-sunk)] bg-gradient-to-b from-[var(--navy)]/[0.06] to-[var(--navy)]/[0.18]";

function KartuOrang({
  person,
  ukuran = "biasa",
  orientasi = "tegak",
  label,
  nadaLabel = "teal",
  idKartu,
  locale,
}: {
  person: Person;
  ukuran?: "besar" | "sedang" | "biasa";
  orientasi?: "tegak" | "mendatar";
  label?: string;
  nadaLabel?: "teal" | "navy";
  idKartu: string;
  locale: Locale;
}) {
  /* Disaring lewat photoUrl dulu: berkas yang tidak ada di repo lama
     mengembalikan null, dan bingkai kosong lebih buruk daripada bingkai yang
     tidak pernah dipasang. */
  const semuaFoto = person.photos
    .map((p) => photoUrl(p))
    .filter((u): u is string => Boolean(u));

  if (orientasi === "mendatar") {
    return (
      <div className="group flex h-full items-stretch border border-[var(--line)] bg-[var(--bg)] transition-colors duration-[var(--gerak-cepat)] hover:border-[var(--border)]">
        <div
          className={`relative aspect-[4/5] w-[112px] shrink-0 overflow-hidden border-r border-[var(--line)] sm:w-[132px] ${LATAR_STUDIO}`}
        >
          <FotoOrang
            nama={person.name}
            urls={semuaFoto}
            id={idKartu}
            sizes="(max-width: 640px) 112px, 132px"
            posisiIndikator="top-2 left-2"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3.5 sm:px-5 sm:py-4">
          {label && (
            <span className="mb-1.5 inline-block">
              <Pill tone={nadaLabel}>{label}</Pill>
            </span>
          )}
          <p className="text-[15.5px] leading-snug font-semibold text-[var(--ink)] transition-colors duration-[var(--gerak-cepat)] group-hover:text-[var(--navy)] sm:text-[16.5px]">
            {person.name}
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-[var(--ink-muted)] sm:text-[13px]">
            {terjemahJabatan(person.position, locale)}
          </p>
        </div>
      </div>
    );
  }

  const namaKelas =
    ukuran === "besar"
      ? "text-[18px] sm:text-[20px] font-bold text-[var(--navy)]"
      : ukuran === "sedang"
        ? "text-[16.5px] sm:text-[17.5px] font-semibold text-[var(--ink)]"
        : "text-[15px] font-semibold text-[var(--ink)]";

  return (
    <div className="group flex h-full flex-col border border-[var(--line)] bg-[var(--bg)] transition-colors duration-[var(--gerak-cepat)] hover:border-[var(--border)]">
      <div
        className={`relative aspect-[4/5] overflow-hidden border-b border-[var(--line)] ${LATAR_STUDIO}`}
      >
        <FotoOrang
          nama={person.name}
          urls={semuaFoto}
          id={idKartu}
          sizes={
            ukuran === "besar"
              ? "(max-width: 768px) 90vw, 380px"
              : ukuran === "sedang"
                ? "(max-width: 768px) 60vw, 280px"
                : "(max-width: 640px) 45vw, 200px"
          }
          posisiIndikator="top-2.5 right-2.5"
        />
      </div>

      <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
        {label && (
          <span className="mb-2 inline-block">
            <Pill tone={nadaLabel}>{label}</Pill>
          </span>
        )}
        <p className={`leading-snug ${namaKelas}`}>{person.name}</p>
        <p className="mt-1 text-[12.5px] leading-snug text-[var(--ink-muted)] sm:text-[13px]">
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

      {/* ── Pimpinan ─────────────────────────────────────────────────── */}
      <Section eyebrow={t("leadershipEyebrow")} title={t("leadershipTitle")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-8">
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

      {/* ── Divisi (Hybrid: Koordinator/IT Vertikal di Kiri, Staf Horizontal 2 Kolom di Kanan) ── */}
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

            <div className="grid items-start gap-6 md:grid-cols-12 md:gap-8">
              <div className="w-full max-w-[260px] md:col-span-4 md:max-w-none lg:col-span-3">
                <KartuOrang
                  person={d.koordinator}
                  ukuran="sedang"
                  orientasi="tegak"
                  label={
                    /coordinator/i.test(d.koordinator.position) || d.anggota.length > 0
                      ? t("coordinator")
                      : undefined
                  }
                  nadaLabel="teal"
                  idKartu={`koord-${idDivisi}`}
                  locale={locale}
                />
              </div>
              {d.anggota.length > 0 && (
                <ul className="rise-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-8 lg:col-span-9 lg:gap-5">
                  {d.anggota.map((p, idx) => (
                    <li key={`${p.name}-${p.position}`}>
                      <KartuOrang
                        person={p}
                        orientasi="mendatar"
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

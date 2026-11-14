import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { AngkaNaik } from "./angka-naik";

/* ── kerangka halaman ──────────────────────────────────────────────── */

/**
 * Kepala halaman.
 *
 * ── Kenapa serapat ini ───────────────────────────────────────────────────
 *
 * Versi sebelumnya judul berukuran `display` dengan jarak `py-20` dan
 * ringkasan `text-lead` — satu pita setinggi 330px sebelum isi halaman
 * dimulai. Di halaman daftar akibatnya fatal: di layar laptop 1280×820,
 * kartu event pertama berada di y=912, yaitu halaman daftar yang tidak
 * memperlihatkan satu pun daftarnya sampai digulir.
 *
 * Sekarang semuanya satu baris kisi: judul kiri, angka kanan, jarak `py-10`.
 * Judulnya turun ke ukuran `title` — navigasi di atasnya sudah menyebut nama
 * halaman, jadi judul sebesar hero mengulang informasi yang sudah ada sambil
 * membayar ruang paling mahal di layar.
 *
 * ── Kenapa angkanya prop, bukan JSX bebas ────────────────────────────────
 *
 * Tujuh halaman dulu menulis sendiri blok "angka besar + keterangan kecil"
 * dengan markah yang disalin satu sama lain. Begitu salinan bercabang,
 * ukurannya berbeda tipis antar halaman tanpa ada yang berniat begitu. Di sini
 * ia satu prop, jadi tidak bisa lagi berbeda.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  count,
  countLabel,
  aside,
  bawah,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** Angka besar di kanan — jumlah event, edisi, terbitan, orang. */
  count?: string | number;
  countLabel?: string;
  /** Isi tambahan di kolom kanan, mis. deretan tahun untuk melompat. */
  aside?: ReactNode;
  /** Pita di bawah judul, di dalam kotak yang sama — dipakai saringan. */
  bawah?: ReactNode;
}) {
  const adaKanan = count !== undefined || Boolean(aside);

  return (
    <header className="border-b border-[var(--line)]">
      <div className="shell py-8 md:py-10">
        <div className="grid gap-x-10 gap-y-4 md:grid-cols-12 md:items-end">
          <div className={adaKanan ? "md:col-span-8" : "md:col-span-12"}>
            {eyebrow && <p className="eyebrow rise">{eyebrow}</p>}
            <h1 className="rise mt-1.5 font-serif text-title text-[var(--navy)]">{title}</h1>
            {lead && (
              <p className="rise mt-3 max-w-[62ch] font-sans text-[15px] leading-relaxed text-[var(--ink-muted)]">
                {lead}
              </p>
            )}
          </div>

          {adaKanan && (
            <div className="md:col-span-4 md:text-right">
              {count !== undefined && (
                <>
                  <p className="tnum font-serif text-[28px] leading-none font-bold tracking-[-0.02em] text-[var(--navy)]">
                    {count}
                  </p>
                  {countLabel && (
                    <p className="mt-1.5 text-[12.5px] text-[var(--ink-faint)]">{countLabel}</p>
                  )}
                </>
              )}
              {aside && <div className={count !== undefined ? "mt-3" : ""}>{aside}</div>}
            </div>
          )}
        </div>

        {bawah && <div className="mt-6 border-t border-[var(--line)] pt-5">{bawah}</div>}
      </div>
    </header>
  );
}

export function Section({
  eyebrow,
  title,
  lead,
  children,
  sunk = false,
  action,
  padat = false,
}: {
  eyebrow?: string;
  title?: string;
  lead?: string;
  children: ReactNode;
  sunk?: boolean;
  action?: ReactNode;
  /**
   * Pangkas jarak atas. Dipakai untuk seksi PERTAMA sebuah halaman daftar,
   * yang berdiri tepat di bawah kepala halaman dan saringannya: dengan jarak
   * penuh, baris data pertama terdorong ke bawah lipatan dan pengunjung harus
   * menggulir dulu sebelum melihat isi yang ia datangi.
   */
  padat?: boolean;
}) {
  return (
    <section className={sunk ? "border-y border-[var(--line)] bg-[var(--bg-sunk)]" : ""}>
      <div className={`shell pb-14 md:pb-20 ${padat ? "pt-8 md:pt-10" : "pt-14 md:pt-20"}`}>
        {(eyebrow || title) && (
          <div className={`flex flex-wrap items-end justify-between gap-4 ${padat ? "mb-6" : "mb-10"}`}>
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h2 className="mt-2 font-serif text-title text-[var(--ink)]">{title}</h2>}
              {lead && <p className="mt-3 max-w-[56ch] font-sans text-[var(--ink-muted)]">{lead}</p>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/* ── tombol & tautan ───────────────────────────────────────────────── */

type ButtonTone = "primary" | "navy" | "outline";

const toneClass: Record<ButtonTone, string> = {
  // coral: satu per layar
  primary: "bg-[var(--coral)] text-[var(--on-coral)] hover:opacity-90",
  navy: "bg-[var(--navy)] text-[var(--on-navy)] hover:opacity-90",
  outline:
    "border border-[var(--border)] text-[var(--ink)] hover:border-[var(--teal)] hover:text-[var(--teal)]",
};

export function ButtonLink({
  href,
  children,
  tone = "navy",
  external,
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: ButtonTone;
  external?: boolean;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14.5px] font-semibold transition-all duration-[var(--gerak-cepat)] ${toneClass[tone]} ${className}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
        <span aria-hidden className="text-[12px]">
          ↗
        </span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Tautan "semua X" di kanan judul seksi. */
export function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--teal)]"
    >
      {children}
      <span
        aria-hidden
        className="transition-transform duration-[var(--gerak-cepat)] group-hover:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--ink-muted)] transition-colors duration-[var(--gerak-cepat)] hover:text-[var(--teal)]"
    >
      <span aria-hidden className="transition-transform duration-[var(--gerak-cepat)] group-hover:-translate-x-0.5">
        ←
      </span>
      {children}
    </Link>
  );
}

/* ── penanda ───────────────────────────────────────────────────────── */

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "teal" | "coral" | "navy";
}) {
  const map = {
    neutral: "border-[var(--border)] text-[var(--ink-muted)]",
    teal: "border-[var(--teal)]/45 text-[var(--teal)]",
    coral: "border-[var(--coral)]/45 text-[var(--coral)]",
    navy: "border-[var(--navy)]/40 text-[var(--navy)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-[10.5px] font-bold tracking-[0.07em] uppercase ${map[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * Angka besar editorial (Georgia). Salah satu dari dua sumber "keberanian" di
 * situs ini — yang lain skala tipografi judul. Tidak ada gradien, tidak ada
 * elemen terbang.
 */
export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-[var(--line)] pt-4">
      <span className="tnum font-serif text-[30px] leading-none font-bold tracking-[-0.02em] text-[var(--navy)] md:text-[38px]">
        {/* Angka aslinya tetap dirender di server; AngkaNaik hanya mengambil
            alih kalau elemennya masuk layar dari luar. Tanpa JavaScript,
            yang tampil tetap angka yang benar. */}
        <AngkaNaik nilai={value} />
      </span>
      <span className="text-[13px] leading-snug text-[var(--ink-faint)]">{label}</span>
    </div>
  );
}

export function StatRow({ items }: { items: { value: string | number; label: string }[] }) {
  return (
    <div
      className="rise-stagger grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-6"
    >
      {items.map((s) => (
        <Stat key={s.label} value={s.value} label={s.label} />
      ))}
    </div>
  );
}

/** Baris definisi untuk halaman detail. */
export function DefList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex flex-col">
      {items.map((i) => (
        <div
          key={i.label}
          className="grid grid-cols-1 gap-1 border-b border-[var(--line)] py-3.5 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4"
        >
          <dt className="eyebrow pt-0.5">{i.label}</dt>
          <dd className="text-[15.5px] text-[var(--ink)]">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 border border-dashed border-[var(--border)] px-6 py-12 text-center sm:items-center">
      <p className="text-[var(--ink-muted)]">{title}</p>
      {action}
    </div>
  );
}

/**
 * Sel kosong penutup baris terakhir sebuah kisi garis rambut.
 *
 * Kisi di situs ini menggambar garisnya dengan `gap-px` di atas wadah yang
 * berlatar warna garis. Trik itu rapi selama tiap baris penuh — begitu baris
 * terakhir kurang satu-dua sel, yang tampak bukan ruang kosong melainkan
 * KOTAK berwarna garis di sebelah kartu terakhir, seolah ada kartu yang gagal
 * dimuat.
 *
 * Pengisi ini menambal sisa baris dengan latar halaman. Jumlahnya beda per
 * titik henti, jadi dua himpunan disiapkan dan masing-masing hanya tampil di
 * lebar yang membutuhkannya.
 */
export function SelPengisi({
  jumlah,
  kolom,
  tampak,
  as: Tag = "li",
}: {
  jumlah: number;
  kolom: 2 | 3 | 4 | 6;
  tampak?: string;
  as?: "li" | "div";
}) {
  const sisa = (kolom - (jumlah % kolom)) % kolom;
  if (sisa === 0) return null;
  const kelasTampak =
    tampak ?? (kolom === 2 ? "hidden sm:block lg:hidden" : "hidden lg:block");
  return (
    <>
      {Array.from({ length: sisa }).map((_, i) => (
        <Tag
          key={`pengisi-${kolom}-${i}`}
          aria-hidden
          className={`bg-[var(--bg)] ${kelasTampak}`}
        />
      ))}
    </>
  );
}

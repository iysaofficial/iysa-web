import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { AngkaNaik } from "./angka-naik";

/* ── kerangka halaman ──────────────────────────────────────────────── */

/**
 * Kepala halaman. Grid asimetris: judul kiri berat, metadata kanan —
 * bukan semuanya di tengah seperti situs lama, yang membuat tiap halaman
 * terlihat sama dan tidak memberi mata tempat berpijak.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  aside,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="border-b border-[var(--line)]">
      <div className="shell py-14 md:py-20">
        <div className="grid gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-8">
            {eyebrow && <p className="eyebrow rise">{eyebrow}</p>}
            <h1 className="rise mt-3 text-display text-[var(--navy)]">{title}</h1>
            {lead && (
              <p className="rise mt-5 max-w-[56ch] text-lead text-[var(--ink-muted)]">{lead}</p>
            )}
          </div>
          {aside && <div className="md:col-span-4 md:pt-10">{aside}</div>}
        </div>
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
}: {
  eyebrow?: string;
  title?: string;
  lead?: string;
  children: ReactNode;
  sunk?: boolean;
  action?: ReactNode;
}) {
  return (
    <section className={sunk ? "border-y border-[var(--line)] bg-[var(--bg-sunk)]" : ""}>
      <div className="shell py-14 md:py-20">
        {(eyebrow || title) && (
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h2 className="mt-2 text-title text-[var(--ink)]">{title}</h2>}
              {lead && <p className="mt-3 max-w-[56ch] text-[var(--ink-muted)]">{lead}</p>}
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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.07em] uppercase ${map[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * Angka besar mono. Salah satu dari dua sumber "keberanian" di situs ini —
 * yang lain skala tipografi judul. Tidak ada gradien, tidak ada elemen terbang.
 */
export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-[var(--line)] pt-4">
      <span className="tnum font-mono text-[30px] leading-none font-medium tracking-[-0.03em] text-[var(--navy)] md:text-[38px]">
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
      data-reveal
      className="rise-stagger grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-5"
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

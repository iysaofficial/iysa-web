import { Link } from "@/i18n/navigation";

/** Kepala halaman galeri: judul + tab Foto / Video. */
export function GaleriKepala({
  judul, aktif, label,
}: {
  judul: string;
  aktif: "foto" | "video";
  label: { eyebrow: string; foto: string; video: string };
}) {
  const tab = (k: "foto" | "video", teks: string) => (
    <Link href={`/galeri/${k}`} aria-current={aktif === k ? "page" : undefined}
      className={`rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors ${
        aktif === k ? "bg-[var(--navy)] text-[var(--on-navy)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
      }`}>
      {teks}
    </Link>
  );
  return (
    <header className="border-b border-[var(--line)]">
      <div className="shell flex flex-col gap-4 py-8 md:flex-row md:items-end md:justify-between md:py-10">
        <div>
          <p className="eyebrow">{label.eyebrow}</p>
          <h1 className="mt-1.5 text-title text-[var(--navy)]">{judul}</h1>
        </div>
        <nav className="flex w-fit gap-1 rounded-full border border-[var(--border)] p-1">
          {tab("foto", label.foto)}
          {tab("video", label.video)}
        </nav>
      </div>
    </header>
  );
}

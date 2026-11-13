import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { PageHeader, Section, SelPengisi, EmptyState } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { curation, curationLabels, ptkDocuments, ptkDocumentLabels } from "@/content/external";
import { semuaSeriKurasi, adaCatatan, ringkasEdisi, WARNA_NADA, tanggalKurasi } from "@/lib/kurasi";

export const revalidate = 900;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "curation" });
  return pageMetadata({ locale, path: "/kurasi", title: t("title"), description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title") } });
}

export default async function CurationPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("curation");

  const seri = await semuaSeriKurasi();

  return (
    <>
      <PageHeader eyebrow="Puspresnas" title={t("title")} lead={t("lead")}
        count={seri.length || undefined} countLabel={seri.length ? t("seriesCount", { count: seri.length }) : undefined} />

      {/* Proses kurasi per ajang — dari dasbor (kurasi_progres). */}
      <Section eyebrow={t("seriesEyebrow")} title={t("seriesTitle")} lead={t("seriesLead")} padat>
        {seri.length === 0 ? (
          <EmptyState title={t("unavailable")} />
        ) : (
          <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {seri.map((s) => {
              const terbaru = s.edisi.find(adaCatatan);
              const r = terbaru ? ringkasEdisi(terbaru) : null;
              const k = r?.terakhir;
              return (
                <li key={s.slug} className="bg-[var(--bg)]">
                  <Link href={`/kurasi/${s.slug}`}
                    className="group flex h-full flex-col gap-5 p-6 transition-colors duration-[var(--gerak-cepat)] hover:bg-[var(--bg-sunk)]">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 shrink-0">
                        {s.logo && <Image src={s.logo} alt="" fill sizes="48px" className="object-contain" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-[12px] tracking-wide text-[var(--ink-faint)]">{s.akronim}</p>
                        <p className="text-[15.5px] leading-snug font-semibold text-[var(--ink)] group-hover:text-[var(--navy)]">{s.nama}</p>
                      </div>
                    </div>
                    {terbaru && k && (
                      <div className="mt-auto text-[13px]">
                        <p className="text-[var(--ink-faint)]">{t("latestStatus")} · {t("edition", { tahun: terbaru.tahun })}</p>
                        <p className="mt-1 leading-snug text-[var(--ink)]">
                          <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: WARNA_NADA[k.nada] }} />
                          {k.label}{k.status ? ` — ${k.status}` : ""}
                        </p>
                        {k.terjadi_pada && <p className="tnum mt-0.5 text-[var(--ink-muted)]">{tanggalKurasi(k.terjadi_pada, locale)}</p>}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {s.edisi.map((e) => (
                        <span key={e.tahun} className="tnum rounded-full border border-[var(--border)] px-2.5 py-0.5 font-mono text-[11.5px] text-[var(--ink-muted)]">{e.tahun}</span>
                      ))}
                    </div>
                  </Link>
                </li>
              );
            })}
            <SelPengisi jumlah={seri.length} kolom={2} />
            <SelPengisi jumlah={seri.length} kolom={3} />
          </ul>
        )}
      </Section>

      <Section eyebrow={t("archiveTitle")}>
        <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {curation.folders.map((f) => (
            <li key={f.key} className="bg-[var(--bg)]">
              <a href={f.url} target="_blank" rel="noreferrer"
                 className="group flex h-full flex-col justify-between gap-8 p-7 transition-colors duration-[var(--gerak-cepat)] hover:bg-[var(--bg-sunk)]">
                <span className="text-[16.5px] leading-snug font-semibold text-[var(--ink)] group-hover:text-[var(--navy)]">
                  {curationLabels[f.key]?.[locale] ?? f.key}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--teal)]">
                  {t("openFolder")}
                  <span aria-hidden className="transition-transform duration-[var(--gerak-cepat)] group-hover:translate-x-0.5">↗</span>
                </span>
              </a>
            </li>
          ))}
          <SelPengisi jumlah={curation.folders.length} kolom={2} />
          <SelPengisi jumlah={curation.folders.length} kolom={3} />
        </ul>

        {/* Dokumen resmi Lomba Invensi & PTK.
            Di situs lama keduanya hanya ada di dropdown navbar "Event Info",
            yang tidak ikut pindah — jadi sejak penulisan ulang, dua berkas ini
            tidak bisa dijangkau dari mana pun. Tempatnya di sini: halaman ini
            memang halaman dokumen resmi. */}
        <div className="mt-10 border-t border-[var(--line)] pt-8">
          <h2 className="eyebrow">{t("documentsTitle")}</h2>
          <ul className="mt-4 flex flex-col">
            {ptkDocuments.map((d) => (
              <li key={d.key} className="border-b border-[var(--line)] last:border-0">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
                >
                  <span className="text-[15.5px] leading-snug font-medium text-[var(--ink)] transition-colors duration-[var(--gerak-cepat)] group-hover:text-[var(--teal)]">
                    {ptkDocumentLabels[d.key]?.[locale] ?? d.key}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tnum font-mono text-[13px] text-[var(--ink-faint)]">
                      {d.year}
                    </span>
                    <span
                      aria-hidden
                      className="text-[12px] text-[var(--teal)] transition-transform duration-[var(--gerak-cepat)] group-hover:translate-x-0.5"
                    >
                      ↗
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* curation.pdf sengaja null: berkas yang ditautkan situs lama
            (Kurasi.pdf) tidak pernah ada di repo, jadi tombolnya selama ini
            mengarah ke 404. Tidak dipasang lagi sampai berkasnya ada. */}
        {curation.pdf && (
          <div className="mt-8">
            <a href={curation.pdf} target="_blank" rel="noreferrer"
               className="text-[14.5px] font-medium text-[var(--teal)] underline decoration-1 underline-offset-2">
              {t("openDocument")}
            </a>
          </div>
        )}
      </Section>
    </>
  );
}

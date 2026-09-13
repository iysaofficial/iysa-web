import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

import { PageHeader, EmptyState, MoreLink, Section, SelPengisi } from "@/components/ui";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { SeriKartu } from "@/components/seri-kartu";
import { pageMetadata } from "@/lib/seo";
import { filterEvents, eventFacets, allEvents, type EventLevel, type EventMode } from "@/lib/data";
import { statusEvent, waktuEvent, kelompokkanSeri } from "@/lib/event-seri";
import { ambilSemuaSeriDashboard } from "@/lib/dashboard-event";
import { EdisiDashboardKartu } from "@/components/edisi-dashboard-kartu";

type Search = { level?: string; mode?: string; q?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "events" });
  return pageMetadata({
    locale,
    path: "/event",
    title: t("title"),
    description: t("lead"),
    og: { eyebrow: "IYSA", heading: t("title"), meta: t("count", { count: allEvents().length }) },
  });
}

const isLevel = (v?: string): v is EventLevel => v === "national" || v === "international";
const isMode = (v?: string): v is EventMode =>
  v === "online" || v === "onsite" || v === "hybrid";

/**
 * Halaman event.
 *
 * ── Kenapa susunannya begini ─────────────────────────────────────────────
 *
 * Versi sebelumnya: 66 kartu dalam satu kisi rata, diurutkan menurut ID
 * internal, sehingga event 2024 dan 2026 berselang-seling. Tidak ada cara
 * menjawab dua pertanyaan yang paling sering dibawa pengunjung — "apa yang
 * bisa saya ikuti sekarang?" dan "seri ini sudah jalan berapa kali?"
 *
 * Sekarang halaman menjawab keduanya berurutan:
 *
 *   1. Pendaftaran terbuka — dihitung dari tanggal, bukan ditandai tangan
 *   2. Akan datang         — sudah terjadwal tapi pendaftarannya tidak buka
 *   3. Semua seri          — 45 seri, tiap edisinya berjejer dari yang terbaru
 *
 * Tidak ada yang disembunyikan: seluruh 66 edisi tetap tampil, termasuk yang
 * sudah lama selesai. Yang berubah cuma urutannya jadi punya arti.
 *
 * ── Saat saringan aktif ──────────────────────────────────────────────────
 *
 * Susunan bertingkat itu dilewati dan hasilnya ditampilkan rata. Orang yang
 * mengetik pencarian sedang mencari satu hal tertentu; mengelompokkannya lagi
 * per seri justru menyembunyikan yang dia cari di balik satu lapis lagi.
 */
export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations("events");

  const level = isLevel(sp.level) ? sp.level : undefined;
  const mode = isMode(sp.mode) ? sp.mode : undefined;
  const q = sp.q?.trim() || undefined;
  const menyaring = Boolean(level || mode || q);

  const hasil = filterEvents({ level, mode, q });
  const facets = eventFacets();

  const kini = new Date();
  const semua = allEvents();
  const terbuka = semua
    .filter((e) => statusEvent(e, kini) === "terbuka")
    .sort((a, b) => waktuEvent(a) - waktuEvent(b));
  const akan = semua
    .filter((e) => statusEvent(e, kini) === "akan")
    .sort((a, b) => waktuEvent(a) - waktuEvent(b));
  const seri = kelompokkanSeri(semua);

  /* Data dari database dashboard. Hanya seri yang sudah "dipin" panitia yang
     menjawab; sisanya diam-diam tetap memakai data warisan situs lama. Karena
     itu blok ini tidak pernah bisa menggagalkan halaman — paling buruk ia
     kosong. Lihat src/lib/dashboard-event.ts. */
  const dariDashboard = await ambilSemuaSeriDashboard();
  const dibuka = [...dariDashboard.values()]
    .filter((e) => e.pendaftaranDibuka)
    .sort((a, b) => (a.pendaftaranTutup ?? "").localeCompare(b.pendaftaranTutup ?? ""));

  /* Edisi warisan dari seri yang sudah punya data dashboard dibuang dari dua
     seksi teratas. Kalau tidak, satu seri bisa muncul dua kali dengan tanggal
     yang berbeda — satu hasil tebakan atas kalimat bebas, satu dari kolom
     tanggal sungguhan — dan pengunjung tidak punya cara tahu mana yang benar.
     Di arsip mereka tetap tampil: di sana yang diperlihatkan riwayat, bukan
     ajakan mendaftar. */
  const slugDiambilAlih = new Set(
    seri
      .filter((x) => dariDashboard.has(x.akronim.toUpperCase()))
      .flatMap((x) => x.edisi.map((e) => e.slug)),
  );
  /* Jumlah kolom disamakan dengan jumlah kartunya selama masih di bawah tiga.
     Kisi garis rambut di situs ini memakai latar berwarna garis di wadahnya,
     jadi kolom yang tidak terisi tidak hilang begitu saja — ia tampil sebagai
     kotak kosong di sebelah kartu terakhir. */
  const kolomDibuka =
    dibuka.length === 1 ? "" : dibuka.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";

  const terbukaWarisan = terbuka.filter((e) => !slugDiambilAlih.has(e.slug));
  const akanWarisan = akan.filter((e) => !slugDiambilAlih.has(e.slug));

  return (
    <>
      {/* Kepala halaman baku, ditambah satu pita saringan di slot `bawah`.
          Ringkasan halaman sengaja tidak dikirim: di kepala seringkas ini ia
          menggantung di kolom tengah tanpa apa pun untuk diratakan, dan
          pemilik situs menilainya tidak pada tempatnya. Deskripsi halamannya
          tetap hidup di metadata untuk mesin pencari. */}
      <PageHeader
        eyebrow="Event"
        title={t("title")}
        count={menyaring ? hasil.length : semua.length}
        countLabel={
          menyaring
            ? `${t("count", { count: hasil.length })} · ${semua.length} ${locale === "id" ? "total" : "in total"}`
            : `${t("count", { count: semua.length })} · ${t("seriesCount", { count: seri.length })}`
        }
        bawah={<EventFilters facets={facets} active={{ level, mode, q }} />}
      />

      {menyaring ? (
        <div className="shell pb-16">
          {hasil.length === 0 ? (
            <EmptyState title={t("empty")} action={<MoreLink href="/event">{t("reset")}</MoreLink>} />
          ) : (
            <ul className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3">
              {hasil.map((e) => (
                <li key={e.slug} className="bg-[var(--bg)]">
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {/* Satu seksi, dua asal data. Kartu dashboard didahulukan: itu
              satu-satunya sumber yang tahu pendaftaran mana yang BENAR-BENAR
              dibuka sekarang — saklarnya ada di dashboard, dan sebagian edisi
              di sini bahkan belum pernah ada di situs lama. Menjadikannya dua
              seksi terpisah berarti dua judul "Pendaftaran terbuka" di satu
              halaman, yang membingungkan tanpa memberi apa pun. */}
          {(dibuka.length > 0 || terbukaWarisan.length > 0) && (
            <Section eyebrow={t("nowEyebrow")} title={t("openTitle")} lead={t("openLead")} padat>
              {/* Dua kisi terpisah, bukan satu. Kartu dashboard dibangun di
                  sekitar logo dan tanggal; kartu warisan di sekitar poster 3:2
                  yang jauh lebih tinggi. Disatukan dalam satu kisi, baris yang
                  sama memaksa kartu dashboard meregang mengejar tinggi poster
                  dan menyisakan kekosongan besar di tengahnya. */}
              {dibuka.length > 0 && (
                <ul className={`grid gap-px border border-[var(--line)] bg-[var(--line)] ${kolomDibuka}`}>
                  {dibuka.map((e) => (
                    <li key={e.id} className="flex">
                      <EdisiDashboardKartu edisi={e} />
                    </li>
                  ))}
                  <SelPengisi jumlah={dibuka.length} kolom={3} />
                  <SelPengisi jumlah={dibuka.length} kolom={2} />
                </ul>
              )}

              {terbukaWarisan.length > 0 && (
                <ul
                  className={`grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3 ${
                    dibuka.length > 0 ? "mt-px" : ""
                  }`}
                >
                  {terbukaWarisan.map((e) => (
                    <li key={e.slug} className="bg-[var(--bg)]">
                      <EventCard event={e} />
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {akanWarisan.length > 0 && (
            <Section eyebrow={t("scheduledEyebrow")} title={t("upcomingTitle")} lead={t("upcomingLead")} sunk>
              <ul className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3">
                {akanWarisan.map((e) => (
                  <li key={e.slug} className="bg-[var(--bg)]">
                    <EventCard event={e} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section eyebrow={t("archiveEyebrow")} title={t("seriesTitle")} lead={t("seriesLead")}>
            {/* Kisi, bukan daftar baris. Arsip dipakai untuk memindai: yang
                ditanyakan pengunjung lebih dulu adalah seri apa saja yang ada,
                bukan edisi mana saja di dalamnya. Alasan lengkapnya ada di
                komponen kartunya. */}
            <ul className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-3 xl:grid-cols-4">
              {seri.map((s) => (
                <li key={s.slug} className="flex">
                  <SeriKartu seri={s} dash={dariDashboard.get(s.akronim.toUpperCase())} />
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}

      <div className="shell pb-16">
        {/* Ekosistem domain — satu-satunya tempat 34 situs event IYSA tercatat. */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-8">
          <div>
            <p className="eyebrow">{t("sites")}</p>
            <p className="mt-2 max-w-[52ch] text-[15px] text-[var(--ink-muted)]">{t("sitesLead")}</p>
          </div>
          <MoreLink href="/event/situs">{t("sites")}</MoreLink>
        </div>
      </div>
    </>
  );
}

/**
 * Pembacaan data hasil migrasi, bertipe.
 *
 * Berkas di src/content/generated/ dihasilkan scripts/extract-legacy.mjs dari
 * repo lama. Di sini ia dibungkus jadi fungsi, bukan diimpor langsung oleh
 * halaman — supaya saat sebuah entitas berpindah ke API dasbor, yang berubah
 * cukup isi fungsinya.
 */

import affiliatesRaw from "@/content/generated/affiliates.json";
import issuesRaw from "@/content/generated/newsletter-issues.json";
import cardsRaw from "@/content/generated/newsletter-cards.json";
import eventsRaw from "@/content/generated/events.json";
import highlightsRaw from "@/content/generated/event-highlights.json";
import faqRaw from "@/content/generated/faq.json";
import videosRaw from "@/content/generated/videos.json";
import partnersRaw from "@/content/generated/partners.json";
import sitesRaw from "@/content/generated/event-sites.json";
import affiliateSitesRaw from "@/content/generated/affiliate-sites.json";
import orgStructureRaw from "@/content/generated/org-structure.json";

/* ── tipe ──────────────────────────────────────────────────────────── */

export type EventLevel = "national" | "international";
export type EventMode = "online" | "onsite" | "hybrid";

export type IysaEvent = {
  legacyId: number;
  origin: "iysa" | "affiliate";
  slug: string;
  title: string;
  poster: string | null;
  level: EventLevel | null;
  levelRaw: string | null;
  mode: EventMode | null;
  city: string | null;
  locationRaw: string | null;
  category: string | null;
  dates: string | null;
  registrationEnds: string | null;
  registrationUrl: string | null;
  hashtags: string[];
  venueName: string | null;
  venueImage: string | null;
  mapsUrl: string | null;
  mapsEmbed: string | null;
};

export type NewsletterIssue = {
  legacyKey: string;
  slug: string;
  year: number;
  month: number | null;
  batch: number | null;
  kind: "monthly" | "batch" | "other";
  title: string;
  cover: string | null;
  driveId: string | null;
  pdfPreview: string | null;
  hasPdf: boolean;
};

export type Affiliate = {
  id: number;
  legacyPath: string;
  slug: string;
  name: string;
  logo: string | null;
  /** Foto dokumentasi di badan halaman lama, di luar logo. Hanya MIYIO punya. */
  images: string[];
  description: string;
  words: number;
  videos: string[];
  /**
   * Tautan Drive beserta judul aslinya.
   *
   * Namanya `links`, bukan `gallery`, karena isinya bukan hanya galeri:
   * ICPC menautkan siaran pers dan MIYIO menautkan panduan peserta. Halaman
   * mitra sempat melabeli ketiganya "Buka galeri di Google Drive" — `title`
   * ada supaya tombolnya menyebut isi tautannya yang sebenarnya. Null berarti
   * markah lamanya memang tidak memberi judul; pemakainya jatuh ke label umum.
   */
  links: { url: string; title: string | null }[];
  sections: string[];
};

export type FaqItem = { group: string; question: string; answer: string };

export type VideoItem = {
  year: number | null;
  title: string;
  description: string | null;
  youtubeId: string | null;
  srcRaw: string | null;
};

export type Person = {
  name: string;
  position: string;
  /** Foto utama; selalu sama dengan `photos[0]`. */
  photo: string | null;
  /**
   * Semua foto orang itu, 1–4 buah, sudah bebas duplikat.
   *
   * Dulu di sini ada `photoAlt` yang hanya memuat foto kedua, dan tidak pernah
   * dirender — sementara 30 berkas foto ketiga dan keempat tidak ikut migrasi
   * sama sekali. Satu senarai menggantikan keduanya supaya tidak ada lagi dua
   * cara menyimpan hal yang sama yang bisa saling menyimpang.
   */
  photos: string[];
  children: Person[];
};

export type EventSite = { name: string; type: string | null; url: string | null };

/* ── event ─────────────────────────────────────────────────────────── */

/**
 * Perbaikan tingkat event (level) yang salah label pada data warisan:
 * - I3O 2024 ("Indonesia International IoT Olympiad") kehilangan `level` (`null`)
 * - NRTC 2025 ("Nasional Research Teacher Competition") tercatat `"international"`
 */
const PERBAIKAN_LEVEL_EVENT: Record<string, EventLevel> = {
  "indonesia-international-iot-olympiad-i3o-2024": "international",
  "nasional-research-teacher-competition-nrtc-2025": "national",
};

const events: IysaEvent[] = (eventsRaw as IysaEvent[]).map((e) =>
  PERBAIKAN_LEVEL_EVENT[e.slug]
    ? { ...e, level: PERBAIKAN_LEVEL_EVENT[e.slug] }
    : e,
);

export const allEvents = (): IysaEvent[] => events;

export const eventsByOrigin = (origin: IysaEvent["origin"]) =>
  events.filter((e) => e.origin === origin);

export const eventBySlug = (slug: string) => events.find((e) => e.slug === slug) ?? null;

export const eventByLegacyId = (id: number) =>
  events.find((e) => e.origin === "iysa" && e.legacyId === id) ?? null;

export const eventHighlights = () => highlightsRaw;

/**
 * Penyaring yang dipakai halaman daftar. Baru mungkin setelah nilai EventType
 * dan Location dibakukan saat migrasi — di data lama, "Nasional"/"National"
 * dan "Offline"/" Offline " hidup berdampingan sehingga mengelompokkan event
 * tidak bisa dilakukan sama sekali.
 */
export function filterEvents(opts: { level?: EventLevel; mode?: EventMode; q?: string }) {
  const q = opts.q?.trim().toLowerCase();
  return events.filter((e) => {
    if (opts.level && e.level !== opts.level) return false;
    if (opts.mode && e.mode !== opts.mode) return false;
    if (q && !`${e.title} ${e.category ?? ""} ${e.city ?? ""}`.toLowerCase().includes(q))
      return false;
    return true;
  });
}

export function eventFacets() {
  const count = <T extends string>(pick: (e: IysaEvent) => T | null) => {
    const m = new Map<T, number>();
    for (const e of events) {
      const k = pick(e);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  return {
    level: count((e) => e.level),
    mode: count((e) => e.mode),
  };
}

/* ── newsletter ────────────────────────────────────────────────────── */

const issues = issuesRaw as NewsletterIssue[];

export const allIssues = () => issues;
export const issueBySlug = (slug: string) => issues.find((i) => i.slug === slug) ?? null;

export const issueYears = () =>
  [...new Set(issues.map((i) => i.year))].sort((a, b) => b - a);

export const issuesByYear = (year: number) => issues.filter((i) => i.year === year);

/** Kartu sampul lama, dipakai hanya untuk membangun peta redirect. */
export const newsletterCards = () =>
  cardsRaw as { year: number; title: string; cover: string | null; legacyPath: string | null; slug: string | null }[];

/* ── mitra afiliasi ────────────────────────────────────────────────── */

const affiliates = affiliatesRaw as Affiliate[];

export const allAffiliates = () => affiliates;
export const affiliateBySlug = (slug: string) =>
  affiliates.find((a) => a.slug === slug) ?? null;

/* ── sisa ──────────────────────────────────────────────────────────── */

export const faq = () => faqRaw as FaqItem[];

export const faqGroups = () => {
  const items = faq();
  const groups = [...new Set(items.map((f) => f.group))];
  return groups.map((g) => ({ group: g, items: items.filter((f) => f.group === g) }));
};

export const videos = () => videosRaw as VideoItem[];

export const videoYears = () =>
  [...new Set(videos().map((v) => v.year))].filter((y): y is number => y != null).sort((a, b) => b - a);

/**
 * Logo institusi mitra — 59 entri, 30 nasional dan 29 internasional.
 *
 * Sumbernya dua komponen situs lama, `National-affiliation.js` dan
 * `International-affiliation.js`, yang meng-hardcode daftar `<img>`-nya.
 * Entri yang dikomentari di sana tidak ikut; `scripts/extract-legacy.mjs`
 * membuangnya lebih dulu dengan `stripComments`.
 *
 * **Jangan kembali ke `AffiliationLogo.json`.** Berkas itu sisa yang tidak
 * pernah dipakai komponen mana pun, dan isinya rusak: 41 entri yang hanya
 * menunjuk 9 berkas, 26 di antaranya `about-logo.png` alias logo IYSA
 * sendiri, dengan bagian "International" yang identik byte-per-byte dengan
 * bagian "National". Dinding logo pernah dibangun dari sana dan hasilnya
 * memajang lambang IYSA 26 kali di bawah judul "41 institusi mitra".
 *
 * `legacyName` adalah nama berkasnya, disimpan untuk pelacakan — BUKAN untuk
 * ditampilkan. Sebagiannya bukan nama institusi sama sekali (`pohon`,
 * `burung`, `red g`, `img`). Situs lama pun memakai `alt=""` di setiap logo.
 */
export const partners = () =>
  partnersRaw as { scope: "national" | "international"; logo: string; legacyName: string }[];

export const eventSites = () => sitesRaw as EventSite[];

export const affiliateSites = () =>
  affiliateSitesRaw as { name: string; type: string | null; legacyPath: string | null }[];

export const orgStructure = () => orgStructureRaw as Person[];

/** Struktur 5 tingkat diratakan untuk hitungan dan pencarian. */
export function flattenPeople(nodes: Person[] = orgStructure()): Person[] {
  return nodes.flatMap((n) => [n, ...flattenPeople(n.children)]);
}

/* ── angka untuk beranda ───────────────────────────────────────────── */

export const stats = () => ({
  events: events.length,
  affiliates: affiliates.length,
  /* 59 — dihitung dari daftar yang benar-benar tampil di situs lama.
     Sempat dicabut waktu angkanya masih 41 dan bersumber dari
     AffiliationLogo.json yang rusak; sekarang sumbernya kedua komponen
     afiliasi, jadi angkanya bisa dipertanggungjawabkan. */
  partners: partners().length,
  issues: issues.length,
  videos: videos().length,
  people: flattenPeople().length,
  eventSites: eventSites().length,
  countries: 11, // dari daftar negara di profil; belum ada tabelnya di dasbor
});

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
  description: string;
  words: number;
  videos: string[];
  gallery: string[];
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
  photo: string | null;
  photoAlt: string | null;
  children: Person[];
};

export type EventSite = { name: string; type: string | null; url: string | null };

/* ── event ─────────────────────────────────────────────────────────── */

const events = eventsRaw as IysaEvent[];

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
 * Logo institusi dari `AffiliationLogo.json` lama.
 *
 * **JANGAN dipakai untuk klaim jumlah mitra, dan jangan dirender sebagai
 * dinding logo.** Datanya rusak di sumbernya, dan sudah diperiksa entri per
 * entri:
 *
 *   41 entri  →  9 berkas unik  →  8 yang bukan placeholder
 *   26 entri menunjuk `about-logo.png`, yaitu logo IYSA sendiri
 *   `International[0..6]` identik byte-per-byte dengan `National[0..6]`
 *   (kampus Indonesia yang sama, dilabeli internasional)
 *   bentuk entrinya cuma `{id, image}` — tidak ada nama institusi sama sekali
 *
 * Dinding logo pernah dibangun dari data ini dan dicabut lagi: hasilnya
 * memajang lambang IYSA 26 kali sambil mengklaim "41 institusi mitra". Tanpa
 * nama, entri kosongnya juga tidak bisa diganti inisial.
 *
 * Cerita mitra yang jujur sudah ada di `affiliates.json` — 13 afiliasi
 * internasional bernama, semuanya berlogo, dirender di beranda dan `/mitra`.
 */
export const partners = () => partnersRaw as { scope: "national" | "international"; logo: string }[];

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
  /* `partners` sengaja TIDAK ada di sini. Menghitung partnersRaw menghasilkan
     41, padahal 26 entrinya placeholder berisi logo IYSA dan 7 sisanya
     duplikat — lihat catatan di atas `partners()`. Angka itu pernah tampil
     sebagai "41 institusi mitra" di beranda dan /profil, dan dicabut. */
  issues: issues.length,
  videos: videos().length,
  people: flattenPeople().length,
  eventSites: eventSites().length,
  countries: 11, // dari daftar negara di profil; belum ada tabelnya di dasbor
});

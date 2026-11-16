/**
 * Satu sumber untuk navigasi — dipakai header, footer, dan sitemap.
 *
 * `key` merujuk ke messages/*.json namespace "nav".
 * `path` ditulis tanpa prefiks locale; komponen Link dari next-intl yang
 * menambahkannya.
 */

export type NavItem = {
  key: string;
  path: string;
  children?: NavItem[];
};

export const primaryNav: NavItem[] = [
  { key: "profile", path: "/profil" },
  {
    key: "events",
    path: "/event",
    children: [
      { key: "events", path: "/event" },
      { key: "partners", path: "/mitra" },
    ],
  },
  { key: "team", path: "/tim" },
  /* Kalender jadi menu utama: di menu Event ia hanya submenu, dan navbar
     desktop tidak merender submenu — sehingga tidak terjangkau dari atas. */
  { key: "calendarShort", path: "/kalender" },
  { key: "newsletter", path: "/newsletter" },
  { key: "gallery", path: "/galeri/video" },
  { key: "faq", path: "/faq" },
  { key: "contact", path: "/kontak" },
];

/**
 * Halaman di luar menu utama.
 *
 * ── Kenapa daftar ini sekarang juga dirender ─────────────────────────────
 *
 * Semula ia hanya memberi makan sitemap, dan akibatnya ada empat halaman yang
 * TIDAK BISA DIJANGKAU dari mana pun di situs: kalender event, galeri foto,
 * kurasi, dan event afiliasi. Keempatnya punya padanan di menu situs lama —
 * di sana mereka duduk di dropdown "Our Events", "Gallery", dan "Event Info".
 * Penulisan ulang meratakan menunya jadi satu tingkat tanpa memindahkan isi
 * dropdown-nya ke mana pun.
 *
 * Mesin pencari menemukannya lewat sitemap, tapi pengunjung tidak punya satu
 * pun jalan ke sana. Sekarang daftar ini jadi indeks di kaki halaman, jadi
 * tiap halaman punya sedikitnya satu tautan masuk.
 */
export const secondaryNav: NavItem[] = [
  { key: "curation", path: "/kurasi" },
  { key: "calendar", path: "/kalender" },
  { key: "partners", path: "/mitra" },
  { key: "affiliateEvents", path: "/event/afiliasi" },
  { key: "eventSites", path: "/event/situs" },
  { key: "photos", path: "/galeri/foto" },
  { key: "expertTeam", path: "/tim/ahli" },
];

export const secondaryPaths = [
  ...secondaryNav.map((n) => n.path),
  "/tim/staf-ahli",
];

export const allStaticPaths = [
  "/",
  ...primaryNav.map((n) => n.path),
  ...primaryNav.flatMap((n) => n.children?.map((c) => c.path) ?? []),
  ...secondaryPaths,
].filter((p, i, a) => a.indexOf(p) === i);

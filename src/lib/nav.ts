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
      { key: "calendar", path: "/kalender" },
    ],
  },
  { key: "team", path: "/tim" },
  { key: "newsletter", path: "/newsletter" },
  { key: "gallery", path: "/galeri/video" },
  { key: "faq", path: "/faq" },
  { key: "contact", path: "/kontak" },
];

/** Halaman yang harus masuk sitemap tapi tidak perlu tempat di menu utama. */
export const secondaryPaths = [
  "/event/situs",
  "/event/afiliasi",
  "/galeri/foto",
  "/kurasi",
  "/kurasi/lktin",
  "/kurasi/ospc",
  "/tim/ahli",
  "/tim/staf-ahli",
];

export const allStaticPaths = [
  "/",
  ...primaryNav.map((n) => n.path),
  ...primaryNav.flatMap((n) => n.children?.map((c) => c.path) ?? []),
  ...secondaryPaths,
].filter((p, i, a) => a.indexOf(p) === i);

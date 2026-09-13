/**
 * Membangun peta redirect 301 dari rute lama ke rute baru.
 *
 *   node scripts/build-redirects.mjs
 *
 * Daftar rute lama TIDAK ditulis tangan — ia dibaca langsung dari App.js di
 * repo lama, supaya tidak ada rute yang luput karena kelalaian menyalin.
 * Skrip ini keluar dengan kode 1 kalau ada satu saja rute lama tanpa tujuan.
 * next.config.ts membaca hasilnya, jadi build ikut gagal bila peta bolong.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OLD_APP = join(here, "..", "..", ".old", "src", "App.js");
const GEN = join(here, "..", "src", "content", "generated");
const OUT = join(here, "..", "src", "content", "generated", "redirects.json");

const readJSON = (f) => JSON.parse(readFileSync(join(GEN, f), "utf8"));

/* ── 1. Rute lama, dari sumber ─────────────────────────────────────── */

const app = readFileSync(OLD_APP, "utf8");
const legacyRoutes = [
  ...new Set([...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1])),
].sort();

/* ── 2. Padanan halaman statis ─────────────────────────────────────── */

// Bahasa bawaan dipakai sebagai tujuan: pengunjung lama hampir semuanya
// datang dari pencarian berbahasa Indonesia atau tautan sosial IYSA.
const L = "/id";

const staticMap = {
  "/": L,
  "/About": `${L}/profil`,
  "/AllEventPage": `${L}/event`,
  "/AllEventWebPage": `${L}/event/situs`,
  "/AllEventAffiliation": `${L}/event/afiliasi`,
  "/AllEventAffiliationWebPage": `${L}/mitra`,
  "/CalenderEvent": `${L}/kalender`,
  "/ContactPage": `${L}/kontak`,
  "/Curasi": `${L}/kurasi`,
  "/CurationLKTIN": `${L}/kurasi/lktin`,
  "/CurationOSPC": `${L}/kurasi/ospc`,
  "/ExpertTeam": `${L}/tim/ahli`,
  "/ExpertStaff": `${L}/tim/staf-ahli`,
  "/FaqPage": `${L}/faq`,
  "/GalleryPhoto": `${L}/galeri/foto`,
  "/GalleryVideo": `${L}/galeri/video`,
  "/NewsletterPage": `${L}/newsletter`,
  "/OurTeam": `${L}/tim`,
};

/* ── 3. Rute dinamis ───────────────────────────────────────────────── */

const redirects = [];
const add = (source, destination) =>
  redirects.push({ source, destination, permanent: true });

for (const [from, to] of Object.entries(staticMap)) add(from, to);

// 3a. 42 halaman newsletter → satu rute dinamis.
//
//     Padanannya TIDAK dicari lewat gambar sampul: lima terbitan awal 2022
//     tidak pernah punya kartu sampul, jadi pencocokan lewat sampul
//     meninggalkan /NewsletterDetailPage1..5 tanpa tujuan — padahal kelimanya
//     sudah terindeks.
//
//     Yang dipakai di sini rantai impor aslinya, yang pasti:
//       /NewsletterDetailPage1
//         → pages/newsletter/NewsletterDetailPage1.js
//         → components/newsletter/NewsletterDetail1.js
//         → DataLetter.NewsletterJanuary2022
//     lalu kunci itu dicocokkan ke slug baru lewat `legacyKey`.
const issues = readJSON("newsletter-issues.json");
const slugByLegacyKey = new Map(issues.map((i) => [i.legacyKey, i.slug]));

const OLD_SRC = join(here, "..", "..", ".old", "src");

/** Telusuri satu rute newsletter sampai ke kunci JSON yang dibacanya. */
function resolveNewsletterKey(route) {
  const pageName = route.replace(/^\//, "");
  let pageSrc;
  try {
    pageSrc = readFileSync(join(OLD_SRC, "pages", "newsletter", `${pageName}.js`), "utf8");
  } catch {
    return null;
  }

  const comp = pageSrc.match(/from\s+['"]\.\.\/\.\.\/components\/newsletter\/([\w]+)['"]/)?.[1];
  if (!comp) return null;

  let compSrc;
  try {
    compSrc = readFileSync(join(OLD_SRC, "components", "newsletter", `${comp}.js`), "utf8");
  } catch {
    return null;
  }

  return compSrc.match(/DataLetter\.(\w+)/)?.[1] ?? null;
}

// 3b. 13 halaman mitra → satu rute dinamis.
const affiliates = readJSON("affiliates.json");
const affBySource = new Map(affiliates.map((a) => [a.legacyPath, a.slug]));

// 3c. /Event/:id — rute berparameter; id lama dipetakan ke slug satu per satu
//     supaya tautan lama ke event tertentu tetap mendarat di event yang sama.
const events = readJSON("events.json");

/* ── 4. Petakan tiap rute lama ─────────────────────────────────────── */

const unmapped = [];

for (const route of legacyRoutes) {
  if (route in staticMap) continue; // sudah ditambahkan

  if (/^\/Newsletter.*DetailPage\d+$/.test(route)) {
    const key = resolveNewsletterKey(route);
    const slug = key ? slugByLegacyKey.get(key) : null;
    if (slug) add(route, `${L}/newsletter/${slug}`);
    else unmapped.push(`${route}${key ? ` (kunci ${key} tak dikenal)` : " (rantai impor putus)"}`);
    continue;
  }

  if (/^\/EventAffiliationPage\d+$/.test(route)) {
    const slug = affBySource.get(route);
    if (slug) add(route, `${L}/mitra/${slug}`);
    else unmapped.push(route);
    continue;
  }

  if (route === "/Event/:id") {
    // Satu redirect per event, bukan satu pola — karena id numerik lama tidak
    // punya hubungan apa pun dengan slug baru.
    for (const e of events) {
      if (e.origin === "iysa") add(`/Event/${e.legacyId}`, `${L}/event/${e.slug}`);
    }
    // Jaring pengaman: id yang tidak dikenal mendarat di daftar event,
    // bukan di halaman 404.
    add("/Event/:id", `${L}/event`);
    continue;
  }

  unmapped.push(route);
}

/* ── 5. Alamat lain yang pernah dibagikan ──────────────────────────── */

// Rute lama ditulis dengan huruf kapital. Varian huruf kecil ditambahkan
// karena URL sering disalin-tempel dalam bentuk lowercase dari chat.
const extra = [];
for (const r of redirects) {
  const lower = r.source.toLowerCase();
  if (lower !== r.source && !r.source.includes(":")) {
    extra.push({ source: lower, destination: r.destination, permanent: true });
  }
}
redirects.push(...extra);

/* ── 6. Laporan & penjagaan ────────────────────────────────────────── */

console.log(`\nRute lama terbaca dari App.js : ${legacyRoutes.length}`);
console.log(`Redirect dihasilkan          : ${redirects.length}`);
console.log(`  halaman statis             : ${Object.keys(staticMap).length}`);
console.log(`  newsletter                 : ${redirects.filter((r) => r.destination.includes("/newsletter/")).length}`);
console.log(`  mitra afiliasi             : ${redirects.filter((r) => r.destination.includes("/mitra/")).length}`);
console.log(`  event per id               : ${redirects.filter((r) => /^\/Event\/\d+$/.test(r.source)).length}`);
console.log(`  varian huruf kecil         : ${extra.length}`);

if (unmapped.length) {
  console.error(`\nGAGAL — ${unmapped.length} rute lama tanpa tujuan:`);
  unmapped.forEach((r) => console.error("  - " + r));
  process.exit(1);
}

// Pastikan tidak ada sumber ganda; Next memakai yang pertama dan menelan
// sisanya diam-diam, yang akan menyembunyikan kesalahan pemetaan.
const dupes = redirects
  .map((r) => r.source)
  .filter((s, i, a) => a.indexOf(s) !== i);
if (dupes.length) {
  console.error(`\nGAGAL — sumber redirect ganda: ${[...new Set(dupes)].join(", ")}`);
  process.exit(1);
}

writeFileSync(OUT, JSON.stringify(redirects, null, 2) + "\n");
console.log(`\nSeluruh ${legacyRoutes.length} rute lama terpetakan. → ${OUT.split("/src/")[1]}\n`);

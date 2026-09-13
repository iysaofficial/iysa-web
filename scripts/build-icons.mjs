/**
 * Membangun ikon situs dari lambang IYSA.
 *
 *   node scripts/build-icons.mjs      (npm run build:icons)
 *
 * Yang dihasilkan:
 *
 *   src/app/icon.svg          ikon utama — vektor, dipakai peramban modern
 *   src/app/favicon.ico       32px, untuk yang masih meminta .ico
 *   src/app/apple-icon.png    180px, layar beranda iOS (wajib punya latar —
 *                             iOS tidak menghormati transparansi dan akan
 *                             menaruh lambang di atas hitam pekat)
 *   public/media/logo/iysa-mark.svg       lambang telanjang, untuk OG & fallback 3D
 *   public/media/logo/iysa-mark-gelap.svg varian tema gelap
 *
 * Next App Router menemukan icon.svg / favicon.ico / apple-icon.png otomatis
 * dari src/app/ — tidak perlu didaftarkan di metadata.
 *
 * ── Kenapa skripnya menduplikasi geometri ────────────────────────────────
 *
 * Skrip .mjs tidak bisa mengimpor src/components/iysa-logo.tsx. Jadi angkanya
 * ditulis dua kali — dan supaya duplikat itu tidak diam-diam menyimpang,
 * skrip ini MEMBACA berkas .tsx-nya dan membandingkan angkanya sebelum
 * menulis apa pun. Kalau berbeda, skrip berhenti dan menyebut angka mana yang
 * tidak cocok.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const APP = join(ROOT, "src", "app");
const LOGO_DIR = join(ROOT, "public", "media", "logo");

/* ── Geometri — harus sama dengan src/components/iysa-logo.tsx ──────── */

const G = { C: 256, RX: 200, RY: 66, SW: 27, NODE: 30, GLOBE: 54 };

const ORBITS = [
  { rot: 30, key: "teal", simpul: 180 },
  { rot: 90, key: "coral", simpul: 180 },
  { rot: -30, key: "navy", simpul: 0 },
];

/* ── Penjaga: bandingkan dengan komponen React ──────────────────────── */

const sumber = readFileSync(join(ROOT, "src", "components", "iysa-logo.tsx"), "utf8");
const beda = [];
for (const [nama, nilai] of Object.entries(G)) {
  // cocokkan "C: 256," di dalam blok GEOMETRI
  const m = sumber.match(new RegExp(`\\b${nama}:\\s*(\\d+)`));
  if (!m) beda.push(`${nama}: tidak ditemukan di iysa-logo.tsx`);
  else if (Number(m[1]) !== nilai) beda.push(`${nama}: skrip ${nilai} ≠ komponen ${m[1]}`);
}
if (beda.length) {
  console.error("\nGeometri lambang menyimpang dari src/components/iysa-logo.tsx:\n");
  for (const b of beda) console.error("  - " + b);
  console.error("\nSamakan keduanya sebelum membangun ikon.\n");
  process.exit(1);
}

/* ── Palet ──────────────────────────────────────────────────────────── */

const TERANG = {
  navy: "#2f5490",
  teal: "#2e9c97",
  coral: "#ef5138",
  globe: "#0e1726",
  garis: "#ffffff",
};

const GELAP = {
  navy: "#7ea3e0",
  teal: "#4fc4bc",
  coral: "#ff7a5e",
  globe: "#eef2f9",
  garis: "#0c1220",
};

/* ── Perakit ────────────────────────────────────────────────────────── */

const { C, RX, RY, SW, NODE, GLOBE } = G;

const titikSimpul = (rot, deg) => {
  const a = ((rot + deg) * Math.PI) / 180;
  return { x: C + RX * Math.cos(a), y: C + RX * Math.sin(a) };
};

const orbit = (o, p, kelas) =>
  `<ellipse${kelas ? ` class="o-${o.key}"` : ""} cx="${C}" cy="${C}" rx="${RX}" ry="${RY}" fill="none" stroke="${p[o.key]}" stroke-width="${SW}" transform="rotate(${o.rot} ${C} ${C})"/>`;

const simpul = (o, p, kelas) => {
  const t = titikSimpul(o.rot, o.simpul);
  return `<circle${kelas ? ` class="s-${o.key}"` : ""} cx="${t.x.toFixed(1)}" cy="${t.y.toFixed(1)}" r="${NODE}" fill="${p[o.key]}"/>`;
};

/**
 * `polos` membuang meridian bola dunia. Di bawah 40px meridian berubah jadi
 * kotak abu bergaris — diuji dengan merender 32px lalu memperbesarnya tanpa
 * penghalusan. Favicon selalu polos; icon.svg tidak, karena ia dipakai juga
 * di ukuran besar.
 */
function svgLambang({ palet = TERANG, bg = null, polos = false, pad = 0, kelas = false } = {}) {
  const [teal, coral, navy] = ORBITS;
  // `pad` memberi ruang napas di apple-icon, yang digambar mepet ke tepi ubin.
  const vb = pad ? `${-pad} ${-pad} ${512 + pad * 2} ${512 + pad * 2}` : "0 0 512 512";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">
${bg ? `<rect x="${-pad}" y="${-pad}" width="${512 + pad * 2}" height="${512 + pad * 2}" fill="${bg}"/>` : ""}
${orbit(teal, palet, kelas)}
${orbit(coral, palet, kelas)}
<circle${kelas ? ` class="bola"` : ""} cx="${C}" cy="${C}" r="${GLOBE}" fill="${palet.globe}"/>
${
  polos
    ? ""
    : `<g${kelas ? ` class="garis"` : ""} fill="none" stroke="${palet.garis}" stroke-width="6">
<line x1="${C - GLOBE}" y1="${C}" x2="${C + GLOBE}" y2="${C}"/>
<ellipse cx="${C}" cy="${C}" rx="${(GLOBE * 0.45).toFixed(1)}" ry="${GLOBE}"/>
</g>`
}
${orbit(navy, palet, kelas)}
${ORBITS.map((o) => simpul(o, palet, kelas)).join("\n")}
</svg>`.replace(/\n{2,}/g, "\n");
}

/**
 * icon.svg mengikuti tema peramban: tab gelap dapat lambang terang, dan
 * sebaliknya — satu berkas, tanpa JavaScript.
 *
 * Warnanya ditulis HARFIAH di atribut, lalu ditimpa lewat @media yang
 * menyasar kelas. Bukan `var(--x)` di dalam SVG, meski itu tampak lebih rapi:
 * banyak perender di luar peramban (librsvg — yang dipakai sharp, ImageMagick,
 * sebagian pratinjau sistem berkas) tidak menyelesaikan custom property, dan
 * yang keluar adalah `stroke="var(--t)"` yang gagal jadi TANPA GARIS plus
 * `fill` yang jatuh ke hitam bawaan. Versi pertama berkas ini persis begitu:
 * tiga orbitnya hilang seluruhnya dan yang tersisa hanya empat lingkaran
 * hitam. Warna harfiah selalu benar; @media hanya menambah, tidak menopang.
 */
function svgIkonAdaptif() {
  const isi = svgLambang({ palet: TERANG, kelas: true });
  const gaya = `<style>
@media (prefers-color-scheme:dark){
.o-navy{stroke:${GELAP.navy}}.o-teal{stroke:${GELAP.teal}}.o-coral{stroke:${GELAP.coral}}
.s-navy{fill:${GELAP.navy}}.s-teal{fill:${GELAP.teal}}.s-coral{fill:${GELAP.coral}}
.bola{fill:${GELAP.globe}}.garis{stroke:${GELAP.garis}}
}
</style>`;
  return isi.replace(/(<svg[^>]*>)/, `$1\n${gaya}`);
}

/* ── Tulis ──────────────────────────────────────────────────────────── */

mkdirSync(LOGO_DIR, { recursive: true });

const tulis = (jalur, isi) => {
  writeFileSync(jalur, isi.trimStart() + "\n");
  return Buffer.byteLength(isi);
};

const hasil = [];

hasil.push(["src/app/icon.svg", tulis(join(APP, "icon.svg"), svgIkonAdaptif())]);
hasil.push([
  "public/media/logo/iysa-mark.svg",
  tulis(join(LOGO_DIR, "iysa-mark.svg"), svgLambang()),
]);
hasil.push([
  "public/media/logo/iysa-mark-gelap.svg",
  tulis(join(LOGO_DIR, "iysa-mark-gelap.svg"), svgLambang({ palet: GELAP })),
]);

// favicon.ico — 32px, varian polos, latar putih.
// Latar bukan transparan: di bilah tab gelap, lambang bertepi transparan
// kehilangan bola dunianya yang gelap. Putih pekat selalu terbaca di keduanya.
const icoPng = await sharp(Buffer.from(svgLambang({ polos: true, bg: "#ffffff" })))
  .resize(32, 32)
  .png()
  .toBuffer();

// sharp tidak menulis .ico; bungkus PNG 32×32 dalam wadah ICO secara manual.
// Format ICO mengizinkan muatan PNG sejak Vista, dan semua peramban yang
// masih meminta favicon.ico mendukungnya.
const ico = Buffer.concat([
  Buffer.from([0, 0, 1, 0, 1, 0, 32, 32, 0, 0, 1, 0, 32, 0]),
  (() => {
    const b = Buffer.alloc(8);
    b.writeUInt32LE(icoPng.length, 0);
    b.writeUInt32LE(22, 4);
    return b;
  })(),
  icoPng,
]);
writeFileSync(join(APP, "favicon.ico"), ico);
hasil.push(["src/app/favicon.ico", ico.length]);

// apple-icon — 180px, latar putih wajib (iOS mengabaikan transparansi),
// lambang diberi ruang napas supaya tidak mepet sudut ubin.
const apple = await sharp(Buffer.from(svgLambang({ bg: "#ffffff", pad: 64 })))
  .resize(180, 180)
  .png()
  .toBuffer();
writeFileSync(join(APP, "apple-icon.png"), apple);
hasil.push(["src/app/apple-icon.png", apple.length]);

// PNG lambang untuk tempat yang tidak bisa memakai SVG (mis. beberapa
// pratinjau tautan lama).
const markPng = await sharp(Buffer.from(svgLambang({ bg: "#ffffff" })))
  .resize(512, 512)
  .png()
  .toBuffer();
writeFileSync(join(LOGO_DIR, "iysa-mark.png"), markPng);
hasil.push(["public/media/logo/iysa-mark.png", markPng.length]);

/* ── Laporan ────────────────────────────────────────────────────────── */

const kb = (b) => (b / 1024).toFixed(1).padStart(6) + " KB";
console.log("\nIkon dibangun dari lambang IYSA\n");
for (const [nama, byte] of hasil) console.log("  " + nama.padEnd(38) + kb(byte));
console.log(
  "\n  Geometri cocok dengan src/components/iysa-logo.tsx.\n" +
    "  favicon.ico memakai varian polos — meridian bola dunia jadi bubur di 32px.\n",
);

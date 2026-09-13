/**
 * Membangun ikon situs dari lambang IYSA hasil tracing.
 *
 *   node scripts/build-icons.mjs      (npm run build:icons)
 *
 * Sumbernya `public/media/logo/iysa-mark-traced.svg`, keluaran
 * `npm run trace:logo` atas berkas lambang asli IYSA. **Jalankan trace:logo
 * lebih dulu** — `npm run migrate` sudah mengurutkannya begitu.
 *
 * Yang dihasilkan:
 *
 *   src/app/icon.svg          salinan lambang vektor, adaptif tema
 *   src/app/favicon.ico       32px, untuk yang masih meminta .ico
 *   src/app/apple-icon.png    180px berlatar putih dengan ruang napas
 *                             (iOS tidak menghormati transparansi)
 *   public/media/logo/iysa-mark.png   512px, untuk pratinjau yang tak bisa SVG
 *
 * Next App Router menemukan icon.svg / favicon.ico / apple-icon.png otomatis
 * dari src/app/ — tidak perlu didaftarkan di metadata. Justru sebaliknya:
 * mendeklarasikan `icons` di metadata MENGGANTIKAN konvensi berkas ini dan
 * membuat icon.svg tidak pernah dirujuk. Lihat catatan di layout.
 *
 * ── Kenapa bukan dari geometri lagi ──────────────────────────────────────
 *
 * Versi sebelumnya menggambar lambang dari angka — tiga elips, tiga lingkaran,
 * bola dunia berangka — dan membandingkan angkanya dengan komponen React
 * supaya keduanya tidak menyimpang. Bentuknya mendekati, tapi tetap tiruan,
 * dan terlihat sebagai tiruan di navbar maupun tab peramban. Sekarang satu
 * sumber untuk semuanya: berkas hasil tracing.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const APP = join(ROOT, "src", "app");
const LOGO_DIR = join(ROOT, "public", "media", "logo");
const SUMBER = join(LOGO_DIR, "iysa-mark-traced.svg");

if (!existsSync(SUMBER)) {
  console.error(
    `\nLambang hasil tracing tidak ada: ${SUMBER}\n` +
      `Jalankan \`npm run trace:logo\` lebih dulu.\n`,
  );
  process.exit(1);
}

const svgAsli = readFileSync(SUMBER, "utf8");

/* ── Varian untuk raster ────────────────────────────────────────────────
 *
 * Blok @media dibuang saat merasterkan: perender di luar peramban tidak
 * menyelesaikannya, dan membiarkannya hanya menambah berat tanpa efek. Warna
 * harfiah di atributnya sudah palet terang, yang memang benar untuk favicon
 * berlatar putih.
 */
const tanpaMedia = svgAsli.replace(/<style>[\s\S]*?<\/style>/, "");

/** Tambah ruang napas dan latar — dipakai apple-icon, yang digambar mepet ubin. */
function denganLatar(svg, { pad = 0, bg = "#ffffff" } = {}) {
  const vb = svg.match(/viewBox="([\d.\s-]+)"/)?.[1]?.trim().split(/\s+/).map(Number);
  if (!vb) return svg;
  const [x, y, w, h] = vb;
  const vbBaru = `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`;
  return svg
    .replace(/viewBox="[^"]+"/, `viewBox="${vbBaru}"`)
    .replace(
      /(<svg[^>]*>)/,
      `$1<rect x="${x - pad}" y="${y - pad}" width="${w + pad * 2}" height="${h + pad * 2}" fill="${bg}"/>`,
    );
}

/* ── Tulis ──────────────────────────────────────────────────────────────── */

mkdirSync(LOGO_DIR, { recursive: true });

const hasil = [];

// icon.svg — lambang vektor apa adanya, lengkap dengan @media tema gelapnya.
writeFileSync(join(APP, "icon.svg"), svgAsli);
hasil.push(["src/app/icon.svg", Buffer.byteLength(svgAsli)]);

/* favicon.ico — 32px berlatar putih.
 *
 * Latarnya bukan transparan: di bilah tab gelap, lambang bertepi transparan
 * kehilangan bola dunianya yang gelap. Dirender dari 512px lalu diperkecil,
 * bukan langsung ke 32px — penurunan bertahap menjaga lengkung orbitnya tetap
 * terbaca alih-alih putus. */
const dasar = await sharp(Buffer.from(denganLatar(tanpaMedia, { pad: 12 })), { density: 600 })
  .resize(512, 512, { fit: "contain", background: "#ffffff" })
  .flatten({ background: "#ffffff" })
  .png()
  .toBuffer();

/* `ensureAlpha()` wajib: `flatten()` menghasilkan PNG tiga kanal, dan
   pengurai ICO milik Next menolaknya — "The PNG is not in RGBA format" —
   sehingga seluruh build gagal, bukan cuma ikonnya. */
const icoPng = await sharp(dasar)
  .resize(32, 32, { kernel: "lanczos3" })
  .ensureAlpha()
  .png()
  .toBuffer();

/* sharp tidak menulis .ico; PNG 32×32 dibungkus wadah ICO secara manual.
   Format ICO mengizinkan muatan PNG sejak Vista, dan setiap peramban yang
   masih meminta favicon.ico mendukungnya. */
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

// apple-icon — 180px, latar putih wajib (iOS mengabaikan transparansi).
const apple = await sharp(Buffer.from(denganLatar(tanpaMedia, { pad: 64 })), { density: 600 })
  .resize(180, 180, { fit: "contain", background: "#ffffff" })
  .flatten({ background: "#ffffff" })
  .png()
  .toBuffer();
writeFileSync(join(APP, "apple-icon.png"), apple);
hasil.push(["src/app/apple-icon.png", apple.length]);

// PNG 512px untuk pratinjau lama yang tidak bisa menampilkan SVG.
const markPng = await sharp(dasar).png().toBuffer();
writeFileSync(join(LOGO_DIR, "iysa-mark.png"), markPng);
hasil.push(["public/media/logo/iysa-mark.png", markPng.length]);

/* ── Laporan ────────────────────────────────────────────────────────────── */

const kb = (b) => (b / 1024).toFixed(1).padStart(6) + " KB";
console.log("\nIkon dibangun dari lambang hasil tracing\n");
for (const [nama, byte] of hasil) console.log("  " + nama.padEnd(38) + kb(byte));
console.log(
  "\n  Sumber: public/media/logo/iysa-mark-traced.svg\n" +
    "  Raster diturunkan dari 512px, bukan langsung ke ukuran kecil.\n",
);

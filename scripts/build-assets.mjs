/**
 * Merapikan 136 MB aset situs lama.
 *
 *   node scripts/build-assets.mjs
 *
 * Tiga hal yang dikerjakan:
 *
 *  1. MENYARING. Hanya berkas yang benar-benar dirujuk data hasil migrasi yang
 *     ikut. Situs lama men-deploy seluruh folder — termasuk dua .zip 14 MB
 *     berisi arsip foto tim yang tidak pernah diunduh siapa pun lewat situs.
 *
 *  2. MENYERAGAMKAN. Lima format (PNG · JPG · WebP · JPEG · GIF) jadi satu:
 *     WebP. Yang terbesar di situs lama justru PNG — satu logo universitas
 *     3,8 MB, enam logo afiliasi masing-masing di atas 2 MB, dan semuanya
 *     dimuat di beranda sekaligus.
 *
 *  3. MEMBATASI UKURAN. Tidak ada gambar yang perlu lebih lebar dari tempat
 *     tampilnya. Poster dibatasi 1400px, logo 600px, foto orang 800px.
 *
 * GIF dilewati konversinya (animasinya hilang kalau dipaksa jadi WebP statis)
 * dan hanya disalin bila dirujuk.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const OLD_PUBLIC = join(here, "..", "..", ".old", "public");
const GEN = join(here, "..", "src", "content", "generated");
const OUT = join(here, "..", "public", "media");

const readJSON = (f) => JSON.parse(readFileSync(join(GEN, f), "utf8"));

/* ── 1. Kumpulkan rujukan ──────────────────────────────────────────── */

const refs = new Set();
const note = (p) => {
  if (typeof p !== "string" || !p.trim()) return;
  if (/^https?:/i.test(p)) return; // aset luar, bukan urusan skrip ini
  refs.add(p.replace(/^\.?\//, "")); // "./assets/images/x.png" → "assets/images/x.png"
};

for (const e of readJSON("events.json")) {
  note(e.poster);
  note(e.venueImage);
}
for (const i of readJSON("newsletter-issues.json")) note(i.cover);
for (const c of readJSON("newsletter-cards.json")) note(c.cover);
for (const a of readJSON("affiliates.json")) {
  note(a.logo);
  // Foto dokumentasi di badan halaman mitra (MIYIO memasang dua).
  for (const img of a.images ?? []) note(img);
}
for (const p of readJSON("partners.json")) note(p.logo);
for (const h of readJSON("event-highlights.json")) note(h.poster);

// Seluruh isi `photos`, bukan foto utamanya saja: sejak ekstraktor memanen
// photo1..photo4, foto ketiga dan keempat tiap orang ikut ditampilkan di
// halaman tim, jadi berkasnya harus ikut dikonversi juga.
const walkPeople = (nodes) => {
  for (const n of nodes) {
    for (const p of n.photos ?? [n.photo]) note(p);
    walkPeople(n.children ?? []);
  }
};
walkPeople(readJSON("org-structure.json"));

// expertTeam.json hanya nama berkas, tanpa folder.
for (const f of readJSON("expert-images.json")) {
  if (typeof f === "string") note(`assets/images/team/${f}`);
}

// Logo IYSA dipakai footer & header versi lama; simpan keduanya.
note("assets/images/logo/iysa_white_logo.WebP");
note("assets/images/logo/iysa_logo.WebP");

/* ── 2. Aturan ukuran per folder ───────────────────────────────────── */

const widthFor = (rel) => {
  if (rel.includes("/poster/")) return 1400;
  if (rel.includes("/newsletter/")) return 1000;
  if (rel.includes("/team/")) return 800;
  if (rel.includes("/venue/")) return 1200;
  if (rel.includes("/logo")) return 600; // logo & "logo afiliasi"
  return 1200;
};

/* ── 3. Proses ─────────────────────────────────────────────────────── */

const map = {}; // jalur lama → jalur baru
let inBytes = 0;
let outBytes = 0;
let converted = 0;
let copied = 0;
const missing = [];

/** Nama keluaran yang aman: huruf kecil, tanpa spasi, selalu .webp. */
const outName = (rel) => {
  const stem = basename(rel, extname(rel))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const folder = rel.includes("/")
    ? rel.split("/").slice(-2, -1)[0].toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : "lain";
  return `${folder}/${stem}`;
};

/**
 * Data lama menunjuk berkas yang sebagian tidak ada. Dua sebab berbeda:
 *
 *   - ekstensi salah tulis — `ispc.WebP` padahal berkasnya `ispc.jpeg`;
 *   - berkasnya memang tidak pernah ada — `os2mn.WebP` tidak ada di repo.
 *
 * Yang pertama bisa dipulihkan dengan aman: nama tanpa ekstensi sama persis.
 * Yang kedua TIDAK ditebak. Mencocokkan `YISF.WebP` ke `yisf2026.png` secara
 * kira-kira berisiko menempelkan poster tahun lain ke event yang salah, dan
 * poster yang salah lebih buruk daripada tidak ada poster. Keduanya dicatat di
 * laporan supaya bisa dibereskan dari sumbernya.
 */
const indexByStem = new Map();
const indexDir = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) indexDir(p);
    else {
      const stem = basename(e.name, extname(e.name)).toLowerCase();
      const key = `${dirname(p)}::${stem}`;
      if (!indexByStem.has(key)) indexByStem.set(key, p);
    }
  }
};
indexDir(join(OLD_PUBLIC, "assets"));

/** Kembalikan jalur nyata untuk satu rujukan, atau null. */
const resolve = (rel) => {
  const direct = join(OLD_PUBLIC, rel);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;

  // Ekstensi salah: cari nama yang sama di folder yang sama.
  const stem = basename(rel, extname(rel)).toLowerCase();
  return indexByStem.get(`${dirname(direct)}::${stem}`) ?? null;
};

const wrongExt = [];

for (const rel of [...refs].sort()) {
  if (rel === "-" || rel.length < 4) continue; // rujukan kosong di data lama

  const src = resolve(rel);
  if (!src) {
    missing.push(rel);
    continue;
  }
  if (!src.endsWith(rel)) wrongExt.push(`${rel} → ${basename(src)}`);

  const ext = extname(src).toLowerCase(); // dari berkas nyata, bukan rujukan
  const stem = outName(rel);
  mkdirSync(join(OUT, dirname(stem)), { recursive: true });

  inBytes += statSync(src).size;

  // GIF: animasi tidak boleh hilang, jadi disalin apa adanya.
  if (ext === ".gif") {
    const dest = join(OUT, `${stem}.gif`);
    copyFileSync(src, dest);
    outBytes += statSync(dest).size;
    map[rel] = `/media/${stem}.gif`;
    copied++;
    continue;
  }

  const dest = join(OUT, `${stem}.webp`);
  try {
    await sharp(src)
      .rotate() // hormati EXIF orientation sebelum resize
      .resize({ width: widthFor(rel), withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(dest);
    outBytes += statSync(dest).size;
    map[rel] = `/media/${stem}.webp`;
    converted++;
  } catch (err) {
    console.warn(`  ! gagal mengubah ${rel}: ${err.message}`);
    missing.push(rel);
  }
}

writeFileSync(join(GEN, "asset-map.json"), JSON.stringify(map, null, 2) + "\n");

/* ── 4. Laporan ────────────────────────────────────────────────────── */

const mb = (b) => (b / 1024 / 1024).toFixed(1) + " MB";
const dirSize = (d) => {
  let s = 0;
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    s += e.isDirectory() ? dirSize(p) : statSync(p).size;
  }
  return s;
};

const oldTotal = dirSize(join(OLD_PUBLIC, "assets"));

console.log(`
Aset
  seluruh folder lama        ${mb(oldTotal)}
  benar-benar dirujuk data   ${refs.size} berkas · ${mb(inBytes)}
  dihasilkan                 ${converted} dikonversi + ${copied} disalin · ${mb(outBytes)}

  turun dari seluruh folder   ${mb(oldTotal)} → ${mb(outBytes)}  (−${(100 - (outBytes / oldTotal) * 100).toFixed(1)}%)
  turun dari yang dirujuk     ${mb(inBytes)} → ${mb(outBytes)}  (−${(100 - (outBytes / inBytes) * 100).toFixed(1)}%)
  tidak ikut                  ${mb(oldTotal - inBytes)} aset tak terpakai, termasuk dua .zip
${wrongExt.length ? `\n  EKSTENSI SALAH TULIS DI DATA LAMA (${wrongExt.length}) — dipulihkan otomatis:\n${wrongExt.map((m) => "    - " + m).join("\n")}` : ""}
${missing.length ? `\n  BERKAS TIDAK ADA DI REPO (${missing.length}) — perlu diunggah ulang, TIDAK ditebak:\n${missing.map((m) => "    - " + m).join("\n")}` : ""}
`);

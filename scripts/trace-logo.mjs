/**
 * Menelusuri lambang IYSA dari raster jadi vektor.
 *
 *   node scripts/trace-logo.mjs            (npm run trace:logo)
 *
 * Sumbernya satu-satunya berkas lambang yang dimiliki IYSA:
 * `logo iysa tanpa logo type.png`, 472×512, RGBA. Tidak ada versi vektornya
 * di mana pun — sudah dicari di seluruh repo lama, dan satu-satunya `.svg`
 * di sana ternyata logo React bawaan create-react-app.
 *
 * ── Kenapa ditelusuri per warna ──────────────────────────────────────────
 *
 * potrace hanya bisa memisahkan gelap dari terang: satu bitmap jadi satu
 * bentuk. Lambang ini punya lima warna, jadi rasternya dipecah dulu jadi lima
 * masker — tiap piksel dimasukkan ke kelas warna terdekat — lalu tiap masker
 * ditelusuri sendiri.
 *
 * Karena tiap piksel hanya masuk SATU kelas, kelima hasilnya saling lepas dan
 * menutup bidang yang sama persis dengan rasternya. Itu sebabnya bentuk
 * aslinya kembali utuh tanpa perlu menebak urutan tumpukan: orbit teal dan
 * coral memang terputus di tempat navy lewat di depannya, dan keterputusan
 * itu ikut tertelusuri apa adanya.
 *
 * ── Kenapa bukan digambar ulang dari geometri ────────────────────────────
 *
 * Versi sebelumnya menyusun lambang dari tiga elips dan tiga lingkaran.
 * Bentuknya mendekati, tapi tetap tiruan: proporsi orbit, tebal garis yang
 * menyempit di ujung, dan bola dunia berbenua tidak pernah persis. Untuk
 * lambang organisasi, "mendekati" bukan standar yang benar.
 *
 * ── Keluaran ─────────────────────────────────────────────────────────────
 *
 *   public/media/logo/iysa-mark-traced.svg   lambang vektor penuh
 *   src/content/generated/logo-paths.json    path + warna, dipakai 2D & 3D
 *
 * Yang kedua itu yang dipakai komponen React dan objek 3D-nya, supaya
 * keduanya memakai bentuk yang sama persis dan tidak bisa menyimpang.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import potrace from "potrace";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");

const SUMBER =
  process.env.LOGO_SRC ??
  "/Users/kimen/Documents/IYSA/Dashboard IYSA/logo iysa tanpa logo type.png";

/* ── Kelas warna ────────────────────────────────────────────────────────
 *
 * Diambil dari histogram raster aslinya, bukan dikira: navy 32,8% ·
 * teal 25,5% · coral 18,8% · putih 4,6% · hitam 3,9% dari 74.544 piksel
 * tak transparan. Urutan di sini = urutan gambar; putih (badan bola dunia)
 * lebih dulu, benua hitam di atasnya. */
const KELAS = [
  { nama: "bola-badan", rgb: [255, 255, 255], peran: "globe-body" },
  { nama: "teal", rgb: [48, 192, 192], peran: "orbit" },
  { nama: "coral", rgb: [240, 96, 72], peran: "orbit" },
  { nama: "navy", rgb: [48, 96, 144], peran: "orbit" },
  { nama: "bola-benua", rgb: [24, 24, 24], peran: "globe-ink" },
];

const jarak = (a, b) => {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
};

/** Telusuri satu masker jadi data path. potrace dibungkus jadi Promise. */
const telusuri = (buf) =>
  new Promise((res, rej) => {
    potrace.trace(
      buf,
      {
        // turdSize membuang bercak kecil sisa anti-alias. 8 piksel cukup
        // untuk membersihkan tanpa memakan detail benua bola dunia.
        turdSize: 8,
        alphaMax: 1,
        optCurve: true,
        optTolerance: 0.2,
        threshold: 128,
      },
      (err, svg) => (err ? rej(err) : res(svg)),
    );
  });

/**
 * Ambil data path DAN aturan isiannya.
 *
 * `fill-rule` wajib ikut. potrace mengeluarkan lubang — benua di dalam bola
 * dunia, ruang di dalam lengkung orbit — sebagai sub-path di dalam `d` yang
 * sama, dan mengandalkan `evenodd` untuk melubanginya. Kalau hanya `d` yang
 * diambil, aturan bawaan `nonzero` menutup semua lubang dan bola dunia
 * berbenua berubah jadi cakram hitam pekat. Persis itu yang terjadi di
 * percobaan pertama.
 */
const ambilPath = (svg) => {
  const d = [...svg.matchAll(/ d="([^"]+)"/g)].map((x) => x[1]).join(" ");
  const aturan = svg.match(/fill-rule="([^"]+)"/)?.[1] ?? "evenodd";
  return { d, aturan };
};

/* ── Jalankan ───────────────────────────────────────────────────────────── */

const { data, info } = await sharp(SUMBER).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

console.log(`\nMenelusuri ${SUMBER.split("/").pop()} — ${W}×${H}\n`);

const hasil = [];

for (const kelas of KELAS) {
  // Masker: piksel milik kelas ini jadi HITAM, sisanya PUTIH.
  // potrace menelusuri yang gelap.
  const masker = Buffer.alloc(W * H, 255);
  let jumlah = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    if (data[i + 3] < 128) continue; // transparan: bukan milik siapa pun
    const px = [data[i], data[i + 1], data[i + 2]];

    let terdekat = null;
    let min = Infinity;
    for (const k of KELAS) {
      const d = jarak(px, k.rgb);
      if (d < min) {
        min = d;
        terdekat = k.nama;
      }
    }
    if (terdekat === kelas.nama) {
      masker[p] = 0;
      jumlah++;
    }
  }

  if (jumlah === 0) {
    console.log(`  ${kelas.nama.padEnd(12)} tidak ada piksel — dilewati`);
    continue;
  }

  const png = await sharp(masker, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  const svg = await telusuri(png);
  const { d, aturan } = ambilPath(svg);

  hasil.push({ nama: kelas.nama, peran: kelas.peran, d, aturan });
  console.log(
    `  ${kelas.nama.padEnd(12)} ${String(jumlah).padStart(6)} piksel  →  ${String(d.length).padStart(6)} karakter path`,
  );
}

/* ── Tulis ──────────────────────────────────────────────────────────────── */

const WARNA = {
  navy: "var(--logo-navy)",
  teal: "var(--logo-teal)",
  coral: "var(--logo-coral)",
  "bola-badan": "var(--logo-globe-badan)",
  "bola-benua": "var(--logo-globe)",
};

mkdirSync(join(ROOT, "public", "media", "logo"), { recursive: true });
mkdirSync(join(ROOT, "src", "content", "generated"), { recursive: true });

/* Dua palet, dan SVG-nya memilih sendiri.
 *
 * Lambang ini dipakai lewat <img>, jadi ia tidak bisa membaca token CSS
 * halaman. Tapi @media di DALAM berkas SVG tetap berlaku, jadi satu berkas
 * bisa melayani kedua tema — pola yang sama dengan src/app/icon.svg.
 *
 * Tanpa ini, badan bola dunia (#ffffff) dan benuanya (#0e1726) sama-sama
 * nyaris tak terlihat di latar gelap #0c1220. */
const TERANG_SVG = {
  navy: "#2f5490",
  teal: "#2e9c97",
  coral: "#ef5138",
  "bola-badan": "#f4f7fc",
  "bola-benua": "#0e1726",
};
const GELAP_SVG = {
  navy: "#7ea3e0",
  teal: "#4fc4bc",
  coral: "#ff7a5e",
  "bola-badan": "#0c1220",
  "bola-benua": "#eef2f9",
};

const kelasDari = (nama) => "l-" + nama.replace(/[^a-z]/g, "");

const svgPenuh = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
<style>
@media (prefers-color-scheme:dark){
${hasil.map((h) => `.${kelasDari(h.nama)}{fill:${GELAP_SVG[h.nama]}}`).join("")}
}
</style>
${hasil
  .map(
    (h) =>
      `<path class="${kelasDari(h.nama)}" fill="${TERANG_SVG[h.nama]}" fill-rule="${h.aturan}" d="${h.d}"/>`,
  )
  .join("\n")}
</svg>
`;

writeFileSync(join(ROOT, "public", "media", "logo", "iysa-mark-traced.svg"), svgPenuh);

writeFileSync(
  join(ROOT, "src", "content", "generated", "logo-paths.json"),
  JSON.stringify(
    { viewBox: `0 0 ${W} ${H}`, lebar: W, tinggi: H, lapisan: hasil.map((h) => ({ ...h, warna: WARNA[h.nama] })) },
    null,
    2,
  ) + "\n",
);

const kb = (n) => (n / 1024).toFixed(1) + " KB";
console.log(`
  public/media/logo/iysa-mark-traced.svg   ${kb(Buffer.byteLength(svgPenuh))}
  src/content/generated/logo-paths.json    ${hasil.length} lapisan

  Urutan lapisan = urutan gambar. Tiap piksel hanya masuk satu kelas, jadi
  lapisannya saling lepas dan menutup bidang yang sama dengan rasternya.
`);

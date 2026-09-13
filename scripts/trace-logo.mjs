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
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import potrace from "potrace";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");

const SUMBER =
  process.env.LOGO_SRC ??
  "/Users/kimen/Documents/IYSA/Dashboard IYSA/logo iysa tanpa logo type.png";

/**
 * Lockup lengkap: lambang + huruf "IYSA" + baris keterangan. Dipakai untuk
 * menelusuri wordmark-nya saja — lihat catatan di bagian bawah berkas ini.
 */
const SUMBER_LOCKUP =
  process.env.LOGO_LOCKUP_SRC ?? "/Users/kimen/Documents/IYSA/Dashboard IYSA/LOGO IYSA.png";

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

/* ── Wordmark "IYSA" ────────────────────────────────────────────────────
 *
 * Navbar sebelumnya menulis "IYSA" dengan Plus Jakarta Sans tebal — huruf
 * yang rapi, tapi BUKAN letterform merek IYSA. Pemilik situs menawarkan
 * berkas lockup lengkapnya; memakainya apa adanya sebagai gambar gagal karena
 * dua hal, dan keduanya terlihat begitu dirender pada ukuran navbar
 * sesungguhnya:
 *
 *   - baris "Indonesian Young Scientist Association" jadi bubur di 36px
 *   - seluruh teksnya gelap, jadi hilang ke latar di tema gelap situs ini
 *
 * Jadi hurufnya ditelusuri sendiri jadi satu path. Berkasnya dipakai sebagai
 * CSS mask, bukan gambar: warnanya datang dari `background-color`, sehingga
 * letterform-nya asli DAN ikut tema. Baris keterangannya sengaja tidak ikut.
 *
 * Koordinat potongnya terikat pada berkas lockup 1280×719 yang ada sekarang.
 * Kalau berkasnya diganti, periksa ulang — skrip ini menolak hasil yang
 * rasionya jauh dari yang diharapkan alih-alih menulis wordmark yang salah.
 */
if (existsSync(SUMBER_LOCKUP)) {
  const POTONG = { left: 570, top: 110, width: 610, height: 250 };

  const dipotong = await sharp(SUMBER_LOCKUP).extract(POTONG).toBuffer();
  const dirapikan = await sharp(dipotong).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  const { data: pikselW, info: infoW } = await sharp(dirapikan.data)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rasio = infoW.width / infoW.height;
  if (rasio < 2.5 || rasio > 3.4) {
    console.error(
      `\nWordmark hasil potong rasionya ${rasio.toFixed(2)} — di luar rentang wajar (2,5–3,4).\n` +
        `Koordinat potong kemungkinan tidak cocok lagi dengan berkas lockup.\n`,
    );
    process.exit(1);
  }

  // Untuk CSS mask yang menentukan cuma bentuknya; warnanya datang dari CSS.
  const maskerW = Buffer.alloc(infoW.width * infoW.height, 255);
  for (let i = 0, p = 0; i < pikselW.length; i += 4, p++) {
    if (pikselW[i + 3] > 128) maskerW[p] = 0;
  }

  const pngW = await sharp(maskerW, {
    raw: { width: infoW.width, height: infoW.height, channels: 1 },
  })
    .png()
    .toBuffer();

  const svgW = await telusuri(pngW);
  const { d: dW, aturan: aturanW } = ambilPath(svgW);

  const berkasW =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${infoW.width} ${infoW.height}">` +
    `<path fill="#000" fill-rule="${aturanW}" d="${dW}"/></svg>\n`;

  writeFileSync(join(ROOT, "public", "media", "logo", "iysa-wordmark.svg"), berkasW);

  console.log(
    `  public/media/logo/iysa-wordmark.svg      ${(Buffer.byteLength(berkasW) / 1024).toFixed(1)} KB` +
      `   ${infoW.width}×${infoW.height} (rasio ${rasio.toFixed(2)})\n`,
  );
} else {
  console.log(`  wordmark dilewati — berkas lockup tidak ada di ${SUMBER_LOCKUP}\n`);
}

/* ── Lockup lengkap ─────────────────────────────────────────────────────
 *
 * Navbar desktop memakai lockup resmi apa adanya: lambang + "IYSA" + baris
 * "Indonesian Young Scientist Association", satu gambar, tanpa teks tambahan
 * dari situs. Itu permintaan pemilik merek, dan ia yang berhak menentukan
 * mereknya tampil bagaimana.
 *
 * Dua hal yang dulu menggagalkan pemakaian PNG-nya langsung diselesaikan di
 * sini, bukan dihindari:
 *
 *   - Teksnya gelap, jadi lenyap ke latar di tema gelap. Ditelusuri jadi SVG
 *     berkelas, lalu @media di dalam berkasnya menukar paletnya sendiri —
 *     pola yang sama dengan iysa-mark-traced.svg.
 *   - Baris keterangan jadi bubur kalau lockup-nya dipaksa setinggi lambang
 *     saja. Karena itu komponennya memberi lockup TINGGI yang lebih besar dan
 *     hanya memakainya di lebar desktop; di ponsel yang tampil lambang saja.
 *
 * Baris keterangan berwarna nyaris hitam — sama dengan benua bola dunia —
 * padahal keduanya harus berperilaku berbeda di tema gelap: teksnya jadi
 * terang, benuanya harus tetap gelap karena duduk di atas badan bola yang
 * putih. Keduanya dipisah menurut posisi x: histogram kolom piksel hitam
 * kosong sama sekali antara x=380 dan x=579, jadi batas di 480 aman dan tidak
 * memotong apa pun.
 */
if (existsSync(SUMBER_LOCKUP)) {
  /** Kolom pemisah benua bola dunia (kiri) dari baris keterangan (kanan). */
  const BATAS_TEKS = 480;

  const KELAS_LOCKUP = [
    { nama: "bola-badan", rgb: [255, 255, 255] },
    { nama: "teal", rgb: [48, 192, 192] },
    { nama: "coral", rgb: [240, 96, 72] },
    { nama: "navy", rgb: [48, 96, 144] },
    { nama: "bola-benua", rgb: [24, 24, 24] },
  ];

  const { data: pikselL, info: infoL } = await sharp(SUMBER_LOCKUP)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: WL, height: HL } = infoL;

  // Kotak isi, supaya berkas hasilnya tidak membawa margin kosong yang
  // membuat tinggi CSS-nya berbohong.
  let x0 = WL, x1 = -1, y0 = HL, y1 = -1;
  for (let y = 0; y < HL; y++) {
    for (let x = 0; x < WL; x++) {
      const i = (y * WL + x) * 4;
      if (pikselL[i + 3] < 128) continue;
      if (pikselL[i] > 245 && pikselL[i + 1] > 245 && pikselL[i + 2] > 245) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }

  const lapisanL = [];
  for (const kelas of KELAS_LOCKUP) {
    // Benua dan teks keterangan berbagi warna, jadi kelas hitam ditelusuri
    // dua kali dengan potongan x yang berbeda.
    const bagian =
      kelas.nama === "bola-benua"
        ? [
            { nama: "bola-benua", dari: 0, sampai: BATAS_TEKS },
            { nama: "teks", dari: BATAS_TEKS, sampai: WL },
          ]
        : [{ nama: kelas.nama, dari: 0, sampai: WL }];

    for (const bag of bagian) {
      const masker = Buffer.alloc(WL * HL, 255);
      let jumlah = 0;
      for (let y = 0; y < HL; y++) {
        for (let x = 0; x < WL; x++) {
          const p = y * WL + x;
          const i = p * 4;
          if (pikselL[i + 3] < 128) continue;
          if (x < bag.dari || x >= bag.sampai) continue;
          const px = [pikselL[i], pikselL[i + 1], pikselL[i + 2]];
          let terdekat = null;
          let min = Infinity;
          for (const k of KELAS_LOCKUP) {
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
      }
      if (jumlah === 0) continue;

      const png = await sharp(masker, { raw: { width: WL, height: HL, channels: 1 } })
        .png()
        .toBuffer();
      const { d, aturan } = ambilPath(await telusuri(png));
      lapisanL.push({ nama: bag.nama, d, aturan });
      console.log(`  lockup ${bag.nama.padEnd(12)} ${String(jumlah).padStart(6)} piksel`);
    }
  }

  const TERANG_L = { ...TERANG_SVG, teks: "#1a1a1a" };
  const GELAP_L = { ...GELAP_SVG, teks: "#eef2f9" };

  const wL = x1 - x0 + 1;
  const hL = y1 - y0 + 1;
  const berkasL =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${wL} ${hL}">` +
    `<style>@media (prefers-color-scheme:dark){` +
    lapisanL.map((l) => `.${kelasDari(l.nama)}{fill:${GELAP_L[l.nama]}}`).join("") +
    `}</style>` +
    lapisanL
      .map(
        (l) =>
          `<path class="${kelasDari(l.nama)}" fill="${TERANG_L[l.nama]}" fill-rule="${l.aturan}" d="${l.d}"/>`,
      )
      .join("") +
    `</svg>\n`;

  writeFileSync(join(ROOT, "public", "media", "logo", "iysa-lockup.svg"), berkasL);
  console.log(
    `\n  public/media/logo/iysa-lockup.svg        ${(Buffer.byteLength(berkasL) / 1024).toFixed(1)} KB` +
      `   ${wL}×${hL} (rasio ${(wL / hL).toFixed(2)})\n`,
  );
}

/**
 * Menguji kontras palet terhadap WCAG 2.1.
 * Tidak ada warna yang dipakai di situs ini sebelum lolos di sini.
 *
 *   node scripts/contrast.mjs
 *
 * Ambang: AA teks normal 4.5 · AA teks besar (>=24px atau >=18.66px bold) 3.0
 *         AA komponen non-teks (garis, ikon, batas fokus) 3.0
 */

const hex = (h) => {
  const s = h.replace("#", "");
  const n = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Luminансi relatif menurut definisi WCAG.
const lum = (h) => {
  const [r, g, b] = hex(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/* ── palet ─────────────────────────────────────────────────────────── */

const light = {
  // latar
  bg: "#FFFFFF",
  bgSunk: "#F6F8FB",
  // tinta
  ink: "#0E1726",
  inkMuted: "#4A5568",
  inkFaint: "#6B7687",
  // merek
  navy: "#0B2948",
  teal: "#1F5FAE",
  coral: "#C2410C",
  // garis dekoratif — pemisah seksi, bukan batas komponen
  line: "#CDD6E2",
  // batas komponen interaktif (input, select, tombol bergaris) + cincin fokus
  border: "#7E8A9E",
  focus: "#1F5FAE",
};

const dark = {
  bg: "#0C1220",
  bgSunk: "#131C2E",
  ink: "#EEF2F9",
  inkMuted: "#A8B4C8",
  inkFaint: "#8B97AB",
  navy: "#A9C2F0",
  teal: "#8AB8FF",
  coral: "#FF8A63",
  line: "#2E3B57",
  border: "#64758F",
  focus: "#5FC9C0",
};

/* ── pasangan yang benar-benar dipakai di situs ────────────────────── */

const pairs = (t) => [
  // [nama, depan, belakang, ambang, catatan]
  ["teks badan", t.ink, t.bg, 4.5, "p, li"],
  ["teks badan di latar cekung", t.ink, t.bgSunk, 4.5, "seksi bergaris"],
  ["teks redup", t.inkMuted, t.bg, 4.5, "keterangan, metadata"],
  ["teks redup di latar cekung", t.inkMuted, t.bgSunk, 4.5, ""],
  ["teks pudar", t.inkFaint, t.bg, 4.5, "label mono kecil"],
  ["judul navy", t.navy, t.bg, 4.5, "h1–h3 (diuji sbg teks normal)"],
  ["judul navy di latar cekung", t.navy, t.bgSunk, 4.5, ""],
  ["tautan teal", t.teal, t.bg, 4.5, "tautan dalam teks"],
  ["tautan teal di latar cekung", t.teal, t.bgSunk, 4.5, ""],
  ["coral sbg teks", t.coral, t.bg, 4.5, "satu aksi per layar"],

  // WCAG 1.4.11 — batas komponen antarmuka dan penanda fokus wajib 3:1.
  // Diuji terhadap kedua latar, karena formulir muncul di latar cekung juga.
  ["batas input", t.border, t.bg, 3.0, "1.4.11 komponen"],
  ["batas input di latar cekung", t.border, t.bgSunk, 3.0, "1.4.11 komponen"],
  ["cincin fokus", t.focus, t.bg, 3.0, "1.4.11 fokus"],
  ["cincin fokus di latar cekung", t.focus, t.bgSunk, 3.0, "1.4.11 fokus"],
];

/* Garis dekoratif (--line) sengaja TIDAK diuji pada 3:1.
 * WCAG 1.4.11 mengatur batas komponen antarmuka dan penanda status — bukan
 * pemisah visual. Garis 1px antar seksi di situs ini tidak membawa informasi:
 * setiap seksi sudah dipisahkan judul dan ruang. Menggelapkannya sampai 3:1
 * justru memecah halaman menjadi kotak-kotak dan merusak ruang putih lega
 * yang jadi inti desainnya. Kalau suatu garis PERNAH jadi satu-satunya penanda
 * batas sebuah kontrol, pakai --border, bukan --line. */

// Tombol: teks di atas blok warna merek.
const buttons = (t, mode) => {
  const onNavy = mode === "light" ? "#FFFFFF" : "#0C1220";
  const onCoral = mode === "light" ? "#FFFFFF" : "#2A0A02";
  const onTeal = mode === "light" ? "#FFFFFF" : "#05221F";
  return [
    ["tombol navy", onNavy, t.navy, 4.5, "teks di atas isian navy"],
    ["tombol coral", onCoral, t.coral, 4.5, "ajakan utama"],
    ["tombol teal", onTeal, t.teal, 4.5, "ajakan kedua"],
  ];
};

/* ── lambang ───────────────────────────────────────────────────────────
 *
 * Warna lambang DILAPORKAN tapi TIDAK menggagalkan build, dan itu bukan
 * kelonggaran: WCAG 1.4.11 secara eksplisit mengecualikan logotype —
 * "Logotypes: Text that is part of a logo or brand name has no contrast
 * requirement." Memaksa lambang lolos ambang teks berarti mengubah warna
 * merek demi aturan yang memang tidak mengaturnya.
 *
 * Tapi lambang yang tidak terlihat tetap lambang yang gagal, jadi angkanya
 * tetap dicetak. Nilai di globals.css dipilih supaya ketiganya ≥3:1 di kedua
 * tema — warna asli logo tidak bisa: teal #30b4b4 hanya 2,53:1 di putih, dan
 * navy #305490 hanya 2,49:1 di latar gelap. */

const lambang = {
  light: { navy: "#2f5490", teal: "#2e9c97", coral: "#ef5138", globe: "#0e1726" },
  dark: { navy: "#7ea3e0", teal: "#4fc4bc", coral: "#ff7a5e", globe: "#eef2f9" },
};

const laporLambang = () => {
  console.log("\nLAMBANG — dilaporkan, tidak menggagalkan (WCAG 1.4.11 mengecualikan logotype)");
  console.log("─".repeat(74));
  for (const [mode, set] of Object.entries(lambang)) {
    const bg = mode === "light" ? light.bg : dark.bg;
    const sunk = mode === "light" ? light.bgSunk : dark.bgSunk;
    for (const [nama, warna] of Object.entries(set)) {
      const r = ratio(warna, bg);
      const rs = ratio(warna, sunk);
      console.log(
        "  " +
          `${mode}/${nama}`.padEnd(32) +
          r.toFixed(2).padStart(7) +
          rs.toFixed(2).padStart(8) +
          "   " +
          (Math.min(r, rs) >= 3 ? "terbaca" : "TIPIS — periksa mata, bukan skrip"),
      );
    }
  }
  console.log("  " + "(kolom: latar biasa · latar cekung)".padStart(56));
};

/* ── jalankan ──────────────────────────────────────────────────────── */

let fail = 0;

const run = (label, tokens, mode) => {
  console.log(`\n${label}`);
  console.log("─".repeat(74));
  console.log(
    "  " + "pasangan".padEnd(32) + "rasio".padStart(7) + "  ambang".padEnd(9) + " hasil",
  );
  for (const [name, fg, bg, min, note] of [...pairs(tokens), ...buttons(tokens, mode)]) {
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) fail++;
    console.log(
      "  " +
        name.padEnd(32) +
        r.toFixed(2).padStart(7) +
        "   ≥ " +
        min.toFixed(1).padEnd(5) +
        (ok ? " LOLOS" : " GAGAL") +
        (note ? "   " + note : ""),
    );
  }
};

run("TEMA TERANG", light, "light");
run("TEMA GELAP", dark, "dark");
laporLambang();

console.log(
  "\n" +
    (fail === 0
      ? "Semua pasangan lolos WCAG AA.\n"
      : `${fail} pasangan GAGAL — palet belum boleh dipakai.\n`),
);
process.exit(fail === 0 ? 0 : 1);

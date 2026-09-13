/**
 * Mengeluarkan konten yang terkunci di dalam komponen React situs lama
 * menjadi data JSON. Dijalankan sekali saat migrasi; disimpan supaya
 * hasilnya bisa ditelusuri ulang dan diperiksa.
 *
 *   node scripts/extract-legacy.mjs
 *
 * Sumber : ../.old/src  (sparse checkout iysaofficial/Iysa @ main)
 * Keluaran: src/content/generated/*.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OLD = join(here, "..", "..", ".old", "src");
const OUT = join(here, "..", "src", "content", "generated");
mkdirSync(OUT, { recursive: true });

const read = (p) => readFileSync(join(OLD, p), "utf8");
const readJSON = (p) => JSON.parse(read(p));
const write = (name, data) => {
  writeFileSync(join(OUT, name), JSON.stringify(data, null, 2) + "\n");
  const n = Array.isArray(data) ? data.length : Object.keys(data).length;
  console.log(`  ${name.padEnd(26)} ${String(n).padStart(4)} entri`);
};

/* ── alat bantu teks ───────────────────────────────────────────────── */

// Buang komentar JSX {/* ... */} dan komentar blok biasa.
const stripComments = (s) =>
  s.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

// JSX memecah satu kalimat jadi banyak baris berindentasi. Satukan kembali,
// rapikan entitas HTML, lalu normalkan spasi.
const tidy = (s) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\{"\s*"\}|\{" "\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/* ── 1. Mitra afiliasi: 13 komponen → 13 rekaman ───────────────────── */

function affiliates() {
  const dir = join(OLD, "components", "Allaffiliationweb");
  const out = [];

  for (let i = 1; i <= 13; i++) {
    const file = join(dir, `EventAffiliation${i}.js`);
    if (!existsSync(file)) {
      console.warn(`  ! EventAffiliation${i}.js tidak ada — dilewati`);
      continue;
    }
    const raw = stripComments(readFileSync(file, "utf8"));

    // Nama lembaga = <h3> pertama.
    const headings = [...raw.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => tidy(m[1]));
    const name = headings[0] ?? `Affiliate ${i}`;

    // Logo = <img src="..."> pertama.
    const logo = raw.match(/<img[^>]*?src=["']([^"']+)["']/)?.[1] ?? null;

    // Deskripsi = gabungan <p> yang panjangnya layak (buang label galeri).
    const paras = [...raw.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
      .map((m) => tidy(m[1]))
      .filter((t) => t.length > 60 && !/^Gallery of/i.test(t));

    // Video after-event.
    const videos = [...raw.matchAll(/youtube\.com\/embed\/([\w-]{6,})/g)].map((m) => m[1]);

    // Tautan galeri Drive.
    const gallery = [...raw.matchAll(/https:\/\/drive\.google\.com\/[^"'\s]+/g)].map((m) =>
      m[0].replace(/[",]+$/, ""),
    );

    // Judul seksi selain nama lembaga, mis. "After Event 2024".
    const sections = headings.slice(1);

    out.push({
      id: i,
      legacyPath: `/EventAffiliationPage${i}`,
      slug: slugify(name),
      name,
      logo,
      description: paras.join("\n\n"),
      words: paras.join(" ").split(/\s+/).filter(Boolean).length,
      videos,
      gallery,
      sections,
    });
  }
  return out;
}

/* ── 2. Newsletter: satu berkas, dua entitas ───────────────────────── */

// Kunci tahun ditulis sebagai kata Indonesia; PDF memakai nama bulan Inggris
// dengan beberapa nama bulan Indonesia yang tersisip (Juni, Maret, Mei).
const YEAR_KEY = {
  duapuluh: 2020,
  duapuluhsatu: 2021,
  duapuluhdua: 2022,
  duapuluhtiga: 2023,
  duapuluhempat: 2024,
  duapuluhlima: 2025,
  duapuluhenam: 2026,
};

const MONTH = {
  january: 1, february: 2, march: 3, maret: 3, april: 4, may: 5, mei: 5,
  june: 6, juni: 6, july: 7, juli: 7, august: 8, agustus: 8,
  september: 9, october: 10, oktober: 10, november: 11, december: 12, desember: 12,
};

function newsletters() {
  const src = readJSON("data/newsletter/NewsletterData.json");

  // (a) Kartu sampul per tahun — memegang tautan ke halaman detail lama.
  const cards = [];
  for (const [key, year] of Object.entries(YEAR_KEY)) {
    for (const item of src[key] ?? []) {
      cards.push({
        year,
        title: tidy(item.title ?? ""),
        cover: item.gambar ?? null,
        legacyPath: item.linkbtn ?? null,
      });
    }
  }

  // (b) Terbitan PDF — entitas sebenarnya.
  const issues = [];
  for (const [key, rows] of Object.entries(src)) {
    if (key in YEAR_KEY || !Array.isArray(rows) || !rows.length) continue;

    const m = key.match(/^Newsletter(.*?)(\d{4})$/);
    if (!m) continue;
    const [, label, yearStr] = m;
    const year = Number(yearStr);

    const batch = label.match(/^Batch(\d+)Edition$/);
    const monthName = label.toLowerCase();
    const month = MONTH[monthName] ?? null;

    for (const row of rows) {
      const link = String(row.linkpdf ?? "").trim();
      const driveId = link.match(/\/d\/([\w-]+)/)?.[1] ?? null;
      issues.push({
        legacyKey: key,
        year,
        month,
        batch: batch ? Number(batch[1]) : null,
        kind: batch ? "batch" : month ? "monthly" : "other",
        title: tidy(row.title ?? ""),
        cover: row.images ?? null,
        driveId,
        pdfPreview: link || null,
        // Lima terbitan 2022 tercatat di situs lama tanpa tautan PDF sama
        // sekali. Entrinya tetap dipertahankan — judul dan sampulnya nyata —
        // tapi ditandai supaya halaman tidak menyajikan pembaca kosong.
        hasPdf: Boolean(link),
      });
    }
  }

  // Urut terbaru dulu; terbitan bulanan sebelum batch di tahun yang sama.
  issues.sort(
    (a, b) => b.year - a.year || (b.month ?? 0) - (a.month ?? 0) || (a.batch ?? 0) - (b.batch ?? 0),
  );

  // Slug stabil & bisa dibaca manusia: iysa-newsletter-januari-2025
  const ID_MONTH = ["", "januari", "februari", "maret", "april", "mei", "juni",
    "juli", "agustus", "september", "oktober", "november", "desember"];
  const seen = new Set();
  for (const it of issues) {
    let base = it.batch
      ? `edisi-batch-${it.batch}-${it.year}`
      : it.month
        ? `${ID_MONTH[it.month]}-${it.year}`
        : slugify(it.title) || `terbitan-${it.year}`;
    let slug = base;
    let n = 2;
    while (seen.has(slug)) slug = `${base}-${n++}`;
    seen.add(slug);
    it.slug = slug;
  }

  // Sandingkan kartu sampul dengan terbitan lewat berkas sampul yang sama,
  // supaya rute lama /Newsletter2025DetailPage1 tahu slug barunya.
  for (const card of cards) {
    const hit = issues.find((i) => i.cover && card.cover && i.cover === card.cover);
    card.slug = hit?.slug ?? null;
  }

  return { issues, cards };
}

/* ── 3. Event: bakukan nilai yang tidak pernah dibakukan ───────────── */

const LEVEL = {
  nasional: "national", national: "national",
  internasional: "international", international: "international",
};

function normalizeLevel(raw) {
  const k = String(raw ?? "").trim().toLowerCase();
  return LEVEL[k] ?? null; // "Offline" yang tersesat ke kolom ini → null
}

function normalizeMode(raw) {
  const k = String(raw ?? "").trim().toLowerCase();
  if (!k) return { mode: null, city: null };
  if (k === "online") return { mode: "online", city: null };
  if (k === "hybrid") return { mode: "hybrid", city: null };
  if (k === "offline") return { mode: "onsite", city: null };
  return { mode: "onsite", city: String(raw).trim() }; // nama kota
}

function events() {
  const flatten = (src) =>
    Array.isArray(src) ? src : Object.values(src).flatMap((v) => (Array.isArray(v) ? v : [v]));

  const build = (row, origin) => {
    const { mode, city } = normalizeMode(row.Location);
    const strayLevel = normalizeLevel(row.Location); // tangkap "Offline" di EventType
    return {
      legacyId: row.id,
      origin,
      slug: slugify(row.title ?? `event-${row.id}`),
      title: tidy(row.title ?? ""),
      poster: row.image ?? null,
      level: normalizeLevel(row.EventType) ?? strayLevel ?? null,
      levelRaw: row.EventType ?? null,
      mode,
      city,
      locationRaw: row.Location ?? null,
      category: tidy(row.EventCategory ?? "") || null,
      dates: tidy(row.DateAdTime ?? "") || null,
      registrationEnds: tidy(row.RegistEndDate ?? "") || null,
      registrationUrl: row.LinkRegist || null,
      hashtags: (row.Hastag ?? "").split(/\s+/).filter((t) => t.startsWith("#")),
      venueName: tidy(row.NameLocation ?? "") || null,
      venueImage: row.ImageVeneu || null,
      mapsUrl: row.LinkGmaps || null,
      mapsEmbed: row.LinkGmapsEmbed || null,
    };
  };

  const main = flatten(readJSON("data/event/EventPosterDetail.json")).map((r) => build(r, "iysa"));
  const affil = flatten(readJSON("data/eventaffiliasi/EventPosterDetailAffiliasi.json")).map((r) =>
    build(r, "affiliate"),
  );

  // Slug unik di seluruh gabungan.
  const seen = new Set();
  for (const e of [...main, ...affil]) {
    let s = e.slug, n = 2;
    while (seen.has(s)) s = `${e.slug}-${n++}`;
    seen.add(s);
    e.slug = s;
  }

  const highlights = flatten(readJSON("data/event/EventPoster.json")).map((r) => ({
    legacyId: r.id,
    title: tidy(r.title ?? ""),
    poster: r.image ?? null,
    level: normalizeLevel(r.level),
    location: tidy(r.location ?? "") || null,
    date: tidy(r.date ?? "") || null,
    link: r.link || null,
  }));

  return { events: [...main, ...affil], highlights };
}

/* ── 4. Sisa data: bentuknya sudah layak, cukup dirapikan ──────────── */

function misc() {
  // Tiap kelompok FAQ memakai ruas bernomor sendiri: question/question2/
  // question3 dengan answer/answer2/answer3. Ambil apa pun yang cocok polanya.
  const FAQ_GROUP = {
    faqData: "registration",
    faqData2: "presentation",
    faqData3: "results",
  };
  const faqSrc = readJSON("data/faq/Faq.json");
  const faq = [];
  for (const [key, rows] of Object.entries(faqSrc)) {
    if (!Array.isArray(rows) || !rows.length) continue;
    for (const r of rows) {
      const qKey = Object.keys(r).find((k) => /^question\d*$/.test(k));
      const aKey = Object.keys(r).find((k) => /^answer\d*$/.test(k));
      if (!qKey || !r[qKey]) continue;
      faq.push({
        group: FAQ_GROUP[key] ?? key,
        question: tidy(r[qKey]),
        answer: tidy(aKey ? (r[aKey] ?? "") : ""),
      });
    }
  }

  const videoSrc = readJSON("data/gallery/Video.json");
  const videos = [];
  for (const [key, rows] of Object.entries(videoSrc)) {
    const year = Number(key.replace(/\D/g, "")) || null;
    for (const r of rows ?? []) {
      const id = String(r.src ?? "").match(/(?:embed\/|v=|youtu\.be\/)([\w-]{6,})/)?.[1] ?? null;
      videos.push({
        year,
        title: tidy(r.title ?? ""),
        description: tidy(r.content ?? "") || null,
        youtubeId: id,
        srcRaw: r.src ?? null,
      });
    }
  }
  videos.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  /**
   * Logo afiliasi diambil dari DUA KOMPONEN, bukan dari AffiliationLogo.json.
   *
   * JSON itu sisa yang tidak pernah dipakai, dan isinya rusak: 41 entri yang
   * hanya menunjuk 9 berkas, 26 di antaranya `about-logo.png` alias logo IYSA
   * sendiri, dan bagian "International"-nya berisi kampus Indonesia yang sama
   * persis dengan bagian "National". Merender dari sana menghasilkan lambang
   * IYSA berulang 26 kali di bawah judul "institusi mitra".
   *
   * Yang benar-benar tampil di situs lama di-hardcode sebagai daftar <img> di
   * `National-affiliation.js` dan `International-affiliation.js` — lengkap
   * dengan sebagian yang sengaja dikomentari (PPI, UINN, UINUJ, UNY, its,
   * asti, fna, dan lainnya). `stripComments` membuangnya lebih dulu, jadi yang
   * ikut hanya yang memang ditampilkan.
   *
   * Nama institusinya ada di nama berkas, bukan di data. Disimpan apa adanya
   * sebagai `legacyName` supaya bisa dilacak; nama tampilan yang rapi
   * dipetakan di `src/content/partners.ts`, pola yang sama dengan
   * `affiliateNames`.
   */
  const logoAfiliasi = (berkas, scope) => {
    const isi = stripComments(read(`components/home/${berkas}`));
    const src = [...isi.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
    // Satu berkas bisa muncul dua kali di markah lama (unikom); ambil sekali.
    return [...new Set(src)].map((logo) => ({
      scope,
      logo,
      legacyName: logo
        .split("/")
        .pop()
        .replace(/\.[^.]+$/, ""),
    }));
  };

  const partners = [
    ...logoAfiliasi("National-affiliation.js", "national"),
    ...logoAfiliasi("International-affiliation.js", "international"),
  ];

  const sites = (readJSON("data/eventwebsite/EventWebsite.json").EventWebsite ?? []).map((r) => ({
    name: tidy(r.WebsiteName ?? ""),
    type: tidy(r.EventType ?? "") || null,
    url: r.link ?? null,
  }));

  const affiliateSites = (
    readJSON("data/eventaffiliationwebsite/EventAffiliationWebsite.json").EventWebsite ?? []
  ).map((r) => ({
    name: tidy(r.WebsiteName ?? ""),
    type: tidy(r.EventType ?? "") || null,
    legacyPath: r.link ?? null,
  }));

  // Hierarki 5 tingkat dipertahankan apa adanya; hanya dirapikan.
  const walk = (node) => ({
    name: tidy(node.name ?? ""),
    position: tidy(node.position ?? ""),
    photo: node.photo1 ?? null,
    photoAlt: node.photo2 ?? null,
    children: (node.children ?? []).map(walk),
  });
  const team = readJSON("data/team/organizationStructure.json").map(walk);

  // expertTeam.json hanya senarai nama berkas, bukan data orang.
  const expertImages = readJSON("data/team/expertTeam.json");

  return { faq, videos, partners, sites, affiliateSites, team, expertImages };
}

/* ── jalankan ──────────────────────────────────────────────────────── */

console.log("\nMengeluarkan konten dari komponen lama:\n");

const aff = affiliates();
write("affiliates.json", aff);

const nl = newsletters();
write("newsletter-issues.json", nl.issues);
write("newsletter-cards.json", nl.cards);

const ev = events();
write("events.json", ev.events);
write("event-highlights.json", ev.highlights);

const m = misc();
write("faq.json", m.faq);
write("videos.json", m.videos);
write("partners.json", m.partners);
write("event-sites.json", m.sites);
write("affiliate-sites.json", m.affiliateSites);
write("org-structure.json", m.team);
write("expert-images.json", m.expertImages);

/* ── laporan mutu ──────────────────────────────────────────────────── */

const flat = (n) => [n, ...(n.children ?? []).flatMap(flat)];
const people = m.team.flatMap(flat).length;
const affWords = aff.reduce((s, a) => s + a.words, 0);
const unmapped = nl.cards.filter((c) => !c.slug).length;
const noLevel = ev.events.filter((e) => !e.level).length;

console.log(`
Ringkasan
  kata mitra terselamatkan   ${affWords}
  terbitan newsletter        ${nl.issues.length} (tanpa PDF: ${nl.issues.filter((i) => !i.hasPdf).length})
  FAQ                        ${m.faq.length} dalam ${new Set(m.faq.map((f) => f.group)).size} kelompok
  kartu sampul               ${nl.cards.length} (tanpa padanan: ${unmapped})
  event                      ${ev.events.length}  tanpa level: ${noLevel}
  level dibakukan            ${[...new Set(ev.events.map((e) => e.levelRaw))].filter(Boolean).join(" / ")}
  moda dibakukan             ${[...new Set(ev.events.map((e) => e.mode))].filter(Boolean).join(" / ")}
  orang di struktur          ${people}
`);

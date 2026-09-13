/**
 * Menarik hasil kurasi ajang IYSA dari SIMT — pangkalan data talenta nasional
 * milik Kemendikdasmen.
 *
 * ── Kenapa angkanya ditarik, bukan diketik ─────────────────────────────
 *
 * Seksi kurasi di beranda mengklaim sesuatu atas nama lembaga negara: bahwa
 * ajang IYSA sudah dikurasi, sebanyak sekian seri dan sekian edisi, sejak
 * tahun sekian. Angka yang diketik tangan akan basi diam-diam, dan yang basi
 * di sini bukan sekadar salah — ia klaim yang bisa dibantah dengan membuka
 * satu tautan yang situsnya sendiri pajang.
 *
 * Jadi angkanya datang dari sumber yang sama dengan yang dipakai pembaca untuk
 * mengecek: daftar kurasi publik SIMT. Jalankan `npm run tarik:kurasi` untuk
 * menyegarkannya; hasilnya masuk ke src/content/generated/kurasi-simt.json
 * berikut tanggal penarikan, jadi umur datanya selalu terbaca.
 *
 * ── Yang perlu diketahui tentang datanya ───────────────────────────────
 *
 * SIMT mengurasi per CABANG ajang, bukan per edisi. Satu edisi WSEEC dengan
 * tujuh bidang lomba muncul sebagai tujuh baris, dan bintangnya bisa berbeda
 * antar bidang di edisi yang sama — 91 dari 189 edisi begitu saat ini. Karena
 * itu tidak ada satu angka "bintang edisi": yang jujur hanyalah cakupannya
 * (berapa seri, berapa edisi, sejak kapan), dan pembaca dipersilakan membuka
 * SIMT untuk predikat per cabangnya.
 *
 * Nama penyelenggara di SIMT ditulis lengkap tanpa singkatan, dan hanya ada
 * SATU ejaan untuk IYSA. Pencocokan longgar berbahaya di sini: "Center for
 * Young Scientists" (CYS, Korea) juga mengandung "young scientist" dan punya
 * 138 baris sendiri. Jadi pencocokannya persis, bukan mengandung.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SUMBER = "https://simt.kemendikdasmen.go.id/api/v2/list-kurasi";
const HALAMAN_PUBLIK = "https://simt.kemendikdasmen.go.id/kurasi/advanced-search";

/** Ejaan persis penyelenggara di SIMT. Lihat catatan di atas. */
const PENYELENGGARA = "Indonesian Young Scientist Association";

const akar = join(dirname(fileURLToPath(import.meta.url)), "..");
const tujuan = join(akar, "src/content/generated/kurasi-simt.json");

/**
 * Singkatan ajang di SIMT tidak seragam: "WICE", "WICE 2024", "(GloCoLiS)",
 * "GloCoLis", "IIF NASIONAL". Tanpa dirapikan, satu seri terhitung beberapa
 * kali dan jumlah serinya jadi mengada-ada.
 */
function rapikanSingkatan(teks) {
  return (teks || "")
    .toUpperCase()
    .replace(/[()]/g, "")
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\bNASIONAL\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const jawaban = await fetch(`${SUMBER}?page=1&per_page=10000`, {
  headers: { accept: "application/json" },
});
if (!jawaban.ok) throw new Error(`SIMT menjawab ${jawaban.status}`);

const semua = (await jawaban.json())?.result?.list;
if (!Array.isArray(semua) || semua.length === 0) {
  throw new Error("SIMT tidak mengembalikan daftar kurasi");
}

const baris = semua.filter((r) => (r.organizer || "").trim() === PENYELENGGARA);
if (baris.length === 0) {
  // Berhenti, jangan tulis nol: berkas yang ada sekarang lebih benar daripada
  // seksi beranda yang tiba-tiba mengaku tidak pernah dikurasi.
  throw new Error(`Tidak ada baris untuk "${PENYELENGGARA}" — nama penyelenggaranya mungkin berubah`);
}

const seri = new Set();
const edisi = new Set();
const tahun = new Set();
for (const r of baris) {
  const s = rapikanSingkatan(r.short_name_of_competition);
  const th = (r.competition_start || "").slice(0, 4);
  if (s) seri.add(s);
  if (s && th) edisi.add(`${s}|${th}`);
  if (th) tahun.add(th);
}

const tahunUrut = [...tahun].sort();
const hasil = {
  _sumber: HALAMAN_PUBLIK,
  _api: SUMBER,
  _penyelenggara: PENYELENGGARA,
  _ditarik: new Date().toISOString().slice(0, 10),
  cabang: baris.length,
  seri: seri.size,
  edisi: edisi.size,
  tahunAwal: Number(tahunUrut[0]),
  tahunAkhir: Number(tahunUrut[tahunUrut.length - 1]),
};

await writeFile(tujuan, `${JSON.stringify(hasil, null, 2)}\n`);
console.log(
  `kurasi SIMT: ${hasil.cabang} cabang, ${hasil.seri} seri, ${hasil.edisi} edisi, ${hasil.tahunAwal}–${hasil.tahunAkhir}`,
);

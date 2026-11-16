/**
 * Seri, edisi, dan status event.
 *
 * Data event warisan tidak punya satu pun medan untuk ini: tidak ada seri,
 * tidak ada nomor edisi, tidak ada status. Yang ada hanya judul bebas dan dua
 * tanggal berbentuk teks. Modul ini menyimpulkan ketiganya dari situ — dan
 * mengakui ketika tidak bisa, alih-alih menebak.
 *
 * Kalau dasbor nanti menyiarkan edisinya lewat `/api/public/v1`, seluruh isi
 * berkas ini seharusnya diganti data sungguhan. Sampai itu terjadi, ini yang
 * ada.
 */

import type { IysaEvent } from "./data";
import { judulEvent } from "./teks-event";

/* ── Tanggal ────────────────────────────────────────────────────────────
 *
 * Tanggalnya ditulis manusia dalam dua bahasa, dengan akhiran urutan yang
 * kadang salah ("January 13rd"), koma yang kadang ada kadang tidak, dan
 * sebagian menyebut dua rentang sekaligus (daring dan luring). Yang dicari
 * cuma satu: kapan terakhirnya, supaya bisa dibandingkan dengan hari ini.
 */

const BULAN: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
  january: 1, february: 2, march: 3, may: 5, june: 6,
  july: 7, august: 8, october: 10, december: 12,
};

/**
 * Ambil tanggal TERAKHIR yang disebut sebuah teks.
 *
 * Dipakai nama bulan yang muncul paling belakang, karena teks seperti
 * "7 - 10 Oktober 2025 (Online), 15 - 18 Oktober 2025 (Offline)" menyebut dua
 * rentang dan yang menentukan selesai-tidaknya adalah yang terakhir.
 *
 * Hari dibiarkan 28 kalau tidak ketemu: cukup untuk membandingkan bulan, dan
 * tidak pernah membuat event tampak selesai lebih awal daripada seharusnya.
 */
export function uraiTanggal(teks: string | null): Date | null {
  if (!teks) return null;
  const l = teks.toLowerCase();

  const tahun = l.match(/\b(20\d{2})\b/)?.[1];
  if (!tahun) return null;

  let bulan: number | null = null;
  let posisi = -1;
  for (const [nama, nilai] of Object.entries(BULAN)) {
    const i = l.lastIndexOf(nama);
    if (i > posisi) {
      posisi = i;
      bulan = nilai;
    }
  }
  if (!bulan) return null;

  const sebelum = l.slice(Math.max(0, posisi - 12), posisi).match(/(\d{1,2})\D*$/);
  const sesudah = l.slice(posisi).match(/(\d{1,2})/);
  const hari = Number(sebelum?.[1] ?? sesudah?.[1] ?? 28);

  return new Date(Number(tahun), bulan - 1, hari);
}

export type StatusEvent = "terbuka" | "akan" | "selesai";

/**
 * Status sebuah event terhadap hari ini.
 *
 *   terbuka — pendaftaran masih dibuka
 *   akan    — acaranya belum lewat, tapi pendaftarannya sudah tutup atau
 *             tanggalnya tidak bisa dipastikan
 *   selesai — acaranya sudah lewat
 *
 * Tidak ada tebakan di antaranya: kalau tanggal pendaftaran tidak terurai,
 * event itu TIDAK pernah diklaim terbuka.
 */
export function statusEvent(e: IysaEvent, kini: Date = new Date()): StatusEvent {
  const tutupDaftar = uraiTanggal(e.registrationEnds);
  if (tutupDaftar && tutupDaftar >= kini) return "terbuka";

  const acara = uraiTanggal(e.dates);
  if (acara && acara >= kini) return "akan";

  return "selesai";
}

/** Kunci pengurutan: makin besar makin baru. */
export function waktuEvent(e: IysaEvent): number {
  return uraiTanggal(e.dates)?.getTime() ?? 0;
}

/* ── Seri ───────────────────────────────────────────────────────────────
 *
 * Judul IYSA memakai dua pola, dan keduanya harus ditangani:
 *
 *   AKRONIM (Nama Panjang) Tahun    → "IMSEF (International Mathematics…)"
 *   Nama Panjang (AKRONIM) Tahun    → "World Invention Competition (WICE)"
 *
 * Versi pertama pengekstrak ini hanya menangkap pola kedua, dan 20 dari 66
 * event jatuh ke "tanpa seri". Dengan kedua pola, 62 dari 66 tercakup.
 */

/**
 * Empat judul tidak mengikuti pola mana pun. Dipetakan tangan, dan sengaja
 * dibuat kecil serta terlihat — kalau daftar ini membesar, berarti polanya
 * yang perlu diperbaiki, bukan daftarnya yang perlu ditambah.
 */
const PETA_KHUSUS: Record<string, string> = {
  "5th WYIIA – World Youth Invention and Innovation Award": "WYIIA",
  "KOREA INTERNATIONAL WOMEN'S INVENTION EXPOSITION": "KIWIE",
  "Lomba Invensi & PTK": "Lomba Invensi & PTK",
  "IWC & I3C(World Cup Innovation & International Invention and Innovation Competition) 2026":
    "IWC & I3C",
};

export function akronimSeri(judul: string): string {
  const bersih = judulEvent(judul);
  const khusus = PETA_KHUSUS[bersih] ?? PETA_KHUSUS[judul.trim()];
  if (khusus) return khusus;

  // Pola A: akronim mendahului kurung pembuka.
  const depan = bersih.match(/^([A-Za-z0-9&']{2,12})\s*(?:ke-\d+\s*)?\(/);
  if (depan) return depan[1].toUpperCase();

  // Pola B: akronim di dalam kurung, satu kata.
  const dalam = bersih.match(/\(([A-Za-z0-9&'-]{2,12})\)/);
  if (dalam && /[A-Za-z]/.test(dalam[1]) && !/\s/.test(dalam[1])) {
    return dalam[1].toUpperCase().replace(/-/g, "");
  }

  // Tidak ketemu: judulnya sendiri jadi nama seri, tanpa mengarang akronim.
  return bersih.replace(/\s*\b20\d{2}\b\s*$/, "").trim();
}

/**
 * Nama panjang seri, diambil dari isi kurung kalau ada. Dipakai sebagai
 * keterangan di bawah akronim; kalau tidak ada, dikembalikan null supaya
 * barisnya tidak diisi teks karangan.
 */
/**
 * Nama panjang seri.
 *
 * Judul warisan memakai EMPAT susunan berbeda, dan ketiga yang pertama sempat
 * terlewat satu per satu sampai hasilnya diperiksa seri demi seri:
 *
 *   1. "IMSEF (International Mathematics…)"   nama di dalam kurung
 *   2. "(ISIF) International Science…"        nama SESUDAH kurung
 *   3. "Lomba Karya Tulis Ilmiah (LKTIN) 2026" nama SEBELUM kurung
 *   4. "KOREA INTERNATIONAL WOMEN'S…"          tanpa kurung sama sekali
 *
 * Mengembalikan null hanya kalau memang tidak ada nama selain akronimnya —
 * lebih baik barisnya kosong daripada diisi teks karangan.
 */
export function namaSeri(judul: string): string | null {
  const bersih = judulEvent(judul);
  const tanpaTahun = (s: string) => s.replace(/\s*\b20\d{2}\b\s*$/, "").replace(/[,\s]+$/, "").trim();

  // 2. "(AKRONIM) Nama Panjang"
  const sesudahKurung = bersih.match(/^\([A-Za-z0-9&'-]{2,12}\)\s*(.+)$/);
  if (sesudahKurung) {
    const sisa = tanpaTahun(sesudahKurung[1]);
    if (sisa.length >= 6) return sisa;
  }

  // 3. "Nama Panjang (AKRONIM) …"
  const sebelumKurung = bersih.match(/^(.+?)\s*\([A-Za-z0-9&'-]{2,12}\)/);
  if (sebelumKurung) {
    const sisa = tanpaTahun(sebelumKurung[1]);
    if (sisa.length >= 6) return sisa;
  }

  // 1. "AKRONIM (Nama Panjang)" — termasuk kurung yang lupa ditutup di data.
  const dalamKurung = bersih.match(/\(([^)]{6,})\)?/)?.[1]?.trim();
  if (dalamKurung && !/^[A-Z0-9&'-]+$/.test(dalamKurung)) return tanpaTahun(dalamKurung);

  // 4. Tanpa kurung: judulnya sendiri, kecuali judulnya memang cuma akronim.
  const polos = tanpaTahun(bersih);
  return polos && polos.toUpperCase() !== akronimSeri(judul).toUpperCase() ? polos : null;
}

export function slugSeri(akronim: string): string {
  return akronim
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type Seri = {
  akronim: string;
  slug: string;
  nama: string | null;
  edisi: IysaEvent[];
  /** Waktu edisi terbaru — dipakai mengurutkan seri. */
  terbaru: number;
};

/**
 * Kelompokkan event jadi seri, edisi terbaru lebih dulu di dalam tiap seri.
 *
 * Seri diurutkan menurut edisi terbarunya, lalu jumlah edisi: seri yang masih
 * berjalan tahun ini muncul di atas, dan arsip yang sudah berhenti turun ke
 * bawah dengan sendirinya tanpa perlu daftar manual.
 */
export function kelompokkanSeri(events: IysaEvent[]): Seri[] {
  const peta = new Map<string, IysaEvent[]>();

  for (const e of events) {
    const a = akronimSeri(e.title);
    const daftar = peta.get(a);
    if (daftar) daftar.push(e);
    else peta.set(a, [e]);
  }

  return [...peta.entries()]
    .map(([akronim, edisi]) => {
      const urut = [...edisi].sort((a, b) => waktuEvent(b) - waktuEvent(a));
      return {
        akronim,
        slug: slugSeri(akronim),
        nama: urut.map((e) => namaSeri(e.title)).find(Boolean) ?? null,
        edisi: urut,
        terbaru: waktuEvent(urut[0]),
      };
    })
    .sort((a, b) => b.terbaru - a.terbaru || b.edisi.length - a.edisi.length);
}

export function seriBySlug(events: IysaEvent[], slug: string): Seri | null {
  return kelompokkanSeri(events).find((s) => s.slug === slug) ?? null;
}

/**
 * Gabungkan seri warisan dengan seri yang hanya ada di dasbor.
 *
 * Daftar seri situs ini dibangun dari 66 edisi warisan situs lama, jadi seri
 * yang lahir setelah migrasi (mis. IASCAI) tidak punya tempat. Seri dasbor
 * yang tidak dikenal data warisan ditambahkan sebagai seri tanpa edisi
 * warisan; kartunya dan halamannya membaca dasbor.
 */
export function gabungSeriDashboard(
  seri: Seri[],
  dash: Iterable<{ akronim: string; nama: string; mulai: string | null; tahun: string }>,
): Seri[] {
  const ada = new Set(seri.map((s) => s.akronim.toUpperCase()));
  const slugAda = new Set(seri.map((s) => s.slug));
  const baru: Seri[] = [];
  for (const d of dash) {
    const slug = slugSeri(d.akronim);
    if (ada.has(d.akronim.toUpperCase()) || slugAda.has(slug)) continue;
    const waktu = d.mulai ? Date.parse(`${d.mulai}T00:00:00Z`) : Date.UTC(Number(d.tahun) || 0, 0, 1);
    baru.push({ akronim: d.akronim, slug, nama: d.nama || null, edisi: [], terbaru: Number.isFinite(waktu) ? waktu : 0 });
  }
  return [...seri, ...baru].sort((a, b) => b.terbaru - a.terbaru || b.edisi.length - a.edisi.length);
}

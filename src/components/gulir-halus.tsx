"use client";

import { useEffect } from "react";

/**
 * Gulir halus — Lenis.
 *
 * ── Apa yang sebenarnya berubah ────────────────────────────────────────
 *
 * Roda tetikus dan trackpad memindahkan halaman seketika, satu lompatan per
 * kedutan. Lenis menyisipkan satu langkah di antaranya: posisi gulir yang
 * ditampilkan mengejar posisi yang diminta sebesar 10% jarak sisa tiap
 * bingkai (`lerp: 0.1`). Hasilnya halaman terasa punya bobot — ia berangkat
 * sedikit terlambat dan berhenti dengan meluncur, bukan mematuk.
 *
 * Itu juga yang membuat lambang 3D jadi enak dilihat tanpa diubah sama
 * sekali: ia membaca `window.scrollY` di rAF-nya sendiri, dan karena angka itu
 * sekarang bergerak mulus, geraknya ikut mulus.
 *
 * ── Kenapa pustaka, bukan ditulis sendiri ──────────────────────────────
 *
 * Melambatkan gulir gampang; yang susah adalah semua yang menempel padanya.
 * Tautan jangkar, tombol Home/End/PageDown, sentuhan di ponsel, gulir di dalam
 * elemen yang punya gulirnya sendiri, dan bilah gulir yang diseret — semua
 * harus tetap benar, dan tiap satu yang meleset terasa seperti situs rusak,
 * bukan seperti animasi yang kurang pas. Lenis menangani itu dan besarnya
 * hanya beberapa kilobita.
 *
 * ── Batas yang dipatuhi ────────────────────────────────────────────────
 *
 * Kalau pengunjung meminta gerak dikurangi, komponen ini tidak memasang apa
 * pun dan gulir kembali ke bawaan peramban. Ini bukan sekadar sopan santun:
 * gulir yang meluncur adalah pemicu mabuk gerak yang diketahui, dan tidak ada
 * cara lain bagi pengunjung untuk mematikannya dari dalam halaman.
 */
export function GulirHalus() {
  useEffect(() => {
    const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (kurangiGerak.matches) return;

    let batal = false;
    let hentikan: (() => void) | undefined;

    (async () => {
      let Lenis: typeof import("lenis").default;
      try {
        ({ default: Lenis } = await import("lenis"));
      } catch {
        // Tanpa gulir halus situs tetap utuh — jadi kegagalan muat di sini
        // tidak perlu dilaporkan ke siapa pun.
        return;
      }
      if (batal) return;

      const lenis = new Lenis({
        lerp: 0.1,
        /* Hanya roda dan trackpad. Di ponsel gulir sentuh dibiarkan bawaan:
           ia sudah punya inersia dari sistem operasinya sendiri, dan
           menumpuknya dengan inersia kedua terasa licin, bukan mewah. */
        smoothWheel: true,
        syncTouch: false,
      });

      let bingkai = 0;
      const jalan = (waktu: number) => {
        lenis.raf(waktu);
        bingkai = requestAnimationFrame(jalan);
      };
      bingkai = requestAnimationFrame(jalan);

      hentikan = () => {
        cancelAnimationFrame(bingkai);
        lenis.destroy();
      };
    })();

    return () => {
      batal = true;
      hentikan?.();
    };
  }, []);

  return null;
}

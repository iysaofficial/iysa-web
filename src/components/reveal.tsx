"use client";

import { useEffect } from "react";

/**
 * Menunda animasi `.rise` sampai elemennya benar-benar masuk layar.
 *
 * ── Masalah yang diperbaiki ──────────────────────────────────────────────
 *
 * `.rise` dan `.rise-stagger` adalah animasi CSS murni, dan animasi CSS mulai
 * berjalan saat elemennya dipasang — bukan saat terlihat. Di beranda yang
 * panjangnya enam seksi, itu berarti dinding logo mitra dan blok newsletter
 * sudah selesai beranimasi sebelum pengunjung menggulir sejauh itu. Gerakannya
 * terjadi, tapi tidak ada yang menontonnya: yang tampak cuma halaman diam.
 *
 * ── Cara kerjanya ────────────────────────────────────────────────────────
 *
 * CSS menahan animasi dengan `animation-play-state: paused` untuk apa pun di
 * dalam `[data-reveal]` yang belum ditandai `data-terlihat`. Berkas ini
 * memasang IntersectionObserver yang memberi tanda itu saat elemennya masuk
 * layar, lalu berhenti mengamatinya — animasinya sekali jalan, bukan bolak-balik
 * setiap kali digulir melewatinya.
 *
 * ── Kenapa penahannya di CSS, bukan di sini ──────────────────────────────
 *
 * Kalau JavaScript yang memberi kelas "mulai", ada jendela antara halaman
 * terlihat dan skrip ini jalan — dan di jendela itu animasinya sudah berjalan
 * duluan, persis masalah yang mau dibereskan. Menahan di CSS berarti
 * penahannya ikut render pertama, sebelum React sempat apa pun.
 *
 * ── Kalau JavaScript mati ────────────────────────────────────────────────
 *
 * `@media (scripting: none)` di globals.css membatalkan penahannya, jadi
 * animasinya jalan seperti sebelum ada berkas ini. Tanpa aturan itu, halaman
 * tanpa JavaScript akan berhenti di `opacity: 0` — seluruh isinya tak terlihat
 * selamanya. Itu kegagalan yang jauh lebih buruk daripada animasi yang telanjur
 * selesai.
 */
export function Reveal() {
  useEffect(() => {
    const target = document.querySelectorAll("[data-reveal]:not([data-terlihat])");
    if (target.length === 0) return;

    // Tanpa dukungan IntersectionObserver, tandai semuanya sekaligus —
    // lebih baik animasi yang telanjur jalan daripada isi yang tak muncul.
    if (typeof IntersectionObserver === "undefined") {
      target.forEach((el) => el.setAttribute("data-terlihat", ""));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-terlihat", "");
          obs.unobserve(e.target);
        }
      },
      {
        /* Mulai sedikit sebelum tepi bawah layar, supaya gerakannya sudah
           berjalan saat elemennya benar-benar terbaca — bukan tersentak
           tepat ketika mata sampai. */
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.01,
      },
    );

    target.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return null;
}

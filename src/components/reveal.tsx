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
 * Penahan di globals.css digerbangi `:root[data-gerak="aktif"]`, dan atribut
 * itu dipasang `ThemeScript` di <head>. Tanpa JavaScript atribut itu tidak
 * pernah ada, jadi tidak ada yang ditahan dan halaman tampil utuh.
 *
 * Gerbangnya harus berupa atribut yang dipasang skrip, bukan
 * `@media (scripting: none)`: Chrome melaporkan `scripting: enabled` bahkan
 * ketika JavaScript dimatikan, jadi pagar itu tidak pernah menyala justru bagi
 * orang yang membutuhkannya. Versi pertama berkas ini memakainya, dan
 * tangkapan layar tanpa-JS menampilkan grid yang kosong melompong.
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

    /* Jaring pengaman terakhir.
     *
     * Penahan di CSS membuat isi halaman tidak terlihat sampai ada yang
     * melepasnya. IntersectionObserver hampir selalu melepasnya — tapi
     * "hampir" tidak cukup untuk sesuatu yang taruhannya halaman kosong:
     * elemen di dalam wadah yang tidak pernah menggulir, viewport yang sangat
     * tinggi sehingga `rootMargin` negatif melewatinya, atau tata letak yang
     * berubah setelah pengamatan dimulai.
     *
     * Setelah 3 detik, apa pun yang masih tertahan dilepas begitu saja.
     * Kehilangan animasi jauh lebih ringan daripada kehilangan isinya. */
    const jaring = window.setTimeout(() => {
      document
        .querySelectorAll("[data-reveal]:not([data-terlihat])")
        .forEach((el) => el.setAttribute("data-terlihat", ""));
      obs.disconnect();
    }, 3000);

    return () => {
      obs.disconnect();
      window.clearTimeout(jaring);
    };
  }, []);

  return null;
}

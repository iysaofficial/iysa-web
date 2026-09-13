"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Angka yang berhitung naik saat masuk layar.
 *
 * ── Kenapa ia TIDAK selalu beranimasi ────────────────────────────────────
 *
 * Angka aslinya dirender di server, jadi ia sudah tergambar di layar sebelum
 * React sempat hidup. Kalau komponen ini memaksa animasi setiap kali, yang
 * terlihat pengunjung adalah "66" → "0" → berhitung naik lagi ke "66": satu
 * lompatan mundur yang terbaca sebagai kerusakan, bukan gerakan.
 *
 * Jadi aturannya: beranimasi HANYA kalau saat dipasang elemennya masih di
 * luar layar. Yang sudah terlihat sejak awal dibiarkan apa adanya — tidak ada
 * yang hilang, karena animasi yang tidak sempat ditonton memang tidak
 * menambah apa-apa. Deret angka di beranda duduk di bawah hero, jadi di
 * hampir semua layar ia memang masuk dari bawah dan ikut berhitung.
 *
 * ── Yang dijaga ──────────────────────────────────────────────────────────
 *
 * Tanpa JavaScript, atau dengan `prefers-reduced-motion`, angkanya tetap
 * angka yang benar sejak render pertama. Tidak ada keadaan di mana pengunjung
 * melihat nol yang tidak pernah beranjak.
 */
export function AngkaNaik({ nilai }: { nilai: string | number }) {
  const teks = String(nilai);

  /* Pisahkan bagian angka dari imbuhannya: "11+" jadi 11 dan "+".
     Kalau tidak ada angka sama sekali, komponen ini tidak melakukan apa-apa. */
  const cocok = teks.match(/^(\d+)(.*)$/);
  const target = cocok ? Number(cocok[1]) : null;
  const imbuhan = cocok ? cocok[2] : "";

  const ref = useRef<HTMLSpanElement>(null);
  const [tampil, setTampil] = useState<string | null>(null);

  useEffect(() => {
    if (target === null || target === 0) return;
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    // Sudah terlihat saat dipasang → biarkan. Lihat catatan di atas.
    const kotak = el.getBoundingClientRect();
    if (kotak.top < window.innerHeight && kotak.bottom > 0) return;

    let raf = 0;
    let mulai = 0;
    const DURASI = 900;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();

        const langkah = (t: number) => {
          if (!mulai) mulai = t;
          const p = Math.min((t - mulai) / DURASI, 1);
          // easeOutCubic: cepat di awal lalu mengendap, supaya angkanya
          // terbaca sebagai "sampai" dan bukan berhenti mendadak.
          const e = 1 - Math.pow(1 - p, 3);
          setTampil(String(Math.round(target * e)));
          if (p < 1) raf = requestAnimationFrame(langkah);
          else setTampil(null); // kembalikan ke nilai asli dari server
        };
        raf = requestAnimationFrame(langkah);
      },
      { threshold: 0.4 },
    );

    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);

  return (
    <span ref={ref}>
      {tampil === null ? teks : tampil + imbuhan}
    </span>
  );
}

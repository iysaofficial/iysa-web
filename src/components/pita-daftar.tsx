"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Pita "N event membuka pendaftaran" yang menempel di dasar layar ponsel.
 *
 * Di ponsel, kartu pendaftaran baru terlihat setelah beberapa kali gulir;
 * pita ini menjaga jalan pintasnya selalu sejangkau ibu jari. Muncul setelah
 * hero terlewati, dan menyingkir saat footer terlihat supaya tidak menutupi
 * tautan di sana. Disembunyikan mulai layar `md`.
 */
export function PitaDaftar({ teks, aksi }: { teks: string; aksi: string }) {
  const [tampak, setTampak] = useState(false);

  useEffect(() => {
    const kaki = document.querySelector("footer");
    let kakiTerlihat = false;
    const io = kaki
      ? new IntersectionObserver(([e]) => {
          kakiTerlihat = e.isIntersecting;
          cek();
        })
      : null;
    function cek() {
      setTampak(window.scrollY > window.innerHeight * 0.8 && !kakiTerlihat);
    }
    if (kaki && io) io.observe(kaki);
    cek();
    window.addEventListener("scroll", cek, { passive: true });
    return () => {
      window.removeEventListener("scroll", cek);
      io?.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden={!tampak}
      className={`fixed inset-x-3 bottom-3 z-40 transition-[transform,opacity] duration-300 md:hidden ${
        tampak ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[130%] opacity-0"
      }`}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <Link
        href="/event"
        tabIndex={tampak ? 0 : -1}
        className="flex min-h-[52px] items-center justify-between gap-3 rounded-full bg-[var(--navy)] py-2 pr-2 pl-5 text-[var(--on-navy)] shadow-[0_14px_30px_-10px_rgba(11,41,72,0.6)]"
      >
        <span className="flex min-w-0 items-center gap-2.5 text-[14px] font-semibold whitespace-nowrap">
          <span aria-hidden className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ec4b6] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2ec4b6]" />
          </span>
          {teks}
        </span>
        <span className="shrink-0 rounded-full bg-white px-4 py-2.5 text-[13.5px] font-bold whitespace-nowrap text-[#0b2948]">
          {aksi} →
        </span>
      </Link>
    </div>
  );
}

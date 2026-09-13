"use client";

import { useEffect, useRef, useState } from "react";
import { IysaLogo } from "./iysa-logo";

/**
 * Lambang IYSA sebagai objek tiga dimensi.
 *
 * ── Kenapa bentuknya ini ─────────────────────────────────────────────────
 *
 * Bukan objek 3D baru yang ditempel di beranda, melainkan lambang IYSA
 * sendiri yang diangkat ke ruang: tiga orbit jadi tiga torus pada sudut yang
 * sama persis dengan versi SVG-nya (−30°, +30°, 90°), tiga simpul jadi tiga
 * bola kecil di ujung orbit, dan bola dunia di pusat jadi bola sungguhan.
 * Sudut, jari-jari, dan tebalnya diturunkan dari GEOMETRI yang sama supaya
 * kalau lambangnya berubah, yang ini ikut berubah — bukan dua bentuk yang
 * kebetulan mirip lalu pelan-pelan menyimpang.
 *
 * ── Kenapa three.js dimuat belakangan ────────────────────────────────────
 *
 * `import("three")` dipanggil di dalam useEffect, bukan di atas berkas. Itu
 * membuat three masuk chunk terpisah yang hanya diambil setelah beranda
 * terpasang dan hanya di beranda — bundel awal situs tidak bertambah sama
 * sekali. Peserta yang membuka halaman event dari HP tidak pernah mengunduh
 * satu byte pun dari three.
 *
 * ── Kenapa ia tidak boleh jadi elemen LCP ────────────────────────────────
 *
 * Judul hero yang harus tampil lebih dulu, dan ia memang tampil lebih dulu:
 * kanvas ini kosong sampai three selesai diunduh, sementara judulnya sudah
 * dirender di server. Selama itu yang tampil lambang SVG statis — yang juga
 * jadi jawaban akhir kalau WebGL tidak tersedia atau pengunjung meminta
 * gerakan dikurangi. Jadi tidak pernah ada keadaan di mana tempat ini kosong.
 *
 * ── Yang sengaja TIDAK dilakukan ─────────────────────────────────────────
 *
 * Tanpa bayangan, tanpa pantulan lingkungan, tanpa post-processing. Brief
 * situs ini menyebut "berani tanpa norak", dan yang membuat objek ini menarik
 * adalah gerakannya yang lambat dan bentuknya yang sudah dikenal — bukan
 * tumpukan efek. Ia juga berhenti berputar begitu keluar layar, supaya tidak
 * memutar GPU ponsel sepanjang halaman digulir.
 */

/* Sama dengan GEOMETRI di iysa-logo.tsx, dinormalkan ke satuan dunia 3D
   (dibagi 100). Rasio antar angkanya yang penting, bukan nilai mutlaknya. */
const R_ORBIT = 2.0; // sepadan RX 200
const R_TABUNG = 0.135; // sepadan SW 27
const R_SIMPUL = 0.15; // sepadan NODE 30
const R_BOLA = 0.54; // sepadan GLOBE 54

const ORBIT = [
  { rot: 30, warna: "--logo-teal", simpul: 180 },
  { rot: 90, warna: "--logo-coral", simpul: 180 },
  { rot: -30, warna: "--logo-navy", simpul: 0 },
] as const;

/** Baca warna token dari CSS supaya objek ikut tema terang/gelap. */
function bacaWarna(el: HTMLElement, nama: string, cadangan: string) {
  const v = getComputedStyle(el).getPropertyValue(nama).trim();
  return v || cadangan;
}

export function HeroAtom({ className = "" }: { className?: string }) {
  const wadah = useRef<HTMLDivElement>(null);
  const [hidup, setHidup] = useState(false);

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;

    // Gerakan dikurangi: jangan muat three sama sekali. Lambang SVG statis
    // yang sudah tampil adalah jawaban yang benar, bukan versi 3D yang diam.
    const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (kurangiGerak.matches) return;

    let batal = false;
    let bersihkan: (() => void) | undefined;

    (async () => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        return; // gagal memuat: lambang SVG tetap di tempatnya
      }
      if (batal || !wadah.current) return;

      const lebar = el.clientWidth;
      const tinggi = el.clientHeight;
      if (lebar === 0 || tinggi === 0) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        return; // WebGL tidak tersedia
      }

      renderer.setSize(lebar, tinggi);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.display = "block";
      el.appendChild(renderer.domElement);
      setHidup(true);

      const scene = new THREE.Scene();
      const kamera = new THREE.PerspectiveCamera(38, lebar / tinggi, 0.1, 100);
      kamera.position.set(0, 0, 8.2);

      /* Dua lampu saja: satu arah utama supaya permukaan torus punya sisi
         terang dan gelap, satu ambient supaya sisi gelapnya tidak jadi hitam
         pekat di tema terang. */
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const lampu = new THREE.DirectionalLight(0xffffff, 2.2);
      lampu.position.set(3, 4, 5);
      scene.add(lampu);

      const akar = new THREE.Group();
      scene.add(akar);

      const bahan = (hex: string) =>
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(hex),
          roughness: 0.42,
          metalness: 0.08,
        });

      const dibuang: { dispose(): void }[] = [];

      for (const o of ORBIT) {
        const hex = bacaWarna(el, o.warna, "#2f5490");
        const mat = bahan(hex);
        dibuang.push(mat);

        const geo = new THREE.TorusGeometry(R_ORBIT, R_TABUNG, 20, 160);
        dibuang.push(geo);
        const cincin = new THREE.Mesh(geo, mat);
        // Torus digambar di bidang XY; diputar pada sumbu Z persis seperti
        // `rotate()` di SVG-nya, lalu dimiringkan sedikit di X supaya
        // ketiganya terbaca sebagai ruang, bukan tiga lingkaran datar.
        cincin.rotation.z = (o.rot * Math.PI) / 180;
        cincin.rotation.x = 0.42;
        akar.add(cincin);

        const sudut = ((o.rot + o.simpul) * Math.PI) / 180;
        const sgeo = new THREE.SphereGeometry(R_SIMPUL, 24, 24);
        dibuang.push(sgeo);
        const simpul = new THREE.Mesh(sgeo, mat);
        simpul.position.set(R_ORBIT * Math.cos(sudut), R_ORBIT * Math.sin(sudut), 0);
        simpul.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.42);
        akar.add(simpul);
      }

      // Bola dunia di pusat — rangka garis, bukan bola pejal, supaya orbit
      // yang lewat di belakangnya tetap terlihat.
      const bolaGeo = new THREE.SphereGeometry(R_BOLA, 22, 16);
      dibuang.push(bolaGeo);
      const bolaMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(bacaWarna(el, "--logo-globe", "#0e1726")),
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      });
      dibuang.push(bolaMat);
      akar.add(new THREE.Mesh(bolaGeo, bolaMat));

      /* ── Gerak ────────────────────────────────────────────────────────
         Putaran lambat terus-menerus, plus kemiringan mengikuti kursor yang
         dibatasi ±8°. Batas itu penting: lebih dari itu objeknya terasa
         "mengejar" pengunjung, dan di halaman yang isinya bacaan, itu
         mengganggu alih-alih menarik. */
      const BATAS = (8 * Math.PI) / 180;
      let tujuanX = 0;
      let tujuanY = 0;
      let kiniX = 0;
      let kiniY = 0;

      const onPointer = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        tujuanY = ((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)) * BATAS;
        tujuanX = ((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)) * BATAS;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      // Berhenti saat keluar layar: tidak ada gunanya memutar GPU untuk
      // sesuatu yang tidak terlihat, dan di ponsel itu terasa di baterai.
      let terlihat = true;
      const io = new IntersectionObserver((es) => (terlihat = es[0].isIntersecting), {
        threshold: 0,
      });
      io.observe(el);

      let raf = 0;
      const jam = new THREE.Clock();

      const gambar = () => {
        raf = requestAnimationFrame(gambar);
        if (!terlihat) return;

        const d = jam.getDelta();
        akar.rotation.y += d * 0.28;

        // Redam menuju sudut tujuan, bukan lompat: gerakannya jadi punya
        // bobot dan tidak menyentak saat kursor bergerak cepat.
        kiniX += (tujuanX - kiniX) * 0.05;
        kiniY += (tujuanY - kiniY) * 0.05;
        akar.rotation.x = kiniX;
        akar.rotation.z = kiniY;

        renderer.render(scene, kamera);
      };
      gambar();

      const onResize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w === 0 || h === 0) return;
        kamera.aspect = w / h;
        kamera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(el);

      bersihkan = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointer);
        io.disconnect();
        ro.disconnect();
        for (const d of dibuang) d.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      batal = true;
      bersihkan?.();
    };
  }, []);

  return (
    <div
      ref={wadah}
      aria-hidden
      className={`relative grid aspect-square w-full max-w-[340px] place-items-center ${className}`}
    >
      {/* Lambang statis: tampil sebelum three tiba, dan tetap jadi jawaban
          akhir kalau WebGL tidak ada atau gerakan diminta dikurangi.
          Menghilang begitu kanvas benar-benar menggambar. */}
      <IysaLogo
        size={200}
        className={`transition-opacity duration-500 ${hidup ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
}

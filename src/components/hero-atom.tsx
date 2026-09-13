"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lambang IYSA sebagai objek tiga dimensi yang mengikuti gulir.
 *
 * ── Bentuknya dari lambang aslinya ───────────────────────────────────────
 *
 * `SVGLoader` mengurai `iysa-mark-traced.svg` — hasil tracing berkas lambang
 * asli IYSA — lalu tiap lapisan di-`ExtrudeGeometry` jadi relief. Tiap lapisan
 * diberi pergeseran z sesuai urutan tumpukannya di lambang asli, jadi objeknya
 * punya parallax sungguhan saat berputar, bukan satu lempeng pipih.
 *
 * ── Mengikuti gulir ──────────────────────────────────────────────────────
 *
 * Kanvasnya hidup di lapisan `fixed` tersendiri, bukan di dalam aliran
 * halaman. Sebuah kotak kosong di hero menyediakan tempat duduknya; tiap
 * bingkai, lapisan itu diletakkan tepat menimpa kotak tadi. Begitu hero
 * tergulir ke atas, lapisannya berhenti mengikuti dan menambat di kanan atas
 * layar sambil mengecil — jadi lambangnya tetap terlihat sepanjang halaman.
 *
 * Putarannya digerakkan posisi gulir, bukan hanya waktu: tiap piksel yang
 * digulir memutar objeknya sedikit, sehingga gerakannya terasa terhubung
 * dengan apa yang dilakukan pengunjung. Putaran lambat tetap jalan supaya ia
 * tidak mati total saat halaman diam.
 *
 * ── Pantangan yang tidak boleh dilanggar ─────────────────────────────────
 *
 * Ukuran kanvas TIDAK PERNAH diambil dari elemen yang bisa dipengaruhinya.
 * Ia dihitung dari kotak kosong di hero, yang ukurannya murni dari kisi
 * halaman. Versi lama mengukur induk kanvasnya sendiri dan menghasilkan
 * gelang umpan balik yang menumbuhkan dokumen ~20.000px per detik sampai
 * 950.000px — seluruh isi halaman terdorong ke luar jangkauan gulir.
 */

/* Pergeseran kedalaman per lapisan, dalam satuan viewBox lambang.
   Urutannya sama dengan urutan tumpukan di lambang aslinya. */
const KEDALAMAN: Record<string, number> = {
  navy: 14,
  coral: 4,
  teal: -4,
  "bola-benua": -10,
  "bola-badan": -12,
};

const TOKEN: Record<string, string> = {
  navy: "--logo-navy",
  teal: "--logo-teal",
  coral: "--logo-coral",
  "bola-benua": "--logo-globe",
  "bola-badan": "--logo-globe-badan",
};

const CADANGAN: Record<string, string> = {
  navy: "#2f5490",
  teal: "#2e9c97",
  coral: "#ef5138",
  "bola-benua": "#0e1726",
  "bola-badan": "#f4f7fc",
};

/** Kelas pada path SVG → nama lapisan; urutan jadi cadangannya. */
const KELAS_KE_NAMA: Record<string, string> = {
  "l-navy": "navy",
  "l-teal": "teal",
  "l-coral": "coral",
  "l-bolabenua": "bola-benua",
  "l-bolabadan": "bola-badan",
};
const URUTAN_LAPISAN = ["bola-badan", "teal", "coral", "navy", "bola-benua"];

/**
 * Tempat tambat saat hero sudah tergulir lewat: sudut kanan BAWAH.
 *
 * Percobaan pertama menambat di kanan atas dan hasilnya dua masalah sekaligus,
 * keduanya terlihat begitu dipotret sambil digulir: ia sejajar dengan lambang
 * IYSA di header — dua lambang yang sama dalam satu baris — dan ia menimpa
 * tepi kartu event serta dinding logo mitra. Sudut kanan bawah lapang, jauh
 * dari header, dan tidak mengulang merek yang sudah ada di atas.
 */
const TAMBAT = { bawah: 24, kanan: 20, sisi: 116 };

/**
 * Perpindahan ke tambatan dimulai saat bagian atas kotak hero naik melewati
 * garis ini, dan selesai setelah menempuh `PERALIHAN` piksel lagi.
 *
 * Pemicunya posisi kotak hero terhadap layar — BUKAN jaraknya ke tambatan.
 * Percobaan pertama memakai jarak ke tambatan dan hasilnya lambang sudah
 * tertambat sejak posisi gulir nol, dengan tempatnya di hero dibiarkan kosong.
 */
const PEMICU = 120;
const PERALIHAN = 260;

function bacaWarna(el: HTMLElement, nama: string, cadangan: string) {
  return getComputedStyle(el).getPropertyValue(nama).trim() || cadangan;
}

export function HeroAtom({ className = "" }: { className?: string }) {
  const slot = useRef<HTMLDivElement>(null);
  const lapisan = useRef<HTMLDivElement>(null);
  const [hidup, setHidup] = useState(false);

  useEffect(() => {
    const kotak = slot.current;
    const layer = lapisan.current;
    if (!kotak || !layer) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let batal = false;
    let bersihkan: (() => void) | undefined;

    (async () => {
      let THREE: typeof import("three");
      let SVGLoaderMod: typeof import("three/examples/jsm/loaders/SVGLoader.js");
      try {
        [THREE, SVGLoaderMod] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/SVGLoader.js"),
        ]);
      } catch {
        return;
      }
      if (batal) return;

      const awal = kotak.getBoundingClientRect();
      if (awal.width === 0) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          /* Isi kanvas dibuang tiap kali dikomposit kalau ini false, jadi satu
             bingkai yang terlewat meninggalkan kanvas kosong permanen. */
          preserveDrawingBuffer: true,
        });
      } catch {
        return;
      }

      const kanvas = renderer.domElement;
      kanvas.style.position = "absolute";
      kanvas.style.inset = "0";
      kanvas.style.width = "100%";
      kanvas.style.height = "100%";
      kanvas.style.display = "block";
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(awal.width, awal.width, false);
      layer.appendChild(kanvas);

      const scene = new THREE.Scene();
      const kamera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      kamera.position.set(0, 0, 9);

      scene.add(new THREE.AmbientLight(0xffffff, 2.4));
      const utama = new THREE.DirectionalLight(0xffffff, 3.2);
      utama.position.set(3, 5, 6);
      scene.add(utama);
      const isian = new THREE.DirectionalLight(0xffffff, 1.4);
      isian.position.set(-4, -2, 3);
      scene.add(isian);

      const akar = new THREE.Group();
      scene.add(akar);
      const dibuang: { dispose(): void }[] = [];

      /* Bentuknya diambil dari berkas SVG yang SUDAH diunduh halaman ini
         sebagai lambang cadangan — nol byte tambahan, karena peramban
         menyajikannya dari singgahan. Menanamnya sebagai JSON justru menaikkan
         muat awal 622 → 656 KB untuk data yang cuma dipakai kalau three jalan. */
      let terurai: Awaited<ReturnType<InstanceType<typeof SVGLoaderMod.SVGLoader>["loadAsync"]>>;
      try {
        terurai = await new SVGLoaderMod.SVGLoader().loadAsync("/media/logo/iysa-mark-traced.svg");
      } catch {
        return;
      }
      if (batal) return;

      const grup = new THREE.Group();
      let jumlahMesh = 0;

      terurai.paths.forEach((path, i) => {
        const simpul = (path.userData as { node?: Element } | undefined)?.node;
        const nama = KELAS_KE_NAMA[simpul?.getAttribute?.("class") ?? ""] ?? URUTAN_LAPISAN[i];
        if (!nama) return;

        const isi = new THREE.Color(bacaWarna(kotak, TOKEN[nama], CADANGAN[nama]));
        const bahan = new THREE.MeshStandardMaterial({
          color: isi,
          /* Tanpa emissive, sisi extrude yang membelakangi lampu jatuh ke hitam
             dan lambangnya terbaca sebagai siluet gelap, bukan logo IYSA. */
          emissive: isi,
          emissiveIntensity: 0.32,
          roughness: 0.5,
          metalness: 0.04,
          side: THREE.DoubleSide,
        });
        dibuang.push(bahan);

        for (const b of path.toShapes()) {
          const geo = new THREE.ExtrudeGeometry(b, {
            depth: 16,
            bevelEnabled: false,
            curveSegments: 4,
          });
          dibuang.push(geo);
          const mesh = new THREE.Mesh(geo, bahan);
          mesh.position.z = KEDALAMAN[nama] ?? 0;
          grup.add(mesh);
          jumlahMesh++;
        }
      });

      if (jumlahMesh === 0) {
        renderer.dispose();
        kanvas.remove();
        for (const d of dibuang) d.dispose();
        return;
      }

      // SVG memakai sumbu Y ke bawah, three ke atas. Ukuran dan pusatnya
      // dihitung dari kotak batas grupnya sendiri, bukan angka tulis tangan.
      grup.scale.set(1, -1, 1);
      const ukuran = new THREE.Box3().setFromObject(grup).getSize(new THREE.Vector3());
      const skala = ukuran.y > 0 ? 4.6 / ukuran.y : 0.009;
      grup.scale.set(skala, -skala, skala);
      grup.position.sub(new THREE.Box3().setFromObject(grup).getCenter(new THREE.Vector3()));
      akar.add(grup);

      // Gambar satu bingkai, lalu periksa pikselnya. Cadangan hanya
      // disembunyikan kalau kanvas benar-benar berisi sesuatu.
      renderer.render(scene, kamera);
      let adaPiksel = false;
      try {
        const gl = renderer.getContext();
        const w = kanvas.width;
        const h = kanvas.height;
        const buf = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        for (let i = 3; i < buf.length; i += 4) {
          if (buf[i] > 8) {
            adaPiksel = true;
            break;
          }
        }
      } catch {
        adaPiksel = false;
      }
      if (!adaPiksel) {
        renderer.dispose();
        kanvas.remove();
        for (const d of dibuang) d.dispose();
        return;
      }
      setHidup(true);

      /* ── Penempatan lapisan ──────────────────────────────────────────
         Lapisan `fixed` diletakkan menimpa kotak kosong di hero selama kotak
         itu masih cukup di layar; sesudahnya ia menambat di kanan atas sambil
         mengecil. Semua angka berasal dari kotak kosong dan ukuran layar —
         tidak satu pun dari kanvas itu sendiri. */
      let lebarLalu = 0;

      const tempatkan = () => {
        const r = kotak.getBoundingClientRect();
        const lebarLayar = window.innerWidth;
        const menambat = lebarLayar >= 1024;

        let x: number;
        let y: number;
        let sisi: number;

        let kabur: number;

        if (!menambat) {
          x = r.left;
          y = r.top;
          sisi = r.width;
          kabur = 1;
        } else {
          // 0 selagi lambang masih di tempatnya di hero, 1 saat tertambat penuh.
          const maju = Math.min(1, Math.max(0, (PEMICU - r.top) / PERALIHAN));
          const yTambat = window.innerHeight - TAMBAT.bawah - TAMBAT.sisi;
          const xTambat = lebarLayar - TAMBAT.kanan - TAMBAT.sisi;

          x = r.left + (xTambat - r.left) * maju;
          y = r.top + (yTambat - r.top) * maju;
          sisi = r.width + (TAMBAT.sisi - r.width) * maju;
          // Diredupkan sedikit saat tertambat: ia melayang di atas isi halaman,
          // jadi ia penanda merek, bukan sesuatu yang meminta perhatian.
          kabur = 1 - 0.18 * maju;
        }

        layer.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
        layer.style.width = `${Math.round(sisi)}px`;
        layer.style.height = `${Math.round(sisi)}px`;
        layer.style.opacity = kabur.toFixed(2);

        if (Math.abs(sisi - lebarLalu) > 1) {
          lebarLalu = sisi;
          renderer.setSize(sisi, sisi, false);
        }
      };

      /* ── Gerak ───────────────────────────────────────────────────────
         Putaran digerakkan posisi gulir — dua putaran penuh sepanjang halaman
         — ditambah putaran lambat supaya tidak mati saat halaman diam, dan
         kemiringan mengikuti kursor yang dibatasi ±8°. */
      const BATAS = (8 * Math.PI) / 180;
      let tujuanX = 0;
      let tujuanY = 0;
      let kiniX = 0;
      let kiniY = 0;

      const onPointer = (e: PointerEvent) => {
        tujuanY = ((e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)) * BATAS;
        tujuanX = ((e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) * BATAS;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      let terlihat = !document.hidden;
      const onVisibilitas = () => {
        terlihat = !document.hidden;
      };
      document.addEventListener("visibilitychange", onVisibilitas);

      let raf = 0;
      let putarGulir = 0;

      const gambar = () => {
        raf = requestAnimationFrame(gambar);

        const kini = performance.now();
        if (!terlihat) return;

        tempatkan();

        const jangkauan = Math.max(1, document.body.scrollHeight - window.innerHeight);
        const kemajuan = Math.min(1, Math.max(0, window.scrollY / jangkauan));
        // Redam menuju sudut gulir supaya putarannya mulus, bukan menyentak
        // mengikuti tiap kejadian gulir.
        putarGulir += (kemajuan * Math.PI * 4 - putarGulir) * 0.08;

        akar.rotation.y = putarGulir + kini * 0.00008;

        kiniX += (tujuanX - kiniX) * 0.05;
        kiniY += (tujuanY - kiniY) * 0.05;
        akar.rotation.x = kiniX;
        akar.rotation.z = kiniY;

        renderer.render(scene, kamera);
      };
      gambar();

      bersihkan = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibilitas);
        for (const d of dibuang) d.dispose();
        renderer.dispose();
        kanvas.remove();
      };
    })();

    return () => {
      batal = true;
      bersihkan?.();
    };
  }, []);

  return (
    <>
      {/* Kotak kosong: menyediakan tempat duduk lambang di hero dan jadi
          satu-satunya sumber ukuran kanvas. Ukurannya murni dari kisi
          halaman — kanvas tidak pernah bisa memengaruhinya. */}
      <div
        ref={slot}
        aria-hidden
        className={`relative grid aspect-square w-full max-w-[340px] place-items-center ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/logo/iysa-mark-traced.svg"
          alt=""
          width={220}
          height={220}
          className={`absolute inset-0 m-auto h-[65%] w-auto transition-opacity duration-500 ${
            hidup ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {/* Lapisan kanvas. `fixed` dan tak bisa disentuh, jadi ia tidak pernah
          menghalangi tautan atau tombol di bawahnya. */}
      <div
        ref={lapisan}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-30 will-change-transform"
        style={{ width: 0, height: 0 }}
      />
    </>
  );
}

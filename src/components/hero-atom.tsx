"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lambang IYSA sebagai objek tiga dimensi.
 *
 * ── Bentuknya dari lambang aslinya, bukan tiruan ─────────────────────────
 *
 * Versi pertama komponen ini menyusun "atom" dari tiga torus dan tiga bola —
 * mendekati, tapi tetap tiruan. Sekarang bentuknya datang dari lambang IYSA
 * yang sebenarnya: `logo iysa tanpa logo type.png` ditelusuri jadi vektor oleh
 * `scripts/trace-logo.mjs`, dan path hasilnya di-extrude jadi relief tiga
 * dimensi. Jadi yang berputar di hero benar-benar logo IYSA, lengkap dengan
 * orbit yang terputus di tempat navy lewat di depan dan bola dunia berbenua.
 *
 * ── Kedalaman ────────────────────────────────────────────────────────────
 *
 * Tiap lapisan diberi pergeseran z sesuai urutan tumpukannya di lambang asli:
 * navy paling depan, coral dan teal di tengah, bola dunia paling belakang.
 * Itu yang membuat objeknya punya parallax sungguhan saat berputar — bukan
 * satu lempeng pipih yang diputar.
 *
 * ── Kenapa three.js dimuat belakangan ────────────────────────────────────
 *
 * `import("three")` dipanggil di dalam useEffect, bukan di atas berkas, jadi
 * three masuk chunk terpisah yang hanya diambil setelah beranda terpasang dan
 * hanya di beranda. Bundel awal situs tidak bertambah sama sekali.
 *
 * ── Yang dijaga ──────────────────────────────────────────────────────────
 *
 * Gerakan dikurangi → three tidak dimuat sama sekali. WebGL tidak ada atau
 * impor gagal → lambang SVG statis tetap di tempatnya. Keluar layar → berhenti
 * menggambar. Bukan elemen LCP: kanvasnya kosong sampai three tiba, sementara
 * judul hero sudah dirender di server.
 */

/* Pergeseran kedalaman per lapisan, dalam satuan viewBox lambang (472×512).
   Urutannya sama dengan urutan tumpukan di lambang aslinya. */
const KEDALAMAN: Record<string, number> = {
  navy: 14,
  coral: 4,
  teal: -4,
  "bola-benua": -10,
  "bola-badan": -12,
};

/** Token warna situs untuk tiap lapisan lambang. */
const TOKEN: Record<string, string> = {
  navy: "--logo-navy",
  teal: "--logo-teal",
  coral: "--logo-coral",
  "bola-benua": "--logo-globe",
  "bola-badan": "--logo-globe-badan",
};

/**
 * Kelas pada path SVG → nama lapisan.
 *
 * `scripts/trace-logo.mjs` memberi tiap path kelas `l-<nama tanpa tanda
 * baca>`. Dipetakan lewat kelas, bukan lewat urutan, supaya penelusuran ulang
 * yang menghasilkan urutan berbeda tidak diam-diam menukar warna lapisan.
 */
const KELAS_KE_NAMA: Record<string, string> = {
  "l-navy": "navy",
  "l-teal": "teal",
  "l-coral": "coral",
  "l-bolabenua": "bola-benua",
  "l-bolabadan": "bola-badan",
};

/**
 * Urutan lapisan sebagaimana ditulis `scripts/trace-logo.mjs`.
 * Dipakai sebagai cadangan kalau atribut `class` tidak terbaca.
 */
const URUTAN_LAPISAN = ["bola-badan", "teal", "coral", "navy", "bola-benua"];

const CADANGAN: Record<string, string> = {
  navy: "#2f5490",
  teal: "#2e9c97",
  coral: "#ef5138",
  "bola-benua": "#0e1726",
  "bola-badan": "#f4f7fc",
};

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
        return; // gagal memuat: lambang SVG tetap di tempatnya
      }
      if (batal || !wadah.current) return;

      const lebar = el.clientWidth;
      const tinggi = el.clientHeight;
      if (lebar === 0 || tinggi === 0) return;

      let renderer: import("three").WebGLRenderer;
      try {
        /* `preserveDrawingBuffer: true` bukan kemewahan di sini.
         *
         * Bawaannya `false`, yang berarti isi kanvas DIBUANG setiap kali
         * dikomposit. Selama gelung render terus menggambar itu tidak terasa —
         * tapi begitu gelungnya berhenti satu kali saja, kanvasnya kosong
         * permanen dan tidak ada yang menggambarnya lagi.
         *
         * Itu persis yang dialami pengunjung: lambang tampil sesaat saat
         * memuat, lalu hilang tepat setelah selesai. Penjaga piksel pun lolos,
         * karena saat diperiksa memang masih ada isinya.
         *
         * Dengan true, bingkai terakhir bertahan di layar apa pun yang terjadi
         * pada gelungnya. */
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
        });
      } catch {
        return; // WebGL tidak tersedia
      }

      renderer.setSize(lebar, tinggi);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.display = "block";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const kamera = new THREE.PerspectiveCamera(34, lebar / tinggi, 0.1, 100);
      kamera.position.set(0, 0, 9);

      /* Tiga lampu: satu arah utama supaya sisi extrude punya terang dan
         gelap, satu isian dari sisi berlawanan, satu ambient sebagai dasar.
         Angkanya dinaikkan setelah potret pertama memperlihatkan lambangnya
         nyaris hitam di latar gelap — sisi yang tidak tersorot jatuh ke nol
         dan warna mereknya hilang. */
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
         sebagai lambang cadangan di bawah — jadi biayanya nol byte tambahan,
         karena peramban menyajikannya dari singgahan.

         Sempat dicoba menanamkan path-nya sebagai JSON di dalam bundel.
         Turbopack menyalinnya ke chunk muat awal DAN chunk lazy, dan muat awal
         beranda naik 622 → 656 KB untuk data yang cuma dipakai kalau three
         benar-benar jalan. Mengambil berkasnya jauh lebih murah. */
      let terurai: Awaited<ReturnType<InstanceType<typeof SVGLoaderMod.SVGLoader>["loadAsync"]>>;
      try {
        terurai = await new SVGLoaderMod.SVGLoader().loadAsync(
          "/media/logo/iysa-mark-traced.svg",
        );
      } catch {
        return; // berkas lambang tidak terambil: cadangan <img> tetap tampil
      }
      if (batal) return;

      const grup = new THREE.Group();
      let jumlahMesh = 0;

      terurai.paths.forEach((path, i) => {
        /* Nama lapisan dibaca dari atribut `class` pada path-nya
           (`l-navy`, `l-bolabenua`, …). Kalau kelasnya tidak terbaca —
           SVGLoader tidak menjanjikan atribut itu ikut terbawa — jatuh ke
           urutan lapisan, yang ditulis skrip tracing secara tetap.

           Penjaga ini bukan hiasan: tanpa dia, satu pemetaan yang gagal
           membuat SEMUA path dilewati, tidak ada mesh yang terbentuk, dan
           hero-nya kosong melompong. Persis itu yang terjadi di percobaan
           pertama. */
        // `userData` bertipe {} di deklarasi three, padahal SVGLoader
        // menaruh simpul DOM aslinya di sana. Dipersempit di sini saja.
        const simpul = (path.userData as { node?: Element } | undefined)?.node;
        const kelas = simpul?.getAttribute?.("class") ?? "";
        const nama = KELAS_KE_NAMA[kelas] ?? URUTAN_LAPISAN[i];
        if (!nama) return;

        const warna = bacaWarna(el, TOKEN[nama], CADANGAN[nama]);
        /* `emissive` disetel ke warna yang sama dengan isiannya.
           Tanpa itu, sisi extrude yang membelakangi lampu jatuh ke hitam dan
           lambangnya terbaca sebagai siluet gelap, bukan sebagai logo IYSA —
           persis yang terjadi di potret pertama. Intensitasnya ditahan rendah
           supaya bentuk tiga dimensinya tetap terbaca; kalau terlalu tinggi,
           bayangannya hilang dan objeknya jadi rata seperti stiker. */
        const isi = new THREE.Color(warna);
        const bahan = new THREE.MeshStandardMaterial({
          color: isi,
          emissive: isi,
          emissiveIntensity: 0.32,
          roughness: 0.5,
          metalness: 0.04,
          side: THREE.DoubleSide,
        });
        dibuang.push(bahan);

        // `toShapes()`, bukan `SVGLoader.createShapes()` — yang kedua sudah
        // deprecated sejak r185 dan mencetak peringatan ke konsol. Sejak versi
        // itu ia juga tidak lagi menerima argumen `isCCW`; arah lilitannya
        // ditentukan dari `fill-rule` pada path-nya sendiri, dan path hasil
        // tracing kita semuanya membawa `evenodd`.
        const bentuk = path.toShapes();

        for (const b of bentuk) {
          const geo = new THREE.ExtrudeGeometry(b, {
            depth: 16,
            bevelEnabled: false,
            // Lengkung hasil tracing sudah rapat; 4 segmen sudah mulus dan
            // menahan jumlah simpul tetap wajar di ponsel.
            curveSegments: 4,
          });
          dibuang.push(geo);
          const mesh = new THREE.Mesh(geo, bahan);
          mesh.position.z = KEDALAMAN[nama] ?? 0;
          grup.add(mesh);
          jumlahMesh++;
        }
      });

      /* SVG memakai sumbu Y ke bawah, three ke atas — jadi skalanya dibalik
         di Y.

         Ukuran dan titik pusatnya dihitung dari kotak batas grupnya sendiri,
         bukan dari angka viewBox yang ditulis tangan. Dengan begitu lambang
         tetap terbingkai benar kalau nanti ditelusuri ulang dan hasilnya
         sedikit bergeser. */
      grup.scale.set(1, -1, 1);
      const ukuran = new THREE.Box3().setFromObject(grup).getSize(new THREE.Vector3());
      const skala = ukuran.y > 0 ? 4.6 / ukuran.y : 0.009;
      grup.scale.set(skala, -skala, skala);

      const pusat = new THREE.Box3().setFromObject(grup).getCenter(new THREE.Vector3());
      grup.position.sub(pusat);

      if (jumlahMesh === 0) {
        renderer.dispose();
        renderer.domElement.remove();
        for (const d of dibuang) d.dispose();
        return;
      }

      akar.add(grup);

      /* ── Bukti sebelum menyembunyikan cadangan ───────────────────────
       *
       * Gambar satu bingkai, lalu BACA pikselnya. Lambang cadangan hanya
       * dilenyapkan kalau kanvas benar-benar berisi sesuatu.
       *
       * Versi sebelumnya menyembunyikannya begitu mesh terbentuk — dan itu
       * bukan hal yang sama. Pengunjung melaporkan lambang di hero muncul
       * sekilas saat memuat lalu hilang tepat setelah selesai: mesh memang
       * terbentuk, tapi tidak ada yang tergambar, dan cadangannya sudah
       * telanjur dibuang. "Ada mesh" adalah niat; "ada piksel" adalah bukti.
       *
       * readPixels di sini aman: pembacaan terjadi di tugas yang sama dengan
       * penggambarannya, sebelum penyangga ditukar. */
      renderer.render(scene, kamera);

      let adaPiksel = false;
      try {
        const gl = renderer.getContext();
        const w = renderer.domElement.width;
        const h = renderer.domElement.height;
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
        renderer.domElement.remove();
        for (const d of dibuang) d.dispose();
        return;
      }

      // Terbukti ada yang tergambar — baru cadangannya boleh menghilang.
      setHidup(true);


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

      /* Berhenti menggambar hanya saat TAB-nya tidak terlihat, bukan saat
         elemennya keluar layar.
         *
         * Sebelumnya ini dijaga IntersectionObserver demi baterai. Tapi kalau
         * observer itu sekali saja melaporkan "tidak terlihat" — dan ia
         * melaporkan keadaan awal begitu dipasang, sebelum tata letak tentu
         * sudah tenang — gelungnya berhenti dan kanvasnya tidak pernah
         * digambar lagi. Penghematan baterainya kecil; harga kegagalannya
         * adalah lambang yang hilang di layar utama situs.
         *
         * `document.hidden` jauh lebih aman: ia hanya menyala saat tab benar-
         * benar tidak dirender, dan peramban membangunkannya kembali lewat
         * `visibilitychange`. */
      let terlihat = !document.hidden;
      const onVisibilitas = () => {
        terlihat = !document.hidden;
      };
      document.addEventListener("visibilitychange", onVisibilitas);

      let raf = 0;

      /* Selisih waktu dihitung sendiri, bukan dengan THREE.Clock: kelas itu
         sudah usang di three 0.186 dan memanggilnya mencetak peringatan ke
         konsol setiap pengunjung. Dibatasi 0,1 detik supaya tab yang
         ditinggal lalu dibuka lagi tidak membuat objeknya melompat. */
      let waktuLalu = performance.now();

      const gambar = () => {
        raf = requestAnimationFrame(gambar);

        const kini = performance.now();
        const d = Math.min((kini - waktuLalu) / 1000, 0.1);
        waktuLalu = kini;

        if (!terlihat) return;

        akar.rotation.y += d * 0.32;

        kiniX += (tujuanX - kiniX) * 0.05;
        kiniY += (tujuanY - kiniY) * 0.05;
        akar.rotation.x = kiniX;
        akar.rotation.z = kiniY;

        renderer.render(scene, kamera);
      };
      gambar();

      /* Ukuran terakhir diingat supaya observer tidak memicu dirinya sendiri:
         ia mengamati `el`, sedangkan `setSize()` mengubah kanvas DI DALAM
         `el`. Tanpa penjaga ini konsol kebanjiran "ResizeObserver loop
         completed with undelivered notifications". */
      let lebarLalu = lebar;
      let tinggiLalu = tinggi;
      let rafUkur = 0;

      const onResize = () => {
        cancelAnimationFrame(rafUkur);
        rafUkur = requestAnimationFrame(() => {
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (w === 0 || h === 0) return;
          if (w === lebarLalu && h === tinggiLalu) return;
          lebarLalu = w;
          tinggiLalu = h;
          kamera.aspect = w / h;
          kamera.updateProjectionMatrix();
          renderer.setSize(w, h);
        });
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(el);

      bersihkan = () => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(rafUkur);
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibilitas);
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
      {/*
        Lambang statis: tampil sebelum three tiba, dan tetap jadi jawaban akhir
        kalau WebGL tidak ada atau gerakan diminta dikurangi. Menghilang begitu
        kanvas benar-benar menggambar.

        Berkasnya, bukan komponen sebaris: 18 KB data path terlalu berat untuk
        ikut di setiap HTML halaman, dan sebagai berkas ia diambil sekali lalu
        disinggahi. Warnanya ikut tema lewat @media di dalam SVG-nya sendiri.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/logo/iysa-mark-traced.svg"
        alt=""
        width={220}
        height={220}
        className={`h-[65%] w-auto transition-opacity duration-500 ${hidup ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
}

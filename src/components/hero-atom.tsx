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
 * Resolusi tetap penyangga gambar kanvas, dalam piksel CSS.
 *
 * Ukuran TAMPIL lambang berubah terus sepanjang gulir, tapi penyangga
 * gambarnya tidak ikut berubah: ia dialokasikan sekali sebesar ini, lalu CSS
 * yang melar-mengecilkannya. Kalau `setSize` dipanggil tiap kali ukuran
 * tampilnya bergeser, GPU mengalokasi ulang penyangga tiap bingkai — mahal,
 * dan tepat jenis jalur yang dulu melahirkan gelang umpan balik di berkas ini.
 * Angkanya di atas ukuran tampil terbesar, jadi tidak pernah terlihat lunak.
 */
const RESOLUSI = 480;

/** Ukuran dasar lambang saat mengambang, sebagai pecahan lebar layar. */
const PECAHAN_SISI = 0.17;
const SISI_MIN = 150;
const SISI_MAKS = 300;

/**
 * Jalur singgah sepanjang halaman: berganti-ganti tepi kiri dan kanan, selalu
 * di sekitar tengah layar secara vertikal. Nilainya pecahan dari lebar dan
 * tinggi layar, mengacu ke SUDUT KIRI ATAS lambang.
 *
 * Berpindah sisi begini membuat lambang terasa menemani pembaca alih-alih
 * menempel di satu sudut — dan karena ia selalu di tepi, kolom teks yang
 * lebarnya dibatasi tidak pernah tertutup badan lambangnya.
 */
const JALUR = [
  { p: 0.08, xf: 0.04, yf: 0.42 },
  { p: 0.32, xf: 0.82, yf: 0.36 },
  { p: 0.56, xf: 0.04, yf: 0.46 },
  { p: 0.80, xf: 0.82, yf: 0.40 },
];

/**
 * Perpindahan dari hero ke jalur dimulai saat bagian atas kotak hero naik
 * melewati garis ini, dan selesai setelah menempuh `PERALIHAN` piksel lagi.
 *
 * Pemicunya posisi kotak hero terhadap layar — BUKAN jaraknya ke tujuan.
 * Percobaan pertama memakai jarak ke tujuan dan hasilnya lambang sudah
 * berpindah sejak posisi gulir nol, dengan tempatnya di hero dibiarkan kosong.
 */
const PEMICU = 120;
const PERALIHAN = 260;

const jepit = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const antara = (a: number, b: number, t: number) => a + (b - a) * t;
/** Pelunakan tepi supaya perpindahan antar singgahan tidak menyentak. */
const lunak = (t: number) => t * t * (3 - 2 * t);

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
      let RuangMod: typeof import("three/examples/jsm/environments/RoomEnvironment.js");
      try {
        [THREE, SVGLoaderMod, RuangMod] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/SVGLoader.js"),
          import("three/examples/jsm/environments/RoomEnvironment.js"),
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
      /* Sekali saja, dan tidak pernah lagi. `false` = jangan tulis gaya —
         ukuran tampilnya diatur CSS di lapisan pembungkus. */
      renderer.setSize(RESOLUSI, RESOLUSI, false);
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

      /* ── Pantulan lingkungan ──────────────────────────────────────────
         Tiga lampu arah saja memberi permukaan yang rata dan mati; yang
         membuat sebuah objek terbaca sebagai benda bernilai adalah pantulan
         yang BERGERAK di permukaannya saat ia berputar. `RoomEnvironment`
         adalah ruang studio kecil bawaan three — dikukus sekali jadi peta
         lingkungan lewat PMREM, tanpa satu pun berkas gambar diunduh.

         Kilapnya sengaja setengah jalan: metalness penuh akan menelan warna
         merek dan menjadikan lambangnya logam berwarna entah apa. Yang dikejar
         permukaan berenamel — warnanya tetap warna IYSA, tapi ada sorot yang
         menyapu tiap kali ia berguling. */
      const pmrem = new THREE.PMREMGenerator(renderer);
      const ruang = new RuangMod.RoomEnvironment();
      const petaLingkungan = pmrem.fromScene(ruang, 0.04).texture;
      scene.environment = petaLingkungan;
      ruang.dispose?.();
      pmrem.dispose();

      const akar = new THREE.Group();
      scene.add(akar);
      const dibuang: { dispose(): void }[] = [];
      /* Bahan tiap lapisan disimpan supaya pendar warnanya bisa digerakkan
         posisi gulir — lihat blok Gerak di bawah. */
      const bahanLapisan: import("three").MeshStandardMaterial[] = [];

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
          /* Licin dan setengah logam: cukup untuk menangkap sorot dari peta
             lingkungan, belum cukup untuk menenggelamkan warna mereknya. */
          roughness: 0.26,
          metalness: 0.34,
          envMapIntensity: 0.9,
          side: THREE.DoubleSide,
        });
        dibuang.push(bahan);
        bahanLapisan.push(bahan);

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
      const tempatkan = (p: number) => {
        const r = kotak.getBoundingClientRect();
        const lebarLayar = window.innerWidth;
        const tinggiLayar = window.innerHeight;

        // Di layar sempit lambang tetap duduk di hero dan menggulir bersamanya:
        // tidak ada ruang tepi untuk ditempati tanpa menutupi bacaan.
        if (lebarLayar < 1024) {
          pasang(r.left, r.top, r.width, 1);
          return;
        }

        /* Titik singgah menurut posisi gulir. Di luar rentang jalur dipakai
           singgahan terdekat, jadi lambang tidak pernah kehilangan tujuan. */
        let xf = JALUR[0].xf;
        let yf = JALUR[0].yf;
        for (let i = 0; i < JALUR.length - 1; i++) {
          const a = JALUR[i];
          const b = JALUR[i + 1];
          if (p >= a.p && p <= b.p) {
            const t = lunak((p - a.p) / (b.p - a.p));
            xf = antara(a.xf, b.xf, t);
            yf = antara(a.yf, b.yf, t);
            break;
          }
          if (p > b.p) {
            xf = b.xf;
            yf = b.yf;
          }
        }

        /* Ukurannya mengembang di tengah halaman lalu mengempis lagi —
           setengah perjalanan adalah puncaknya. Tanpa ini lambangnya bergerak
           tapi tidak pernah "terjadi" apa-apa padanya; dengan ini ia terasa
           mendekat lalu menjauh. */
        const sisiDasar = jepit(lebarLayar * PECAHAN_SISI, SISI_MIN, SISI_MAKS);
        const mengembang = 1 + 0.32 * Math.sin(jepit(p) * Math.PI);

        let tujuanX = xf * lebarLayar;
        let tujuanY = yf * tinggiLayar;
        let tujuanSisi = sisiDasar * mengembang;
        let tujuanKabur = 0.42;

        /* ── Perhentian terakhir ──────────────────────────────────────────
           Begitu kaki halaman masuk layar, lambang bergerak ke tengah secara
           mendatar dan turun sampai tiga perempat badannya berada DI ATAS
           garis atas footer — seperempat sisanya tertutup, karena footer
           diberi lapisan lebih tinggi daripada lapisan lambang. */
        const footer = document.querySelector("footer");
        const atapFooter = footer ? footer.getBoundingClientRect().top : Infinity;
        if (atapFooter < tinggiLayar) {
          const akhirJalan = lunak(jepit((tinggiLayar - atapFooter) / (tinggiLayar * 0.45)));
          const sisiAkhir = antara(tujuanSisi, sisiDasar * 1.35, akhirJalan);
          tujuanX = antara(tujuanX, lebarLayar / 2 - sisiAkhir / 2, akhirJalan);
          tujuanY = antara(tujuanY, atapFooter - sisiAkhir * 0.75, akhirJalan);
          tujuanSisi = sisiAkhir;
          tujuanKabur = antara(0.42, 0.95, akhirJalan);
        }

        // 0 selagi lambang masih di tempatnya di hero, 1 saat lepas penuh.
        const maju = lunak(jepit((PEMICU - r.top) / PERALIHAN));
        pasang(
          antara(r.left, tujuanX, maju),
          antara(r.top, tujuanY, maju),
          antara(r.width, tujuanSisi, maju),
          antara(1, tujuanKabur, maju),
        );
      };

      const pasang = (x: number, y: number, sisi: number, kabur: number) => {
        layer.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
        layer.style.width = `${Math.round(sisi)}px`;
        layer.style.height = `${Math.round(sisi)}px`;
        layer.style.opacity = kabur.toFixed(2);
        // Penyangga gambar TIDAK disentuh di sini — lihat catatan di RESOLUSI.
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

        const jangkauan = Math.max(1, document.body.scrollHeight - window.innerHeight);
        const kemajuan = jepit(window.scrollY / jangkauan);

        tempatkan(kemajuan);

        // Redam menuju sudut gulir supaya putarannya mulus, bukan menyentak
        // mengikuti tiap kejadian gulir.
        putarGulir += (kemajuan * Math.PI * 4 - putarGulir) * 0.08;
        akar.rotation.y = putarGulir + kini * 0.00008;

        /* ── Warna mengikuti gulir ─────────────────────────────────────
           Pendar tiap lapisan naik-turun sepanjang halaman, dan tiap lapisan
           diberi beda fase supaya orbit navy, teal, dan coral tidak menyala
           serempak. Yang bergerak hanya intensitas pendarnya — warna dasarnya
           tetap warna merek, jadi lambangnya tidak pernah berubah jadi warna
           lain. */
        for (let i = 0; i < bahanLapisan.length; i++) {
          const fase = kemajuan * Math.PI * 2 + i * 0.9;
          bahanLapisan[i].emissiveIntensity = 0.2 + 0.28 * (0.5 + 0.5 * Math.sin(fase));
        }

        /* ── Jungkir balik ────────────────────────────────────────────
           Satu sumbu saja menghasilkan gasing: bentuknya tidak pernah benar-
           benar berubah, jadi mata berhenti memperhatikannya setelah satu
           putaran. Dua sumbu tambahan yang berjalan pada kelipatan berbeda
           membuat siluetnya tidak pernah mengulang persis, dan relief antar
           lapisannya jadi terbaca — itu satu-satunya alasan objek ini dibuat
           tiga dimensi sejak awal.

           Miring mengikuti kursor tetap ditumpuk di atasnya, jadi ia masih
           membalas gerakan tetikus. */
        kiniX += (tujuanX - kiniX) * 0.05;
        kiniY += (tujuanY - kiniY) * 0.05;
        akar.rotation.x = kiniX + Math.sin(putarGulir * 0.5) * 0.34;
        akar.rotation.z = kiniY + Math.cos(putarGulir * 0.33) * 0.2;

        renderer.render(scene, kamera);
      };
      gambar();

      bersihkan = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibilitas);
        for (const d of dibuang) d.dispose();
        petaLingkungan.dispose();
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
        className="lapisan-atom pointer-events-none fixed top-0 left-0 z-20 will-change-transform"
        style={{ width: 0, height: 0 }}
      />
    </>
  );
}

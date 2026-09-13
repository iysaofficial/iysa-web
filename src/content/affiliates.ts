/**
 * Deskripsi 13 lembaga mitra internasional, dua bahasa.
 *
 * Sumber: components/Allaffiliationweb/EventAffiliation1..13.js di repo lama —
 * satu-satunya tempat teks ini pernah ada. Diekstrak oleh
 * scripts/extract-legacy.mjs ke generated/affiliates.json; berkas ini memegang
 * versi yang sudah dibereskan plus terjemahannya.
 *
 * Yang diperbaiki dari aslinya, semuanya cacat salin-tempel yang terlihat:
 *
 *   · MIIX  — judulnya berakhir dengan tanda tanya nyasar: "Malaysia
 *             Invention & Innovation Expo?"
 *   · E-nnovate — dua frasa tercetak dua kali: "...will promote your
 *             popularity that will promote your innovative ideas in the
 *             international arena. international arena."
 *   · WoSG  — "in 12 categories. categories."
 *   · InventCor — satu-satunya entri yang aslinya berbahasa Indonesia, padahal
 *             12 lainnya Inggris. Versi Inggrisnya ditulis di sini supaya
 *             halaman /en tidak menyelipkan satu paragraf Indonesia.
 *
 * Isi faktualnya tidak diubah. Kunci objek = slug di generated/affiliates.json.
 */

type Bilingual = { en: string; id: string };

export const affiliateNames: Record<string, string> = {
  // Hanya yang perlu dibetulkan; sisanya memakai `name` dari data hasil ekstraksi.
  "malaysia-invention-innovation-expo": "Malaysia Invention & Innovation Expo (MIIX)",
};

export const affiliateCopy: Record<string, Bilingual> = {
  "beijing-youth-science-creation-competition": {
    en: "The Beijing Youth Science Creation Competition (BYSCC) is a science and technology innovation competition built to give contestants a platform to present their research findings and exchange ideas with one another. The annual event is widely recognised internationally.",
    id: "Beijing Youth Science Creation Competition (BYSCC) adalah kompetisi inovasi sains dan teknologi yang memberi peserta ruang untuk memaparkan hasil penelitiannya dan bertukar gagasan. Event tahunan ini diakui luas di tingkat internasional.",
  },

  "taiwan-international-science-fair": {
    en: "TISF is a science research competition for high school students in grades 9 to 12. Its mission is to find and nurture talented young scientists. TISF 2024 brought together 630 domestic and international participants with 211 projects from 27 countries and regions, and was organised by the Taiwan National Science Education Center (NTSEC) from 28 January to 2 February 2024.",
    id: "TISF adalah kompetisi penelitian sains untuk pelajar SMA kelas 9 sampai 12, dengan misi menemukan dan membina peneliti muda berbakat. TISF 2024 mempertemukan 630 peserta dari dalam dan luar negeri dengan 211 proyek dari 27 negara dan kawasan, diselenggarakan Taiwan National Science Education Center (NTSEC) pada 28 Januari–2 Februari 2024.",
  },

  "phatthalung-international-science-fair": {
    en: "Phatthalung International Science Fair (PISF) is a science and technology competition for elementary, junior high, and high school students, organised by Princess Ubolratana Rajakanya's College Phatthalung, Thailand, together with the Phatthalung Provincial Administrative Organization.",
    id: "Phatthalung International Science Fair (PISF) adalah kompetisi sains dan teknologi untuk jenjang SD, SMP, dan SMA, diselenggarakan Princess Ubolratana Rajakanya's College Phatthalung, Thailand, bersama Phatthalung Provincial Administrative Organization.",
  },

  "5th-international-exhibition-inventcor": {
    // Aslinya hanya ada versi Indonesia; versi Inggris ditulis di sini.
    en: "InventCor is an IYSA affiliate event from Romania. It is a well-regarded exhibition covering a broad range of topics: science, innovation, ecology, safety, health, community, intellectual property, teaching methods, entrepreneurship, and the arts.",
    id: "InventCor adalah event afiliasi IYSA yang berasal dari Rumania. Pamerannya cukup bergengsi dan membahas berbagai topik: sains, inovasi, ekologi, keamanan, kesehatan, komunitas, kekayaan intelektual, metode pengajaran, kewirausahaan, dan seni.",
  },

  "malaysia-invention-innovation-expo": {
    en: "MIIX is an IYSA affiliate event from Malaysia that showcases innovations across many fields. It works to grow a culture of innovation and design in teaching and learning among educators, learners, and the wider public, and gives students and teachers a respected platform to present their work through digital channels.",
    id: "MIIX adalah event afiliasi IYSA dari Malaysia yang memamerkan inovasi dari berbagai bidang. Tujuannya menumbuhkan budaya inovasi dan desain dalam proses belajar-mengajar di kalangan pendidik, pelajar, dan masyarakat luas, sekaligus memberi panggung terhormat bagi siswa dan guru untuk menampilkan karyanya lewat kanal digital.",
  },

  "international-innovation-and-invention-show-e-nnovate": {
    en: "E-NNOVATE is an IYSA affiliate event from Poland, and more than an ordinary innovation show — it is a competition where science meets business. E-NNOVATE runs a web platform with global reach that carries participants' innovative ideas onto the international stage.",
    id: "E-NNOVATE adalah event afiliasi IYSA dari Polandia, dan bukan sekadar pameran inovasi biasa — ini kompetisi tempat sains bertemu bisnis. E-NNOVATE menjalankan platform daring berjangkauan global yang membawa gagasan peserta ke panggung internasional.",
  },

  "worldinvent-singapore-wosg": {
    en: "WoSG is an IYSA affiliate event from Singapore that presents inventions and innovations from around the world across 12 categories. Exhibitors are judged and receive awards based on the quality of their ideas.",
    id: "WoSG adalah event afiliasi IYSA dari Singapura yang menampilkan invensi dan inovasi dari seluruh dunia dalam 12 kategori. Peserta pameran dinilai dan menerima penghargaan berdasarkan mutu gagasannya.",
  },

  "africa-science-buskers-festival": {
    en: "The Africa Science Buskers Festival (ASBF) is Africa's leading science fair for young scientists, engineers, artists, and science communicators in primary and secondary schools. At ASBF 2024, participants present a show-and-tell on a science topic, innovation, or piece of original research of their choosing.",
    id: "Africa Science Buskers Festival (ASBF) adalah pameran sains terdepan di Afrika bagi peneliti muda, insinyur, seniman, dan komunikator sains tingkat SD dan SMP/SMA. Di ASBF 2024, peserta menampilkan presentasi show-and-tell atas topik sains, inovasi, atau penelitian orisinal pilihannya.",
  },

  "china-adolescents-science-and-technology-innovation-contest-castic": {
    en: "CASTIC is Asia's largest and most prestigious event for young scientists from around the world — a place to engage with science, share different values and traditions, and build friendships globally.",
    id: "CASTIC adalah event terbesar dan paling bergengsi di Asia bagi peneliti muda dari seluruh dunia — tempat bergelut dengan sains, saling bertukar nilai dan tradisi, serta membangun pertemanan lintas negara.",
  },

  "world-invention-creativity-olympic-wico": {
    en: "WICO is an IYSA affiliate event from South Korea. It draws out creative ideas, opens new perspectives, sharpens presentation skills, and builds a global network for its participants.",
    id: "WICO adalah event afiliasi IYSA dari Korea Selatan. Event ini memancing gagasan kreatif, membuka cara pandang baru, mengasah kemampuan presentasi, dan membangun jaringan global bagi pesertanya.",
  },

  "innoverse-invention-and-innovation-expo": {
    en: "Innoverse Expo is a leading event for inventors, innovators, and entrepreneurs to present their products and ideas. The expo features advanced technology, groundbreaking research, and innovative products from a range of industries including healthcare, energy, and telecommunications.",
    id: "Innoverse Expo adalah event terdepan bagi inventor, inovator, dan wirausahawan untuk menampilkan produk dan gagasannya. Pamerannya menghadirkan teknologi mutakhir, penelitian terobosan, dan produk inovatif dari berbagai industri — kesehatan, energi, telekomunikasi, dan lainnya.",
  },

  "international-creative-papers-conference-olympics-icpc": {
    en: "The International Creative Papers Conference (ICPC) is an academic event where researchers from around the world present innovative research. It gives students and professionals a platform for creative and outstanding papers — invention papers, academic papers, and other forms of research. Its main aim is to enable the exchange and presentation of outstanding work by leading scholars who shape science, technology, and the knowledge economy.",
    id: "International Creative Papers Conference (ICPC) adalah event akademik tempat peneliti dari seluruh dunia memaparkan penelitian inovatifnya. ICPC memberi ruang bagi pelajar dan profesional untuk menampilkan makalah kreatif dan unggul — makalah invensi, makalah akademik, maupun bentuk penelitian lain. Tujuan utamanya memungkinkan pertukaran dan pemaparan karya unggul dari akademisi terkemuka yang berperan dalam sains, teknologi, dan ekonomi pengetahuan.",
  },

  "malaysia-international-young-inventors-olympiad-miyio-2025": {
    en: "MIYIO 2025 — the 13th Malaysia International Young Inventors Olympiad — is an international innovation competition for young inventors and students to present creative projects and technological solutions. MIYIO works to build creativity, scientific thinking, and problem-solving among young innovators. Participants present invention projects across fields including science, technology, engineering, the environment, health, and social innovation.",
    id: "MIYIO 2025 — Malaysia International Young Inventors Olympiad ke-13 — adalah kompetisi inovasi internasional bagi inventor muda dan pelajar untuk menampilkan proyek kreatif dan solusi teknologinya. MIYIO menumbuhkan kreativitas, cara berpikir ilmiah, dan kemampuan memecahkan masalah di kalangan inovator muda. Peserta memaparkan proyek invensi di berbagai bidang: sains, teknologi, rekayasa, lingkungan, kesehatan, dan inovasi sosial.",
  },
};

/**
 * Negara asal, untuk penanda di kartu.
 *
 * PERHATIAN — belum terverifikasi. Data lama tidak mencatat negara sama sekali;
 * sembilan di antaranya disebut di dalam teks deskripsinya sendiri ("from
 * Malaysia", "from Poland"), tapi EMPAT ini saya simpulkan dari pengetahuan
 * umum, bukan dari sumber mana pun:
 *
 *   · africa-science-buskers-festival        → Namibia
 *   · innoverse-invention-and-innovation-expo → India
 *   · international-creative-papers-...-icpc  → Indonesia
 *   · taiwan-international-science-fair       → Taiwan (dari nama, bukan teks)
 *
 * Label negara yang salah di halaman mitra adalah kesalahan yang menimpa nama
 * IYSA, bukan nama saya. Karena itu `unverifiedCountry` di bawah menandainya,
 * dan komponen hanya menampilkan yang sudah pasti. Hapus dari daftar itu
 * setelah dikonfirmasi.
 */
export const unverifiedCountry = new Set([
  "africa-science-buskers-festival",
  "innoverse-invention-and-innovation-expo",
  "international-creative-papers-conference-olympics-icpc",
]);

export const affiliateCountry: Record<string, Bilingual> = {
  "beijing-youth-science-creation-competition": { en: "China", id: "Tiongkok" },
  "taiwan-international-science-fair": { en: "Taiwan", id: "Taiwan" },
  "phatthalung-international-science-fair": { en: "Thailand", id: "Thailand" },
  "5th-international-exhibition-inventcor": { en: "Romania", id: "Rumania" },
  "malaysia-invention-innovation-expo": { en: "Malaysia", id: "Malaysia" },
  "international-innovation-and-invention-show-e-nnovate": { en: "Poland", id: "Polandia" },
  "worldinvent-singapore-wosg": { en: "Singapore", id: "Singapura" },
  "africa-science-buskers-festival": { en: "Namibia", id: "Namibia" },
  "china-adolescents-science-and-technology-innovation-contest-castic": {
    en: "China",
    id: "Tiongkok",
  },
  "world-invention-creativity-olympic-wico": { en: "South Korea", id: "Korea Selatan" },
  "innoverse-invention-and-innovation-expo": { en: "India", id: "India" },
  "international-creative-papers-conference-olympics-icpc": { en: "Indonesia", id: "Indonesia" },
  "malaysia-international-young-inventors-olympiad-miyio-2025": {
    en: "Malaysia",
    id: "Malaysia",
  },
};

/**
 * Profil, visi-misi, dan daftar program.
 *
 * Semua teks di berkas ini sebelumnya terkunci di dalam komponen React
 * (CompanyProfileComp.js, Vision-Mission.js, About.js, Curation.js). Versi
 * Inggris dipertahankan sesuai aslinya kecuali salah tulis yang jelas —
 * "oppotunities" → "opportunities", "by Indonesia by providing" → "by
 * providing", dan satu "the world." yang tercetak dua kali. Versi Indonesia
 * baru; di situs lama tidak ada bahasa kedua sama sekali.
 */

type Bilingual = { en: string; id: string };

export const intro: Bilingual = {
  en: "Indonesian Young Scientist Association (IYSA) is an institution engaged in developing Indonesian students' potential, talents, and creativity by providing them opportunities to participate in scientific competitions, non-competitive programmes, and activities in Indonesia and abroad.",
  id: "Indonesian Young Scientist Association (IYSA) adalah lembaga yang bergerak di bidang pendidikan untuk mengembangkan potensi, bakat, dan kreativitas pelajar Indonesia, dengan membuka jalan bagi mereka untuk mengikuti kompetisi ilmiah, program non-kompetisi, dan kegiatan di dalam maupun luar negeri.",
};

export const founding: Bilingual = {
  en: "IYSA was established in November 2018 and legally confirmed at the Ministry of Law and Human Rights in the form of a notarial deed in 2019. It was founded by Mr. Deni Irawan.",
  id: "IYSA berdiri pada November 2018 dan disahkan di Kementerian Hukum dan Hak Asasi Manusia melalui akta notaris pada 2019. Pendirinya adalah Bapak Deni Irawan.",
};

export const reach: Bilingual = {
  en: "Since its inception, IYSA has been active in a wide range of activities, building affiliations with countries including Malaysia, Thailand, Singapore, China, India, Korea, Taiwan, Türkiye, Tunisia, Egypt, and the United Arab Emirates.",
  id: "Sejak awal berdiri, IYSA aktif dalam berbagai kegiatan dan membangun afiliasi dengan berbagai negara, antara lain Malaysia, Thailand, Singapura, Tiongkok, India, Korea, Taiwan, Türkiye, Tunisia, Mesir, dan Uni Emirat Arab.",
};

export const vision: Bilingual = {
  en: "To become an institution that enables young Indonesian researchers to keep communicating and innovating through research.",
  id: "Menjadi lembaga yang memfasilitasi peneliti muda Indonesia untuk terus berkomunikasi dan berinovasi melalui penelitian.",
};

export const mission: Bilingual[] = [
  {
    en: "Run national collaboration programmes between young Indonesian researchers.",
    id: "Menyelenggarakan program kolaborasi tingkat nasional antar peneliti muda Indonesia.",
  },
  {
    en: "Hold competition programmes within the country.",
    id: "Menyelenggarakan program kompetisi di dalam negeri.",
  },
  {
    en: "Prepare young Indonesian researchers to represent Indonesia in international competitions.",
    id: "Menyiapkan peneliti muda Indonesia untuk mewakili Indonesia di kompetisi tingkat internasional.",
  },
];

export const goals: Bilingual[] = [
  {
    en: "Provide opportunities for Indonesian students to develop their potential, especially in science and technology.",
    id: "Membuka kesempatan bagi pelajar Indonesia untuk mengembangkan potensinya, terutama di bidang sains dan teknologi.",
  },
  {
    en: "Cultivate a spirit of competition that draws out the potential in Indonesian students.",
    id: "Menumbuhkan semangat berkompetisi agar potensi pelajar Indonesia keluar sepenuhnya.",
  },
];

export const community: Bilingual = {
  en: "IYSA runs a nationwide community for contestants called Members of IYSA, and a dedicated community for research teachers in Indonesia and abroad called the IYSA Research Teachers Community.",
  id: "IYSA menaungi komunitas peserta di seluruh Indonesia bernama Members of IYSA, serta komunitas khusus guru pembimbing penelitian di dalam dan luar negeri bernama IYSA Research Teachers Community.",
};

export const experts: Bilingual = {
  en: "From the beginning until now, IYSA has been supported by a team of experts and expert staff — professors, lecturers, practitioners, researchers, and teachers of scientific work from leading institutions across Indonesia.",
  id: "Sejak awal hingga kini, IYSA didukung tim ahli dan staf ahli yang terdiri dari profesor, dosen, praktisi, peneliti, dan guru pembina karya ilmiah dari berbagai institusi terkemuka di Indonesia.",
};

export const partnersNational: Bilingual = {
  en: "In running its programmes, IYSA works with leading institutions — public and private universities in Indonesia and abroad.",
  id: "Dalam menjalankan programnya, IYSA bekerja sama dengan institusi terkemuka, baik perguruan tinggi negeri maupun swasta, di Indonesia dan luar negeri.",
};

export const partnersInternational: Bilingual = {
  en: "IYSA also collaborates with more than 50 organisations across Asia, Europe, the Americas, and Africa, and has sent many Indonesian students to take part in their affiliated events.",
  id: "IYSA juga berkolaborasi dengan lebih dari 50 organisasi di Asia, Eropa, Amerika, dan Afrika, serta telah mengantar banyak pelajar Indonesia mengikuti event afiliasi mereka.",
};

/**
 * Program kompetisi. Di situs lama daftar ini hanya deretan akronim dalam
 * tanda kurung tanpa keterangan apa pun — dikelompokkan di sini supaya
 * pembaca tahu apa yang sedang dilihatnya.
 */
export const programmes = {
  nationalCompetitions: [
    "IIF-NASIONAL", "JNSF", "LKTIN", "NASISC", "NASPO", "NICYMS",
    "NRTC", "NSIF", "NYIIA", "OSPC", "YNSF",
  ],
  internationalCompetitions: [
    "AISEEF", "BISF", "GLOCOLIS", "GYIIF", "I2ASPO", "I3O", "IICYMS",
    "IIIEX", "IRTC", "ISIF", "ISPC", "IYBC", "IYMIA", "JISF", "TISIIF",
    "WASISC", "WECC", "WICE", "WSEEC", "WYIIA", "YISF",
  ],
  nationalOlympiads: ["NYMO", "NYEO", "NYBO", "NYCO", "NYPO"],
  internationalOlympiads: ["IYMO", "IYEO", "IYBO", "IYCO", "IYPO"],
  nonCompetition: [
    "IYSA CSR",
    "IYSA Excursion",
    "IYSA Research Portal",
    "IYSA Goes To School",
    "IYSA Newsletter",
    "IYSA Edutainment Webinar",
    "Campus Corner",
    "Online Research Course",
  ],
} as const;

export const programmeLabels: Record<keyof typeof programmes, Bilingual> = {
  nationalCompetitions: { en: "National competitions", id: "Kompetisi nasional" },
  internationalCompetitions: {
    en: "International competitions",
    id: "Kompetisi internasional",
  },
  nationalOlympiads: { en: "National olympiads", id: "Olimpiade nasional" },
  internationalOlympiads: { en: "International olympiads", id: "Olimpiade internasional" },
  nonCompetition: { en: "Non-competition programmes", id: "Program non-kompetisi" },
};

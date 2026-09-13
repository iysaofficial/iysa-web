/**
 * Identitas & kontak organisasi.
 *
 * Di situs lama seluruh isi berkas ini hanya ada di dalam Footer.js — satu
 * komponen React sebagai satu-satunya tempat alamat kantor dan nomor WhatsApp
 * tercatat. Dipindahkan ke sini supaya bisa disunting tanpa deploy dan
 * dipakai ulang oleh halaman kontak, JSON-LD, dan metadata.
 */

export const org = {
  name: "Indonesian Young Scientist Association",
  shortName: "IYSA",
  founded: "2018-11",
  legalNote: {
    en: "Legally confirmed by notarial deed at the Ministry of Law and Human Rights, 2019.",
    id: "Disahkan melalui akta notaris di Kementerian Hukum dan Hak Asasi Manusia, 2019.",
  },
  founder: "Deni Irawan, M. Pd",

  email: "youngscientist.iysa@gmail.com",

  address: {
    street: "Jl. Kemang, Pasir Putih",
    district: "Kecamatan Sawangan",
    city: "Kota Depok",
    region: "Jawa Barat",
    postalCode: "16519",
    country: "ID",
    mapsUrl: "https://goo.gl/maps/9x18coXGCmSscKec6",
  },

  /**
   * Situs lama memajang satu nomor dan menyimpan satu lagi di dalam komentar
   * kode. Keduanya dipertahankan di sini; hanya yang `primary` yang tampil,
   * sisanya menunggu konfirmasi apakah masih aktif.
   */
  whatsapp: [
    { number: "+6288213248890", display: "+62 882 1324 8890", primary: true },
    { number: "+6281770914129", display: "+62 817 7091 4129", primary: false },
  ],

  social: [
    {
      label: "Instagram",
      url: "https://www.instagram.com/iysa_official/?hl=id",
      handle: "@iysa_official",
    },
    { label: "YouTube", url: "https://www.youtube.com/@IYSAOfficial", handle: "@IYSAOfficial" },
    { label: "TikTok", url: "https://www.tiktok.com/@iysa.official", handle: "@iysa.official" },
    {
      label: "Facebook",
      url: "https://www.facebook.com/profile.php?id=100063979907207",
      handle: "IYSA Official",
    },
    {
      label: "LinkedIn",
      url: "https://www.linkedin.com/company/indonesian-young-scientist-association-iysa",
      handle: "IYSA",
    },
  ],

  dashboardUrl: "https://dashboard.iysa.or.id/login",
} as const;

export const addressLine = [
  org.address.street,
  org.address.district,
  org.address.city,
  org.address.region,
  org.address.postalCode,
].join(", ");

export const primaryWhatsapp = org.whatsapp.find((w) => w.primary)!;

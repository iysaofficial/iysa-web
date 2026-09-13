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
    /* Peta tersemat kantor. Situs lama memasangnya di halaman kontak; versi
       pertama situs baru hanya menyisakan alamatnya sebagai tautan teks, jadi
       pengunjung kehilangan satu-satunya cara melihat di mana kantornya
       sebelum mengklik keluar. */
    mapsEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d253741.41689444406!2d106.49425108671875!3d-6.431333699999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69e906913915c7%3A0x1de9ddf653d9736f!2sIYSA!5e0!3m2!1sid!2sid!4v1689664084076!5m2!1sid!2sid",
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

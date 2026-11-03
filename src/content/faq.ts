import type { Locale } from "@/i18n/routing";
import type { FaqItem } from "@/lib/data";

/**
 * Tanya jawab umum (FAQ) peserta IYSA dalam dua bahasa.
 *
 * Data warisan di `src/content/generated/faq.json` hanya tersedia dalam bahasa
 * Inggris percakapan dengan sejumlah salah ketik tanda baca dan huruf kecil di
 * awal kalimat ("how many zoom accounts can join and what should i set my name").
 * Berkas ini menyediakan terjemahan bahasa Indonesia yang baku serta merapikan
 * tata bahasa Inggrisnya tanpa mengubah satu pun aturan atau prosedur panitia.
 */
export const faqTerjemahan: Record<Locale, FaqItem[]> = {
  id: [
    {
      group: "registration",
      question: "Kapan kami menerima LoA (Letter of Acceptance) dan ke mana dokumen tersebut dikirimkan?",
      answer:
        "Setelah pendaftaran Anda kami terima, surel konfirmasi akan dikirimkan dalam waktu 1×24 jam. Adapun LoA akan dikirimkan ke alamat surel ketua tim maksimal 3×24 jam setelah pendaftaran.",
    },
    {
      group: "registration",
      question: "Saya sudah mendaftar satu minggu yang lalu, tetapi mengapa belum menerima LoA dan Invoice?",
      answer:
        "Silakan periksa folder Spam atau Promosi pada surel ketua tim Anda; ada kemungkinan surel dari tim IYSA masuk ke folder tersebut.",
    },
    {
      group: "registration",
      question: "Di mana kami mengunggah berkas kompetisi?",
      answer:
        "Tautan Google Drive untuk mengunggah berkas kompetisi serta tautan pengunggahan bukti pembayaran tercantum di dalam dokumen Invoice.",
    },
    {
      group: "registration",
      question: "Saya ingin membayar biaya pendaftaran, tetapi di mana saya bisa menemukan Invoice dan nomor rekening tujuan?",
      answer:
        "Invoice dikirimkan bersamaan dalam satu dokumen dengan LoA tim Anda — pastikan Anda membaca surel serta lampiran LoA hingga halaman terakhir. Pembayaran dapat ditransfer ke nomor rekening yang tertera pada Invoice sesuai dengan nominal yang tercantum.",
    },
    {
      group: "registration",
      question: "Saya sudah membayar biaya pendaftaran. Ke mana saya harus mengunggah bukti pembayaran?",
      answer:
        "Setelah melakukan pembayaran, silakan unggah bukti transfer melalui tautan yang tertera pada dokumen Invoice. Pastikan seluruh data dan bukti transfer diunggah dengan benar agar dapat segera diverifikasi oleh panitia.",
    },
    {
      group: "registration",
      question: "Kapan kuitansi pembayaran (receipt) akan dikirimkan kepada kami?",
      answer:
        "Kuitansi pembayaran akan kami kirimkan ke surel ketua tim selambat-lambatnya 7 hari kerja setelah Anda mengunggah bukti pembayaran.",
    },
    {
      group: "registration",
      question: "Penjurian tinggal satu minggu lagi, mengapa saya belum menerima jadwal presentasi tim?",
      answer:
        "Jadwal presentasi peserta daring akan kami kirimkan selambat-lambatnya 2 hari sebelum pelaksanaan penjurian melalui grup WhatsApp dan surel ketua tim. Pastikan Anda rutin memeriksa informasi terbaru di grup WhatsApp maupun surel.",
    },
    {
      group: "presentation",
      question: "Kapan jadwal presentasi akan dibagikan oleh panitia?",
      answer:
        "Jadwal presentasi dibagikan selambat-lambatnya 2 hari sebelum penjurian berlangsung (atau lebih awal) melalui grup WhatsApp dan surel ketua tim.",
    },
    {
      group: "presentation",
      question: "Aplikasi apa yang digunakan untuk presentasi daring? Zoom, Google Meet, atau lainnya?",
      answer:
        "Untuk penjurian daring (online), kami selalu menggunakan aplikasi Zoom. Pastikan aplikasi Zoom pada perangkat Anda sudah diperbarui ke versi terbaru.",
    },
    {
      group: "presentation",
      question: "Kapan tautan Zoom akan dibagikan oleh panitia?",
      answer:
        "Tautan Zoom akan dibagikan pada hari pelaksanaan penjurian dan dikirimkan secara berkala ke grup WhatsApp sesuai jadwal sesi presentasi tim Anda.",
    },
    {
      group: "presentation",
      question: "Berapa akun Zoom yang boleh bergabung dan bagaimana format penamaan akunnya?",
      answer:
        "Setiap tim diperkenankan bergabung ke ruang Zoom menggunakan maksimal 5 akun peserta. Seluruh akun wajib menggunakan format nama yang telah ditentukan, yaitu: \"Nomor Ruang_Nama Ketua Tim_Nama Institusi\".",
    },
    {
      group: "presentation",
      question: "Berapa lama durasi presentasi untuk setiap tim?",
      answer:
        "Setiap tim diberikan waktu total 15 menit untuk 1 sesi penjurian, yang terbagi menjadi 7 menit pertama untuk pemaparan materi dan 8 menit berikutnya untuk sesi tanya jawab bersama dewan juri.",
    },
    {
      group: "presentation",
      question: "Berapa juri yang akan menilai di stan (booth) peserta luring?",
      answer:
        "Sama seperti penjurian daring, setiap tim akan dinilai oleh 2 orang juri. Setelah sesi penilaian selesai, tim Anda akan diberikan stiker tanda sudah dinilai — pastikan stan Anda mendapatkan 2 stiker.",
    },
    {
      group: "presentation",
      question: "Apakah kami boleh merapikan stan (booth) segera setelah selesai dinilai?",
      answer:
        "Anda baru diperkenankan merapikan stan setelah seluruh tim selesai dinilai. Apabila tim Anda sudah selesai dinilai lebih awal, silakan mengunjungi stan peserta lainnya terlebih dahulu.",
    },
    {
      group: "results",
      question: "Kapan pengumuman pemenang dilaksanakan?",
      answer:
        "Pengumuman pemenang (Awarding Ceremony) diselenggarakan pada hari terakhir rangkaian acara. Anda dapat melihat tanggal pastinya pada jadwal di Buku Panduan (Guide Book).",
    },
    {
      group: "results",
      question: "Di mana kami dapat melihat daftar hasil pemenang?",
      answer:
        "Anda dapat memeriksa daftar hasil akhir pemenang pada situs web resmi dari ajang kompetisi yang Anda ikuti.",
    },
    {
      group: "results",
      question: "Kapan E-Certificate akan dikirimkan?",
      answer:
        "IYSA tidak mengirimkan E-Certificate kepada peserta Nasional maupun peserta asal Indonesia yang mengikuti kompetisi secara daring. Peserta Nasional daring akan menerima sertifikat cetak (hardcopy) yang dikirimkan bersama medali melalui ekspedisi JNE.",
    },
    {
      group: "results",
      question: "Kapan sertifikat peserta daring akan dikirimkan?",
      answer:
        "Sertifikat akan dikirimkan selambat-lambatnya satu bulan setelah pengumuman pemenang. Anda dapat memeriksa nomor resi pengiriman yang kami bagikan secara berkala di grup WhatsApp untuk memantau status pengiriman sertifikat Anda.",
    },
    {
      group: "results",
      question: "Di mana kami bisa mendapatkan sertifikat pembimbing (supervisor certificate)?",
      answer:
        "Anda dapat melihat dan mengunduh sertifikat pembimbing langsung melalui situs web resmi dari ajang kompetisi yang Anda ikuti.",
    },
    {
      group: "results",
      question: "Bagaimana cara memesan penggandaan medali (medal doubling)?",
      answer:
        "Bagi peserta luring (offline), Anda dapat langsung memesan penggandaan medali di lokasi acara setelah pengumuman pemenang selesai. Bagi peserta daring (online), pemesanan dapat dilakukan melalui tautan yang kami bagikan di grup WhatsApp selambat-lambatnya 2 hari setelah pengumuman pemenang.",
    },
  ],
  en: [
    {
      group: "registration",
      question: "When will we receive our LoA (Letter of Acceptance), and where will it be sent?",
      answer:
        "After we receive your registration, we will send a confirmation email within 1×24 hours. Your LoA will be sent to the team leader's email address within 3×24 hours after registration.",
    },
    {
      group: "registration",
      question: "I registered one week ago — why haven't I received my LoA and Invoice yet?",
      answer:
        "Please check the Spam or Promotions folder in your team leader's email inbox, as emails from the IYSA committee may occasionally be filtered there.",
    },
    {
      group: "registration",
      question: "Where do we upload our competition files?",
      answer:
        "The Google Drive link for uploading competition files and the link for submitting proof of payment are both included in your Invoice document.",
    },
    {
      group: "registration",
      question: "I want to pay the registration fee, where can I find the invoice and bank account details?",
      answer:
        "We send the Invoice together in the same document as your team's LoA — please make sure to read the email and LoA attachment all the way to the last page. Payment can be transferred to the bank account listed on the Invoice according to the stated amount.",
    },
    {
      group: "registration",
      question: "I have already paid the registration fee. Where can I upload the proof of payment?",
      answer:
        "Once you have completed the payment, please upload your transfer receipt via the link provided on the Invoice. Make sure all details and the proof of transfer are filled in accurately so the committee can verify and record your payment.",
    },
    {
      group: "registration",
      question: "When will the payment receipt be sent to us?",
      answer:
        "We will send the official payment receipt to the team leader's email within a maximum of 7 working days after you have uploaded your proof of payment.",
    },
    {
      group: "registration",
      question: "Judging is one week away — why haven't I received my team's presentation schedule yet?",
      answer:
        "We send the online presentation schedule no later than 2 days before judging takes place via the WhatsApp group and the team leader's email. Please check the WhatsApp group and your email regularly for updates.",
    },
    {
      group: "presentation",
      question: "When will the presentation schedule be shared by the committee?",
      answer:
        "We share the presentation schedule no later than 2 days before judging takes place (or earlier) via the WhatsApp group and the team leader's email.",
    },
    {
      group: "presentation",
      question: "Which application is used for online presentations — Zoom, Google Meet, or another platform?",
      answer:
        "For online judging, we always use Zoom. Please make sure your Zoom application is updated to the latest version before judging day.",
    },
    {
      group: "presentation",
      question: "When will the Zoom link be shared by the committee?",
      answer:
        "We provide the Zoom link on judging day and share it periodically in the WhatsApp group according to your team's scheduled presentation slot.",
    },
    {
      group: "presentation",
      question: "How many Zoom accounts may join, and how should we format our display names?",
      answer:
        "Up to 5 participant accounts per team may join the Zoom room. All accounts must follow the required naming format: \"Room Number_Team Leader Name_Institution Name\".",
    },
    {
      group: "presentation",
      question: "How long is each team's presentation session?",
      answer:
        "Each team is allocated 15 minutes in total per judging session: the first 7 minutes for the presentation and the remaining 8 minutes for the Q&A session with the jury.",
    },
    {
      group: "presentation",
      question: "How many judges will visit each offline participant's booth?",
      answer:
        "Just like online judging, 2 judges will evaluate each team. After your team has been evaluated, you will receive a sticker indicating that your booth has been judged — please make sure your booth receives 2 stickers.",
    },
    {
      group: "presentation",
      question: "May we pack up our booth right after being judged?",
      answer:
        "You may begin packing up your booth only after all teams have finished being judged. Once your judging session is complete, feel free to visit other participants' booths first.",
    },
    {
      group: "results",
      question: "When will the winners be announced?",
      answer:
        "The winners announcement (Awarding Ceremony) is held on the final day of each event. You can check the exact date on the schedule listed in the Guide Book.",
    },
    {
      group: "results",
      question: "Where can we view the official list of winners?",
      answer:
        "You can view the final results on the official website of the competition you are participating in.",
    },
    {
      group: "results",
      question: "When will E-Certificates be sent?",
      answer:
        "IYSA does not send E-Certificates to National participants or Indonesian participants joining online events. Online National participants receive printed hardcopy certificates shipped together with their medals via JNE courier.",
    },
    {
      group: "results",
      question: "When are certificates shipped to online participants?",
      answer:
        "Certificates are shipped no later than one month after the winners announcement. You can check the tracking numbers shared periodically in the WhatsApp group to monitor your shipment.",
    },
    {
      group: "results",
      question: "Where can we download the supervisor certificate?",
      answer:
        "You can view and download the supervisor certificate on the official website of the competition you are participating in.",
    },
    {
      group: "results",
      question: "How can we order duplicate medals (medal doubling)?",
      answer:
        "Offline participants can order duplicate medals on-site right after the winners announcement. Online participants can order duplicate medals via the link shared in the WhatsApp group no later than 2 days after the winners announcement.",
    },
  ],
};

export function ambilFaq(locale: Locale): FaqItem[] {
  return faqTerjemahan[locale] ?? faqTerjemahan.id;
}

export function ambilGrupFaq(locale: Locale) {
  const items = ambilFaq(locale);
  const groups = [...new Set(items.map((f) => f.group))];
  return groups.map((g) => ({ group: g, items: items.filter((f) => f.group === g) }));
}


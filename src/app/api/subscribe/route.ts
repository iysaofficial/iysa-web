import { sendMail, mailConfigured } from "@/lib/mail";
import { rateLimited, clientKey } from "@/lib/ratelimit";

/**
 * Langganan newsletter.
 *
 * Catatan penting: ini mengabarkan alamat baru ke kotak masuk IYSA, bukan
 * menambahkannya ke daftar kirim otomatis — belum ada tabel pelanggan di
 * dasbor. Begitu tabelnya ada, tulis ke sana dari sini.
 */
export async function POST(req: Request) {
  if (rateLimited(`sub:${clientKey(req)}`)) {
    return Response.json({ error: "terlalu sering" }, { status: 429 });
  }

  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return Response.json({ error: "badan permintaan bukan JSON" }, { status: 400 });
  }

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    return Response.json({ error: "alamat surel tidak valid" }, { status: 400 });
  }

  if (!mailConfigured()) {
    // Gagal dengan terang-terangan, bukan pura-pura berhasil. Formulir yang
    // menerima alamat lalu membuangnya lebih buruk daripada formulir yang
    // mengaku belum siap.
    console.error("[subscribe] RESEND_API_KEY / MAIL_TO belum diset");
    return Response.json({ error: "layanan surel belum dikonfigurasi" }, { status: 503 });
  }

  const result = await sendMail({
    subject: `Langganan newsletter baru: ${email.trim()}`,
    text: `Alamat surel baru mendaftar newsletter IYSA.\n\n${email.trim()}\n\nDikirim dari formulir langganan di iysa.or.id.`,
    replyTo: email.trim(),
  });

  if (!result.ok) {
    console.error(`[subscribe] gagal: ${result.reason} ${result.detail ?? ""}`);
    return Response.json({ error: "gagal mengirim" }, { status: 502 });
  }

  return Response.json({ ok: true });
}

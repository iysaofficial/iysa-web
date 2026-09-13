import { sendMail, mailConfigured } from "@/lib/mail";
import { rateLimited, clientKey } from "@/lib/ratelimit";

const MAX = { name: 120, subject: 160, message: 4000 };

export async function POST(req: Request) {
  if (rateLimited(`contact:${clientKey(req)}`)) {
    return Response.json({ error: "terlalu sering" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "badan permintaan bukan JSON" }, { status: 400 });
  }

  const str = (v: unknown, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

  const name = str(body.name, MAX.name);
  const email = str(body.email, 200);
  const subject = str(body.subject, MAX.subject);
  const message = str(body.message, MAX.message);

  const bad: string[] = [];
  if (!name) bad.push("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push("email");
  if (!message) bad.push("message");
  if (bad.length) return Response.json({ error: "tidak lengkap", fields: bad }, { status: 400 });

  // Kolom jebakan: disembunyikan dari manusia, diisi sebagian besar bot.
  if (str(body.website, 100)) return Response.json({ ok: true });

  if (!mailConfigured()) {
    console.error("[contact] RESEND_API_KEY / MAIL_TO belum diset");
    return Response.json({ error: "layanan surel belum dikonfigurasi" }, { status: 503 });
  }

  const result = await sendMail({
    subject: `[iysa.or.id] ${subject || "Pesan dari formulir kontak"}`,
    text: [
      `Nama   : ${name}`,
      `Surel  : ${email}`,
      `Perihal: ${subject || "—"}`,
      "",
      message,
      "",
      "— Dikirim dari formulir kontak iysa.or.id",
    ].join("\n"),
    replyTo: email,
  });

  if (!result.ok) {
    console.error(`[contact] gagal: ${result.reason} ${result.detail ?? ""}`);
    return Response.json({ error: "gagal mengirim" }, { status: 502 });
  }

  return Response.json({ ok: true });
}

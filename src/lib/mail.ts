/**
 * Pengiriman surel lewat Resend.
 *
 * Mengganti Formspree, yang di situs lama dipakai empat formulir sekaligus di
 * satu kuota gratis. Resend memberi 3.000 surel/bulan pada paket gratisnya —
 * cukup longgar untuk volume IYSA, dan tidak menaruh formulir apa pun di
 * belakang kuota yang bisa habis di tengah musim pendaftaran.
 *
 * Dipanggil lewat REST, tanpa SDK: satu permintaan POST tidak perlu paket
 * tambahan, dan dependensi yang tidak ada tidak perlu dirawat.
 */

const ENDPOINT = "https://api.resend.com/emails";

export type SendResult =
  | { ok: true }
  | { ok: false; reason: "unconfigured" | "rejected" | "network"; detail?: string };

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_TO);
}

export async function sendMail(input: {
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.MAIL_TO;
  // Harus domain yang sudah diverifikasi di Resend; sebelum itu, Resend hanya
  // mengizinkan pengiriman ke alamat pemilik akun.
  const from = process.env.MAIL_FROM ?? "IYSA <onboarding@resend.dev>";

  if (!key || !to) {
    return { ok: false, reason: "unconfigured" };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { ok: false, reason: "rejected", detail: `${res.status} ${await res.text()}`.slice(0, 300) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "network", detail: (err as Error).message };
  }
}

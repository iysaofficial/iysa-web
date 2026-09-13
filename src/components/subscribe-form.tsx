"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { org } from "@/content/org";

type State = "idle" | "sending" | "done" | "error";

/**
 * Langganan newsletter. Situs lama memakai Formspree (kuota gratis ketat,
 * dipakai empat formulir sekaligus); di sini permintaan masuk ke route
 * handler sendiri yang meneruskannya lewat Resend.
 *
 * Kalau surel gagal dikirim, pengunjung tidak dibiarkan buntu — alamat surel
 * IYSA ditawarkan sebagai jalan langsung.
 */
export function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("newsletter");
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setEmail("");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="text-[14px] leading-relaxed text-[var(--teal)]">
        {t("subscribed")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {!compact && (
        <label htmlFor="sub-email" className="eyebrow">
          {t("email")}
        </label>
      )}
      <div className="flex gap-2">
        <input
          id="sub-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          aria-label={compact ? t("email") : undefined}
          disabled={state === "sending"}
          className="min-w-0 flex-1 rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="shrink-0 rounded bg-[var(--coral)] px-4 py-2 text-[14px] font-semibold text-[var(--on-coral)] transition-opacity duration-[var(--gerak-cepat)] hover:opacity-90 disabled:opacity-60"
        >
          {state === "sending" ? t("subscribing") : t("subscribeCta")}
        </button>
      </div>

      {state === "error" && (
        <p role="alert" className="text-[13.5px] leading-relaxed text-[var(--coral)]">
          {t("subscribeError")}{" "}
          <a href={`mailto:${org.email}`} className="underline decoration-1 underline-offset-2">
            {org.email}
          </a>
        </p>
      )}
    </form>
  );
}

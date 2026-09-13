"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { org } from "@/content/org";

type State = "idle" | "sending" | "done" | "error";

const field =
  "w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[15.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] disabled:opacity-60";

export function ContactForm() {
  const t = useTranslations("contact");
  const [state, setState] = useState<State>("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setState("done");
        form.reset();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p
        role="status"
        className="border-l-2 border-[var(--teal)] pl-4 text-[15.5px] leading-relaxed text-[var(--teal)]"
      >
        {t("sent")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="c-name" className="eyebrow">
            {t("name")}
          </label>
          <input
            id="c-name"
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            disabled={state === "sending"}
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="c-email" className="eyebrow">
            {t("email")}
          </label>
          <input
            id="c-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            placeholder="nama@sekolah.sch.id"
            disabled={state === "sending"}
            className={field}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="c-subject" className="eyebrow">
          {t("subject")}
        </label>
        <input
          id="c-subject"
          name="subject"
          maxLength={160}
          placeholder={t("subjectPlaceholder")}
          disabled={state === "sending"}
          className={field}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="c-message" className="eyebrow">
          {t("message")}
        </label>
        <textarea
          id="c-message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          placeholder={t("messagePlaceholder")}
          disabled={state === "sending"}
          className={`${field} resize-y`}
        />
      </div>

      {/* Kolom jebakan: tak terlihat manusia, diisi sebagian besar bot. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-full bg-[var(--coral)] px-6 py-2.5 text-[14.5px] font-semibold text-[var(--on-coral)] transition-opacity duration-150 hover:opacity-90 disabled:opacity-60"
        >
          {state === "sending" ? t("sending") : t("send")}
        </button>

        {state === "error" && (
          <p role="alert" className="text-[13.5px] leading-relaxed text-[var(--coral)]">
            {t("error", { email: org.email })}
          </p>
        )}
      </div>
    </form>
  );
}

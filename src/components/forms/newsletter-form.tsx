"use client";

import { useActionState, useId } from "react";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { IDLE } from "@/lib/validation/schemas";
import { SpamFields } from "./spam-fields";

export function NewsletterForm({ source = "footer", tone = "dark" }: { source?: "footer" | "homepage"; tone?: "dark" | "light" }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, IDLE);
  const id = useId();
  const dark = tone === "dark";
  const error = state.status === "error" ? (state.fieldErrors?.email?.[0] ?? state.message) : undefined;

  if (state.status === "success") {
    return (
      <p role="status" className={dark ? "text-sand" : "text-emerald"}>
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} noValidate className="relative w-full max-w-md">
      <input type="hidden" name="source" value={source} />
      <SpamFields />
      <label htmlFor={`${id}-email`} className={`eyebrow mb-2 block ${dark ? "text-gold" : "text-gold-ink"}`}>
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`min-h-11 flex-1 border px-4 py-2 ${
            dark ? "border-gold/60 bg-emerald-deep text-ivory placeholder:text-sand/70" : "border-[#857a63] bg-white text-ink"
          }`}
          placeholder="you@example.com"
        />
        <button
          type="submit"
          disabled={pending}
          className={`min-h-11 px-6 text-xs font-medium tracking-[0.2em] uppercase disabled:opacity-60 ${
            dark ? "bg-gold text-emerald-deep hover:bg-[#d6b45f]" : "bg-emerald text-ivory hover:bg-emerald-deep"
          }`}
        >
          {pending ? "Joining…" : "Join"}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className={`mt-2 text-sm ${dark ? "text-[#f3b7a8]" : "text-error"}`}>
          {error}
        </p>
      )}
      <p className={`mt-3 text-xs ${dark ? "text-sand/90" : "text-muted"}`}>
        [NEWSLETTER CONSENT TEXT — what you'll send and how to unsubscribe; link to privacy policy]
      </p>
    </form>
  );
}

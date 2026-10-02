"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { submitEnquiry } from "@/app/actions/enquiry";
import { Button } from "@/components/ui/button";
import { ENQUIRY_TYPES, type FormState, IDLE, enquirySchema, fieldErrorsOf } from "@/lib/validation/schemas";
import { Field, FormMessage, describedBy } from "./field";
import { SpamFields } from "./spam-fields";

export function EnquiryForm({ defaultType }: { defaultType?: string }) {
  const id = useId();
  const [state, action, pending] = useActionState(submitEnquiry, IDLE);
  const [clientErrors, setClientErrors] = useState<Record<string, string[] | undefined> | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const errors = clientErrors ?? (state.status === "error" ? (state.fieldErrors ?? {}) : {});
  const err = (k: string) => errors[k]?.[0];
  const shown: FormState = clientErrors ? { status: "error", message: "Please check the highlighted fields." } : state;

  useEffect(() => {
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={messageRef} tabIndex={-1} role="status" className="bg-sand p-8 text-center focus:outline-none">
        <p className="font-display text-2xl text-emerald">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={action}
      noValidate
      className="relative grid gap-6"
      onSubmit={(e) => {
        // Validate in the browser first; the server action validates again.
        const result = enquirySchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
        if (!result.success) {
          e.preventDefault();
          setClientErrors(fieldErrorsOf(result.error));
          requestAnimationFrame(() => messageRef.current?.focus());
        } else {
          setClientErrors(null);
        }
      }}
    >
      <SpamFields />
      <div ref={messageRef} tabIndex={-1} className="focus:outline-none">
        <FormMessage state={shown} />
      </div>

      <Field id={`${id}-type`} label="What are you planning?" error={err("type")}>
        <select name="type" defaultValue={defaultType ?? ""} className="field-input" {...describedBy(`${id}-type`, err("type"))}>
          <option value="" disabled>
            Choose one
          </option>
          {ENQUIRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={`${id}-name`} label="Your name" error={err("name")}>
          <input name="name" autoComplete="name" className="field-input" {...describedBy(`${id}-name`, err("name"))} />
        </Field>
        <Field id={`${id}-email`} label="Email" error={err("email")}>
          <input name="email" type="email" autoComplete="email" className="field-input" {...describedBy(`${id}-email`, err("email"))} />
        </Field>
        <Field id={`${id}-phone`} label="Phone" optional error={err("phone")}>
          <input name="phone" type="tel" autoComplete="tel" className="field-input" {...describedBy(`${id}-phone`, err("phone"))} />
        </Field>
        <Field id={`${id}-company`} label="Company or organization" optional>
          <input name="company" autoComplete="organization" className="field-input" id={`${id}-company`} />
        </Field>
        <Field id={`${id}-eventDate`} label="Event date" optional error={err("eventDate")}>
          <input name="eventDate" type="date" className="field-input" {...describedBy(`${id}-eventDate`, err("eventDate"))} />
        </Field>
        <Field id={`${id}-quantity`} label="Approximate quantity" optional hint="e.g. 150 favour boxes">
          <input name="quantity" className="field-input" {...describedBy(`${id}-quantity`, undefined, true)} />
        </Field>
      </div>

      <Field id={`${id}-budget`} label="Budget" optional>
        <input name="budget" className="field-input" id={`${id}-budget`} />
      </Field>

      <Field id={`${id}-message`} label="Tell us about it" error={err("message")}>
        <textarea name="message" rows={6} className="field-input" {...describedBy(`${id}-message`, err("message"))} />
      </Field>

      <div>
        <label className="flex min-h-11 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            className="mt-1 h-5 w-5 shrink-0 accent-emerald"
            aria-invalid={err("consent") ? true : undefined}
            aria-describedby={err("consent") ? `${id}-consent-error` : undefined}
          />
          <span className="text-sm">
            I agree to MALAKI storing these details to reply to my enquiry, as described in the{" "}
            <Link href="/legal/privacy" className="underline underline-offset-4">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {err("consent") && (
          <p id={`${id}-consent-error`} className="mt-1 text-sm text-error">
            {err("consent")}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:justify-self-start">
        {pending ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}

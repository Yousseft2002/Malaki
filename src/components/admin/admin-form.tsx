"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/validation/schemas";
import { IDLE } from "@/lib/validation/schemas";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Form bound to an admin server action, showing its success / error message. */
export function AdminForm({
  action,
  children,
  submitLabel = "Save",
  className = "",
  confirm,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 bg-emerald px-5 text-xs font-medium tracking-[0.15em] text-ivory uppercase hover:bg-emerald-deep disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {state.status !== "idle" && (
          <p role={state.status === "error" ? "alert" : "status"} className={`text-sm ${state.status === "error" ? "text-error" : "text-emerald"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

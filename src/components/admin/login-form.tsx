"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions/auth";
import { FormMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { IDLE } from "@/lib/validation/schemas";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, IDLE);
  return (
    <form action={action} className="grid gap-5">
      <FormMessage state={state} />
      <div>
        <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input id="admin-email" name="email" type="email" autoComplete="username" required className="field-input" />
      </div>
      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required className="field-input" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

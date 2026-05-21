"use client";

import { useActionState } from "react";
import { signInSenior, type ActionResult } from "@/lib/auth/actions";
import { SeniorButton } from "@/components/senior/SeniorButton";
import { SeniorInput, SeniorLabel } from "@/components/senior/SeniorInput";

export function SeniorLoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signInSenior,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <SeniorLabel htmlFor="username">Uživatelské jméno</SeniorLabel>
        <SeniorInput
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="Např. babicka.marie"
        />
      </div>

      <div>
        <SeniorLabel htmlFor="password">Heslo</SeniorLabel>
        <SeniorInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.ok === false ? (
        <p
          role="alert"
          className="rounded-[var(--radius-senior-input)] border-2 border-[var(--color-red-200)] bg-[var(--color-red-50)] p-4 text-[var(--text-senior)] text-[var(--color-red-700)]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="pt-2">
        <SeniorButton
          type="submit"
          size="xl"
          block
          disabled={pending}
          className="btn-ribbon pr-10 bg-[var(--color-navy-800)] text-[var(--color-paper-50)] hover:bg-[var(--color-gold-400)] hover:text-[var(--color-navy-900)] hover:shadow-none"
        >
          {pending ? "Přihlašujeme…" : "Přihlásit se"}
        </SeniorButton>
      </div>
    </form>
  );
}

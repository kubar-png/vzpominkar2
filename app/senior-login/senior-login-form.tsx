"use client";

import { useActionState } from "react";
import { signInSenior, type ActionResult } from "@/lib/auth/actions";

export function SeniorLoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signInSenior,
    null,
  );

  return (
    <form action={formAction} className="auth-form">
      <div className="auth-field">
        <label htmlFor="username">Uživatelské jméno</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="Např. babicka.marie"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="password">Heslo</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.ok === false ? (
        <p role="alert" className="auth-alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? "Přihlašujeme…" : "Přihlásit se"}
        <span className="arrow" aria-hidden>
          ↗
        </span>
      </button>
    </form>
  );
}

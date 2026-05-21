"use client";

import { useActionState } from "react";
import { signInOwner, type ActionResult } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signInOwner,
    null,
  );

  return (
    <form action={formAction} className="auth-form">
      <div className="auth-field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vy@rodina.cz"
          required
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

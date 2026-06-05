"use client";

import { useActionState, useState } from "react";
import { signInOwner, type ActionResult } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signInOwner,
    null,
  );
  // Controlled so a failed login keeps the e-mail (the form would otherwise be
  // reset by the server action — re-typing the address is needlessly annoying).
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="auth-form">
      <div className="auth-field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vy@email.cz"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

      <label className="auth-remember">
        <input type="checkbox" name="remember" defaultChecked />
        <span>Zůstat přihlášen</span>
      </label>

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

"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ActionResult } from "@/lib/auth/actions";

export function ResetRequestForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    requestPasswordReset,
    null,
  );

  if (state?.ok) {
    return (
      <div className="auth-form" role="status" aria-live="polite">
        <p className="auth-lede" style={{ marginTop: 0 }}>
          Hotovo. Pokud k tomu e-mailu existuje účet, dorazí během chvíle zpráva
          s odkazem na nastavení nového hesla. Odkaz platí jednu hodinu.
        </p>
      </div>
    );
  }

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

      {state?.ok === false ? (
        <p role="alert" className="auth-alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? "Posíláme…" : "Poslat odkaz"}
        <span className="arrow" aria-hidden>
          ↗
        </span>
      </button>
    </form>
  );
}

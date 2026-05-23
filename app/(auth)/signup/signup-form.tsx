"use client";

import { useActionState } from "react";
import { signUpOwner, type ActionResult } from "@/lib/auth/actions";

export function SignupForm({
  product,
  gift,
}: {
  product?: string;
  gift?: boolean;
} = {}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signUpOwner,
    null,
  );

  const fieldError = (name: string) =>
    state?.ok === false && state.field === name ? state.error : undefined;

  // Email-confirmation flow: after a successful sign-up the user must
  // click the link in their inbox before we sign them in. Render a quiet
  // confirmation card instead of the form.
  if (state?.ok && state.checkEmail) {
    return (
      <div className="auth-form" role="status" aria-live="polite">
        <div
          style={{
            padding: "1.5rem",
            border: "1px solid var(--color-paper-200, #e6dcc4)",
            borderRadius: "10px",
            background: "var(--color-paper-100, #faf6ec)",
          }}
        >
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.5,
              color: "var(--color-navy-900, #16213a)",
              margin: 0,
            }}
          >
            Zkontrolujte svou e-mailovou schránku, poslali jsme vám
            potvrzovací odkaz. Po kliknutí vás přihlásíme a&nbsp;pomůžeme
            s&nbsp;prvním nastavením.
          </p>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.85rem",
              color: "var(--color-ink-600, #5b5547)",
            }}
          >
            Nedorazil? Mrkněte do nevyžádané pošty.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="auth-form">
      {product ? <input type="hidden" name="product" value={product} /> : null}
      {gift ? <input type="hidden" name="gift" value="1" /> : null}
      <Field
        label="Vaše jméno"
        name="displayName"
        autoComplete="name"
        placeholder="Jana Nováková"
        required
        error={fieldError("displayName")}
      />
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="vy@rodina.cz"
        required
        error={fieldError("email")}
      />
      <Field
        label="Heslo"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Aspoň 10 znaků"
        minLength={10}
        required
        error={fieldError("password")}
      />

      {state?.ok === false && !state.field ? (
        <p role="alert" className="auth-alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? "Vytváříme účet…" : "Vytvořit účet"}
        <span className="arrow" aria-hidden>
          ↗
        </span>
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div className="auth-field">
      <label htmlFor={props.name}>{label}</label>
      <input id={props.name} {...props} />
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}

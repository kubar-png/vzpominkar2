"use client";

import { useActionState } from "react";
import { signUpOwner, type ActionResult } from "@/lib/auth/actions";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function SignupForm({
  product,
  gift,
  test,
}: {
  product?: string;
  gift?: boolean;
  test?: boolean;
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
            border: "1px solid var(--color-paper-200, #F3E9C8)",
            borderRadius: "10px",
            background: "var(--color-paper-100, #FEF9E3)",
          }}
        >
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.5,
              color: "var(--color-navy-900, #101d31)",
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
              color: "var(--ink-soft)",
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
      {test ? <input type="hidden" name="test" value="1" /> : null}
      <Field
        label="Vaše jméno"
        name="displayName"
        autoComplete="name"
        placeholder="Jan Novák"
        required
        error={fieldError("displayName")}
      />
      <Field
        label="E-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="vy@email.cz"
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
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const errorId = error ? `${props.name}-error` : undefined;
  const common = {
    id: props.name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": errorId,
    style: error ? { borderColor: "var(--color-danger)" } : undefined,
    ...props,
  };
  return (
    <div className="auth-field">
      <label htmlFor={props.name}>{label}</label>
      {type === "password" ? (
        <PasswordInput {...common} />
      ) : (
        <input type={type} {...common} />
      )}
      {error ? (
        <p id={errorId} className="error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

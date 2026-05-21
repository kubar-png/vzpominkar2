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

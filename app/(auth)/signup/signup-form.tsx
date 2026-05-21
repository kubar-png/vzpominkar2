"use client";

import { useActionState } from "react";
import { signUpOwner, type ActionResult } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signUpOwner,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Vaše jméno"
        name="displayName"
        autoComplete="name"
        placeholder="Jana Nováková"
        required
        error={state?.ok === false && state.field === "displayName" ? state.error : undefined}
      />
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="vy@rodina.cz"
        required
        error={state?.ok === false && state.field === "email" ? state.error : undefined}
      />
      <Field
        label="Heslo"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Aspoň 10 znaků"
        minLength={10}
        required
        error={state?.ok === false && state.field === "password" ? state.error : undefined}
      />

      {state?.ok === false && !state.field ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-[var(--color-red-50)] p-3 text-sm text-[var(--color-red-700)]"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Vytváříme účet…" : "Vytvořit účet"}
      </Button>

      <p className="text-xs text-[var(--color-text-subtle)]">
        Vytvořením účtu souhlasíte s podmínkami služby Vzpomínkář a se zpracováním osobních údajů.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
      {error ? <p className="text-sm text-[var(--color-red-700)]">{error}</p> : null}
    </div>
  );
}

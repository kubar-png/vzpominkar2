"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateOwnerEmail, type ProfileResult } from "@/lib/auth/profile-actions";

export function EmailForm({ current }: { current: string | null }) {
  const [state, formAction, pending] = useActionState<ProfileResult | null, FormData>(
    updateOwnerEmail,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Nová e-mailová adresa</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={current ?? "vas@email.cz"}
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Po uložení vám pošleme ověřovací odkaz. Adresa se změní až po jeho potvrzení.
        </p>
      </div>

      {state?.ok === false ? (
        <p className="text-sm text-[var(--color-red-700)]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-[var(--color-success)]" role="status">
          {state.message ?? "Odesláno."}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Odesílám…" : "Změnit e-mail"}
      </Button>
    </form>
  );
}

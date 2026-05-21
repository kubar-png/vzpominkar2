"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateOwnerPassword, type ProfileResult } from "@/lib/auth/profile-actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<ProfileResult | null, FormData>(
    updateOwnerPassword,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="password">Nové heslo</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={10}
          maxLength={128}
          required
          autoComplete="new-password"
        />
      </div>

      {state?.ok === false ? (
        <p className="text-sm text-[var(--color-red-700)]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-[var(--color-success)]" role="status">
          {state.message ?? "Uloženo."}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Ukládám…" : "Změnit heslo"}
      </Button>
    </form>
  );
}

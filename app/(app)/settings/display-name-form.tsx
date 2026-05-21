"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateDisplayName, type ProfileResult } from "@/lib/auth/profile-actions";

export function DisplayNameForm({ initial }: { initial: string }) {
  const [state, formAction, pending] = useActionState<ProfileResult | null, FormData>(
    updateDisplayName,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Jméno</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initial}
          required
          minLength={2}
          maxLength={80}
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
        {pending ? "Ukládám…" : "Uložit"}
      </Button>
    </form>
  );
}

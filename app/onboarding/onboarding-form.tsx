"use client";

import { useActionState } from "react";
import { startOnboarding, type ActionState } from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    startOnboarding,
    null,
  );

  return (
    <form action={formAction} className="space-y-8">
      <Card>
        <CardContent className="space-y-5 p-7">
          <div className="space-y-2">
            <Label htmlFor="seniorDisplayName">Jméno blízkého, jak ho oslovujete</Label>
            <Input
              id="seniorDisplayName"
              name="seniorDisplayName"
              required
              autoFocus
              placeholder="Babička Marie"
              autoComplete="off"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Klidně tak, jak mu říkáte doma. Tohle jméno ponese jeho kniha —
              později ho můžete změnit.
            </p>
          </div>
        </CardContent>
      </Card>

      {state?.ok === false ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-[var(--color-red-50)] p-3 text-sm text-[var(--color-red-700)]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[34ch] text-xs text-[var(--color-text-muted)]">
          Cenu uvidíte hned v&nbsp;dalším kroku — jednorázově, bez předplatného.
        </p>
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Ukládám…" : "Pokračovat"}
          <span aria-hidden>↗</span>
        </Button>
      </div>
    </form>
  );
}

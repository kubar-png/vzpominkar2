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
            <Label htmlFor="familyName">Jak se vaše rodina jmenuje?</Label>
            <Input
              id="familyName"
              name="familyName"
              required
              placeholder="Vzpomínky babičky Marie"
              autoComplete="off"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Tohle se objeví v záhlaví aplikace a v pozdější knize.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seniorDisplayName">Jméno blízkého, jak ho oslovujete</Label>
            <Input
              id="seniorDisplayName"
              name="seniorDisplayName"
              required
              placeholder="Babička Marie"
              autoComplete="off"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Otázky pro vašeho blízkého si v klidu vyberete později v aplikaci —
              nejdřív se v ní rozhlédnete.
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

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Ukládám…" : "Pokračovat"}
        </Button>
      </div>
    </form>
  );
}

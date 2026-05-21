"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetSeniorPassword } from "@/lib/auth/senior-account-actions";

export function SeniorPasswordReset({
  familyId,
  seniorId,
  username,
}: {
  familyId: string;
  seniorId: string;
  username: string;
}) {
  const [pending, start] = useTransition();
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onReset() {
    setError(null);
    start(async () => {
      const result = await resetSeniorPassword(familyId, seniorId);
      if (result.ok) setNewPassword(result.password);
      else setError(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vygenerovat nové heslo</CardTitle>
        <CardDescription>
          Pokud blízký heslo zapomněl, vygenerujeme nové. Staré heslo přestane fungovat okamžitě.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {newPassword ? (
          <div className="space-y-4">
            {/* Warm-toned "shown once" alert — gold rule + small caps eyebrow */}
            <div className="rounded-[var(--radius-md)] border border-[var(--color-gold-300)] bg-[var(--color-gold-50)] p-4">
              <div className="flex items-center gap-2">
                <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden fill="none">
                  <polygon points="4,0.5 7.5,4 4,7.5 0.5,4" stroke="var(--color-gold-500)" strokeWidth="1" />
                </svg>
                <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--color-gold-600)]">
                  Zobrazí se jen jednou
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">
                Zapište si nebo vytiskněte tento lísteček teď. Po zavření už heslo
                neuvidíte - příště jen vygenerujete nové.
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-paper-50)] p-5">
              <div className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                Uživatelské jméno
              </div>
              <div className="font-mono text-xl">{username}</div>
              <div className="mt-3 text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                Nové heslo
              </div>
              <div className="font-mono text-xl">{newPassword}</div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => window.print()}>
                Vytisknout
              </Button>
              <Button variant="ghost" onClick={() => setNewPassword(null)}>
                Hotovo
              </Button>
            </div>
          </div>
        ) : (
          <>
            {error ? (
              <p
                role="alert"
                className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-[var(--color-red-50)] p-3 text-sm text-[var(--color-red-700)]"
              >
                {error}
              </p>
            ) : null}
            <Button variant="danger" onClick={onReset} disabled={pending}>
              {pending ? "Generujeme…" : "Vygenerovat nové heslo"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

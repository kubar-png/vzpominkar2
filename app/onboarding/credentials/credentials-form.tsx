"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { createSeniorAccount } from "@/lib/auth/actions";

interface Props {
  familyId: string;
  seniorDisplayName: string;
}

type SubmitState =
  | { phase: "form"; error?: string }
  | {
      phase: "done";
      credentials: { username: string; password: string; displayName: string };
    };

export function CredentialsForm({ familyId, seniorDisplayName }: Props) {
  const [state, setState] = useState<SubmitState>({ phase: "form" });
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    const birthYear = Number(fd.get("birthYear") ?? 0);

    startTransition(async () => {
      const result = await createSeniorAccount(familyId, {
        displayName: seniorDisplayName,
        username,
        password,
        birthYear,
      });
      if (result.ok && result.credentials) {
        setState({ phase: "done", credentials: result.credentials });
      } else {
        setState({ phase: "form", error: result.error ?? "Něco se nepovedlo." });
      }
    });
  }

  if (state.phase === "done") {
    return <Handoff creds={state.credentials} />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-7">
          <div className="space-y-2">
            <Label htmlFor="birthYear">Rok narození {seniorDisplayName}</Label>
            <Input
              id="birthYear"
              name="birthYear"
              type="number"
              inputMode="numeric"
              required
              min={1900}
              max={new Date().getFullYear()}
              placeholder="1948"
              autoComplete="off"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Stačí rok — pomáhá nám lépe rozumět, komu Vzpomínkář slouží. Zadává
              se jen jednou a nelze ho měnit.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Uživatelské jméno</Label>
            <Input
              id="username"
              name="username"
              required
              minLength={3}
              maxLength={32}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Např. babicka.marie"
              pattern="^[a-z][a-z0-9_.\-]{2,31}$"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Malá písmena, číslice a tečka, pomlčka, podtržítko. Žádné diakritiky - uživatelské jméno
              jde nadiktovat po telefonu i bez diakritiky.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Heslo (aspoň 8 znaků)</Label>
            <Input
              id="password"
              name="password"
              type="text"
              required
              minLength={8}
              maxLength={128}
              autoComplete="off"
              placeholder="Vyberte krátké heslo, které zvládne i bez brýlí"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Nebudeme ho šifrovat ve vašem prohlížeči - uvidíte ho jen vy. Zapište si ho nebo vytiskněte.
            </p>
          </div>
        </CardContent>
      </Card>

      {state.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-[var(--color-red-50)] p-3 text-sm text-[var(--color-red-700)]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Vytváříme…" : "Vytvořit přístup"}
        </Button>
      </div>
    </form>
  );
}

function Handoff({ creds }: { creds: { username: string; password: string; displayName: string } }) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-[var(--color-navy-200)] bg-[var(--color-navy-50)]">
        <CardContent className="space-y-4 p-7">
          <p className="text-sm uppercase tracking-wider text-[var(--color-text-subtle)]">
            Hotovo - přístup je připraven
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--color-navy-900)]">
            Předejte tento lísteček {creds.displayName ? creds.displayName : "seniorovi"}.
          </h2>
          <p className="text-[var(--color-text-muted)]">
            Najdete to znovu v sekci Senior, ale heslo už neuvidíte — pokud heslo
            zapomenete, jedním kliknutím vytvoříte nové.
          </p>
        </CardContent>
      </Card>

      {/* "Show once" gold alert — emphasises the one-time reveal */}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-gold-300)] bg-[var(--color-gold-50)] p-4 print:hidden">
        <div className="flex items-center gap-2">
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden fill="none">
            <polygon points="4,0.5 7.5,4 4,7.5 0.5,4" stroke="var(--color-gold-500)" strokeWidth="1" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--color-gold-600)]">
            Heslo se zobrazí jen jednou
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">
          Vytiskněte si lísteček nebo si přihlašovací údaje opište teď. Po pokračování
          už heslo neuvidíte - v Nastavení rodiny ho lze vygenerovat znovu.
        </p>
      </div>

      <Card className="border-[var(--color-paper-300)] bg-[var(--color-surface)] print:shadow-none">
        <CardContent className="space-y-4 p-7">
          <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--color-navy-900)]">
            Vzpomínkář - váš přístup
          </h3>
          <p className="text-[var(--color-text-muted)]">
            Otevřete na adrese{" "}
            <span className="font-mono text-[var(--color-text)]">vzpominkar.cz/senior-login</span>
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-4">
              <dt className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                Uživatelské jméno
              </dt>
              <dd className="mt-1 font-mono text-2xl">{creds.username}</dd>
            </div>
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-4">
              <dt className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                Heslo
              </dt>
              <dd className="mt-1 font-mono text-2xl">{creds.password}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3 print:hidden">
        <Button variant="secondary" onClick={() => window.print()}>
          Vytisknout
        </Button>
        <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
          Pokračovat na přehled
        </Link>
      </div>
    </div>
  );
}

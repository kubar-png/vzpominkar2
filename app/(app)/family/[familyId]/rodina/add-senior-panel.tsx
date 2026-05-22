"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { createSeniorAccount } from "@/lib/auth/actions";
import { SENIOR_ROLE_OPTIONS } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

interface AddSeniorPanelProps {
  familyId: string;
}

type Phase =
  | { name: "closed" }
  | { name: "form"; error?: string }
  | { name: "done"; credentials: { username: string; password: string; displayName: string } };

export function AddSeniorPanel({ familyId }: AddSeniorPanelProps) {
  const [phase, setPhase] = useState<Phase>({ name: "closed" });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function open() {
    setPhase({ name: "form" });
  }

  function close() {
    setPhase({ name: "closed" });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const displayName = String(fd.get("displayName") ?? "").trim();
    const username = String(fd.get("username") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    const seniorRole = (fd.get("seniorRole") as string) || null;
    const contactChannel = (fd.get("contactChannel") as "email" | "whatsapp") || null;
    const contactAddress = String(fd.get("contactAddress") ?? "").trim() || null;
    const promptFrequency = Number(fd.get("promptFrequency") ?? 1) as 1 | 2;

    startTransition(async () => {
      const result = await createSeniorAccount(familyId, {
        displayName, username, password, seniorRole,
        contactChannel, contactAddress, promptFrequency,
      });
      if (result.ok && result.credentials) {
        setPhase({ name: "done", credentials: result.credentials });
        router.refresh();
      } else {
        setPhase({ name: "form", error: result.error ?? "Něco se nepovedlo." });
      }
    });
  }

  if (phase.name === "closed") {
    return (
      <button
        type="button"
        onClick={open}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)]",
          "border-2 border-dashed border-[var(--color-border-strong)] px-6 py-5",
          "text-sm font-medium text-[var(--color-text-muted)] transition-colors",
          "hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-700)]",
        )}
      >
        <Plus size={16} />
        Přidat dalšího blízkého
      </button>
    );
  }

  if (phase.name === "done") {
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden border-[var(--color-navy-200)] bg-[var(--color-navy-50)]">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm uppercase tracking-wider text-[var(--color-text-subtle)]">
              Hotovo - přístup je připraven
            </p>
            <h3 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--color-navy-900)]">
              Předejte tento lísteček {phase.credentials.displayName}.
            </h3>
          </CardContent>
        </Card>

        {/* "Show once" gold alert */}
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
            Opište si přihlašovací údaje nebo lísteček vytiskněte. Po zavření už heslo
            neuvidíte - lze ho však kdykoliv vygenerovat znovu.
          </p>
        </div>

        <Card className="border-[var(--color-paper-300)] bg-[var(--color-surface)]">
          <CardContent className="space-y-4 p-6">
            <h4 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--color-navy-900)]">
              Vzpomínkář - přihlašovací údaje
            </h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              Přihlaste se na{" "}
              <span className="font-mono text-[var(--color-text)]">
                {process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "vzpominkar.cz"}
                /senior-login
              </span>
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-4">
                <dt className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                  Uživatelské jméno
                </dt>
                <dd className="mt-1 font-mono text-2xl">{phase.credentials.username}</dd>
              </div>
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-4">
                <dt className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                  Heslo
                </dt>
                <dd className="mt-1 font-mono text-2xl">{phase.credentials.password}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => window.print()}>
            Vytisknout
          </Button>
          <Button onClick={close}>Přidat dalšího</Button>
        </div>
      </div>
    );
  }

  // phase === "form"
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-[var(--color-navy-900)]">Nový blízký</h3>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-[var(--color-text-subtle)]">
          Přidání dalšího blízkého bude v budoucnu zpoplatněno. Nyní je v testovacím provozu zdarma.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-displayName">Celé jméno (jméno a příjmení)</Label>
            <Input
              id="new-displayName"
              name="displayName"
              required
              maxLength={80}
              placeholder="Jana Nováková"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-seniorRole">Role v rodině</Label>
            <Select id="new-seniorRole" name="seniorRole">
              <option value="">- nevybráno -</option>
              {SENIOR_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-contactChannel">Kam posílat otázky</Label>
            <Select id="new-contactChannel" name="contactChannel">
              <option value="">- nevybráno -</option>
              <option value="email">E-mail</option>
              <option value="whatsapp">WhatsApp</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-contactAddress">E-mail nebo telefon (WhatsApp)</Label>
            <Input
              id="new-contactAddress"
              name="contactAddress"
              type="text"
              maxLength={200}
              placeholder="jana@email.cz nebo +420 777 123 456"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-promptFrequency">Jak často posílat otázky</Label>
            <Select id="new-promptFrequency" name="promptFrequency" defaultValue="1">
              <option value="1">Jednou týdně</option>
              <option value="2">Dvakrát týdně</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-username">Uživatelské jméno</Label>
            <Input
              id="new-username"
              name="username"
              required
              minLength={3}
              maxLength={32}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="babicka.marie"
              pattern="^[a-z][a-z0-9_.\-]{2,31}$"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Malá písmena, číslice, tečka, pomlčka nebo podtržítko. Bez diakritiky.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password">Heslo (aspoň 8 znaků)</Label>
            <Input
              id="new-password"
              name="password"
              type="text"
              required
              minLength={8}
              maxLength={128}
              autoComplete="off"
              placeholder="Jednoduché heslo, které zvládne bez brýlí"
            />
          </div>

          {phase.error ? (
            <p
              role="alert"
              className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-[var(--color-red-50)] p-3 text-sm text-[var(--color-red-700)]"
            >
              {phase.error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={close}>
              Zrušit
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Vytváříme…" : "Vytvořit přístup"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

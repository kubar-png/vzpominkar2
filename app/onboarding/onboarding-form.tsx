"use client";

import { useActionState, useState } from "react";
import { startOnboarding, type ActionState } from "@/lib/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CategoryGroup = {
  key: string;
  label: string;
  prompts: { id: string; question: string }[];
};

const MIN_PICKS = 3;
const RECOMMENDED = 8;

export function OnboardingForm({ categories }: { categories: CategoryGroup[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    startOnboarding,
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const okCount = selected.size >= MIN_PICKS;

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
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                Vyberte pár otázek na začátek
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Doporučujeme {RECOMMENDED}. Naplánujeme je po týdnech, jednu po druhé.
              </p>
            </div>
            <Badge tone={selected.size >= RECOMMENDED ? "navy" : okCount ? "navy" : "neutral"}>
              {selected.size} / {RECOMMENDED} doporučeno
            </Badge>
          </div>
          {/* Progress to recommended count */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-paper-200)]">
            <div
              className="h-full bg-[var(--color-navy-800)] transition-[width] duration-300"
              style={{ width: `${Math.min(100, (selected.size / RECOMMENDED) * 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {categories.map((cat, idx) => {
            const catSelectedCount = cat.prompts.filter((p) => selected.has(p.id)).length;
            return (
              <details
                key={cat.key}
                open={idx === 0}
                className="group rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 hover:bg-[var(--color-paper-100)]">
                  <span className="flex items-baseline gap-3">
                    <span className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-navy-900)]">
                      {cat.label}
                    </span>
                    {catSelectedCount > 0 ? (
                      <span className="text-xs font-medium text-[var(--color-gold-600)]">
                        ✓ {catSelectedCount} vybrán{catSelectedCount === 1 ? "a" : catSelectedCount < 5 ? "y" : "o"}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-subtle)]">
                        {cat.prompts.length} otázek
                      </span>
                    )}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-xl text-[var(--color-text-muted)] transition-transform duration-150 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <ul className="space-y-2 border-t border-[var(--color-border)] p-3">
                  {cat.prompts.map((p) => {
                    const isOn = selected.has(p.id);
                    return (
                      <li key={p.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border p-3 transition-colors",
                            "hover:border-[var(--color-navy-300)]",
                            isOn
                              ? "border-[var(--color-navy-800)] bg-[var(--color-navy-50)]"
                              : "border-[var(--color-border)] bg-[var(--color-surface)]",
                          )}
                        >
                          <input
                            type="checkbox"
                            name="promptIds"
                            value={p.id}
                            checked={isOn}
                            onChange={() => toggle(p.id)}
                            className="mt-1 h-5 w-5 accent-[var(--color-navy-800)]"
                          />
                          <span className="text-base leading-relaxed">{p.question}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </div>
      </div>

      {state?.ok === false ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-[var(--color-red-50)] p-3 text-sm text-[var(--color-red-700)]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" disabled={pending || !okCount}>
          {pending ? "Ukládám…" : "Pokračovat"}
        </Button>
      </div>
    </form>
  );
}

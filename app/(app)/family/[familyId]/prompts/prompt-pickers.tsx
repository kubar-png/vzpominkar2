"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LibraryPicker } from "./library-picker";
import { CustomPromptForm } from "./custom-prompt-form";

interface Senior {
  id: string;
  displayName: string | null;
}

interface Group {
  key: string;
  label: string;
  prompts: { id: string; question: string }[];
}

interface CustomPrompt {
  id: string;
  question: string;
}

export function PromptPickers({
  familyId,
  seniors,
  groups,
  customPrompts,
}: {
  familyId: string;
  seniors: Senior[];
  groups: Group[];
  customPrompts: CustomPrompt[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(seniors.map((s) => s.id));

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-10">
      {seniors.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Pro koho?</CardTitle>
            <CardDescription>Vyberte, komu se otázka zařadí nebo odešle.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {seniors.map((s) => {
                const selected = selectedIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      selected
                        ? "bg-[var(--color-navy-900)] text-[var(--color-paper-50)]"
                        : "border border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-700)]",
                    )}
                  >
                    {s.displayName ?? "Blízký"}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Knihovna otázek</CardTitle>
          <CardDescription>
            Vyberte z 30+ připravených otázek. Každá se zařadí na konec rozvrhu (po týdnu).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LibraryPicker familyId={familyId} groups={groups} seniorIds={selectedIds} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vlastní otázky</CardTitle>
          <CardDescription>
            Přidejte si vlastní - třeba něco velmi osobního, co v knihovně není.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CustomPromptForm familyId={familyId} seniorIds={selectedIds} />

          {customPrompts.length > 0 ? (
            <ul className="space-y-2">
              {customPrompts.map((p) => (
                <li
                  key={p.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                >
                  {p.question}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

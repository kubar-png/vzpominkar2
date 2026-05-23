"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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
        <section className="space-y-3">
          <SectionHeading title="Pro koho?" subtitle="Vyberte, komu se otázka zařadí nebo odešle." />
          <div className="flex flex-wrap gap-2">
            {seniors.map((s) => {
              const selected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                    selected
                      ? "border-[var(--color-navy-900)] bg-[var(--color-navy-900)] text-[var(--color-paper-50)]"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-paper-300)] hover:text-[var(--color-navy-700)]",
                  )}
                >
                  {s.displayName ?? "Blízký"}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <SectionHeading
          title="Knihovna otázek"
          subtitle="Vyberte z připravených otázek - každá se zařadí do fronty (po týdnu)."
        />
        <LibraryPicker familyId={familyId} groups={groups} seniorIds={selectedIds} />
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Vlastní otázka"
          subtitle="Něco velmi osobního, co v knihovně není."
        />
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-5 md:p-6">
          <CustomPromptForm familyId={familyId} seniorIds={selectedIds} />
        </div>

        {customPrompts.length > 0 ? (
          <ul className="space-y-2">
            {customPrompts.map((p) => (
              <li
                key={p.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)]"
              >
                {p.question}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="text-[17px] font-semibold tracking-tight text-[var(--color-navy-900)]">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { scheduleNextMonday, scheduleToday } from "@/lib/prompts/actions";
import { cn } from "@/lib/utils";

interface Group {
  key: string;
  label: string;
  prompts: { id: string; question: string }[];
}

export function LibraryPicker({
  familyId,
  groups,
  seniorIds,
}: {
  familyId: string;
  groups: Group[];
  seniorIds: string[];
}) {
  const [activeTab, setActiveTab] = useState<string>(groups[0]?.key ?? "");
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyType, setBusyType] = useState<"queue" | "now" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  function add(promptId: string, type: "queue" | "now") {
    setError(null);
    setBusyId(promptId);
    setBusyType(type);
    start(async () => {
      const result = type === "now"
        ? await scheduleToday(familyId, promptId, seniorIds)
        : await scheduleNextMonday(familyId, promptId, seniorIds);
      if (!result.ok) {
        setError(result.error);
      } else {
        setAdded((prev) => new Set([...prev, promptId]));
      }
      setBusyId(null);
      setBusyType(null);
    });
  }

  const activeGroup = groups.find((g) => g.key === activeTab);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">Žádné otázky v knihovně.</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1.5">
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setActiveTab(g.key)}
            className={cn(
              "rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium tracking-wide transition-colors",
              g.key === activeTab
                ? "bg-[var(--color-navy-900)] text-[var(--color-paper-50)]"
                : "border border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-700)]",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-red-200)] bg-[var(--color-red-50)] px-4 py-2.5 text-sm text-[var(--color-red-700)]"
        >
          {error}
        </p>
      ) : null}

      {activeGroup ? (
        <ul className="space-y-2">
          {activeGroup.prompts.map((p) => {
            const isAdded = added.has(p.id);
            const isBusy = pending && busyId === p.id;
            return (
              <li
                key={p.id}
                className={cn(
                  "flex flex-col gap-3 rounded-[var(--radius-md)] border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
                  isAdded
                    ? "border-[var(--color-navy-200)] bg-[var(--color-navy-50)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]",
                )}
              >
                <span className={cn("text-sm leading-relaxed", isAdded && "text-[var(--color-navy-700)]")}>
                  {p.question}
                </span>

                {isAdded ? (
                  <span className="shrink-0 text-sm font-medium text-[var(--color-navy-700)]">
                    ✓ Naplánováno
                  </span>
                ) : (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => add(p.id, "now")}
                    >
                      {isBusy && busyType === "now" ? "…" : "Poslat hned"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => add(p.id, "queue")}
                    >
                      {isBusy && busyType === "queue" ? "…" : "Do fronty"}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FilterPill } from "@/components/app/FilterPill";
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
  const [added, setAdded] = useState<Set<string>>(new Set());

  function add(promptId: string, type: "queue" | "now") {
    setBusyId(promptId);
    setBusyType(type);
    start(async () => {
      const result = type === "now"
        ? await scheduleToday(familyId, promptId, seniorIds)
        : await scheduleNextMonday(familyId, promptId, seniorIds);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        setAdded((prev) => new Set([...prev, promptId]));
        toast.success(type === "now" ? "Otázka odeslána" : "Naplánováno na příští pondělí");
      }
      setBusyId(null);
      setBusyType(null);
    });
  }

  const activeGroup = groups.find((g) => g.key === activeTab);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Žádné otázky v knihovně.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <FilterPill
            key={g.key}
            active={g.key === activeTab}
            onClick={() => setActiveTab(g.key)}
          >
            {g.label}
          </FilterPill>
        ))}
      </div>

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
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-[var(--color-border)] bg-white",
                )}
              >
                <span
                  className={cn(
                    "text-sm leading-relaxed",
                    isAdded ? "text-emerald-900" : "text-[var(--color-text)]",
                  )}
                >
                  {p.question}
                </span>

                {isAdded ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <Check size={14} aria-hidden />
                    Naplánováno
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

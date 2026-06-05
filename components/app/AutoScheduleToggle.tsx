"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setAutoSchedule } from "@/lib/prompts/actions";

/**
 * Owner setting: the auto-scheduling safety net. An Apple-style switch that
 * toggles families.auto_schedule_prompts. Optimistic, reverts on error.
 */
export function AutoScheduleToggle({
  familyId,
  initial,
}: {
  familyId: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (pending) return;
    const next = !on;
    setOn(next); // optimistic
    startTransition(async () => {
      const res = await setAutoSchedule(familyId, next);
      if (!res.ok) {
        setOn(!next); // revert
        toast.error(res.error);
      } else {
        toast.success(
          next ? "Automatické plánování zapnuto." : "Automatické plánování vypnuto.",
        );
      }
    });
  }

  return (
    <div className="flex items-start justify-between gap-5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white px-5 py-4">
      <div>
        <p className="text-[15px] font-semibold text-[var(--color-navy-900)]">
          Automatické plánování otázek
        </p>
        <p className="mt-1 max-w-[54ch] text-sm leading-relaxed text-[var(--color-text-muted)]">
          Když na konci týdne nemáte naplánovanou žádnou otázku, sami vybereme
          další z připravené knihovny, aby vyprávění nikdy nestálo. Otázky můžete
          kdykoliv změnit nebo si přidat vlastní.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Automatické plánování otázek"
        onClick={toggle}
        disabled={pending}
        className={`vzp-switch${on ? " is-on" : ""}`}
      >
        <span className="vzp-switch-knob" aria-hidden />
      </button>
    </div>
  );
}

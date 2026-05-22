"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { removeAssignment } from "@/lib/prompts/actions";

interface Item {
  id: string;
  scheduledFor: string;
  question: string;
  seniorName: string | null;
}

export function ScheduledList({
  familyId,
  upcoming,
  showSeniorName,
}: {
  familyId: string;
  upcoming: Item[];
  showSeniorName?: boolean;
}) {
  const [pending, start] = useTransition();

  if (upcoming.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Zatím nic nenaplánováno. Přidejte otázky z knihovny níže.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {upcoming.map((a) => (
        <li key={a.id} className="flex items-start justify-between gap-4 py-3">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">
              {formatDate(a.scheduledFor)}
              {showSeniorName && a.seniorName ? (
                <span className="ml-2 rounded-full bg-[var(--color-navy-100)] px-2 py-0.5 text-xs text-[var(--color-navy-800)]">
                  {a.seniorName}
                </span>
              ) : null}
            </p>
            <p>{a.question}</p>
          </div>
          <button
            type="button"
            disabled={pending}
            className="shrink-0 self-start text-xs font-medium text-[var(--color-red-700)] underline-offset-2 transition-colors hover:underline disabled:opacity-50"
            onClick={() =>
              start(async () => {
                await removeAssignment(familyId, a.id);
                toast.success("Otázka odebrána");
              })
            }
          >
            Odebrat
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso + "T10:00:00Z");
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

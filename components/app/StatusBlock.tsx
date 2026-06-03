import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveGender } from "@/lib/gender";

interface StatusBlockProps {
  familyId: string;
  /** Next scheduled question — null if nothing planned. */
  next: {
    question: string;
    scheduledFor: string; // ISO date (YYYY-MM-DD)
    seniorName: string | null;
  } | null;
  /** Name used when there is exactly one senior in the family. */
  onlySeniorFirstName: string | null;
}

const WEEKDAYS = [
  "v neděli",
  "v pondělí",
  "v úterý",
  "ve středu",
  "ve čtvrtek",
  "v pátek",
  "v sobotu",
];

function isToday(d: Date) {
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

function isTomorrow(d: Date) {
  const now = new Date();
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return (
    d.getUTCFullYear() === t.getUTCFullYear() &&
    d.getUTCMonth() === t.getUTCMonth() &&
    d.getUTCDate() === t.getUTCDate()
  );
}

function describeWhen(iso: string): string {
  const d = new Date(iso + "T10:00:00Z");
  if (isToday(d)) return "dnes ráno";
  if (isTomorrow(d)) return "zítra ráno";
  const within7 =
    (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 7;
  const day = WEEKDAYS[d.getUTCDay()];
  if (within7) return `${day} ráno`;
  const formatted = d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
  });
  return formatted;
}

export function StatusBlock({ familyId, next, onlySeniorFirstName }: StatusBlockProps) {
  if (!next) {
    return (
      <section
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)]",
          "bg-white px-6 py-6 sm:px-8 sm:py-7",
        )}
      >
        <span aria-hidden className="absolute inset-y-5 left-0 w-[3px] rounded-full bg-[var(--color-gold-400)]" />
        <p className="app-eyebrow text-[var(--color-gold-600)]">Tento týden</p>
        <p className="mt-3 font-[family-name:var(--font-display)] text-[22px] font-medium leading-snug text-[var(--color-navy-900)] sm:text-2xl">
          Brzy naplánujeme další otázku.
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Žádná otázka zatím nečeká ve frontě. Vyberte další z archivu, ať vzpomínky neuschnou.
        </p>
        <div className="mt-5">
          <Link
            href={`/family/${familyId}/prompts`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            Naplánovat otázku
          </Link>
        </div>
      </section>
    );
  }

  const when = describeWhen(next.scheduledFor);
  const recipient = next.seniorName ?? onlySeniorFirstName;
  const subline = recipient
    ? `Otázka pro ${recipient} vyrazí ${when}.`
    : `Otázka vyrazí ${when}.`;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)]",
        "bg-white px-6 py-6 sm:px-8 sm:py-7",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-5 left-0 w-[3px] rounded-full bg-[var(--color-gold-400)]"
      />
      <p className="app-eyebrow text-[var(--color-gold-600)]">Tento týden</p>
      <blockquote className="mt-3">
        <p className="font-[family-name:var(--font-display)] text-[22px] font-medium leading-snug text-[var(--color-navy-900)] sm:text-2xl">
          &bdquo;{resolveGender(next.question, null)}&ldquo;
        </p>
      </blockquote>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">{subline}</p>
    </section>
  );
}

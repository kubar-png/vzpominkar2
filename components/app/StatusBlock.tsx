import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          "bg-[var(--color-paper-100)] pl-7 pr-6 py-7 sm:pl-10 sm:pr-8 sm:py-8",
        )}
      >
        <span aria-hidden className="absolute inset-y-5 left-0 w-1 rounded-full bg-[var(--color-gold-400)]" />
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--color-gold-600)]">
          Tento týden
        </p>
        <p className="mt-4 font-[family-name:var(--font-display)] text-2xl italic leading-snug text-[var(--color-text-muted)] sm:text-[28px]">
          Brzy naplánujeme další otázku.
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          Žádná otázka zatím nečeká ve frontě. Vyberte další z archivu — vzpomínky tak nevyschnou.
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
        "bg-[var(--color-paper-100)] pl-7 pr-6 py-7 sm:pl-10 sm:pr-8 sm:py-8",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-5 left-0 w-1 rounded-full bg-[var(--color-gold-400)]"
      />
      <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--color-gold-600)]">
        Tento týden
      </p>
      <blockquote className="mt-4">
        <p className="font-[family-name:var(--font-display)] text-2xl italic leading-snug text-[var(--color-navy-900)] sm:text-[28px]">
          &bdquo;{next.question}&ldquo;
        </p>
      </blockquote>
      <p className="mt-4 text-sm text-[var(--color-text-muted)]">{subline}</p>
    </section>
  );
}

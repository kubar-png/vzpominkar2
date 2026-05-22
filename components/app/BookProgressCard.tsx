import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FULL_BOOK = 52;
const ORDER_MIN = 30;
const PRINT_DAYS = 10; // print + ship after order

interface BookProgressCardProps {
  familyId: string;
  count: number;
  /** Compact = slim band style (header-action slot). Default = full mini-card. */
  variant?: "compact" | "full";
  className?: string;
}

function pluralMemories(n: number): string {
  return n === 1 ? "vzpomínka" : n >= 2 && n <= 4 ? "vzpomínky" : "vzpomínek";
}

function estimatedPrintDate(count: number): string | null {
  if (count < ORDER_MIN) return null;
  const d = new Date();
  d.setDate(d.getDate() + PRINT_DAYS);
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long" });
}

/**
 * Editorial book-progress card. Replaces the global sticky strip with an
 * in-flow band. Mirrors the gold milestone marker + navy fill of the original
 * but with cream paper bg and serif numerals.
 */
export function BookProgressCard({
  familyId,
  count,
  variant = "full",
  className,
}: BookProgressCardProps) {
  const pct = Math.min(100, Math.round((count / FULL_BOOK) * 100));
  const milestonePct = Math.round((ORDER_MIN / FULL_BOOK) * 100);
  const remaining = Math.max(0, ORDER_MIN - count);
  const ready = count >= ORDER_MIN;
  const printDate = estimatedPrintDate(count);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "hidden sm:flex items-center gap-4 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2",
          className,
        )}
      >
        <span className="font-mono text-xs tabular-nums text-[var(--color-text-muted)]">
          {count}/{FULL_BOOK}
        </span>
        <div className="relative h-1.5 w-[120px] overflow-hidden rounded-full bg-[var(--color-paper-200)]">
          <div
            className="h-full rounded-full bg-[var(--color-navy-800)] transition-all"
            style={{ width: `${pct}%` }}
          />
          <span
            aria-hidden
            className="absolute top-0 h-full w-px bg-[var(--color-gold-500)]"
            style={{ left: `${milestonePct}%` }}
          />
        </div>
        {ready ? (
          <Link
            href={`/family/${familyId}/book`}
            className="text-xs font-medium text-[var(--color-navy-900)] underline-offset-2 hover:underline"
          >
            Objednat knihu
          </Link>
        ) : (
          <span className="text-xs text-[var(--color-text-subtle)]">
            ještě {remaining} {pluralMemories(remaining)}
          </span>
        )}
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        "px-6 py-5 sm:px-7",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--color-gold-600)]">
          Kniha vzpomínek
        </p>
        <p className="font-mono text-xs tabular-nums text-[var(--color-text-muted)]">
          {count} / {FULL_BOOK} vzpomínek
        </p>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-2 flex-1 rounded-full bg-[var(--color-paper-200)]">
          <div
            className="h-full rounded-full bg-[var(--color-navy-800)] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
          {/* Gold milestone */}
          <div
            className="absolute -top-1 h-4 w-0.5 bg-[var(--color-gold-500)]"
            style={{ left: `${milestonePct}%` }}
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--color-gold-600)]">
              Min.
            </span>
          </div>
        </div>

        {ready ? (
          <Link
            href={`/family/${familyId}/book`}
            className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
          >
            Objednat knihu
          </Link>
        ) : (
          <span className="shrink-0 text-xs text-[var(--color-text-subtle)]">
            ještě {remaining} {pluralMemories(remaining)}
          </span>
        )}
      </div>

      {ready && printDate ? (
        <p className="mt-2 text-xs text-[var(--color-text-subtle)]">
          Při objednání dnes dorazí kolem <span className="text-[var(--color-text)]">{printDate}</span>.
        </p>
      ) : null}
    </section>
  );
}

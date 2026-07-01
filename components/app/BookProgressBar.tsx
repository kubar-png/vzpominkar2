import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFamilyStats } from "@/lib/family/stats";

const FULL_BOOK = 52;
const ORDER_MIN = 30;

interface BookProgressBarProps {
  count: number;
  familyId: string;
}

/** Async wrapper for the sticky bottom progress strip — keeps the layout
 * shell non-blocking while stats resolve. */
export async function BookProgressBarAsync({ familyId }: { familyId: string }) {
  const stats = await getFamilyStats(familyId);
  return <BookProgressBar count={stats.memoryCount} familyId={familyId} />;
}

/** Skeleton matches the real bar's outer dimensions so the page bottom
 * doesn't jump when the real strip streams in. */
export function BookProgressBarSkeleton() {
  return (
    <div
      aria-hidden
      className="fixed bottom-0 left-0 right-0 z-20 md:left-[280px] flex items-center gap-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3"
      style={{ opacity: 0.55 }}
    >
      <div className="h-3 w-24 shrink-0 rounded bg-[var(--color-paper-200)]" />
      <div className="h-2 flex-1 rounded-full bg-[var(--color-paper-200)]" />
      <div className="h-3 w-28 shrink-0 rounded bg-[var(--color-paper-200)]" />
    </div>
  );
}

export function BookProgressBar({ count, familyId }: BookProgressBarProps) {
  const pct = Math.min(100, Math.round((count / FULL_BOOK) * 100));
  const milestonePct = Math.round((ORDER_MIN / FULL_BOOK) * 100);
  const remaining = Math.max(0, ORDER_MIN - count);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 md:left-[280px] flex items-center gap-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
      <span className="shrink-0 text-xs text-[var(--color-text-muted)] tabular-nums">
        {count}&thinsp;/&thinsp;{FULL_BOOK} vzpomínek
      </span>

      <div className="relative h-2 flex-1 rounded-full bg-[var(--color-paper-200)]">
        <div
          className="h-full rounded-full bg-[var(--color-navy-800)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
        {/* Gold milestone marker at 30/52 */}
        <div
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-[var(--color-gold-400)]"
          style={{ left: `${milestonePct}%` }}
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--color-gold-400)]">
            Min.
          </span>
        </div>
      </div>

      {count >= ORDER_MIN ? (
        <Link
          href={`/family/${familyId}/book`}
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          Objednat knihu
        </Link>
      ) : (
        <span className="shrink-0 text-xs text-[var(--color-text-subtle)]">
          Ještě {remaining} {remaining === 1 ? "vzpomínka" : remaining < 5 ? "vzpomínky" : "vzpomínek"}
        </span>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FULL_BOOK = 52;
const ORDER_MIN = 30;

interface BookProgressBarProps {
  count: number;
  familyId: string;
}

export function BookProgressBar({ count, familyId }: BookProgressBarProps) {
  const pct = Math.min(100, Math.round((count / FULL_BOOK) * 100));
  const milestonePct = Math.round((ORDER_MIN / FULL_BOOK) * 100);
  const remaining = Math.max(0, ORDER_MIN - count);

  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
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

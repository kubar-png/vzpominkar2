import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide icon component or any small SVG node. Keep ≤ 24px visually. */
  icon?: React.ReactNode;
  /** Short, full-sentence heading. Inter 17/600. */
  title: string;
  /** One or two sentences. Warm tone, vykání. */
  description?: string;
  /** Single primary CTA — pass a <Link className={buttonVariants(...)}>. */
  action?: React.ReactNode;
  /** Visual tone — `card` wraps in a white surface; `bare` skips the wrap
   * for cases where the parent already supplies the container. */
  variant?: "card" | "bare";
  className?: string;
}

/**
 * Owner-app empty state. Always teaches the interface rather than saying
 * "nothing here." Centered in a white card on the cream page background,
 * with a single primary action that moves the user forward.
 *
 * Used on /dashboard, /memories archive, /rodina, /prompts, /book to keep
 * the empty pattern consistent.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "card",
  className,
}: EmptyStateProps) {
  const body = (
    <div className={cn("flex flex-col items-center gap-3 px-4 py-12 text-center sm:py-16")}>
      {icon ? (
        <div
          aria-hidden
          className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-paper-100)] text-[var(--color-paper-500)]"
        >
          {icon}
        </div>
      ) : null}
      <p className="text-[17px] font-semibold tracking-tight text-[var(--color-navy-900)]">
        {title}
      </p>
      {description ? (
        <p className="max-w-[40ch] text-sm leading-relaxed text-[var(--color-text-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );

  if (variant === "bare") {
    return <div className={className}>{body}</div>;
  }

  return (
    <section
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white",
        className,
      )}
    >
      {body}
    </section>
  );
}

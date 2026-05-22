import * as React from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  /** PP Pangaia italic heading. Kept short — a single phrase. */
  title: string;
  /** Optional supporting line, sets the tone for the fields below. */
  description?: string;
  /** Pulls section into a compact stack (used inside cards). */
  compact?: boolean;
  /** Hide the gold-diamond divider — useful for the first section. */
  hideDivider?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Editorial form section. Reused inside senior cards, the senior intake
 * form, and the /settings page so multi-field forms read like chapters
 * instead of label soup.
 *
 * Layout: optional gold-diamond divider rule → italic heading +
 * description → children container.
 */
export function FormSection({
  title,
  description,
  compact,
  hideDivider,
  className,
  children,
}: FormSectionProps) {
  return (
    <section className={cn(compact ? "space-y-3" : "space-y-4", className)}>
      {!hideDivider ? (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden fill="none">
            <polygon points="4,0.5 7.5,4 4,7.5 0.5,4" stroke="var(--color-gold-500)" strokeWidth="1" />
          </svg>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
      ) : null}
      <header className="space-y-1">
        <h3 className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-navy-900)]">
          {title}
        </h3>
        {description ? (
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        ) : null}
      </header>
      <div className={cn(compact ? "space-y-3" : "space-y-4")}>{children}</div>
    </section>
  );
}

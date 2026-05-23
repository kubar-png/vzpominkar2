import * as React from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  /** Short section heading — kept to a single phrase. */
  title: string;
  /** Optional supporting line, sets the tone for the fields below. */
  description?: string;
  /** Pulls section into a compact stack (used inside cards). */
  compact?: boolean;
  /** Hide the hairline divider — useful for the first section. */
  hideDivider?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Form section primitive. Reused inside senior cards, the senior intake
 * form, and the /settings page so multi-field forms read like chapters
 * instead of label soup.
 *
 * Visual: optional hairline divider → semibold sans heading (Inter, 15px)
 * with a small uppercase eyebrow vibe via tracking — no italics, no
 * decorative gold diamonds. The brief asks for Linear-clean inside the
 * owner app. Marketing copy still gets the editorial flourishes.
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
        <div aria-hidden className="h-px w-full bg-[var(--color-border)]" />
      ) : null}
      <header className="space-y-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-[var(--color-navy-900)]">
          {title}
        </h3>
        {description ? (
          <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
            {description}
          </p>
        ) : null}
      </header>
      <div className={cn(compact ? "space-y-3" : "space-y-4")}>{children}</div>
    </section>
  );
}

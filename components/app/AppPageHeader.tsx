import { cn } from "@/lib/utils";

interface AppPageHeaderProps {
  /** Optional roman numeral — kept for API compatibility, no longer rendered. */
  numeral?: string;
  /** Label kept for API compatibility, no longer rendered. */
  sectionLabel?: string;
  title: string;
  description?: string;
  /** Kept for API compatibility. Owner-app no longer italicises descriptions. */
  italic?: boolean;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Owner-app page header. Linear-leaning: a clean H1 set in Pangaia, a single
 * tight description line, and an optional right-rail action. The primary
 * action is what makes the page "yours" — exactly one per page per the
 * redesign brief.
 *
 * The decorative eyebrow + roman numeral that used to live here belonged to
 * the marketing world; the owner app now lets the sidebar carry the
 * navigation context instead.
 */
export function AppPageHeader({
  title,
  description,
  action,
  className,
}: AppPageHeaderProps) {
  return (
    <header className={cn("pb-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1
            className={cn(
              "font-[family-name:var(--font-display)] font-medium",
              "leading-[1.05] tracking-[-0.02em] text-[var(--color-ink-900)]",
              // clamp(28px, 4vw, 38px) per the redesign typography spec
              "text-[clamp(1.75rem,4vw,2.375rem)]",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="max-w-[60ch] text-[15px] leading-relaxed text-[var(--color-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? (
          <div className="shrink-0 self-start sm:self-end">{action}</div>
        ) : null}
      </div>
    </header>
  );
}

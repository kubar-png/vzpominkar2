import { cn } from "@/lib/utils";

interface AppPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Owner-app page header. Per DESIGN.md the page-title is the editorial
 * moment: Pangaia 32px / 500 / leading 1.1 / tracking -0.02em. Everything
 * else on the page is Inter. An optional muted lede sits one line below,
 * capped at 60ch; an optional right-rail action holds the (at most one)
 * primary CTA for the page.
 *
 * The eyebrow + roman numeral chrome that lived here used to mirror the
 * marketing surface — that pattern was removed; sidebar navigation now
 * carries the structural context.
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

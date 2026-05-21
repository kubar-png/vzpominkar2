import { cn } from "@/lib/utils";
import { SectionEyebrow } from "@/components/landing/Editorial";

interface AppPageHeaderProps {
  /** Optional roman numeral shown as a chapter mark before the label. */
  numeral?: string;
  /** Label text for the editorial eyebrow above the heading. */
  sectionLabel?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Header used on every authenticated app page. Matches the marketing
 * "letterpress journal" style: gold roman-numeral chapter mark + small-caps
 * eyebrow, serif heading set in display-normal weight, and a hairline rule
 * underneath. */
export function AppPageHeader({
  numeral,
  sectionLabel,
  title,
  description,
  action,
  className,
}: AppPageHeaderProps) {
  return (
    <div className={cn("pb-8 border-b border-[var(--color-border)]", className)}>
      {sectionLabel ? (
        /* Eyebrow hidden on mobile - it usually echoes the H1 word-for-word,
         * wasting vertical real estate. Desktop keeps it as decoration. */
        <SectionEyebrow numeral={numeral} className="mb-4 hidden sm:inline-flex">
          {sectionLabel}
        </SectionEyebrow>
      ) : null}
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.08] tracking-tight text-[var(--color-ink-900)] md:text-5xl">
          {title}
        </h1>
        {action ? <div className="shrink-0 pb-1">{action}</div> : null}
      </div>
      {description ? (
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-[var(--color-text-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

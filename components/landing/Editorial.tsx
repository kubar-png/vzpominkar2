/**
 * Editorial atoms - Fleuron + SectionEyebrow + a few helper bits.
 *
 * These exist so the whole site (marketing pages, jak-to-funguje, cenik, faq,
 * member area, senior surface) can share the same "fine-press journal" feel:
 *   - small-caps eyebrows with an optional roman-numeral chapter mark,
 *   - thin gold fleuron rules to break a long white run into chapters,
 *   - one consistent recipe for page section headings.
 *
 * Atoms intentionally lean on global tokens (--color-*) so palette tweaks
 * roll through every surface at once. */
import { cn } from "@/lib/utils";

export function SectionEyebrow({
  children,
  dark,
  numeral,
  className,
}: {
  children: React.ReactNode;
  dark?: boolean;
  /** Optional roman numeral shown before the label as a tiny "chapter" mark. */
  numeral?: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em]",
        dark ? "text-[var(--color-paper-300)]" : "text-[var(--color-text-subtle)]",
        className,
      )}
    >
      {numeral ? (
        <>
          <span
            aria-hidden
            className={cn(
              "font-[family-name:var(--font-display)] text-[12px] tracking-[0.18em]",
              dark ? "text-[var(--color-gold-300)]" : "text-[var(--color-gold-500)]",
            )}
          >
            {numeral}.
          </span>
          <span
            aria-hidden
            className={cn(
              "inline-block h-px w-3",
              dark ? "bg-[var(--color-gold-400)]/40" : "bg-[var(--color-gold-300)]",
            )}
          />
        </>
      ) : null}
      {children}
    </p>
  );
}

/** Heritage divider - a thin gold rule with a centred diamond. Used between
 * adjacent major sections that share the white background, to break the page
 * into "chapters" without resorting to colour-blocking. */
export function Fleuron({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "fleuron mx-auto my-2 max-w-[260px] px-6",
        dark && "text-[var(--color-gold-300)]",
        className,
      )}
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
        <path d="M4.5 0L9 4.5 4.5 9 0 4.5z" />
      </svg>
    </div>
  );
}

/** Shared heading recipe so every page-level h2 matches the home. */
export const editorialHeadingClass =
  "font-[family-name:var(--font-display)] text-2xl font-normal leading-[1.15] tracking-tight text-[var(--color-ink-900)] sm:text-4xl";

/** Slightly smaller variant for "card-titles" / second-tier headings. */
export const editorialHeadingClassSm =
  "font-[family-name:var(--font-display)] text-2xl font-normal leading-[1.2] tracking-tight text-[var(--color-ink-900)] sm:text-3xl";

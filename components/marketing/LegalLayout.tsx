import type { ReactNode } from "react";
import { Shell } from "@/components/landing/Shell";

interface LegalLayoutProps {
  /** Eyebrow above the title (e.g. "Právní informace"). */
  eyebrow: string;
  /** Page title — set in editorial italic display serif. */
  title: ReactNode;
  /** One-line standfirst beneath the title. */
  intro?: ReactNode;
  /** Last-updated date string (already formatted Czech, e.g. "21. 5. 2026"). */
  updatedAt: string;
  /** Page body — long-form prose. Wrap each section in <section>. */
  children: ReactNode;
}

/**
 * Editorial layout for the long-form legal pages (Podmínky, Soukromí, Cookies).
 *
 * Same Shell as the rest of the marketing site so chrome (header, footer,
 * fonts, motion observers) stays consistent. The body uses .prose-vzp from
 * globals.css for the narrow type column + serif headings; we add a thin
 * gold rule + numeral pattern to give each top-level section a chapter feel
 * without overloading the legal text with too much decoration.
 *
 * Pages pass their content as children. Children should be plain HTML (h2,
 * h3, p, ul, ol, dl). The CSS in this layout will style them.
 */
export function LegalLayout({
  eyebrow,
  title,
  intro,
  updatedAt,
  children,
}: LegalLayoutProps) {
  return (
    <Shell>
      {/* Hero */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pt-20 pb-12 text-center sm:pt-28">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
          <span className="mr-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-500)]" />
          {eyebrow}
          <span className="ml-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-500)]" />
        </p>
        <h1
          className="heritage-press mx-auto mt-8 max-w-[22ch] font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.05] tracking-tight text-[var(--color-navy-900)] sm:text-6xl"
          style={{ textWrap: "balance" }}
        >
          {title}
        </h1>
        {intro ? (
          <p className="mx-auto mt-7 max-w-[52ch] text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
            {intro}
          </p>
        ) : null}
        <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">
          Naposledy upraveno · {updatedAt}
        </p>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pb-28">
        <div className="legal-body mx-auto max-w-[68ch]" data-reveal>
          {children}
        </div>
      </section>
    </Shell>
  );
}

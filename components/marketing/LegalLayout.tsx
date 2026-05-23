import type { ReactNode } from "react";
import { Shell } from "@/components/landing/Shell";

interface LegalLayoutProps {
  /** Eyebrow above the title (e.g. "Právní informace"). */
  eyebrow: string;
  /** Page title — set in editorial display serif. */
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
 * fonts) stays consistent. Hero now uses the homepage .hero pattern
 * (eyebrow + h1 + lede + updatedAt note); body retains .legal-body for
 * the narrow type column + serif headings.
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
      {/* Hero — same .hero scope as homepage and other marketing pages */}
      <section className="hero" style={{ paddingTop: "clamp(36px, 6vw, 72px)" }}>
        <div className="container">
          <span className="eyebrow">{eyebrow}</span>
          <h1 style={{ maxWidth: "26ch", margin: "0 auto 24px" }}>{title}</h1>
          {intro ? <p className="lede">{intro}</p> : null}
          <p
            style={{
              marginTop: 20,
              fontFamily: "var(--font-body-editorial)",
              fontSize: 11,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
            }}
          >
            Naposledy upraveno · {updatedAt}
          </p>
        </div>
      </section>

      {/* Body — long-form prose */}
      <div className="divider" aria-hidden />
      <section
        className="section"
        style={{ paddingTop: 0, paddingBottom: "clamp(80px, 10vw, 140px)" }}
      >
        <div className="container">
          <div className="legal-body" data-reveal>
            {children}
          </div>
        </div>
      </section>
    </Shell>
  );
}

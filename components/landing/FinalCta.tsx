import type { ReactNode } from "react";
import Link from "next/link";

interface FinalCtaProps {
  eyebrow: string;
  heading: ReactNode;
  lede: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  /** Renders below the CTA. Pass the optional "Mám ještě otázky" /
   *  "Nebo se podívejte na ceník" link block here. */
  footer?: ReactNode;
}

/**
 * Shared closing card used on every public page except the homepage
 * (which has the email-capture variant). Same shape across cenik, darek,
 * babybook, kontakt, faq, jak-to-funguje, o-nas — eyebrow, heading,
 * lede paragraph, primary CTA, optional footer link.
 */
export function FinalCta({
  eyebrow,
  heading,
  lede,
  ctaHref = "/signup",
  ctaLabel = "Založit Vzpomínkář",
  footer,
}: FinalCtaProps) {
  return (
    <section className="signup">
      <div className="container">
        <div className="signup-card">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{heading}</h2>
          <p className="lede">{lede}</p>
          <Link href={ctaHref} className="btn btn-gold">
            {ctaLabel} <span className="arrow">↗</span>
          </Link>
          {footer ? (
            <p className="signup-disclaimer signup-disclaimer-spaced">{footer}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Inline helper for the "<short text> <Link>word</Link>." footer pattern
 * that recurs across cenik/darek/jak-to-funguje/etc. — keeps the link
 * styling consistent without each page re-inlining the same style block. */
export function FinalCtaFooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="signup-disclaimer-link">
      {children}
    </Link>
  );
}

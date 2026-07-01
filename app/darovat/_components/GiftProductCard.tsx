import Link from "next/link";

/**
 * GiftProductCard — one of the three product cards on /darovat (Krok 1).
 *
 * Two visual variants:
 *   - "side"      → standard fill-in book / custom book. Paper card, concise
 *                   copy, outline CTA. Stacks on mobile.
 *   - "featured"  → the primary app product. Navy (#1B2E4D) card with off-white
 *                   text, a raspberry "Doporučeno" chip, a benefit bullet list,
 *                   and a raspberry CTA. Slightly larger on desktop (the page
 *                   grid widens its column + lifts it with scale) to steer
 *                   buyers here. On mobile it renders FIRST (page order).
 *
 * HONESTY: every benefit listed below is what actually ships today (online
 * knihovna for the family, voice via QR per chapter, first printed book in the
 * price, a human writes/helps). No money-back, no fake urgency. Prices are
 * intentionally omitted here — the buyer sees the exact charge in the funnel /
 * on /cenik (price shown = price charged) — so the chooser stays number-free.
 */

interface GiftProductCardProps {
  title: string;
  /** Optional short line under the title, e.g. "jednorázově · napořád". */
  priceSub?: string;
  /** One-paragraph description (side cards) — concise. */
  blurb: string;
  /** Benefit bullets — only the featured card lists them. */
  bullets?: readonly string[];
  ctaHref: string;
  ctaLabel: string;
  /** Small honest note under the CTA (delivery / login expectation). */
  note: string;
  variant: "side" | "featured";
}

export function GiftProductCard({
  title,
  priceSub,
  blurb,
  bullets,
  ctaHref,
  ctaLabel,
  note,
  variant,
}: GiftProductCardProps) {
  const featured = variant === "featured";
  return (
    <article className={`gpc${featured ? " gpc-featured" : ""}`} data-reveal>
      {featured ? <span className="gpc-chip">Doporučeno</span> : null}

      <h3 className="gpc-title">{title}</h3>

      {priceSub ? (
        <div className="gpc-price">
          <span className="gpc-price-sub">{priceSub}</span>
        </div>
      ) : null}

      <p className="gpc-blurb">{blurb}</p>

      {bullets ? (
        <ul className="gpc-bullets">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}

      <div className="gpc-foot">
        <Link
          href={ctaHref}
          className={`btn ${featured ? "btn-gold" : "btn-outline"} gpc-cta`}
        >
          {ctaLabel} <span className="arrow">↗</span>
        </Link>
        <p className="gpc-note">{note}</p>
      </div>
    </article>
  );
}

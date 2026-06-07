import Link from "next/link";

/**
 * GiftProductCard — one of the three product cards on /darovat (Krok 1).
 *
 * Two visual variants:
 *   - "side"      → standard fill-in book (599) / custom book (899). Paper card,
 *                   concise copy, outline CTA. Stacks on mobile.
 *   - "featured"  → the primary app product (2 890). Light-navy (#0e3b64) card
 *                   with cream text, a gold "Doporučeno" chip, a benefit bullet
 *                   list, and a gold CTA. Slightly larger on desktop (the page
 *                   grid widens its column + lifts it with scale) to steer
 *                   buyers here. On mobile it renders FIRST (page order).
 *
 * HONESTY: every benefit listed below is what actually ships today (online
 * knihovna for the family, voice via QR per chapter, first printed book in the
 * price, a human writes/helps). No money-back, no fake urgency, price shown =
 * price charged (env-driven display via lib/stripe/server.ts on the page).
 */

interface GiftProductCardProps {
  eyebrow: string;
  title: string;
  /** Pre-formatted price string, e.g. "2 890 Kč". */
  price: string;
  /** Short line under the price, e.g. "jednorázově · napořád". */
  priceSub: string;
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
  eyebrow,
  title,
  price,
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

      <span className="eyebrow gpc-eyebrow">{eyebrow}</span>
      <h3 className="gpc-title">{title}</h3>

      <div className="gpc-price">
        <span className="gpc-price-amount">{price}</span>
        <span className="gpc-price-sub">{priceSub}</span>
      </div>

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

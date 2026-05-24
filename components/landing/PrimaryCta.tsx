"use client";

import Link from "next/link";

interface PrimaryCtaProps {
  /** Where the CTA goes. Defaults to /signup so the canonical case is zero-config. */
  href?: string;
  /** Button label. Defaults to "Založit Vzpomínkář" — only override for gift/babybook/hero. */
  label?: string;
  /** Visual modifiers that add the matching CSS class. */
  variant?: "default" | "hero" | "nav";
  /** Extra class names for one-off layout overrides (e.g. full-width inside a card). */
  className?: string;
  /** Used by HomeMobileMenu to close the drawer on tap. */
  onClick?: () => void;
}

/**
 * Canonical gold pill CTA used across the marketing surface — header,
 * footer, sticky mobile bar, every page hero + final-CTA card. Renders
 * a `.btn.btn-gold` Link with the navy-circle arrow.
 *
 * The "use client" directive is here so callers like HomeMobileMenu can
 * pass an onClick (closing the drawer); for plain server-component pages
 * the Link itself is the only client boundary that actually ships.
 */
export function PrimaryCta({
  href = "/signup",
  label = "Založit Vzpomínkář",
  variant = "default",
  className,
  onClick,
}: PrimaryCtaProps) {
  const cls = [
    "btn",
    "btn-gold",
    variant === "hero" && "hero-cta",
    variant === "nav" && "nav-cta-desktop",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Link href={href} className={cls} onClick={onClick}>
      {label} <span className="arrow">↗</span>
    </Link>
  );
}

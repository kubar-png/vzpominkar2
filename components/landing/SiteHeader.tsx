import Link from "next/link";
import { HomeMobileMenu } from "@/components/landing/HomeMobileMenu";
import { PrimaryCta } from "@/components/landing/PrimaryCta";

interface SiteHeaderProps {
  /**
   * "full" — homepage / public pages (nav links + auth CTAs).
   * "minimal" — auth/onboarding pages (logo only, centered).
   */
  variant?: "full" | "minimal";
}

/**
 * Editorial header — shared across the marketing surface.
 * Matches the homepage hero header: gold-tinted brand logo,
 * five inline nav links, gold pill CTA on the right, and a
 * full-screen mobile drawer on small viewports.
 */
export function SiteHeader({ variant = "full" }: SiteHeaderProps) {
  if (variant === "minimal") {
    return (
      <header className="editorial-header">
        <div className="container">
          <nav className="nav" style={{ justifyContent: "center" }}>
            <Link href="/" className="logo" aria-label="Vzpomínkář — domů">
              <span className="logo-mark" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="editorial-header">
      <div className="container">
        <nav className="nav">
          <Link href="/" className="logo" aria-label="Vzpomínkář — domů">
            <span className="logo-mark" aria-hidden="true" />
          </Link>
          <div className="nav-links">
            <Link href="/jak-to-funguje">Jak to funguje</Link>
            <Link href="/cenik">Ceník</Link>
            <Link href="/darek">Jako dárek</Link>
            <Link href="/faq">Otázky</Link>
            <Link href="/o-nas">Náš příběh</Link>
          </div>
          <PrimaryCta variant="nav" />
          <HomeMobileMenu />
        </nav>
      </div>
    </header>
  );
}

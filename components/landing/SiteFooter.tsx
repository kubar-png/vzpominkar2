import Link from "next/link";

interface SiteFooterProps {
  /**
   * "full" — slogan + CTA + logo + sitemap.
   * "minimal" — colophon only, used on auth/onboarding pages.
   */
  variant?: "full" | "minimal";
}

/**
 * Editorial footer — shared across the marketing surface.
 * Matches the homepage editorial footer: dark warm-brown bg,
 * three-column grid (slogan + CTA + logo on the left, two
 * sitemap columns on the right), and a hairline colophon row.
 */
export function SiteFooter({ variant = "full" }: SiteFooterProps) {
  if (variant === "minimal") {
    return (
      <footer className="editorial-footer">
        <div className="container">
          <div
            className="footer-bottom"
            style={{ marginTop: 0, paddingTop: 0, borderTop: "none", justifyContent: "center" }}
          >
            <span>© 2026 Vzpomínkář</span>
            <span>
              <Link href="/podminky">Podmínky</Link>
              {" · "}
              <Link href="/soukromi">Soukromí</Link>
              {" · "}
              <Link href="/cookies">Cookies</Link>
            </span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="editorial-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-left">
            <h2>
              Staré příběhy,
              <br />
              nová generace.
            </h2>
            <Link href="/signup" className="btn btn-gold">
              Začít zdarma <span className="arrow">↗</span>
            </Link>
          </div>

          <div className="footer-col">
            <h4>Procházet</h4>
            <ul>
              <li>
                <Link href="/jak-to-funguje">
                  Jak to funguje <span className="ext">↗</span>
                </Link>
              </li>
              <li>
                <Link href="/cenik">
                  Ceník <span className="ext">↗</span>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  Časté otázky <span className="ext">↗</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Dárek</h4>
            <ul>
              <li>
                <Link href="/darek">
                  Vzpomínkář jako dárek <span className="ext">↗</span>
                </Link>
              </li>
              <li>
                <Link href="/darek/certifikat">
                  Dárkový certifikát <span className="ext">↗</span>
                </Link>
              </li>
              <li>
                <Link href="/babybook">
                  Babybook <span className="ext">↗</span>
                </Link>
              </li>
            </ul>
            <h4 style={{ marginTop: 36 }}>O nás</h4>
            <ul>
              <li>
                <Link href="/o-nas">
                  Náš příběh <span className="ext">↗</span>
                </Link>
              </li>
              <li>
                <Link href="/kontakt">
                  Kontakt <span className="ext">↗</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <span className="logo-mark footer-logo" aria-label="Vzpomínkář" />

        <div className="footer-bottom">
          <span>© 2026 Vzpomínkář</span>
          <span>
            <Link href="/podminky">Podmínky</Link>
            {" · "}
            <Link href="/soukromi">Soukromí</Link>
            {" · "}
            <Link href="/cookies">Cookies</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

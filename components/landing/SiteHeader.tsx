import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { buttonVariants } from "@/components/ui/button";
import { MarketingMobileMenu } from "@/components/landing/MarketingMobileMenu";

interface SiteHeaderProps {
  /**
   * "full" — homepage / public pages (nav links + auth CTAs).
   * "minimal" — auth/onboarding pages (logo only, centered).
   */
  variant?: "full" | "minimal";
}

export function SiteHeader({ variant = "full" }: SiteHeaderProps) {
  if (variant === "minimal") {
    return (
      <header className="bg-[var(--color-bg)]">
        <div
          data-sticky-header
          className="mx-auto flex max-w-[var(--container-wide)] items-center justify-center px-6"
        >
          <div data-sticky-logo>
            <Logo variant="wordmark" href="/" size={28} />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      data-sticky-header-bg
      className="sticky top-0 z-40 bg-[var(--color-bg)]/85 backdrop-blur"
    >
      <div
        data-sticky-header
        className="mx-auto flex max-w-[var(--container-wide)] items-center justify-between px-6"
      >
        <div data-sticky-logo>
          <Logo variant="wordmark" href="/" size={28} />
        </div>
        <nav className="hidden items-center gap-9 text-sm md:flex">
          <Link
            href="/jak-to-funguje"
            className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Jak to funguje
          </Link>
          <Link
            href="/cenik"
            className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Ceník
          </Link>
          <Link
            href="/darek"
            className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            Jako dárek
          </Link>
          <Link
            href="/faq"
            className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            FAQ
          </Link>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Přihlášení
          </Link>
          <Link
            href="/signup"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Začít zdarma
          </Link>
        </div>
        <MarketingMobileMenu />
      </div>
    </header>
  );
}

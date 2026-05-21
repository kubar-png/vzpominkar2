import type { ReactNode } from "react";
import Link from "next/link";
import { Promo } from "./Promo";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { ScrollState } from "@/components/shared/ScrollState";

interface ShellProps {
  children: ReactNode;
  /** Show the top promo banner (default: true). Auth/onboarding pages turn off. */
  showPromo?: boolean;
  /** Header layout - full nav vs logo-only. */
  headerVariant?: "full" | "minimal";
  /** Footer layout - full site map vs colophon-only. */
  footerVariant?: "full" | "minimal";
  /** Mount the scroll observers (RevealOnScroll, ScrollState). Default true. */
  motion?: boolean;
  /** Show the sticky mobile CTA bar at the bottom. Off on auth/onboarding. */
  stickyMobileCta?: boolean;
}

/**
 * Site shell - consistent chrome (promo strip -> header -> footer) plus the
 * client-side motion observers, used on every public-facing page so the
 * branding holds together. Pages drop their content as children.
 */
export function Shell({
  children,
  showPromo = true,
  headerVariant = "full",
  footerVariant = "full",
  motion = true,
  stickyMobileCta = true,
}: ShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {motion ? (
        <>
          <RevealOnScroll />
          <ScrollState />
        </>
      ) : null}
      {showPromo ? <Promo /> : null}
      <SiteHeader variant={headerVariant} />
      <main className={stickyMobileCta ? "pb-20 md:pb-0" : undefined}>{children}</main>
      <SiteFooter variant={footerVariant} />

      {/* Sticky mobile CTA - catches long-scroll readers on small viewports.
       * Desktop has the header CTA always in view, so this hides on md+. */}
      {stickyMobileCta ? (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-strong)] bg-white/95 px-4 py-3 backdrop-blur md:hidden"
          role="region"
          aria-label="Začít zdarma"
        >
          <Link
            href="/signup"
            className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-navy-900)] text-base font-medium text-white transition-colors hover:bg-[var(--color-navy-800)]"
          >
            Začít zdarma
          </Link>
          <p className="mt-1.5 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
            Pilotní verze - zdarma · vrácení do 30 dnů
          </p>
        </div>
      ) : null}
    </div>
  );
}

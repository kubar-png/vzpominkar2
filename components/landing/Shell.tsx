import type { ReactNode } from "react";
import { Promo } from "./Promo";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { PrimaryCta } from "./PrimaryCta";
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
  /**
   * Where the sticky mobile CTA points. Defaults to /signup (the 2 890 Kč main
   * product). Gift pages MUST override this — e.g. /kniha passes the gift
   * checkout — so cold mobile shoppers aren't pushed into the wrong, pricier
   * funnel.
   */
  stickyCtaHref?: string;
  /** Label for the sticky mobile CTA. Defaults to "Založit Vzpomínkář". */
  stickyCtaLabel?: string;
  /** Sub-note under the sticky CTA. Defaults to the main-product app line. */
  stickyCtaNote?: string;
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
  stickyCtaHref,
  stickyCtaLabel,
  stickyCtaNote = "Jednorázově, přístup napořád.",
}: ShellProps) {
  return (
    <div className="editorial min-h-screen">
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
          className="sticky-mobile-cta"
          role="region"
          aria-label={stickyCtaLabel ?? "Založit Vzpomínkář"}
        >
          <PrimaryCta href={stickyCtaHref} label={stickyCtaLabel} />
          <p className="sticky-mobile-cta-note">{stickyCtaNote}</p>
        </div>
      ) : null}
    </div>
  );
}

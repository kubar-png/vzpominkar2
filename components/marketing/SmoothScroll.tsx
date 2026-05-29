"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Inertia smooth-scroll on the marketing surface (homepage + landing pages).
 *
 * NOT enabled on the owner app, senior surface, or auth pages — those have
 * sticky sidebars / sticky CTAs / form focus that fight smoothly-animated
 * scroll and would just feel laggy.
 *
 * Horizontal scroll-snap (testimonial carousel, question deck on mobile,
 * story gallery) is unaffected: Lenis only intercepts vertical wheel/touch
 * on window. Reduced-motion users get native scroll.
 *
 * Touchpad lag: Lenis works smoothly on a touchpad on its own demo site — the
 * lag we had came from our own `html { scroll-behavior: smooth }` stacking a
 * second layer of native smoothing on top of Lenis' programmatic scrolls.
 * That's fixed by importing Lenis' recommended CSS (above) and disabling the
 * native `scroll-behavior` while Lenis is active (`html.lenis` in globals.css).
 */

const MARKETING_PATHS = [
  "/",
  "/darek",
  "/babybook",
  "/cenik",
  "/faq",
  "/o-nas",
  "/kontakt",
  "/jak-to-funguje",
  "/cookies",
  "/podminky",
  "/soukromi",
];

function isMarketingPath(pathname: string): boolean {
  if (MARKETING_PATHS.includes(pathname)) return true;
  // Any future /darek/sub, /faq/sub etc. — keep them in.
  return MARKETING_PATHS.some((p) => p !== "/" && pathname.startsWith(`${p}/`));
}

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isMarketingPath(pathname)) return;
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      // Touch on phones is already buttery natively; smoothing it can
      // actually feel worse (and conflicts with momentum scroll on iOS).
      syncTouch: false,
      wheelMultiplier: 1,
      // Let Lenis own anchor-link scrolling (nav → #produkt). We've disabled
      // native CSS smooth scroll while Lenis is active, so it must handle it.
      anchors: true,
    });

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

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
      // 1.05 lerp = balanced — gentle inertia, not laggy
      lerp: 0.085,
      smoothWheel: true,
      // Touch on phones is already buttery natively; smoothing it can
      // actually feel worse (and conflicts with momentum scroll on iOS).
      syncTouch: false,
      wheelMultiplier: 1,
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

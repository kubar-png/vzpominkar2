"use client";

import { useEffect } from "react";

/**
 * Drives `--kniha-scroll` (0 → 1 over the first ~620px of scroll) on <html>
 * for the /kniha hero: the book pans left, a ruled paper slides out to the
 * right, and the handwriting fills in left-to-right as you scroll.
 *
 * Respects prefers-reduced-motion (sets a static composed state, no scroll
 * listener). Renders nothing — keeps the /kniha page a Server Component.
 */
export function KnihaHeroScroll() {
  useEffect(() => {
    const root = document.documentElement;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.setProperty("--kniha-scroll", "0.45");
      return () => root.style.removeProperty("--kniha-scroll");
    }

    const range = 620;
    let ticking = false;
    const update = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / range));
      root.style.setProperty("--kniha-scroll", p.toFixed(4));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.style.removeProperty("--kniha-scroll");
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

/**
 * HeroScrollDriver
 *
 * Drives the `--hero-scroll` custom property on <html> from window.scrollY,
 * mapped 0 → 1 over the first ~700px. The hero's six page-leaves consume
 * this value to fan out from behind the book cover.
 *
 * Side-effect only; renders nothing. Lives alongside the homepage so the
 * rest of the marketing tree can stay a Server Component.
 */
export function HeroScrollDriver() {
  useEffect(() => {
    const range = 700;
    const root = document.documentElement;
    let ticking = false;

    const update = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / range));
      root.style.setProperty("--hero-scroll", p.toFixed(4));
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
    };
  }, []);

  return null;
}

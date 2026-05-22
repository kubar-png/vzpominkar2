"use client";

import { useEffect } from "react";

/**
 * HeroScrollDriver
 *
 * Two side-effects on window scroll:
 *
 * 1. Drives `--hero-scroll` (0 → 1 over first ~700px) on <html> — the hero's
 *    six page-leaves consume this to fan out from behind the book cover.
 * 2. Toggles `data-state="visible"|"hidden"` on `.editorial-header` — hide
 *    on scroll down past 80px, show on scroll up. Always visible at top.
 *
 * Renders nothing. Lives alongside the homepage so the rest of the
 * marketing tree stays a Server Component.
 */
export function HeroScrollDriver() {
  useEffect(() => {
    const range = 700;
    const root = document.documentElement;
    const header = document.querySelector<HTMLElement>(".editorial-header");
    let ticking = false;
    let lastY = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const p = Math.min(1, Math.max(0, y / range));
      root.style.setProperty("--hero-scroll", p.toFixed(4));

      if (header) {
        if (y < 80) {
          header.dataset.state = "visible";
        } else if (y > lastY + 4) {
          header.dataset.state = "hidden";
        } else if (y < lastY - 4) {
          header.dataset.state = "visible";
        }
      }
      lastY = y;
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

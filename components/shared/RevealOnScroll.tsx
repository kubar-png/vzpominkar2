"use client";

import { useEffect } from "react";

/**
 * Client island that orchestrates scroll-triggered reveals.
 *
 * Mark any element with `data-reveal` (and optionally a `--reveal-delay` CSS
 * variable) and this observer flips `data-revealed="true"` on it the first time
 * it enters the viewport. The actual visual transition lives in globals.css -
 * this component is just the trigger.
 *
 * Falls back to fully-visible elements when JS is disabled (the CSS uses an
 * attribute selector, but if you want bullet-proof no-JS, wrap in @supports).
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    /* Respect reduced-motion: just reveal everything immediately, skip the observer. */
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.dataset.revealed = "true";
      });
      return;
    }

    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = "true";
            obs.unobserve(entry.target);
          }
        }
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return null;
}

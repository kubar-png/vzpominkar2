"use client";

import { useEffect } from "react";

/**
 * Mount once at the app root. Walks the DOM for `[data-reveal]` elements and
 * adds `is-revealed` when each enters the viewport (single shot — unobserved
 * immediately after firing so re-scrolling past doesn't re-trigger).
 *
 * All the actual motion lives in CSS (`[data-reveal]` baseline + transition,
 * `.is-revealed` end state). This component just toggles the class.
 *
 * Re-observes when route changes — IntersectionObserver is per-element, and
 * Next.js soft-navigations swap the DOM under us.
 */
export function RevealObserver() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) {
      // Old browser — just reveal everything immediately.
      document.querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      {
        // Fire slightly before the element fully enters — so by the time the
        // user's eye reaches it, the animation has already played.
        rootMargin: "0px 0px -10% 0px",
        threshold: 0,
      },
    );

    function scan() {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)")
        .forEach((el) => observer.observe(el));
    }

    scan();
    // Re-scan on every route change. We use a MutationObserver on body so we
    // catch React-rendered swaps regardless of the route mechanism.
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

/**
 * Mounts a global scroll listener that flips `data-scrolled` on
 * `<html>` once the user scrolls past 40px.
 *
 * Used by the heritage header to collapse from 72px → 56px and shrink
 * the logo when scrolled. Style lives in globals.css so the transition
 * is CSS-driven (no React re-renders per scroll frame).
 *
 * Updates are throttled with requestAnimationFrame.
 */
export function ScrollState() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    let queued = false;
    const update = () => {
      queued = false;
      root.dataset.scrolled = window.scrollY > 40 ? "true" : "false";
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return null;
}

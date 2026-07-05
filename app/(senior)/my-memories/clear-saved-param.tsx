"use client";

import { useEffect } from "react";

/**
 * One-shot cleanup for the `?saved=1` confirmation flag.
 *
 * The success banner is rendered server-side purely from the presence of the
 * query param. Without this, the param would survive a reload / back-forward /
 * bookmark and keep re-showing the "just saved" banner. We strip it from the
 * URL bar with `history.replaceState` (rather than `router.replace`, which
 * would re-render the server component and make the banner disappear on the
 * spot) — so the confirmation stays visible this once, and any later reload
 * lands on the clean `/my-memories` URL with no banner.
 */
export function ClearSavedParam() {
  useEffect(() => {
    window.history.replaceState(null, "", "/my-memories");
  }, []);
  return null;
}

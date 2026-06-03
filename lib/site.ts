/**
 * Single source of truth for the app's public origin.
 *
 * Override per environment via `NEXT_PUBLIC_APP_URL` (Vercel env / .env.local).
 * The default is the intended production domain — see PRE-LAUNCH.md for the
 * launch switch. `NEXT_PUBLIC_*` is inlined at build time, so this module is
 * safe to import from both Server and Client Components.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://vzpominkar.cz"
).replace(/\/+$/, "");

/** Bare host (no protocol, no trailing slash) for display, e.g. "vzpominkar.cz". */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

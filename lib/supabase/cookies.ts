import type { CookieOptions } from "@supabase/ssr";

/**
 * "Remember me" cookie handling, shared by the SSR client (lib/supabase/server.ts)
 * and the middleware so the session lifetime is consistent everywhere.
 *
 * The user's choice is stored in a small `vzp-remember` flag cookie:
 *   - present and != "0"  → remember (default): Supabase auth cookies are made
 *     persistent (60-day sliding window, refreshed on every visit) so users stay
 *     signed in across browser restarts.
 *   - "0"                 → session-only: drop maxAge/expires so the auth cookies
 *     clear when the browser closes.
 *
 * Default (flag absent) is remember=true, so existing sessions keep working and
 * become reliably persistent.
 */
export const REMEMBER_COOKIE = "vzp-remember";

const REMEMBER_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

/** Supabase stores the session in the chunked `sb-*` auth-token cookies. */
function isAuthCookie(name: string): boolean {
  return name.startsWith("sb-");
}

/** Resolve the remember preference from the request's cookies (default true). */
export function rememberFrom(get: (name: string) => { value: string } | undefined): boolean {
  return get(REMEMBER_COOKIE)?.value !== "0";
}

/** Adjust an outgoing auth cookie's lifetime to match the remember preference. */
export function withRemember(name: string, options: CookieOptions, remember: boolean): CookieOptions {
  if (!isAuthCookie(name)) return options;
  if (remember) {
    // Force a generous persistent window (Supabase may default to a session or
    // short-lived cookie). The actual session validity is still governed by the
    // refresh token, so this never extends auth beyond what Supabase allows.
    return { ...options, maxAge: REMEMBER_MAX_AGE, expires: undefined };
  }
  const next = { ...options };
  delete next.maxAge;
  delete next.expires;
  return next;
}

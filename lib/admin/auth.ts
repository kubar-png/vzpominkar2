import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Env-based single-credential admin auth — fully separate from Supabase/user
 * auth and the app database. The credential lives ONLY in environment variables
 * (encrypted at rest on Vercel), never in `profiles`/`auth.users`, never logged,
 * never sent to the client. There is no signup, no reset, no account creation:
 * the credential changes only by editing the env var.
 *
 * - `ADMIN_USERNAME`      — the admin username.
 * - `ADMIN_PASSWORD`      — the admin password, PLAINTEXT (env only). Stored as
 *   typed for operator simplicity; use a password you do NOT reuse anywhere
 *   else, since an env leak would expose it as-is.
 * - `ADMIN_SESSION_SECRET`— HMAC key for signing the session cookie (session.ts).
 *
 * Both username and password are compared in constant time, so a failed login
 * leaks neither which field was wrong nor — via timing — how much matched.
 */

// Re-exported from the Edge-safe constants module so callers can import them
// from `lib/admin/auth` without dragging this Node-crypto module into the Edge
// bundle. Middleware imports them from `lib/admin/constants`.
export { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE } from "@/lib/admin/constants";

/**
 * Constant-time UTF-8 string compare. Pads both sides to equal length so
 * `timingSafeEqual` never throws on a length mismatch; a mismatched length still
 * resolves to `false`, and timing is independent of where the first byte differs.
 */
function constantTimeStringEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  const len = Math.max(ab.length, bb.length, 1);
  const pa = Buffer.alloc(len);
  const pb = Buffer.alloc(len);
  ab.copy(pa);
  bb.copy(pb);
  return timingSafeEqual(pa, pb) && ab.length === bb.length;
}

/**
 * Verify an admin username + password against the env credential.
 *
 * Returns a single boolean — the caller surfaces a generic error so a failed
 * login never reveals which field was wrong. Fails closed (returns false) when
 * either env var is unset/empty. When configured, BOTH factors are compared
 * before combining, so timing doesn't reveal which one failed.
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;

  const userOk = constantTimeStringEqual(username, expectedUser);
  const passOk = constantTimeStringEqual(password, expectedPass);
  return userOk && passOk;
}

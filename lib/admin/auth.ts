import "server-only";
import { scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Env-based single-credential admin auth — fully separate from Supabase/user
 * auth and the app database. The admin credential lives ONLY in environment
 * variables (encrypted at rest on Vercel), never in `profiles`/`auth.users`,
 * never logged, never sent to the client. There is no signup, no reset, no
 * account creation: the credential changes only by editing the env var.
 *
 * - `ADMIN_USERNAME`      — the admin username (plaintext; obscurity, not a secret).
 * - `ADMIN_PASSWORD_HASH` — scrypt hash, format `scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>`.
 * - `ADMIN_SESSION_SECRET`— HMAC key for signing the session cookie (see session.ts).
 *
 * This module uses Node `node:crypto` (scrypt), so it only runs in the Node
 * runtime (the login Server Action). Middleware verifies the *session* cookie
 * via Web Crypto in `session.ts`; it never imports this file.
 */

// Re-exported from the Edge-safe constants module so callers can import them
// from `lib/admin/auth` (per spec) without dragging this Node-crypto module
// into the Edge bundle. Middleware imports them from `lib/admin/constants`.
export { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE } from "@/lib/admin/constants";

/** scrypt parameters — must match `scripts/hash-admin-password.mjs`. */
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

interface ParsedHash {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
}

/**
 * Parse the stored `ADMIN_PASSWORD_HASH` (`scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>`).
 * Returns null on any malformed value so verification fails closed rather than
 * throwing (the caller treats null as "no valid credential configured").
 */
function parsePasswordHash(stored: string | undefined): ParsedHash | null {
  if (!stored) return null;
  const parts = stored.split("$");
  if (parts.length !== 6) return null;
  const [scheme, nStr, rStr, pStr, saltHex, hashHex] = parts;
  if (scheme !== "scrypt") return null;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return null;
  if (N <= 0 || r <= 0 || p <= 0) return null;
  if (!saltHex || !hashHex) return null;
  if (!/^[0-9a-fA-F]+$/.test(saltHex) || !/^[0-9a-fA-F]+$/.test(hashHex)) return null;
  if (saltHex.length % 2 !== 0 || hashHex.length % 2 !== 0) return null;
  const salt = Buffer.from(saltHex, "hex");
  const hash = Buffer.from(hashHex, "hex");
  if (salt.length === 0 || hash.length === 0) return null;
  return { N, r, p, salt, hash };
}

/**
 * Constant-time string compare that does not early-return on length mismatch in
 * a way that leaks the secret length: we hash both sides to a fixed width first
 * is overkill here — instead we compare equal-length buffers and fold the
 * length check into the boolean result so timing is independent of *where* the
 * first differing byte is.
 */
function constantTimeStringEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  // Compare against a fixed-length copy so timingSafeEqual never throws on a
  // length mismatch; mismatched lengths still resolve to `false`.
  const len = Math.max(ab.length, bb.length, 1);
  const pa = Buffer.alloc(len);
  const pb = Buffer.alloc(len);
  ab.copy(pa);
  bb.copy(pb);
  const equal = timingSafeEqual(pa, pb);
  return equal && ab.length === bb.length;
}

/**
 * Verify an admin username + password against the env credential.
 *
 * - Username compared in constant time against `ADMIN_USERNAME`.
 * - Password verified by scrypt-deriving with the stored salt/params and
 *   `timingSafeEqual`-comparing the derived key against the stored hash.
 *
 * Returns a single boolean — the caller surfaces a generic error so a failed
 * login never reveals whether the username or the password was wrong. Fails
 * closed (returns false) when the env credential is missing or malformed.
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const parsed = parsePasswordHash(process.env.ADMIN_PASSWORD_HASH);

  // Always run scrypt even when config is missing/invalid, to keep timing
  // roughly uniform between "no user configured" and "wrong password". Use the
  // standard params + a throwaway salt when we have nothing valid to compare.
  const N = parsed?.N ?? SCRYPT_N;
  const r = parsed?.r ?? SCRYPT_R;
  const p = parsed?.p ?? SCRYPT_P;
  const keylen = parsed ? parsed.hash.length : SCRYPT_KEYLEN;
  const salt = parsed?.salt ?? Buffer.alloc(16);

  let derived: Buffer;
  try {
    derived = scryptSync(password, salt, keylen, { N, r, p });
  } catch {
    return false;
  }

  const userOk = expectedUser != null && constantTimeStringEqual(username, expectedUser);
  const passOk =
    parsed != null &&
    derived.length === parsed.hash.length &&
    timingSafeEqual(derived, parsed.hash);

  // Combine without short-circuiting so timing doesn't reveal which factor failed.
  return userOk && passOk;
}

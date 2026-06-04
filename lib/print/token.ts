import "server-only";
import { createHmac } from "node:crypto";
import { safeEqual } from "@/lib/cron";

/**
 * Short-lived HMAC tokens that let headless Chromium fetch the internal print
 * page (`/print/book/[token]`) WITHOUT a Supabase auth cookie.
 *
 * The render API (`/api/print/book`) is the only authorized caller: it mints a
 * token, points Puppeteer at the print URL, and the print page verifies the
 * token server-side before rendering real book data. The token therefore acts
 * as a single-use-ish capability — anyone who somehow obtains a live token can
 * only read the one book it names, and only for the few minutes it stays valid.
 *
 * Format (all URL-safe): `${id}.${expSeconds}.${hexHmac}` where the HMAC is
 * SHA-256 over `${id}.${expSeconds}` keyed by PRINT_SIGNING_SECRET. Verified in
 * constant time (reuses lib/cron's safeEqual) so the signature can't be probed
 * byte-by-byte.
 *
 * `id` is a bookId (UUID) or the literal "sample" for the test/preview book.
 */

const DEFAULT_TTL_SECONDS = 5 * 60; // 5 minutes — long enough for a cold render.

function secret(): string {
  const s = process.env.PRINT_SIGNING_SECRET;
  if (!s) {
    // Mirror lib/cron: a missing secret must FAIL CLOSED, never sign/verify with
    // a blank key, so a misconfigured deploy can't leave the print page open.
    throw new Error(
      "Missing PRINT_SIGNING_SECRET. Set it in .env.local (and the Vercel project) to render print PDFs.",
    );
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Mint a token for `id`, valid for `ttlSeconds` (default 5 min). */
export function createPrintToken(id: string, ttlSeconds: number = DEFAULT_TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${id}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * Verify a token and return the `id` it authorizes, or null if the signature is
 * wrong, the token is malformed, or it has expired. Never throws on bad input
 * (only if the secret itself is unset — that's a deploy misconfiguration).
 */
export function verifyPrintToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, expStr, providedSig] = parts as [string, string, string];
  if (!id || !expStr || !providedSig) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp)) return null;
  if (Math.floor(Date.now() / 1000) > exp) return null; // expired

  const expectedSig = sign(`${id}.${expStr}`);
  if (!safeEqual(providedSig, expectedSig)) return null;

  return id;
}

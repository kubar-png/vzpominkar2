import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Constant-time equality so a brute-force can't extract the secret byte-by-byte. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Verify a Vercel cron request's `Authorization: Bearer ${CRON_SECRET}` header
 * in constant time. Denies ALL requests when CRON_SECRET is unset, so a
 * misconfigured deploy can never leave the endpoint publicly triggerable.
 */
export function verifyCronAuth(req: Request): boolean {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected) return false;
  const auth = req.headers.get("authorization") ?? "";
  return safeEqual(auth, expected);
}

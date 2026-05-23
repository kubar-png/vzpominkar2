import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * Per-IP sliding-window rate limiters backed by Upstash Redis (provisioned
 * via the Vercel marketplace integration — env vars use the `KV_*` naming
 * the integration exposes by default).
 *
 * Fail-open on Redis errors: if the Redis call throws or the env vars are
 * missing (local dev without `.env.local`), `check()` returns `{ ok: true }`
 * so the request still goes through. Pre-launch we prefer availability over
 * strict enforcement; revisit once we have real traffic.
 */

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function makeLimiter(opts: {
  prefix: string;
  limit: number;
  windowSec: number;
}): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    prefix: `vzp:${opts.prefix}`,
    limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowSec} s`),
    analytics: false,
  });
}

const authLimiter = makeLimiter({ prefix: "auth", limit: 5, windowSec: 15 * 60 });
const leadsLimiter = makeLimiter({ prefix: "leads", limit: 30, windowSec: 60 * 60 });

export type RateLimitKind = "auth" | "leads";

/** Pulled out so route handlers can pass `request.headers` directly. */
export function getClientIp(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") ?? "unknown";
}

/** For Server Actions — pulls IP from next/headers automatically. */
export async function checkRateLimit(
  kind: RateLimitKind,
  scope?: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const limiter = kind === "auth" ? authLimiter : leadsLimiter;
  if (!limiter) return { ok: true };

  const h = await headers();
  const ip = getClientIp(h);
  const key = scope ? `${ip}:${scope}` : ip;

  try {
    const res = await limiter.limit(key);
    if (res.success) return { ok: true };
    const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch (err) {
    console.error(`[rate-limit:${kind}] redis error (fail-open):`, err);
    return { ok: true };
  }
}

/** For Route Handlers (no next/headers). */
export async function checkRateLimitWithHeaders(
  kind: RateLimitKind,
  reqHeaders: Headers,
  scope?: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const limiter = kind === "auth" ? authLimiter : leadsLimiter;
  if (!limiter) return { ok: true };

  const ip = getClientIp(reqHeaders);
  const key = scope ? `${ip}:${scope}` : ip;

  try {
    const res = await limiter.limit(key);
    if (res.success) return { ok: true };
    const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch (err) {
    console.error(`[rate-limit:${kind}] redis error (fail-open):`, err);
    return { ok: true };
  }
}

/** Czech-language hint for the user when they get throttled. */
export function rateLimitMessage(retryAfterSec: number): string {
  if (retryAfterSec < 60) {
    return `Příliš mnoho pokusů. Zkuste to znovu za ${retryAfterSec} s.`;
  }
  const min = Math.ceil(retryAfterSec / 60);
  return `Příliš mnoho pokusů. Zkuste to znovu za ${min} min.`;
}

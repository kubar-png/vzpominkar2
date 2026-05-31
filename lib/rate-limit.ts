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

/** True when the KV/Redis env vars are present (limiters can be built). */
function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

const isProd = process.env.NODE_ENV === "production";

/**
 * Decide what to do for the `auth` limiter when we cannot get a verdict from
 * Redis (KV unconfigured, or a live call threw). In production we fail CLOSED
 * for auth — a brute-force protection that silently disables itself is worse
 * than a transient deny. The one exception: if KV is simply not provisioned at
 * all in production we log loudly but still allow, so a missing integration
 * can't lock every user out of login. In dev we always stay permissive.
 *
 * `reason` is "unconfigured" (no KV env at all) or "error" (KV env present but
 * the call failed).
 */
function authFailDecision(
  reason: "unconfigured" | "error",
): { ok: true } | { ok: false; retryAfterSec: number } {
  if (!isProd) return { ok: true };
  if (reason === "unconfigured") {
    console.error(
      "[rate-limit:auth] KV is not configured in production — auth rate limiting is DISABLED. Provision the Upstash/KV integration (KV_REST_API_URL / KV_REST_API_TOKEN).",
    );
    return { ok: true };
  }
  // KV is configured but the call errored: fail CLOSED so we don't drop the
  // brute-force protection during an infra blip.
  return { ok: false, retryAfterSec: 60 };
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

/* ── AI-cost protection limiters ────────────────────────────────────────────
 * Two-tier defence: per-user hourly cap stops one compromised account from
 * burning the OpenAI bill before someone notices; per-family daily cap is
 * the hard ceiling — even if attacker rotates IPs / accounts within one
 * family, total spend per family per day stays bounded.
 *
 * Indicative cost ceilings (gpt-4o-mini + whisper at May 2026 pricing):
 *   audio-family-daily 30 calls × ~$0.06 avg = ~$1.80 / family / day
 *   polish-family-daily 100 calls × ~$0.003   = ~$0.30 / family / day
 * Multiply by # of paying families for worst-case daily exposure. */
const aiAudioUserLimiter = makeLimiter({ prefix: "ai-audio-u", limit: 10, windowSec: 60 * 60 });
const aiAudioFamilyLimiter = makeLimiter({ prefix: "ai-audio-f", limit: 30, windowSec: 24 * 60 * 60 });
const aiPolishUserLimiter = makeLimiter({ prefix: "ai-polish-u", limit: 30, windowSec: 60 * 60 });
const aiPolishFamilyLimiter = makeLimiter({ prefix: "ai-polish-f", limit: 100, windowSec: 24 * 60 * 60 });
const aiTextUserLimiter = makeLimiter({ prefix: "ai-text-u", limit: 20, windowSec: 60 * 60 });

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
  if (!limiter) {
    // No limiter built → KV unconfigured. `auth` fails closed in prod; `leads`
    // stays fail-open.
    return kind === "auth"
      ? authFailDecision(isKvConfigured() ? "error" : "unconfigured")
      : { ok: true };
  }

  const h = await headers();
  const ip = getClientIp(h);
  const key = scope ? `${ip}:${scope}` : ip;

  try {
    const res = await limiter.limit(key);
    if (res.success) return { ok: true };
    const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch (err) {
    if (kind === "auth") {
      console.error(`[rate-limit:auth] redis error (fail-closed in prod):`, err);
      return authFailDecision("error");
    }
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
  if (!limiter) {
    return kind === "auth"
      ? authFailDecision(isKvConfigured() ? "error" : "unconfigured")
      : { ok: true };
  }

  const ip = getClientIp(reqHeaders);
  const key = scope ? `${ip}:${scope}` : ip;

  try {
    const res = await limiter.limit(key);
    if (res.success) return { ok: true };
    const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch (err) {
    if (kind === "auth") {
      console.error(`[rate-limit:auth] redis error (fail-closed in prod):`, err);
      return authFailDecision("error");
    }
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

/* ── AI cost rate-limit helpers ───────────────────────────────────────────── */

export type AiRateLimitKind = "audio" | "polish" | "text";

interface AiRateLimitResult {
  ok: boolean;
  retryAfterSec: number;
  /** Which limit fired, for logging / error messages. */
  scope?: "user" | "family";
}

/**
 * Two-tier check before any AI call: per-user hourly cap, then per-family
 * daily cap. Fail-open on Redis errors so legitimate users aren't punished
 * by infra blips — but cost ceiling at the OpenAI account is the ultimate
 * backstop (set monthly hard cap in OpenAI dashboard).
 */
export async function checkAiRateLimit(
  kind: AiRateLimitKind,
  userId: string,
  familyId: string | null,
): Promise<AiRateLimitResult> {
  const { user, family } = pickLimiters(kind);
  if (!user) return { ok: true, retryAfterSec: 0 };

  // Per-user hourly check first (most common abuser is one compromised account)
  try {
    const r = await user.limit(`user:${userId}`);
    if (!r.success) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
        scope: "user",
      };
    }
  } catch (err) {
    console.error(`[ai-rate-limit:${kind}:user] redis error (fail-open):`, err);
    return { ok: true, retryAfterSec: 0 };
  }

  // Per-family daily check
  if (family && familyId) {
    try {
      const r = await family.limit(`family:${familyId}`);
      if (!r.success) {
        return {
          ok: false,
          retryAfterSec: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
          scope: "family",
        };
      }
    } catch (err) {
      console.error(`[ai-rate-limit:${kind}:family] redis error (fail-open):`, err);
      return { ok: true, retryAfterSec: 0 };
    }
  }

  return { ok: true, retryAfterSec: 0 };
}

function pickLimiters(kind: AiRateLimitKind): { user: Ratelimit | null; family: Ratelimit | null } {
  switch (kind) {
    case "audio":
      return { user: aiAudioUserLimiter, family: aiAudioFamilyLimiter };
    case "polish":
      return { user: aiPolishUserLimiter, family: aiPolishFamilyLimiter };
    case "text":
      return { user: aiTextUserLimiter, family: null };
  }
}

/** User-facing Czech hint when AI calls are throttled. */
export function aiRateLimitMessage(result: AiRateLimitResult): string {
  if (result.ok) return "";
  const min = Math.ceil(result.retryAfterSec / 60);
  if (result.scope === "family") {
    return `Vaše rodina dosáhla denního limitu zpracování. Zkuste to zítra (za ${min} min se limit obnoví).`;
  }
  if (min < 60) return `Příliš rychle za sebou. Zkuste to znovu za ${min} min.`;
  const hours = Math.ceil(min / 60);
  return `Příliš rychle za sebou. Zkuste to znovu za ${hours} h.`;
}

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

// Scream once at cold start if KV is missing in prod — auth brute-force
// protection is fail-open without it (see authFailDecision). Cheap visibility
// so a missing integration doesn't go unnoticed until an attack.
if (isProd && !isKvConfigured()) {
  console.error(
    "[rate-limit] KV/Upstash is NOT configured in production — auth brute-force protection is fail-open. Provision KV_REST_API_URL / KV_REST_API_TOKEN.",
  );
}

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
/* Internal admin login (/admin/login). Single operator, so a low per-IP ceiling
 * is plenty; like `auth` it fails CLOSED in prod via authFailDecision so a
 * misconfigured/flaky KV can never silently disable brute-force protection on
 * the most sensitive surface in the app. */
const adminLimiter = makeLimiter({ prefix: "admin", limit: 5, windowSec: 15 * 60 });
const leadsLimiter = makeLimiter({ prefix: "leads", limit: 30, windowSec: 60 * 60 });
/* Book-PDF render is expensive (cold-starts a headless Chromium, ~tens of
 * seconds, 300s budget). Cap one owner/IP to 5 renders per hour so a script
 * can't pin the function and burn the compute budget. Fail-OPEN like `leads`:
 * a missing/flaky KV must never block a paying owner from printing their book. */
const printLimiter = makeLimiter({ prefix: "print", limit: 5, windowSec: 60 * 60 });
/* Senior magic link (/q/{token}). The token itself is the real defence (32 bytes,
 * unguessable); this just caps abuse of the admin generateLink path per IP. A
 * family share one IP and click weekly, so 20/h is generous. Fail-OPEN — a senior
 * must never be locked out of answering. */
const magicLimiter = makeLimiter({ prefix: "magic", limit: 20, windowSec: 60 * 60 });

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

export type RateLimitKind = "auth" | "admin" | "leads" | "print" | "magic";

/** True for kinds that must fail CLOSED in prod (auth surfaces). */
function isAuthKind(kind: RateLimitKind): boolean {
  return kind === "auth" || kind === "admin";
}

function limiterFor(kind: RateLimitKind): Ratelimit | null {
  switch (kind) {
    case "auth":
      return authLimiter;
    case "admin":
      return adminLimiter;
    case "leads":
      return leadsLimiter;
    case "print":
      return printLimiter;
    case "magic":
      return magicLimiter;
  }
}

/** Pulled out so route handlers can pass `request.headers` directly. */
export function getClientIp(h: Headers): string {
  // On Vercel `x-real-ip` is set by the platform to the true client IP and
  // cannot be spoofed by the client — prefer it. Otherwise fall back to the
  // LAST segment of `x-forwarded-for` (the hop appended by the trusted proxy),
  // never the first: the leftmost value is client-supplied and trivially
  // spoofable to dodge per-IP limits.
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    return parts[parts.length - 1] || "unknown";
  }
  return "unknown";
}

/** For Server Actions — pulls IP from next/headers automatically. */
export async function checkRateLimit(
  kind: RateLimitKind,
  scope?: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const limiter = limiterFor(kind);
  if (!limiter) {
    // No limiter built → KV unconfigured. `auth`/`admin` fail closed in prod;
    // `leads`/`print`/`magic` stay fail-open.
    return isAuthKind(kind)
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
    if (isAuthKind(kind)) {
      console.error(`[rate-limit:${kind}] redis error (fail-closed in prod):`, err);
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
  const limiter = limiterFor(kind);
  if (!limiter) {
    return isAuthKind(kind)
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
    if (isAuthKind(kind)) {
      console.error(`[rate-limit:${kind}] redis error (fail-closed in prod):`, err);
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

/* ── Senior-login per-username throttle ───────────────────────────────────────
 * Senior usernames are guessable (derived from the display name) and passwords
 * are short, so the per-IP `checkRateLimit("auth", "senior-login")` alone lets a
 * rotating-IP attacker hammer one known account. This adds a low per-username
 * ceiling, keyed by username (not IP). */
const seniorLoginUserLimiter = makeLimiter({
  prefix: "senior-login-u",
  limit: 10,
  windowSec: 60 * 60,
});

/**
 * Extra throttle for senior login, keyed on the username (not IP). Layered on
 * top of `checkRateLimit("auth", "senior-login")`. Fail behaviour matches the
 * auth limiter: closed on a live error in prod, open only when KV is entirely
 * unprovisioned (so a missing integration can't lock everyone out).
 */
export async function checkSeniorUsernameLimit(
  username: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  if (!seniorLoginUserLimiter) {
    return authFailDecision(isKvConfigured() ? "error" : "unconfigured");
  }
  try {
    const res = await seniorLoginUserLimiter.limit(`senior-login:${username}`);
    if (res.success) return { ok: true };
    const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch (err) {
    console.error(`[rate-limit:senior-login-u] redis error (fail-closed in prod):`, err);
    return authFailDecision("error");
  }
}

/* ── Admin-login per-username throttle ────────────────────────────────────────
 * Layered on top of the per-IP `checkRateLimit("admin", "login")`. The admin
 * username is a single fixed value, so this keyed-by-username ceiling blocks a
 * rotating-IP brute force against the one known account. Fail behaviour matches
 * the auth limiters: closed on a live error in prod, open only when KV is
 * entirely unprovisioned (so a missing integration can't lock the operator out).
 * Low ceiling — the operator logs in occasionally, not in bursts. */
const adminLoginUserLimiter = makeLimiter({
  prefix: "admin-login-u",
  limit: 5,
  windowSec: 15 * 60,
});

/**
 * Extra throttle for admin login, keyed on the submitted username (not IP).
 * Layered on top of `checkRateLimit("admin", "login")`.
 */
export async function checkAdminUsernameLimit(
  username: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  if (!adminLoginUserLimiter) {
    return authFailDecision(isKvConfigured() ? "error" : "unconfigured");
  }
  try {
    const res = await adminLoginUserLimiter.limit(`admin-login:${username}`);
    if (res.success) return { ok: true };
    const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch (err) {
    console.error(`[rate-limit:admin-login-u] redis error (fail-closed in prod):`, err);
    return authFailDecision("error");
  }
}

/* ── Owner per-account throttle (login + password reset) ──────────────────────
 * The per-IP `checkRateLimit("auth", ...)` alone lets a rotating-IP attacker
 * hammer one known owner e-mail. This adds a low per-e-mail ceiling, keyed by
 * the e-mail (not IP). Mirrors the senior per-username throttle; fail behaviour
 * matches the auth limiter (closed on a live error in prod, open only when KV is
 * entirely unprovisioned so a missing integration can't lock everyone out). */
const authAccountLimiter = makeLimiter({
  prefix: "auth-account",
  limit: 10,
  windowSec: 60 * 60,
});

/**
 * Per-account throttle for owner login + password reset, keyed on the e-mail.
 * Layered on top of the per-IP `checkRateLimit("auth", ...)`.
 */
export async function checkAuthAccountLimit(
  identifier: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  if (!authAccountLimiter) {
    return authFailDecision(isKvConfigured() ? "error" : "unconfigured");
  }
  const key = identifier.trim().toLowerCase();
  try {
    const res = await authAccountLimiter.limit(`auth-account:${key}`);
    if (res.success) return { ok: true };
    const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch (err) {
    console.error(`[rate-limit:auth-account] redis error (fail-closed in prod):`, err);
    return authFailDecision("error");
  }
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

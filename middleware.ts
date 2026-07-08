import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { rememberFrom, withRemember } from "@/lib/supabase/cookies";
import { verifyAdminSession } from "@/lib/admin/session";
import { ADMIN_COOKIE } from "@/lib/admin/constants";

/**
 * Middleware responsibilities (kept tight; page-level requireOwner/requireSenior
 * still enforce role access):
 *
 *  1. Refresh the Supabase auth cookie on every request — required by
 *     @supabase/ssr to keep sessions alive.
 *  2. Redirect signed-in users away from /login and /signup to /dashboard.
 *
 * Cross-role blocking (owner vs senior) is handled by page-level guards.
 * Public marketing routes stay reachable to anyone.
 */

const AUTH_PATHS = ["/login", "/signup", "/senior-login"];

// Paths that need Supabase session refresh / auth-page redirects. Middleware now
// runs site-wide for the pre-launch gate (see matcher), but the Supabase client
// below is only created for these — marketing/static routes must never depend on
// Supabase env, and /admin is handled by its own guard first.
const APP_PATHS = [
  "/login",
  "/signup",
  "/senior-login",
  "/dashboard",
  "/settings",
  "/onboarding",
  "/family",
  "/home",
  "/my-memories",
  "/new-memory",
];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Length-checked constant-time string compare (Edge-safe, no Buffer). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Pre-launch lockdown gate (HTTP Basic Auth). When SITE_GATE_PASSWORD is set,
 * every matched page request must carry credentials matching
 * SITE_GATE_USER (default "vzpominkar") : SITE_GATE_PASSWORD. Returns a 401
 * challenge otherwise, or null to let the request through.
 *
 * The matcher excludes /api, /_next and static assets, so Stripe webhooks and
 * Vercel crons are never gated. Fail-open by design: with no password configured
 * the gate is disabled, so a missing/rolled-back env var can't lock the team out.
 */
function siteGate(request: NextRequest): NextResponse | null {
  const password = process.env.SITE_GATE_PASSWORD;
  if (!password) return null; // gate disabled

  const user = process.env.SITE_GATE_USER || "vzpominkar";
  const header = request.headers.get("authorization") || "";

  if (header.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = "";
    }
    const sep = decoded.indexOf(":");
    if (sep !== -1) {
      const gotUser = decoded.slice(0, sep);
      const gotPass = decoded.slice(sep + 1);
      if (safeEqual(gotUser, user) && safeEqual(gotPass, password)) {
        return null; // authorized
      }
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Vzpominkar", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Pre-launch site gate ────────────────────────────────────────────────────
  // Runs before everything: the whole domain is hidden behind HTTP Basic Auth
  // while SITE_GATE_PASSWORD is set. Excluded routes (/api, /_next, static) never
  // reach here — see config.matcher.
  const gated = siteGate(request);
  if (gated) return gated;

  // ── Admin guard ─────────────────────────────────────────────────────────────
  // Handled FIRST, before any Supabase client is created: /admin is a fully
  // separate, env-based auth surface and must NEVER touch the user/Supabase
  // session. We allow the login page (+ its action) through, otherwise verify
  // the signed `vzp_admin` session cookie (Web Crypto, Edge-safe) and bounce to
  // /admin/login when it is missing, malformed, tampered, or expired. We always
  // return early so the Supabase client below is skipped for /admin.
  if (pathname.startsWith("/admin")) {
    // Forward the path to the server layout so it can skip the guard/chrome on
    // the login route (layouts can't read the pathname directly in App Router).
    const adminHeaders = new Headers(request.headers);
    adminHeaders.set("x-admin-pathname", pathname);
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
      return NextResponse.next({ request: { headers: adminHeaders } });
    }
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const valid = await verifyAdminSession(token);
    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next({ request: { headers: adminHeaders } });
  }

  // Supabase session refresh is only needed on the app surfaces in APP_PATHS.
  // Every other matched route (marketing, /eshop, token links) just passes
  // through — the gate above already enforced access. This keeps the front door
  // independent of Supabase env, as before the site-wide matcher.
  if (!startsWithAny(pathname, APP_PATHS)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const remember = rememberFrom((name) => request.cookies.get(name));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, withRemember(name, options, remember)),
          );
        },
      },
    },
  );

  // Session refresh — must run on every middleware-eligible request.
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  // Authed user landing on an auth page: bounce to dashboard.
  // (Page-level guards handle further role-based routing.)
  if (user && startsWithAny(pathname, AUTH_PATHS) && !pathname.startsWith("/login/check-email")) {
    // Gift exception: a logged-in buyer who clicked "Darovat Vzpomínkář"
    // (/signup?gift=1) must NOT dead-end on /dashboard — they came to gift the
    // app, which (for an already-signed-in owner) means starting a fresh gift
    // order. Route them through /darovat/app, which sets the gift marker and
    // sends them into onboarding/platba (or onboarding if no family yet).
    if (pathname === "/signup" && request.nextUrl.searchParams.get("gift") === "1") {
      return NextResponse.redirect(new URL("/darovat/app", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Runs middleware site-wide so the pre-launch gate (siteGate) can hide the
     * whole domain. Excludes routes that must never be gated or that don't need
     * it: /api (Stripe webhook + Vercel crons + internal APIs), Next internals
     * (/_next/static, /_next/image), and any request for a static asset file
     * (matched by extension). Supabase session refresh is scoped in-code to
     * APP_PATHS, so marketing/static routes stay independent of Supabase env.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|json|woff|woff2|ttf|otf|eot|css|js|map)).*)",
  ],
};

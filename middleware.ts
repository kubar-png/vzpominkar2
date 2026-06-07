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

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
     * Only run middleware where session refresh / auth-page redirects are
     * needed. The homepage and other static marketing routes are excluded
     * so a bad Supabase env can never 500 the front door. Add more paths
     * here as the app grows.
     */
    "/admin",
    "/admin/:path*",
    "/login/:path*",
    "/signup/:path*",
    "/senior-login/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/family/:path*",
    "/home/:path*",
    "/my-memories/:path*",
    "/new-memory/:path*",
  ],
};

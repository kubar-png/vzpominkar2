import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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
  let response = NextResponse.next({ request });

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
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Session refresh — must run on every middleware-eligible request.
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  const { pathname } = request.nextUrl;

  // Authed user landing on an auth page: bounce to dashboard.
  // (Page-level guards handle further role-based routing.)
  if (user && startsWithAny(pathname, AUTH_PATHS) && !pathname.startsWith("/login/check-email")) {
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

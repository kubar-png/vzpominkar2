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
  // Run middleware on the Node.js runtime — @supabase/ssr uses Node built-ins
  // (cookie parser, etc.) that aren't fully polyfilled in Edge. On Next 15.x
  // the default Edge runtime fails with `__dirname is not defined` for this
  // dep tree, so we opt into Node explicitly.
  runtime: "nodejs",
  matcher: [
    /*
     * Run on every path except:
     *  - /_next, /api (handle their own auth)
     *  - static assets and image optimisation
     */
    "/((?!_next/static|_next/image|favicon.ico|brand|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|css|js)$).*)",
  ],
};

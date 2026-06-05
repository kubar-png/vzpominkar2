import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { rememberFrom, withRemember } from "@/lib/supabase/cookies";

/**
 * Server-side Supabase client. Reads/writes cookies via Next's headers API
 * so sessions persist across Server Components, Route Handlers, and
 * Server Actions.
 *
 * Set/Remove may throw inside Server Components - that's expected. The
 * try/catch keeps the client usable for read-only RSC scenarios.
 *
 * Pass `{ remember }` at sign-in to set the session lifetime explicitly;
 * otherwise it's read from the persisted `vzp-remember` flag (default: remember).
 */
export async function createClient(opts?: { remember?: boolean }) {
  const cookieStore = await cookies();
  const remember = opts?.remember ?? rememberFrom((name) => cookieStore.get(name));

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, withRemember(name, options, remember)),
            );
          } catch {
            // RSC context - ignore. Middleware and Server Actions handle session refresh.
          }
        },
      },
    },
  );
}

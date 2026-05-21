import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client. Reads/writes cookies via Next's headers API
 * so sessions persist across Server Components, Route Handlers, and
 * Server Actions.
 *
 * Set/Remove may throw inside Server Components - that's expected. The
 * try/catch keeps the client usable for read-only RSC scenarios.
 */
export async function createClient() {
  const cookieStore = await cookies();

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
              cookieStore.set(name, value, options),
            );
          } catch {
            // RSC context - ignore. Middleware and Server Actions handle session refresh.
          }
        },
      },
    },
  );
}

import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client.
 *
 * BYPASSES ROW-LEVEL SECURITY. Use only in trusted server-side code paths
 * (Server Actions, Route Handlers, Cron) where the operation is already
 * authorized by application logic - e.g., creating a senior account on
 * behalf of an owner who has just authenticated.
 *
 * NEVER import this from a Client Component, browser-side helper, or any
 * code that can be reached without a server boundary.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase admin credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }
  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

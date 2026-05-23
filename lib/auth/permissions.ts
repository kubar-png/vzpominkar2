import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppRole = "owner" | "senior";

export interface AuthedUser {
  id: string;
  email: string | null;
  role: AppRole;
  familyId: string | null;
  displayName: string | null;
  username: string | null;
  /**
   * For role='senior' profiles: whether the simplified senior surface
   * (huge buttons, AAA contrast, no editing features) is enabled.
   * For owners this is always true (unused).
   * Defaults to true if column missing or null.
   */
  isSenior: boolean;
}

/**
 * Get the current authed user + profile. Returns null if not signed in or
 * profile row missing. Use this for optional-auth pages.
 *
 * Wrapped in React `cache()` so concurrent layout + page calls within the
 * same request share a single auth + profile fetch instead of double-hitting
 * Supabase. Cache is per-request, so signOut etc. still invalidates as soon
 * as the next request comes in.
 *
 * Profile is read via the service-role client so the lookup works regardless
 * of how the project's PostgREST JWT verification is configured.
 */
export const currentUser = cache(async (): Promise<AuthedUser | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, family_id, display_name, username, is_senior")
    .eq("id", auth.user.id)
    .maybeSingle<{
      role: string;
      family_id: string | null;
      display_name: string | null;
      username: string | null;
      is_senior: boolean | null;
    }>();

  if (!profile) return null;

  return {
    id: auth.user.id,
    email: auth.user.email ?? null,
    role: profile.role as AppRole,
    familyId: profile.family_id,
    displayName: profile.display_name,
    username: profile.username,
    isSenior: profile.is_senior ?? true,
  };
});

/** Owner-only gate. Redirects unauthenticated users to /login. */
export async function requireOwner(): Promise<AuthedUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/home");
  return user;
}

/** Senior-only gate. Redirects unauthenticated users to /senior-login. */
export async function requireSenior(): Promise<AuthedUser> {
  const user = await currentUser();
  if (!user) redirect("/senior-login");
  if (user.role !== "senior") redirect("/dashboard");
  return user;
}

/** Any authenticated user, regardless of role. */
export async function requireAuth(): Promise<AuthedUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Owner-only gate that also asserts membership in a specific family.
 * Use when the URL contains a `familyId` you need to validate against.
 */
export async function requireOwnerOfFamily(familyId: string): Promise<AuthedUser> {
  const user = await requireOwner();
  if (user.familyId !== familyId) redirect("/dashboard");
  return user;
}

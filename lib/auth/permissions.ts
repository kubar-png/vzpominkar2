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
  /** Family subscription status ('active' | 'cancelled' | …), null if no family. */
  subscriptionStatus: string | null;
  /** ISO timestamp the access expires, null = no family or no expiry. */
  subscriptionExpiresAt: string | null;
}

/**
 * True when the user's family has live PAID access.
 *
 * Hard paywall — there is NO free trial. The `families.subscription_status`
 * column allows 'trial' | 'active' | 'expired' | 'cancelled' and DEFAULTS to
 * 'trial' ("signed up, not paid"). Only an explicitly 'active' subscription
 * still within its paid period grants access; 'trial'/'expired'/'cancelled'
 * (and anything else) do not.
 */
export function hasActiveAccess(
  user: Pick<AuthedUser, "subscriptionStatus" | "subscriptionExpiresAt">,
): boolean {
  if (user.subscriptionStatus !== "active") return false;
  if (!user.subscriptionExpiresAt) return true; // active, open-ended
  return new Date(user.subscriptionExpiresAt).getTime() > Date.now();
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

  // Subscription lives on the family, not the profile. Owners and seniors both
  // belong to a family; fetch it once here (this whole fn is request-cached).
  let subscriptionStatus: string | null = null;
  let subscriptionExpiresAt: string | null = null;
  if (profile.family_id) {
    const { data: family } = await admin
      .from("families")
      .select("subscription_status, subscription_expires_at")
      .eq("id", profile.family_id)
      .maybeSingle<{
        subscription_status: string | null;
        subscription_expires_at: string | null;
      }>();
    subscriptionStatus = family?.subscription_status ?? null;
    subscriptionExpiresAt = family?.subscription_expires_at ?? null;
  }

  return {
    id: auth.user.id,
    email: auth.user.email ?? null,
    role: profile.role as AppRole,
    familyId: profile.family_id,
    displayName: profile.display_name,
    username: profile.username,
    isSenior: profile.is_senior ?? true,
    subscriptionStatus,
    subscriptionExpiresAt,
  };
});

/** Owner-only gate. Redirects unauthenticated users to /login. */
export async function requireOwner(): Promise<AuthedUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/home");
  return user;
}

/**
 * Owner gate that ALSO requires live subscription access. This is the gate the
 * owner-app shell uses, so a lapsed/expired family can't keep using the app.
 *
 * Owners mid-onboarding (no family yet) pass through — onboarding creates the
 * family with active access. Lapsed owners go to /predplatne to renew; that
 * page deliberately uses plain requireOwner so it stays reachable.
 */
export async function requireActiveOwner(): Promise<AuthedUser> {
  const user = await requireOwner();
  if (user.familyId && !hasActiveAccess(user)) redirect("/predplatne");
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

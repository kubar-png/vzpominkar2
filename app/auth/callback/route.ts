import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Handles Supabase email-confirmation redirects.
 *
 * Supabase appends ?code=... to the URL set in emailRedirectTo; we swap it
 * for a session and then ensure the owner's profiles row exists (the row
 * is no longer created during signUp — that step now waits for the user
 * to confirm their email, so we lazily upsert on first callback).
 *
 * After a successful exchange a brand-new owner goes to /onboarding;
 * returning users (profile already present) land on /dashboard.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Only honour same-origin `next` paths so an attacker can't redirect
  // signed-in users to an external URL via a crafted reset link.
  const nextParam = url.searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : null;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=callback_failed", url.origin));
  }

  const supabase = await createClient();
  const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !exchanged.user) {
    return NextResponse.redirect(new URL("/login?error=callback_failed", url.origin));
  }

  const user = exchanged.user;
  const meta = (user.user_metadata ?? {}) as { display_name?: string; role?: string };

  // Lazily create the owner profile. Skip when role metadata says "senior"
  // (senior accounts are provisioned by the owner via admin path).
  let isNewOwner = false;
  if (meta.role !== "senior") {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle<{ id: string }>();

    if (!existing) {
      const { error: profileErr } = await admin.from("profiles").insert({
        id: user.id,
        role: "owner",
        display_name: meta.display_name ?? user.email?.split("@")[0] ?? "Vlastník",
        email: user.email ?? null,
      });
      if (profileErr && profileErr.code !== "23505") {
        console.error("[auth/callback] profile insert failed", profileErr);
        return NextResponse.redirect(
          new URL("/login?error=profile_failed", url.origin),
        );
      }
      isNewOwner = true;
    }
  }

  // Recovery / password-reset flow: caller passes ?next=/settings so the
  // user lands directly on the password change form. New-owner onboarding
  // still takes precedence — they don't yet have a place to update from.
  const destination = isNewOwner ? "/onboarding" : (safeNext ?? "/dashboard");
  return NextResponse.redirect(new URL(destination, url.origin));
}

import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cross-device e-mail verification.
 *
 * Sibling to app/auth/callback/route.ts, which uses the PKCE
 * exchangeCodeForSession flow. PKCE stores a `code_verifier` cookie on the
 * device that *started* the flow, so the callback breaks when the confirmation
 * e-mail is opened on a DIFFERENT device — e.g. a 65+ owner signs up on a PC
 * and then taps the link from their phone. That cohort hits this constantly.
 *
 * This route instead verifies a `token_hash` (verifyOtp), which carries no
 * cookie/device state, so it works no matter where the e-mail is opened. On
 * success it mirrors the callback: it marks the owner's profile
 * email_verified=true via the admin client and redirects to `next`.
 *
 * OPERATOR / DASHBOARD STEP (owner does this, NOT done in code):
 * Point the Supabase "Confirm signup" / "Magic Link" e-mail template at
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 * (Authentication → E-mail Templates). Until that template uses `.TokenHash`
 * instead of the default `.ConfirmationURL` (?code=...), this route is never
 * reached and verification keeps going through the cookie-bound callback.
 */

// Verification types Supabase can deliver via an e-mail link. We allow-list
// these so a crafted `type` can't be smuggled into verifyOtp.
const ALLOWED_TYPES = new Set<EmailOtpType>([
  "email",
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const typeParam = url.searchParams.get("type");

  // Only honour same-origin `next` paths so a crafted link can't redirect a
  // freshly-signed-in user to an external URL. Mirrors the callback route.
  const nextParam = url.searchParams.get("next");
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : null;

  if (!tokenHash || !typeParam || !ALLOWED_TYPES.has(typeParam as EmailOtpType)) {
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", url.origin),
    );
  }
  const type = typeParam as EmailOtpType;

  // SSR client → reads/writes the session cookie onto the response, but does
  // NOT require a pre-existing PKCE code_verifier cookie. This is what makes
  // the flow work across devices.
  const supabase = await createClient();
  const { data: verified, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (error || !verified.user) {
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", url.origin),
    );
  }

  const user = verified.user;
  const meta = (user.user_metadata ?? {}) as { role?: string };

  // Mark the owner's e-mail as verified. Skip senior accounts (provisioned by
  // the owner via the admin path, never via this link). Idempotent and cheap.
  // Unlike the callback we do NOT lazily create the profile row here: by the
  // time a confirmation link exists the owner already signed up, so the row is
  // present — we only flip the flag.
  if (meta.role !== "senior") {
    const admin = createAdminClient();
    const { error: updateErr } = await admin
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", user.id)
      .eq("email_verified", false);
    if (updateErr) {
      console.error("[auth/confirm] email_verified update failed", updateErr);
      return NextResponse.redirect(
        new URL("/login?error=profile_failed", url.origin),
      );
    }
  }

  // Recovery / password-reset links pass ?next=/settings so the user lands on
  // the password form; everything else defaults to the dashboard.
  const destination = safeNext ?? "/dashboard";
  return NextResponse.redirect(new URL(destination, url.origin));
}

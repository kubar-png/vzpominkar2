import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildSeniorEmail } from "@/lib/auth/senior-auth";

export type SeniorMagicResult =
  | { ok: true; seniorId: string }
  | { ok: false; reason: "not_found" | "auth_failed" };

/**
 * Establish a Supabase session for a senior from their stable magic token
 * (no password). We resolve the senior by token, mint a one-shot Supabase
 * magic-link OTP via the admin API, and immediately consume it on the SSR client
 * so the session cookie is written onto the response — the same in-route session
 * pattern as app/auth/callback. The senior's own login password is never touched
 * (the family still uses it at /senior-login).
 *
 * The verify OTP type differs across Supabase versions for admin-generated magic
 * links, so we try `email` then `magiclink`, each with a fresh one-shot token.
 */
export async function signInSeniorByMagicToken(token: string): Promise<SeniorMagicResult> {
  // Tokens are 64 hex chars (32 bytes). Reject obviously malformed input cheaply
  // — no DB hit, no admin call — before doing any work.
  if (!/^[a-f0-9]{32,128}$/.test(token)) return { ok: false, reason: "not_found" };

  const admin = createAdminClient();
  const { data: senior } = await admin
    .from("profiles")
    .select("id")
    .eq("magic_token", token)
    .eq("role", "senior")
    .maybeSingle<{ id: string }>();
  if (!senior) return { ok: false, reason: "not_found" };

  const email = buildSeniorEmail(senior.id);
  const supabase = await createClient();

  for (const type of ["email", "magiclink"] as const) {
    const { data: link, error: genErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const hashed = link?.properties?.hashed_token;
    if (genErr || !hashed) {
      console.error("[senior-magic] generateLink failed", genErr);
      continue;
    }
    const { error: verifyErr } = await supabase.auth.verifyOtp({ token_hash: hashed, type });
    if (!verifyErr) return { ok: true, seniorId: senior.id };
  }

  console.error("[senior-magic] verifyOtp failed for senior", senior.id);
  return { ok: false, reason: "auth_failed" };
}

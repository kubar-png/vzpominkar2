import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildSeniorEmail } from "@/lib/auth/senior-auth";

export type SeniorMagicResult =
  | { ok: true; seniorId: string }
  | { ok: false; reason: "not_found" | "auth_failed" };

/** Shape every magic token must match: 64 hex chars (32 bytes), bounded. */
const MAGIC_TOKEN_RE = /^[a-f0-9]{32,128}$/;

/**
 * Resolve a senior magic token to its senior id WITHOUT consuming it —
 * a read-only lookup that mints nothing and verifies nothing, so the caller's
 * Supabase session is left completely untouched.
 *
 * Used by the /q/{token} route to decide, before any session swap, whether the
 * browser already holds a DIFFERENT user's session (e.g. an owner who pasted the
 * link to test it). Same token guard + service-role lookup as the consuming path,
 * so it reveals exactly as much as `signInSeniorByMagicToken` already does and no
 * more.
 */
export async function resolveSeniorIdByToken(token: string): Promise<string | null> {
  // Reject obviously malformed input cheaply — no DB hit — before any work.
  if (!MAGIC_TOKEN_RE.test(token)) return null;

  const admin = createAdminClient();
  const { data: senior } = await admin
    .from("profiles")
    .select("id")
    .eq("magic_token", token)
    .eq("role", "senior")
    .maybeSingle<{ id: string }>();
  return senior?.id ?? null;
}

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
  // Tokens are 64 hex chars (32 bytes). The lookup also re-applies this guard, so
  // malformed input is rejected cheaply (no DB hit) before any work.
  const seniorId = await resolveSeniorIdByToken(token);
  if (!seniorId) return { ok: false, reason: "not_found" };

  const admin = createAdminClient();
  const email = buildSeniorEmail(seniorId);
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
    if (!verifyErr) return { ok: true, seniorId };
  }

  console.error("[senior-magic] verifyOtp failed for senior", seniorId);
  return { ok: false, reason: "auth_failed" };
}

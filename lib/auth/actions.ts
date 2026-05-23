"use server";

import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ownerSignupSchema,
  ownerLoginSchema,
  seniorLoginSchema,
  seniorAccountSchema,
  type SeniorAccountInput,
} from "@/lib/validations/auth";
import { buildSeniorEmail, normalizeUsername } from "@/lib/auth/senior-auth";
import { requireOwner } from "@/lib/auth/permissions";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";

/**
 * ActionResult - discriminated union returned by Server Actions called from
 * client forms. Lets the form render an error message without throwing.
 * Most successful flows redirect server-side, so they don't return; owner
 * signup is the exception (returns `{ ok: true, checkEmail: true }` so the
 * form can render a "podívejte se do schránky" card without auto-login).
 */
export type ActionResult =
  | { ok: true; checkEmail?: boolean }
  | { ok: false; error: string; field?: string };

/* -------------------------------------------------------------------------- */
/* Owner signup / login / signout                                             */
/* -------------------------------------------------------------------------- */

export async function signUpOwner(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rl = await checkRateLimit("auth", "signup");
  if (!rl.ok) return { ok: false, error: rateLimitMessage(rl.retryAfterSec) };

  const parsed = ownerSignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Neplatné údaje.", field: first?.path[0]?.toString() };
  }

  // Email-confirmed signup: send the user a magic link, no auto-login.
  // The auth.users row is created in unconfirmed state; profile insert is
  // deferred to /auth/callback which fires once the user clicks the link.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vzpominkar.cz";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: { display_name: parsed.data.displayName, role: "owner" },
    },
  });

  if (error) {
    return { ok: false, error: humanizeAuthError(error.message) };
  }

  // Best-effort welcome email — Supabase already sends the confirm link,
  // this is the warm follow-up. Failure is non-fatal.
  try {
    const tpl = welcomeEmail({
      displayName: parsed.data.displayName,
      appUrl,
    });
    await sendEmail({
      to: parsed.data.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tag: "welcome",
    });
  } catch (err) {
    console.error("[signup] welcome email failed (non-fatal):", err);
  }

  return { ok: true, checkEmail: true };
}

export async function signInOwner(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rl = await checkRateLimit("auth", "owner-login");
  if (!rl.ok) return { ok: false, error: rateLimitMessage(rl.retryAfterSec) };

  const parsed = ownerLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Neplatné údaje.", field: first?.path[0]?.toString() };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: humanizeAuthError(error.message) };

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/* -------------------------------------------------------------------------- */
/* Senior login                                                               */
/* -------------------------------------------------------------------------- */

export async function signInSenior(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rl = await checkRateLimit("auth", "senior-login");
  if (!rl.ok) return { ok: false, error: rateLimitMessage(rl.retryAfterSec) };

  const parsed = seniorLoginSchema.safeParse({
    username: normalizeUsername(String(formData.get("username") ?? "")),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Neplatné údaje.", field: first?.path[0]?.toString() };
  }

  // Same generic error regardless of whether the username exists — otherwise
  // anyone could enumerate valid senior usernames by checking the response.
  const GENERIC_ERROR = "Špatné uživatelské jméno nebo heslo.";

  const admin = createAdminClient();
  const { data: profile, error: lookupErr } = await admin
    .from("profiles")
    .select("id, role")
    .eq("username", parsed.data.username)
    .eq("role", "senior")
    .maybeSingle();

  if (lookupErr || !profile) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: buildSeniorEmail(profile.id),
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: GENERIC_ERROR };

  redirect("/home");
}

/* -------------------------------------------------------------------------- */
/* Senior account creation (called by owner during onboarding & later)         */
/* -------------------------------------------------------------------------- */

export interface SeniorAccountResult {
  ok: boolean;
  error?: string;
  /** Returned only on success; show ONCE on screen, then forget. */
  credentials?: { username: string; password: string; displayName: string };
}

export async function createSeniorAccount(
  familyId: string,
  input: SeniorAccountInput,
): Promise<SeniorAccountResult> {
  const owner = await requireOwner();
  if (owner.familyId !== familyId) {
    return { ok: false, error: "Nemáte přístup k této rodině." };
  }

  const parsed = seniorAccountSchema.safeParse({
    displayName: input.displayName.trim(),
    username: normalizeUsername(input.username),
    password: input.password,
    seniorRole: input.seniorRole ?? null,
    contactChannel: input.contactChannel ?? null,
    contactAddress: input.contactAddress?.trim() || null,
    promptFrequency: input.promptFrequency ?? 1,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const admin = createAdminClient();

  // Check uniqueness up front so we surface a friendly error instead of an
  // auth-side 422.
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "Toto uživatelské jméno už je obsazené. Zvolte jiné." };
  }

  // Generate the auth user with a synth email + password. email_confirm:true
  // skips the email loop (no real inbox).
  // We pin the UUID so the synthetic email (senior-{id}@vzpominkar.internal)
  // matches profile.id - signInSenior rebuilds the email from profile.id.
  const pinnedUuid = crypto.randomUUID();
  const synthEmail = buildSeniorEmail(pinnedUuid);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    id: pinnedUuid,
    email: synthEmail,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      display_name: parsed.data.displayName,
      role: "senior",
      family_id: familyId,
    },
  });

  if (createErr || !created.user) {
    return { ok: false, error: "Nepodařilo se vytvořit účet seniora." };
  }

  // Insert the profile row (RLS bypassed via admin client).
  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    role: "senior",
    family_id: familyId,
    display_name: parsed.data.displayName,
    username: parsed.data.username,
    senior_role: parsed.data.seniorRole ?? null,
    contact_channel: parsed.data.contactChannel ?? null,
    contact_address: parsed.data.contactAddress ?? null,
    prompt_frequency: parsed.data.promptFrequency,
  });

  if (profileErr) {
    // Rollback auth user - keep state consistent.
    await admin.auth.admin.deleteUser(created.user.id);
    return {
      ok: false,
      error:
        profileErr.code === "23505"
          ? "Toto uživatelské jméno je již obsazené."
          : "Profil se nepodařilo uložit.",
    };
  }

  return {
    ok: true,
    credentials: {
      username: parsed.data.username,
      password: parsed.data.password,
      displayName: parsed.data.displayName,
    },
  };
}

/* -------------------------------------------------------------------------- */

function humanizeAuthError(message: string): string {
  if (/already registered/i.test(message)) {
    return "Tento e-mail je už zaregistrovaný. Zkuste se přihlásit.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "Špatný e-mail nebo heslo.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Nejprve potvrďte e-mail z přijaté zprávy.";
  }
  return "Něco se nepovedlo. Zkuste to znovu.";
}

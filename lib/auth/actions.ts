"use server";

import "server-only";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { REMEMBER_COOKIE } from "@/lib/supabase/cookies";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ownerSignupSchema,
  ownerLoginSchema,
  seniorLoginSchema,
  seniorAccountSchema,
  channelNeedsAttestation,
  type SeniorAccountInput,
} from "@/lib/validations/auth";
import { buildSeniorEmail, normalizeUsername } from "@/lib/auth/senior-auth";
import { requireOwner, currentUser } from "@/lib/auth/permissions";
import { markGiftPending } from "@/lib/gift/cookie";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail, verifyEmail, passwordResetEmail } from "@/lib/email/templates";
import { markBookPaid } from "@/lib/books/server";
import {
  checkRateLimit,
  checkSeniorUsernameLimit,
  checkAuthAccountLimit,
  rateLimitMessage,
} from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";

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

  // Gift flow marker (from /darovat → /signup?gift=1). Carried as a short-lived
  // cookie through onboarding so /onboarding/platba renders the voucher
  // configurator and the buyer can hand over a printable poukaz after paying.
  const isGift = formData.get("gift") === "1";
  // Tester run (from /testovani → /signup?test=1): skip onboarding + payment,
  // provision free access, and bounce back to the testing checklist.
  const isTest = formData.get("test") === "1";

  // Deferred email verification: with Supabase "Confirm email" OFF, signUp
  // returns a live session, so the owner is logged in right away and skips the
  // inbox wall. We verify their email LATER (gated at the paywall).
  const appUrl = SITE_URL;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Used only if email confirmation is ever re-enabled in Supabase.
      emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
      data: { display_name: parsed.data.displayName, role: "owner" },
    },
  });

  if (error) {
    return { ok: false, error: humanizeAuthError(error.message) };
  }

  // Session present = confirmation is OFF and the owner is signed in. Create
  // their profile now (the /auth/callback lazy path no longer fires for
  // signup) and email a verification link they can click any time before the
  // paywall. The click lands on /auth/callback, which flips email_verified.
  if (data.session && data.user) {
    const admin = createAdminClient();
    const { error: profileErr } = await admin.from("profiles").insert({
      id: data.user.id,
      role: "owner",
      display_name: parsed.data.displayName,
      email: parsed.data.email,
      email_verified: false,
      is_tester: isTest,
    });
    if (profileErr && profileErr.code !== "23505") {
      console.error("[signup] profile insert failed:", profileErr);
      return { ok: false, error: "Účet se nepodařilo dokončit. Zkuste to prosím znovu." };
    }

    if (isGift) await markGiftPending();

    await sendOwnerVerificationEmail(parsed.data.email, appUrl, parsed.data.displayName);

    if (isTest) {
      // Testers don't pay and don't go through onboarding: provision a free,
      // active family + collecting book so the dashboard + storyteller flow work
      // immediately, then return them to the testing checklist.
      await provisionTesterFamily(admin, data.user.id);
      redirect("/testovani");
    }

    redirect("/onboarding");
  }

  // Fallback (confirmation re-enabled in Supabase → no session): keep the old
  // "check your inbox" flow + a warm welcome email.
  try {
    const tpl = welcomeEmail({ displayName: parsed.data.displayName, appUrl });
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

/**
 * Sends the owner a "verify your email" link via Supabase magic-link OTP.
 * Best-effort — a failure here must never block signup, since the owner can
 * resend from the in-app banner. Clicking the link hits /auth/callback, which
 * sets profiles.email_verified = true.
 */
async function sendOwnerVerificationEmail(
  email: string,
  appUrl: string,
  displayName?: string,
): Promise<void> {
  try {
    // Generate the verify link ourselves (admin API) and send it via Resend —
    // our own transport (verified vzpominkar.com), not Supabase's auth mailer.
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const hashed = data?.properties?.hashed_token;
    if (error || !hashed) {
      console.error("[signup] verification link gen failed (non-fatal):", error);
      return;
    }
    // token_hash → our cross-device /auth/confirm route (no PKCE cookie, no
    // Supabase redirect-allow-list dependency).
    const verifyUrl = `${appUrl}/auth/confirm?token_hash=${hashed}&type=email&next=/onboarding`;
    const tpl = verifyEmail({ displayName, verifyUrl });
    await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tag: "verify_email",
    });
  } catch (err) {
    console.error("[signup] verification email failed (non-fatal):", err);
  }
}

/**
 * Provision a free, immediately-usable family for a tester (from /testovani):
 * creates the family + first collecting book and grants lifetime access, so the
 * owner lands on a working dashboard (with the guide) and can add a storyteller
 * without going through onboarding or paying. Best-effort — never blocks signup.
 */
async function provisionTesterFamily(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string,
): Promise<void> {
  // Placeholder until the tester names the real storyteller on the dashboard.
  const placeholder = "Váš blízký";
  try {
    const { data: family, error: famErr } = await admin
      .from("families")
      .insert({ name: "Moje vzpomínky", senior_display_name: placeholder, created_by: ownerId })
      .select("id")
      .single<{ id: string }>();
    if (famErr || !family) {
      console.error("[tester provision] family insert failed:", famErr);
      return;
    }
    await admin.from("profiles").update({ family_id: family.id }).eq("id", ownerId);

    const { data: book, error: bookErr } = await admin
      .from("books")
      .insert({ family_id: family.id, senior_display_name: placeholder, sequence_no: 1, title: "Díl 1" })
      .select("id")
      .single<{ id: string }>();

    // Never fall through to mark the family active without a collecting book: a
    // bookless active family bricks every senior answer later (currentBookForSenior
    // returns null → /home shows no question and saveAudio/TextMemory throw
    // 'Tato kniha zatím není aktivní'). Throw so the outer best-effort guard logs
    // it — signup itself still doesn't hard-crash.
    if (bookErr || !book) {
      throw new Error(
        `[tester provision] book insert failed: ${bookErr?.message ?? "no row returned"}`,
      );
    }

    // Grants free lifetime access AND marks the book collecting so the senior
    // can answer straight away — no paywall for testers.
    await markBookPaid(admin, {
      bookId: book.id,
      familyId: family.id,
      actorId: ownerId,
      amountCzk: 0,
    });
  } catch (err) {
    console.error("[tester provision] failed:", err);
  }
}

/**
 * Resends the owner's email-verification link — called from the in-app
 * "Ověřte svůj e-mail" banner. No-ops (returns ok) if already verified.
 */
export async function resendEmailVerification(): Promise<ActionResult> {
  const rl = await checkRateLimit("auth", "email-verify-resend");
  if (!rl.ok) return { ok: false, error: rateLimitMessage(rl.retryAfterSec) };

  const user = await currentUser();
  if (!user || user.role !== "owner") return { ok: false, error: "Nejste přihlášeni." };
  if (user.emailVerified) return { ok: true };
  if (!user.email) return { ok: false, error: "U účtu chybí e-mailová adresa." };

  const appUrl = SITE_URL;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  });
  const hashed = data?.properties?.hashed_token;
  if (error || !hashed) {
    if (error && /rate|second|limit|too many/i.test(error.message)) {
      return { ok: false, error: "Odkaz jsme právě poslali. Zkuste to za chvíli znovu." };
    }
    console.error("[resendEmailVerification]", error);
    return { ok: false, error: "E-mail se nepodařilo odeslat. Zkuste to za chvíli." };
  }
  const verifyUrl = `${appUrl}/auth/confirm?token_hash=${hashed}&type=email&next=/onboarding`;
  const tpl = verifyEmail({ verifyUrl });
  await sendEmail({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tag: "verify_email",
  });
  return { ok: true };
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

  // Per-account ceiling (keyed on e-mail) so a rotating-IP attacker can't hammer
  // one known account past the per-IP limit.
  const accountRl = await checkAuthAccountLimit(parsed.data.email);
  if (!accountRl.ok) return { ok: false, error: rateLimitMessage(accountRl.retryAfterSec) };

  // "Zůstat přihlášen" checkbox — present only when checked (default in the UI).
  const remember = formData.get("remember") !== null;

  const supabase = await createClient({ remember });
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: humanizeAuthError(error.message) };

  // Persist the preference so middleware refreshes use the same lifetime. When
  // not remembering, the flag itself is a session cookie too (fresh start next time).
  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_COOKIE, remember ? "1" : "0", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 60 } : {}),
  });

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Sends a Supabase password-reset email. The link in the email points at
 * /auth/callback?next=/settings — that route already exchanges the code
 * for a session, after which the user is signed in and can change their
 * password via the existing settings form.
 *
 * Returns `{ ok: true }` regardless of whether the email exists so we
 * don't leak account presence. Supabase silently no-ops on unknown emails.
 */
export async function requestPasswordReset(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rl = await checkRateLimit("auth", "password-reset");
  if (!rl.ok) return { ok: false, error: rateLimitMessage(rl.retryAfterSec) };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Zadejte platný e-mail.", field: "email" };
  }

  // Per-account ceiling (keyed on e-mail) — caps reset-mail spam to one address
  // even from rotating IPs. Generic message; doesn't leak account presence.
  const accountRl = await checkAuthAccountLimit(email);
  if (!accountRl.ok) return { ok: false, error: rateLimitMessage(accountRl.retryAfterSec) };

  const appUrl = SITE_URL;
  try {
    // Generate the recovery link via the admin API and deliver it via Resend
    // (our transport), not Supabase's auth mailer.
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    const hashed = data?.properties?.hashed_token;
    if (!error && hashed) {
      const resetUrl = `${appUrl}/auth/confirm?token_hash=${hashed}&type=recovery&next=/settings`;
      const tpl = passwordResetEmail({ resetUrl });
      await sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tag: "password_reset",
      });
    } else if (error && !/not found|no user|user.*exist/i.test(error.message)) {
      // Unknown e-mail → generateLink errors "User not found"; swallow it so we
      // never leak whether the account exists. Log only genuine failures.
      console.error("[requestPasswordReset] generateLink failed:", error.message);
    }
  } catch (err) {
    console.error("[requestPasswordReset] non-fatal:", err);
  }

  // Always report success — never leak whether the account exists.
  return { ok: true };
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

  // Per-username throttle (on top of the per-IP limiter above): blocks a
  // rotating-IP brute force against one known senior account.
  const userRl = await checkSeniorUsernameLimit(parsed.data.username);
  if (!userRl.ok) return { ok: false, error: rateLimitMessage(userRl.retryAfterSec) };

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
    gender: input.gender ?? null,
    birthYear: input.birthYear,
    contactChannel: input.contactChannel ?? null,
    contactAddress: input.contactAddress?.trim() || null,
    phoneE164: input.phoneE164?.trim() || null,
    channelAttestation: input.channelAttestation ?? false,
    channelAttestationText: input.channelAttestationText?.trim() || null,
    promptFrequency: input.promptFrequency ?? 1,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  // SMS/WhatsApp require a phone + the owner attestation (the client blocks this
  // too, but never trust the client). Lawful basis = GDPR Art. 6(1)(f); the
  // owner makes a truthful attestation, NOT consent on the senior's behalf.
  // Mirrors §7.
  const attestationChannel = channelNeedsAttestation(parsed.data.contactChannel)
    ? parsed.data.contactChannel
    : null;
  if (attestationChannel) {
    if (!parsed.data.phoneE164) {
      return { ok: false, error: "Pro SMS i WhatsApp je potřeba platné telefonní číslo." };
    }
    if (!parsed.data.channelAttestation || !parsed.data.channelAttestationText) {
      return {
        ok: false,
        error: "Bez potvrzení nelze otázky posílat přes SMS ani WhatsApp.",
      };
    }
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

  // Insert the profile row (RLS bypassed via admin client). Phone + attestation
  // are written atomically with the channel: phone_e164 + channel_attestation_text
  // + the matching {sms|whatsapp}_attested_at = now() only when that channel is
  // chosen with a fresh attestation; otherwise they stay null (no stale
  // attestation). corr-03: a fresh attestation also clears that channel's
  // *_opt_out_at so the new number isn't masked by a prior opt-out.
  const now = new Date().toISOString();
  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    role: "senior",
    family_id: familyId,
    display_name: parsed.data.displayName,
    username: parsed.data.username,
    // Set the no-password /q/{token} magic link token explicitly instead of
    // relying on the DB column DEFAULT (encode(gen_random_bytes(32),'hex')) —
    // the column is nullable, so a missing default would silently create a
    // senior with magic_token=NULL and break the answer link. Same shape as
    // the default. Mirrors lib/gift/voucher.ts.
    magic_token: randomBytes(32).toString("hex"),
    senior_role: parsed.data.seniorRole ?? null,
    gender: parsed.data.gender ?? null,
    birth_year: parsed.data.birthYear ?? null,
    contact_channel: parsed.data.contactChannel ?? null,
    contact_address: parsed.data.contactAddress ?? null,
    phone_e164: attestationChannel ? parsed.data.phoneE164 : null,
    channel_attestation_text: attestationChannel ? parsed.data.channelAttestationText : null,
    sms_attested_at: attestationChannel === "sms" ? now : null,
    whatsapp_attested_at: attestationChannel === "whatsapp" ? now : null,
    sms_opt_out_at: attestationChannel === "sms" ? null : undefined,
    whatsapp_opt_out_at: attestationChannel === "whatsapp" ? null : undefined,
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

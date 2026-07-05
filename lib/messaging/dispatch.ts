import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import type {
  Channel,
  DeliveryRecipient,
  DispatchResult,
  RenderedMessage,
} from "@/lib/messaging/types";
import { getProvider } from "@/lib/messaging/index";
import {
  firstName,
  renderEmail,
  renderSms,
  renderWhatsApp,
  type RenderContext,
} from "@/lib/messaging/render";
import { resolveGender } from "@/lib/gender";
import { SITE_URL } from "@/lib/site";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * dispatchPrompt — the single delivery seam the weekly-reminder cron calls per
 * assignment, replacing the old hard-coded sendEmail block.
 *
 * See docs/superpowers/specs/2026-06-05-multichannel-question-delivery-design.md §4.2 + §8.
 *
 * Flow:
 *   a. Resolve channel + address from the senior profile (contact_channel,
 *      default "email"). SMS/WhatsApp require phone_e164 AND the matching
 *      *_attested_at set AND *_opt_out_at NULL AND a LIVE provider for that
 *      channel (getProvider(channel).isLive) — otherwise fall back to email
 *      exactly as today. The liveness check (review corr-01) is what stops a
 *      noop provider from returning a synthetic id that records status='sent'
 *      and stamps reminded_at in production, silently losing the question. No
 *      usable address → owner-fallback email; none → skipped.
 *   b. Idempotency: look up prompt_delivery_log for (assignment, channel). A row
 *      already 'sent' → skipped. Otherwise upsert a 'pending' row (the unique
 *      (prompt_assignment_id, channel) key makes this safe to repeat).
 *   c. Render for the channel and getProvider(channel).send(...).
 *   d. Success → row status='sent' (+ provider_message_id/segments/price/sent_at),
 *      return 'sent'. Throw → row status='failed' (+ truncated last_error),
 *      return 'failed' so the cron keeps going and leaves reminded_at NULL for a
 *      retry next run (the 'failed' row is reused, never duplicated).
 */

/** The shape of a senior profile row dispatchPrompt needs. */
export interface DispatchSenior {
  display_name: string | null;
  email: string | null;
  contact_channel: string | null;
  contact_address: string | null;
  magic_token: string | null;
  phone_e164: string | null;
  sms_attested_at: string | null;
  whatsapp_attested_at: string | null;
  sms_opt_out_at: string | null;
  whatsapp_opt_out_at: string | null;
}

/** The owner fields dispatchPrompt needs (BCC + owner-fallback notify). */
export interface DispatchOwner {
  email: string | null;
  display_name: string | null;
}

export interface DispatchContext {
  assignmentId: string;
  familyId: string;
  senior: DispatchSenior | null;
  owner: DispatchOwner | null;
  /** Already gender-resolved + tykání question text. Rendered verbatim. */
  question: string;
  appUrl: string;
}

/** last_error column is text; keep it bounded and never carry a secret upstream. */
const MAX_ERROR_LEN = 500;

function truncateError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.length > MAX_ERROR_LEN ? msg.slice(0, MAX_ERROR_LEN) : msg;
}

/**
 * Outcome of the idempotency upsert head:
 *   - "skipped"  → a 'sent' row already exists on this (assignment, channel); do
 *                  nothing more.
 *   - "ready"    → we hold a pending log row id; proceed to render + send.
 *   - "failed"   → could not obtain a usable log row (an insert error with no
 *                  recoverable racing row); surface as a failed dispatch.
 */
type UpsertOutcome =
  | { kind: "skipped" }
  | { kind: "ready"; logId: string }
  | { kind: "failed"; error: string };

/**
 * upsertPendingLog — the ONE idempotency-gate head, shared by dispatchPrompt and
 * dispatchOwnerFallback (cq-01: previously this ~50-line block was duplicated
 * verbatim across both paths, so a fix to one silently diverged the other — and
 * the owner-fallback copy is the least-tested branch). The send/confirm TAIL was
 * already DRYed into sendAndConfirm; this completes the symmetry.
 *
 * Behaviour (idempotent + concurrent-insert safe via unique(assignment, channel)):
 *   1. Look up the existing (assignment, channel) row. status==='sent' → skipped.
 *   2. No row → INSERT a 'pending' row. A unique-violation race means a concurrent
 *      run already inserted: re-fetch and reuse it (its status may now be 'sent' →
 *      skipped). If we still can't find a row id → failed.
 *   3. An existing non-sent (pending/failed/skipped) row → reset it to 'pending',
 *      refresh recipient_address, clear last_error, and reuse its id.
 */
async function upsertPendingLog(
  admin: Admin,
  assignmentId: string,
  familyId: string,
  channel: Channel,
  recipientAddress: string,
  /** Prefix for the pending-reset console.error so each call site is identifiable. */
  resetLogLabel: string,
): Promise<UpsertOutcome> {
  const { data: existing } = await admin
    .from("prompt_delivery_log")
    .select("id, status")
    .eq("prompt_assignment_id", assignmentId)
    .eq("channel", channel)
    .maybeSingle<{ id: string; status: string }>();

  if (existing?.status === "sent") {
    return { kind: "skipped" };
  }

  let logId = existing?.id ?? null;
  if (!logId) {
    // Insert the pending row. unique(prompt_assignment_id, channel) protects us
    // from a concurrent insert; if that races we re-fetch and reuse the row.
    const { data: inserted, error: insertErr } = await admin
      .from("prompt_delivery_log")
      .insert({
        prompt_assignment_id: assignmentId,
        family_id: familyId,
        channel,
        recipient_address: recipientAddress,
        provider: channel,
        status: "pending",
      })
      .select("id")
      .maybeSingle<{ id: string }>();
    if (insertErr || !inserted) {
      // A unique-violation race means a row now exists — fetch and reuse it.
      const { data: raced } = await admin
        .from("prompt_delivery_log")
        .select("id, status")
        .eq("prompt_assignment_id", assignmentId)
        .eq("channel", channel)
        .maybeSingle<{ id: string; status: string }>();
      if (raced?.status === "sent") {
        return { kind: "skipped" };
      }
      logId = raced?.id ?? null;
      if (!logId) {
        return {
          kind: "failed",
          error: truncateError(insertErr ?? "failed to upsert prompt_delivery_log"),
        };
      }
    } else {
      logId = inserted.id;
    }
  } else {
    // Reuse a prior non-sent (pending/failed/skipped) row: clear stale state and
    // refresh the recipient before re-attempting.
    const { error: resetErr } = await admin
      .from("prompt_delivery_log")
      .update({ status: "pending", recipient_address: recipientAddress, last_error: null })
      .eq("id", logId);
    if (resetErr) {
      console.error(
        `[dispatch] ${resetLogLabel} pending-reset update errored (assignment=${assignmentId} log=${logId})`,
        resetErr,
      );
    }
  }

  return { kind: "ready", logId };
}

/**
 * sendAndConfirm — the ONE send/confirm seam, shared by dispatchPrompt and
 * dispatchOwnerFallback so the irreversible-send asymmetry is fixed identically
 * in both (they previously duplicated this logic).
 *
 * The hazard: provider.send() is IRREVERSIBLE (a real SMS goes out / credit is
 * spent). Marking the row 'failed' AFTER send() returned would make the cron leave
 * reminded_at NULL and RE-SEND a real message next run. And supabase-js never
 * throws on a DB error — it resolves { data, error } — so a silent confirm failure
 * must be checked explicitly.
 *
 * Semantics (DO NOT change without re-reading FIX 5):
 *   - send() THROWS (message NOT out) → mark the row 'failed' (checking the
 *     update's { error }) and return 'failed'. Safe to retry next run.
 *   - send() RETURNS (message IS out) → write the confirm update; on { error } or
 *     throw, retry the confirm up to 3 attempts. If it STILL fails, DO NOT mark
 *     'failed' — console.error loudly and STILL return 'sent', so the cron stamps
 *     reminded_at and the row is never re-selected/re-sent. A stuck-but-sent log
 *     row is acceptable; a resend to an elderly recipient is NOT.
 *
 * KNOWN low-risk gap (accepted, not fixed): the 'sent' idempotency read and this
 * send are not atomic, so two overlapping cron runs could double-send. We
 * deliberately do NOT add a 'sending'-state atomic claim — it would introduce
 * stuck-state recovery complexity for a once-a-week cron. The only realistic
 * overlap is a manual re-trigger during a slow run; the weekly cadence makes this
 * acceptable.
 */
type SendResultOf = Awaited<ReturnType<ReturnType<typeof getProvider>["send"]>>;

async function sendAndConfirm(
  admin: Admin,
  logId: string,
  assignmentId: string,
  recipient: DeliveryRecipient,
  rendered: RenderedMessage,
  /** Builds the extra confirm columns from the provider result (e.g. segments/price). */
  confirmExtra: (result: SendResultOf) => Record<string, unknown>,
): Promise<DispatchResult> {
  const channel = recipient.channel;

  // ── Wrap ONLY the irreversible provider.send() in try/catch ─────────────────
  let result: SendResultOf;
  try {
    result = await getProvider(channel).send(recipient, rendered);
  } catch (err) {
    // Message is NOT out → safe to mark failed + retry next run.
    const { error: updErr } = await admin
      .from("prompt_delivery_log")
      .update({ status: "failed", last_error: truncateError(err) })
      .eq("id", logId);
    if (updErr) {
      console.error(
        `[dispatch] failed-mark update errored (assignment=${assignmentId} log=${logId})`,
        updErr,
      );
    }
    return { status: "failed", channel, error: truncateError(err) };
  }

  // ── Message IS out. The confirm write MUST NOT be able to cause a resend. ────
  const confirmPayload = {
    status: "sent",
    provider_message_id: result.providerMessageId,
    sent_at: new Date().toISOString(),
    last_error: null,
    ...confirmExtra(result),
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { error: confirmErr } = await admin
        .from("prompt_delivery_log")
        .update(confirmPayload)
        .eq("id", logId);
      if (!confirmErr) {
        return { status: "sent", channel };
      }
      if (attempt === 3) {
        // Out of retries. The SMS/email already went out — DO NOT mark failed
        // (that would resend). Leave the row stuck-but-sent and report 'sent'.
        console.error(
          `[dispatch] CONFIRM FAILED after send (assignment=${assignmentId} log=${logId} providerMessageId=${result.providerMessageId}) — row left un-updated; reporting sent to PREVENT a resend`,
          confirmErr,
        );
      }
    } catch (confirmThrow) {
      if (attempt === 3) {
        console.error(
          `[dispatch] CONFIRM THREW after send (assignment=${assignmentId} log=${logId} providerMessageId=${result.providerMessageId}) — row left un-updated; reporting sent to PREVENT a resend`,
          confirmThrow,
        );
      }
    }
  }

  // Always 'sent' once the provider returned: the cron stamps reminded_at and the
  // row is never re-selected → never re-sent. (Stuck-but-sent is acceptable.)
  return { status: "sent", channel };
}

/**
 * Decide the channel + outbound address for this senior.
 *
 * - sms/whatsapp are only honored when ALL of these hold; otherwise we fall back
 *   to email:
 *     1. phone_e164 is present, AND
 *     2. the owner has ATTESTED for that channel (*_attested_at set), AND
 *     3. the senior is not opted out (*_opt_out_at NULL), AND
 *     4. the channel's provider is LIVE (getProvider(channel).isLive) — review
 *        corr-01 (P0). Without this, an owner who selects SMS/WhatsApp before the
 *        provider credentials exist would hit the NOOP provider, which returns a
 *        synthetic id; dispatch would record status='sent', the cron would stamp
 *        reminded_at, and the senior's weekly question would be silently and
 *        permanently lost. Falling back to email keeps the question reaching them.
 * - email address priority mirrors the cron's prior behaviour:
 *     1. contact_address when channel === "email" (owner-configured real address)
 *     2. senior.email when it's a real inbox (not @vzpominkar.internal)
 * - When there is no usable senior address at all, returns { channel: "email",
 *   address: null } so the caller can route the owner-fallback notification.
 */
function resolveDelivery(senior: DispatchSenior | null): {
  channel: Channel;
  address: string | null;
} {
  const requested = senior?.contact_channel ?? "email";

  if ((requested === "sms" || requested === "whatsapp") && senior?.phone_e164) {
    const attestedAt =
      requested === "sms" ? senior.sms_attested_at : senior.whatsapp_attested_at;
    const optedOut =
      requested === "sms" ? senior.sms_opt_out_at : senior.whatsapp_opt_out_at;
    // corr-01: only route to a real channel when its provider is LIVE. A noop
    // provider (creds unset, e.g. before SMS/WhatsApp launch) is NOT live, so we
    // fall through to email rather than let a synthetic 'sent' lose the question.
    if (attestedAt && !optedOut && getProvider(requested).isLive) {
      return { channel: requested, address: senior.phone_e164 };
    }
    // Attestation missing / opted out / provider not live → fall through to email.
  }

  // Email (explicit default + fallback for an unusable phone channel).
  const emailAddress =
    senior?.contact_channel === "email" && senior?.contact_address
      ? senior.contact_address
      : senior?.email && !senior.email.endsWith("@vzpominkar.internal")
        ? senior.email
        : null;

  return { channel: "email", address: emailAddress };
}

export async function dispatchPrompt(
  admin: Admin,
  ctx: DispatchContext,
): Promise<DispatchResult> {
  const { senior, owner } = ctx;
  const ownerEmail = owner?.email ?? null;

  const seniorName = senior?.display_name ?? "Vzpomínkář";
  const ownerName = firstName(owner?.display_name);

  // ── (a) Resolve channel + address ──────────────────────────────────────────
  const { channel, address } = resolveDelivery(senior);

  // No usable senior address → owner-fallback notification (email channel),
  // preserving today's behaviour: the owner is told to prompt verbally, with a
  // generic /senior-login link (never the senior's personal magic link).
  if (!address) {
    if (!ownerEmail) {
      return { status: "skipped", channel };
    }
    return dispatchOwnerFallback(admin, ctx, ownerEmail, seniorName, ownerName);
  }

  // ── (b) Idempotency gate (shared head — see upsertPendingLog) ────────────────
  const gate = await upsertPendingLog(
    admin,
    ctx.assignmentId,
    ctx.familyId,
    channel,
    address,
    "",
  );
  if (gate.kind === "skipped") return { status: "skipped", channel };
  if (gate.kind === "failed") return { status: "failed", channel, error: gate.error };
  const logId = gate.logId;

  // ── (c) Render for the channel + send ───────────────────────────────────────
  const actionUrl = senior?.magic_token
    ? `${ctx.appUrl}/q/${senior.magic_token}`
    : `${ctx.appUrl}/senior-login`;

  // Art. 14 just-in-time notice + one-tap opt-out. SMS/WhatsApp are sent on the
  // legitimate-interest basis to a senior the owner added, so each message must
  // carry a link to who-we-are / why / how-to-stop. The exact URL contract (the
  // opt-out route looks the senior up by profiles.magic_token + validates the
  // kanal param):
  //   ${appUrl}/odhlasit/${magic_token}?kanal=sms|whatsapp
  // Only meaningful for sms/whatsapp (they require magic_token to route at all);
  // email keeps its own footer/unsubscribe and ignores this field.
  const optOutUrl =
    (channel === "sms" || channel === "whatsapp") && senior?.magic_token
      ? `${ctx.appUrl}/odhlasit/${senior.magic_token}?kanal=${channel}`
      : undefined;

  const renderCtx: RenderContext = {
    ownerFirstName: ownerName,
    question: ctx.question,
    actionUrl,
    seniorDisplayName: seniorName,
    optOutUrl,
  };

  let rendered: RenderedMessage;
  if (channel === "sms") rendered = renderSms(renderCtx);
  else if (channel === "whatsapp") rendered = renderWhatsApp(renderCtx);
  else rendered = renderEmail(renderCtx);

  const recipient: DeliveryRecipient = {
    channel,
    address,
    // Owner BCC is email-only; SMS/WhatsApp providers ignore it.
    ownerBcc: channel === "email" ? ownerEmail : null,
  };

  // ── (d) Send + confirm via the shared seam (irreversible-send safe). credit
  // (smsbrana balance) is NOT a log column; it flows up via the provider for the
  // low-credit alert path elsewhere. The confirm carries segments + price.
  return sendAndConfirm(admin, logId, ctx.assignmentId, recipient, rendered, (result) => ({
    segments: result.segments ?? null,
    price: result.price ?? null,
  }));
}

/**
 * Owner-fallback notification — the senior has no usable address, so notify the
 * owner (today's behaviour) routed through the same email channel + delivery log
 * for idempotency and a uniform 'sent'/'failed' result. Uses the generic
 * /senior-login link, never the senior's personal magic link.
 */
async function dispatchOwnerFallback(
  admin: Admin,
  ctx: DispatchContext,
  ownerEmail: string,
  seniorName: string,
  ownerName: string,
): Promise<DispatchResult> {
  const channel: Channel = "email";

  // Shared idempotency-gate head (see upsertPendingLog / cq-01).
  const gate = await upsertPendingLog(
    admin,
    ctx.assignmentId,
    ctx.familyId,
    channel,
    ownerEmail,
    "owner-fallback",
  );
  if (gate.kind === "skipped") return { status: "skipped", channel };
  if (gate.kind === "failed") return { status: "failed", channel, error: gate.error };
  const logId = gate.logId;

  // Owner copy: generic /senior-login link (no personal magic token).
  const rendered = renderEmail({
    ownerFirstName: ownerName,
    question: ctx.question,
    actionUrl: `${ctx.appUrl}/senior-login`,
    seniorDisplayName: seniorName,
  });
  // Owner-fallback subject mirrors the prior cron copy.
  rendered.subject = `Připomínka pro ${seniorName}`;
  rendered.tag = "weekly_reminder_owner_fallback";

  const recipient: DeliveryRecipient = {
    channel,
    address: ownerEmail,
    ownerBcc: null,
  };

  // Same irreversible-send-safe seam as dispatchPrompt. Email has no
  // segments/price columns to carry, so confirmExtra is empty.
  return sendAndConfirm(admin, logId, ctx.assignmentId, recipient, rendered, () => ({}));
}

/**
 * Deliver already-created assignments RIGHT NOW (the "Poslat hned" path), rather
 * than waiting for the weekly cron. Mirrors the cron's per-row logic: resolve
 * gender, dispatchPrompt (channel resolution + idempotent send), and stamp
 * reminded_at on an accepted send. Best-effort + isolated per row; never throws.
 */
export async function dispatchAssignmentsNow(
  admin: Admin,
  assignmentIds: string[],
): Promise<{
  sent: number;
  skipped: number;
  failed: number;
  /** Of the sent, how many actually reached the SENIOR (real senior channel). */
  reachedSenior: number;
  /** Of the sent, how many were an owner-fallback notify (senior had no usable address). */
  ownerFallback: number;
}> {
  const out = { sent: 0, skipped: 0, failed: 0, reachedSenior: 0, ownerFallback: 0 };
  if (assignmentIds.length === 0) return out;

  const { data: assignments } = await admin
    .from("prompt_assignments")
    .select("id, family_id, senior_id, prompt_id, reminded_at")
    .in("id", assignmentIds);
  if (!assignments?.length) return out;

  const promptIds = [...new Set(assignments.map((a) => a.prompt_id).filter(Boolean) as string[])];
  const seniorIds = [...new Set(assignments.map((a) => a.senior_id).filter(Boolean) as string[])];
  const familyIds = [...new Set(assignments.map((a) => a.family_id))];

  const [{ data: prompts }, { data: seniors }, { data: owners }] = await Promise.all([
    admin.from("prompts").select("id, question").in("id", promptIds),
    admin
      .from("profiles")
      .select(
        "id, display_name, gender, email, contact_channel, contact_address, magic_token, phone_e164, sms_attested_at, whatsapp_attested_at, sms_opt_out_at, whatsapp_opt_out_at",
      )
      .in("id", seniorIds.length ? seniorIds : ["00000000-0000-0000-0000-000000000000"]),
    admin
      .from("profiles")
      .select("family_id, email, display_name")
      .in("family_id", familyIds)
      .eq("role", "owner"),
  ]);

  const questionById = new Map((prompts ?? []).map((p) => [p.id, p.question as string]));
  const seniorById = new Map((seniors ?? []).map((s) => [s.id, s]));
  const ownerByFamily = new Map((owners ?? []).map((o) => [o.family_id, o]));

  for (const a of assignments) {
    if (a.reminded_at) { out.skipped++; continue; }
    const rawQ = a.prompt_id ? questionById.get(a.prompt_id) : undefined;
    if (!rawQ) { out.skipped++; continue; }
    const senior = a.senior_id ? seniorById.get(a.senior_id) ?? null : null;
    const owner = ownerByFamily.get(a.family_id) ?? null;
    const question = resolveGender(rawQ, (senior?.gender as "male" | "female" | null) ?? null);

    const dispatchSenior: DispatchSenior | null = senior
      ? {
          display_name: senior.display_name,
          email: senior.email,
          contact_channel: senior.contact_channel,
          contact_address: senior.contact_address,
          magic_token: senior.magic_token,
          phone_e164: senior.phone_e164,
          sms_attested_at: senior.sms_attested_at,
          whatsapp_attested_at: senior.whatsapp_attested_at,
          sms_opt_out_at: senior.sms_opt_out_at,
          whatsapp_opt_out_at: senior.whatsapp_opt_out_at,
        }
      : null;
    // Does this actually reach the SENIOR (a usable senior address), or will it
    // fall back to an owner-notify email / be skipped? Drives honest "sent" copy.
    const willReachSenior = resolveDelivery(dispatchSenior).address != null;

    let status: "sent" | "skipped" | "failed" = "failed";
    try {
      const res = await dispatchPrompt(admin, {
        assignmentId: a.id,
        familyId: a.family_id,
        senior: dispatchSenior,
        owner: owner ? { email: owner.email, display_name: owner.display_name } : null,
        question,
        appUrl: SITE_URL,
      });
      status = res.status;
    } catch (err) {
      console.error("[dispatchAssignmentsNow] threw for assignment", a.id, err);
      status = "failed";
    }

    if (status === "sent") {
      const { error: stampErr } = await admin
        .from("prompt_assignments")
        .update({ reminded_at: new Date().toISOString() })
        .eq("id", a.id);
      if (stampErr) console.error("[dispatchAssignmentsNow] reminded_at stamp failed", a.id, stampErr);
      out.sent++;
      if (willReachSenior) out.reachedSenior++;
      else out.ownerFallback++;
    } else if (status === "skipped") {
      out.skipped++;
    } else {
      out.failed++;
    }
  }
  return out;
}

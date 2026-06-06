import "server-only";
import type { RenderedMessage } from "@/lib/messaging/types";
import { weeklyReminderEmail } from "@/lib/email/templates";

/**
 * Per-channel message renderers for the weekly question delivery.
 *
 * Each renderer turns the same delivery context into a channel-shaped
 * RenderedMessage (see lib/messaging/types.ts). The *wrapper* copy is platform
 * voice → vykání ("má pro vás novou otázku"); the embedded {question} is ALREADY
 * gender-resolved + tykání by the caller (resolveGender in the cron) — renderers
 * must NOT alter it. See:
 *   docs/superpowers/specs/2026-06-05-multichannel-question-delivery-design.md §5
 *   memory: address-tykani-rule, recipient-gender-feature
 *
 * The wrapper is deliberately gender-NEUTRAL ("má pro vás novou otázku", not
 * "se vás zeptal/a") so we never need the owner's gender.
 */

/** Context every channel renderer consumes. */
export interface RenderContext {
  /** Owner display name (full); rendered as first-name only in the body. */
  ownerFirstName: string;
  /** The question — already gender-resolved + tykání. Rendered verbatim. */
  question: string;
  /** The senior's magic link (`${appUrl}/q/${magic_token}`) or fallback URL. */
  actionUrl: string;
  /** Senior display name (used by the email template greeting). */
  seniorDisplayName: string;
  /**
   * Art. 14 just-in-time notice + one-tap opt-out URL, appended to the SMS /
   * WhatsApp body (`${appUrl}/odhlasit/${magic_token}?kanal=sms|whatsapp`). SMS/
   * WhatsApp are sent on the legitimate-interest basis to a senior the owner
   * added, so each message must point to who-we-are / why / how-to-stop. The
   * dispatch stage builds this; it is undefined for email (which keeps its own
   * footer/unsubscribe) and for any channel without a magic_token.
   */
  optOutUrl?: string;
}

/**
 * Pull the first token of a display name. The senior knows the owner by their
 * first name; it's warmer than the full name. Falls back to the input when it's
 * a single token or empty. Pure helper — exported for the dispatch/integrate
 * stage to derive `ownerFirstName` before calling a renderer.
 */
export function firstName(displayName: string | null | undefined): string {
  const trimmed = (displayName ?? "").trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

// ─── SMS ─────────────────────────────────────────────────────────────────────

/** GSM 7-bit default + extension charset. A char outside this forces UCS-2. */
const GSM7_CHARS = new Set(
  // Default alphabet
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà" +
    // Extension table (each is 2 GSM septets, but presence alone keeps us on GSM-7)
    "^{}\\[~]|€",
);

/** True when every char of `text` is encodable in the GSM-7 alphabet. */
export function isGsm7(text: string): boolean {
  for (const ch of text) {
    if (!GSM7_CHARS.has(ch)) return false;
  }
  return true;
}

/**
 * Estimate billed SMS segments. Czech diacritics are NOT in GSM-7, so the
 * reminder is virtually always UCS-2 (70 chars/segment); pure-ASCII bodies bill
 * at 160/segment. Concatenation overhead (UDH) shrinks multi-part segments to
 * 153 (GSM-7) / 67 (UCS-2), which we account for past one segment.
 *
 * This is an *estimate* for the length guard only — the real billed count comes
 * back from smsbrana as `sms_count` and is what we persist.
 */
export function estimateSmsSegments(text: string): number {
  const ucs2 = !isGsm7(text);
  const single = ucs2 ? 70 : 160;
  const multi = ucs2 ? 67 : 153;
  // Count by code points (handles astral chars / emoji as 2 UCS-2 units).
  let units = 0;
  for (const ch of text) units += ch.codePointAt(0)! > 0xffff ? 2 : 1;
  if (units <= single) return 1;
  return Math.ceil(units / multi);
}

/**
 * SMS body per spec §5 + the Art. 14 notice/opt-out line:
 *   `{owner} má pro vás novou otázku: „{otázka}" Odpověď nahrajete tady: {odkaz}`
 *   `Proč vám píšeme a jak se odhlásit: {optOutUrl}`
 *
 * The message stays NON-PROMOTIONAL: asker + question + record link, plus one
 * short line that points to the just-in-time notice (who we are, why we write,
 * legitimate-interest basis) and the one-tap opt-out. When optOutUrl is absent
 * (no magic_token) the extra line is omitted — the link can't route without it.
 *
 * Diacritics are kept (Unicode SMS). The body carries the variable-length
 * question AND the opt-out line now, so it is LONGER than the bare reminder; we
 * still NEVER truncate the question, always preserve the record link, and warn
 * when the rendered SMS would blow past a sane cap (>5 UCS-2 segments) so an
 * abnormally long library question can't silently run up cost (spec §8.3). The
 * real billed count still comes back from smsbrana as sms_count.
 */
export function renderSms(ctx: RenderContext): RenderedMessage {
  const owner = firstName(ctx.ownerFirstName);
  // Guard: the link is the whole point of the SMS — never render without it.
  if (!ctx.actionUrl) {
    throw new Error("[messaging:render] renderSms called without an actionUrl");
  }
  let text = `${owner} má pro vás novou otázku: „${ctx.question}" Odpověď nahrajete tady: ${ctx.actionUrl}`;
  if (ctx.optOutUrl) {
    text += ` Proč vám píšeme a jak se odhlásit: ${ctx.optOutUrl}`;
  }

  const segments = estimateSmsSegments(text);
  if (segments > 5) {
    console.warn(
      `[messaging:render] SMS would bill ~${segments} segments (cap 5); question is unusually long`,
    );
  }

  return { text, tag: "weekly_reminder" };
}

// ─── WhatsApp ────────────────────────────────────────────────────────────────

/**
 * Approved WhatsApp Utility template body (cs) — same copy as the SMS, with the
 * Art. 14 notice/opt-out as a 4th variable so it is NON-PROMOTIONAL and carries
 * the same who-we-are / why / how-to-stop line:
 *   {{1}} má pro vás novou otázku: „{{2}}" Odpověď nahrajete tady: {{3}}
 *   Proč vám píšeme a jak se odhlásit: {{4}}
 * vars in order: [ownerFirstName, question, actionUrl, optOutUrl]
 *
 * The provider maps templateParams positionally onto the template's body
 * parameters, so the approved Meta template MUST declare 4 body variables. When
 * optOutUrl is absent (no magic_token) we fall back to the 3-variable form and
 * the matching legacy template — the link can't route without the token anyway.
 *
 * Meta sends the template, not the assembled text; the `text` field here is a
 * faithful fallback (for the noop provider's log and any non-template surface).
 */
export interface RenderedWhatsApp extends RenderedMessage {
  /**
   * Body params in template order: [{{1}}, {{2}}, {{3}}] or, when an opt-out URL
   * is present, [{{1}}, {{2}}, {{3}}, {{4}}]. The provider maps these onto the
   * approved template's body parameters positionally.
   */
  templateParams: [string, string, string] | [string, string, string, string];
}

export function renderWhatsApp(ctx: RenderContext): RenderedWhatsApp {
  if (!ctx.actionUrl) {
    throw new Error("[messaging:render] renderWhatsApp called without an actionUrl");
  }
  const owner = firstName(ctx.ownerFirstName);
  let text = `${owner} má pro vás novou otázku: „${ctx.question}" Odpověď nahrajete tady: ${ctx.actionUrl}`;
  if (ctx.optOutUrl) {
    text += ` Proč vám píšeme a jak se odhlásit: ${ctx.optOutUrl}`;
  }
  return {
    text,
    tag: "weekly_reminder",
    templateParams: ctx.optOutUrl
      ? [owner, ctx.question, ctx.actionUrl, ctx.optOutUrl]
      : [owner, ctx.question, ctx.actionUrl],
  };
}

// ─── Email ───────────────────────────────────────────────────────────────────

/**
 * Thin adapter over the existing rich `weeklyReminderEmail` template — does NOT
 * duplicate the copy. Returns the RenderedMessage shape (subject/html/text) so
 * the email ChannelProvider can map it straight onto an EmailMessage.
 */
export function renderEmail(ctx: RenderContext): RenderedMessage {
  const tpl = weeklyReminderEmail({
    seniorDisplayName: ctx.seniorDisplayName,
    question: ctx.question,
    // weeklyReminderEmail derives its /senior-login fallback from appUrl; we
    // always pass an explicit actionUrl, so appUrl is only the fallback base.
    appUrl: ctx.actionUrl,
    actionUrl: ctx.actionUrl,
  });
  return {
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tag: "weekly_reminder",
  };
}

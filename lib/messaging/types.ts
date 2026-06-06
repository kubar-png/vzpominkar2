/**
 * Channel-agnostic messaging contracts.
 *
 * These generalize the email-provider pattern (lib/email/provider.ts) into a
 * channel-agnostic registry so the weekly-reminder cron can dispatch the same
 * question over email / SMS / WhatsApp through one seam (dispatchPrompt, a later
 * stage). See docs/superpowers/specs/2026-06-05-multichannel-question-delivery-design.md.
 *
 * Phase 1 ships email + SMS; WhatsApp is a fast-follow that drops in one more
 * ChannelProvider with no change to these types.
 */

/** A delivery channel. */
export type Channel = "email" | "sms" | "whatsapp";

/**
 * Outcome of a single dispatch attempt, as surfaced to the cron loop:
 *   sent    — the provider accepted the send (attempted-and-accepted; phase 1
 *             has no delivery receipts, so this is not "delivered")
 *   skipped — nothing to do (already delivered on this channel, opted out, or
 *             no usable address)
 *   failed  — the provider threw; the cron keeps going and the row logs the error
 */
export type DeliveryStatus = "sent" | "skipped" | "failed";

/**
 * A message already shaped for its target channel by the renderer.
 * `text` is the universal field (SMS/WhatsApp body and email plaintext
 * fallback); `subject`/`html` are email-only.
 */
export interface RenderedMessage {
  /** Email subject line (email only). */
  subject?: string;
  /** Pre-rendered HTML body (email only). */
  html?: string;
  /** SMS / WhatsApp body, and the email plaintext fallback. Always present. */
  text: string;
  /** Tag for analytics; e.g. "weekly_reminder". */
  tag?: string;
}

/** Where a single message is going, on which channel. */
export interface DeliveryRecipient {
  channel: Channel;
  /** email address | E.164 phone (no `+` for some providers) | wa_id. */
  address: string;
  /** Optional owner BCC (email only); ignored by SMS/WhatsApp providers. */
  ownerBcc?: string | null;
}

/**
 * Provider-reported result of an accepted send. `segments`/`price`/`credit`
 * come from SMS providers (smsbrana returns sms_count/price/credit); email and
 * WhatsApp leave them undefined.
 */
export interface SendResult {
  providerMessageId: string;
  /** Billed message parts (smsbrana sms_count). */
  segments?: number;
  /** Per-send price in CZK (smsbrana price). */
  price?: number;
  /** Remaining provider balance in CZK (smsbrana credit) — drives low-credit alerts. */
  credit?: number;
}

/**
 * One outbound channel. Mirrors EmailProvider.send but channel-agnostic; the
 * registry (lib/messaging/index.ts, a later stage) returns a lazy noop provider
 * per channel when the relevant key is unset.
 */
export interface ChannelProvider {
  readonly channel: Channel;
  /**
   * True only for a credential-backed LIVE provider; false for a noop.
   *
   * A noop provider returns a synthetic `providerMessageId` from send() so the
   * pipeline is testable in preview without real credentials. In PRODUCTION that
   * synthetic id is a hazard: dispatch would record status='sent', the cron would
   * stamp `reminded_at`, and the senior's question would be silently lost (never
   * re-selected). `resolveDelivery` (the dispatch stage) MUST consult this flag and
   * FALL BACK to email when a selected sms/whatsapp provider is not live, so a noop
   * never marks a send as succeeded in prod.
   *
   * Convention: every live provider sets `isLive = true`, every noop `isLive = false`.
   * The registry also re-exports this via `isLive(channel)` in lib/messaging/index.ts.
   */
  readonly isLive: boolean;
  send(to: DeliveryRecipient, msg: RenderedMessage): Promise<SendResult>;
}

/** What dispatchPrompt() returns to the cron loop for a single assignment. */
export interface DispatchResult {
  status: DeliveryStatus;
  channel: Channel;
  error?: string;
}

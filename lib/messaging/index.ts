import "server-only";
import type { Channel, ChannelProvider } from "@/lib/messaging/types";
import { EmailChannelProvider } from "@/lib/messaging/providers/email";
import { createSmsProvider } from "@/lib/messaging/providers/smsbrana";
import { createWhatsAppProvider } from "@/lib/messaging/providers/whatsapp";

/**
 * Messaging registry — the channel-agnostic generalization of getEmailProvider().
 *
 * getProvider(channel) returns a lazy singleton ChannelProvider per channel,
 * mirroring lib/email/provider.ts: each provider is constructed once on first
 * use and cached. The noop-vs-live decision lives INSIDE each factory
 * (createSmsProvider / createWhatsAppProvider) or one level down inside
 * getEmailProvider() for email — so the registry never inspects env vars itself;
 * it just wires the right factory to the right channel.
 *
 * See docs/superpowers/specs/2026-06-05-multichannel-question-delivery-design.md §4.1.
 */

const _cache: Partial<Record<Channel, ChannelProvider>> = {};

const FACTORIES: Record<Channel, () => ChannelProvider> = {
  email: () => new EmailChannelProvider(),
  sms: () => createSmsProvider(),
  whatsapp: () => createWhatsAppProvider(),
};

/**
 * Resolve the provider for a channel. Lazy singleton: the factory runs once per
 * channel and the result is cached for the lifetime of the module (the same
 * shape as getEmailProvider's `_provider` memo).
 */
export function getProvider(channel: Channel): ChannelProvider {
  const cached = _cache[channel];
  if (cached) return cached;
  const provider = FACTORIES[channel]();
  _cache[channel] = provider;
  return provider;
}

/**
 * Is the provider for `channel` credential-backed (a real send) rather than a
 * noop? Thin convenience over `getProvider(channel).isLive` for the dispatch
 * stage: `resolveDelivery` consults this and, when a senior's selected sms/whatsapp
 * channel is NOT live, falls back to email — so a noop never marks a send as
 * 'sent' (and stamps `reminded_at`) in production, which would silently lose the
 * senior's weekly question (review corr-01). Email's own liveness is reported the
 * same way, so a caller can verify the fallback channel is itself live.
 */
export function isLive(channel: Channel): boolean {
  return getProvider(channel).isLive;
}

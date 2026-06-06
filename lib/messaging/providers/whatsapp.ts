import "server-only";
import type {
  ChannelProvider,
  DeliveryRecipient,
  RenderedMessage,
  SendResult,
} from "@/lib/messaging/types";
import { renderWhatsApp, type RenderedWhatsApp } from "@/lib/messaging/render";

/**
 * WhatsApp ChannelProvider — Meta Cloud API (fast-follow / Phase 2). Full
 * implementation but dormant until Meta Business Verification clears and the
 * env vars are set; NOOP otherwise, mirroring the email/SMS noop pattern.
 *
 * Sends a pre-approved Utility *template* (proactive business-initiated message;
 * the "free 24h window" does not apply to weekly sends). Template body (cs):
 *   {{1}} má pro vás novou otázku: „{{2}}" Odpověď nahrajete tady: {{3}}
 * params in order [ownerFirstName, question, actionUrl] — produced by
 * renderWhatsApp() in lib/messaging/render.ts.
 *
 *   POST https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_NUMBER_ID}/messages
 *   Authorization: Bearer {WHATSAPP_TOKEN}
 *
 * Env (noop until set): WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
 * WHATSAPP_TEMPLATE_NAME. Language is fixed to "cs".
 *
 * SECURITY: never log WHATSAPP_TOKEN.
 */

const GRAPH_VERSION = "v21.0";
const TEMPLATE_LANGUAGE = "cs";

/**
 * Per-request network timeout. Like the smsbrana provider, this send runs inside
 * the sequential maxDuration=300 cron, so a hung Meta socket must not stall the
 * batch. Unlike smsbrana there is no second host to fail over to: on timeout we
 * abort and throw a clean transport error, which dispatch records as a `failed`
 * delivery-log row (the row is retried next run; no synthetic-success).
 */
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Recipient address → WhatsApp `to`. Meta wants the number in international
 * format WITHOUT a leading '+', digits only (e.g. 420777123456).
 */
function toWhatsAppNumber(address: string): string {
  return address.replace(/[^\d]/g, "");
}

/**
 * Pull the template params for the message. Prefer params the renderer already
 * attached (RenderedWhatsApp.templateParams); fall back to a single body param
 * carrying the full text so a plain RenderedMessage still sends something
 * coherent against a 1-variable template.
 */
function templateParamsFor(msg: RenderedMessage): string[] {
  const wa = msg as Partial<RenderedWhatsApp>;
  if (Array.isArray(wa.templateParams) && wa.templateParams.length > 0) {
    return wa.templateParams;
  }
  return [msg.text];
}

class NoopWhatsAppProvider implements ChannelProvider {
  readonly channel = "whatsapp" as const;
  /** Noop: credentials are unset. Dispatch must fall back to email in prod. */
  readonly isLive = false;

  async send(to: DeliveryRecipient, msg: RenderedMessage): Promise<SendResult> {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[whatsapp:noop] would send template to ${to.address}: ` +
          JSON.stringify(templateParamsFor(msg)),
      );
    }
    return { providerMessageId: `noop-wa-${Date.now()}` };
  }
}

class WhatsAppCloudProvider implements ChannelProvider {
  readonly channel = "whatsapp" as const;
  /** Credential-backed live provider — a real WhatsApp template is sent. */
  readonly isLive = true;
  private token: string;
  private phoneNumberId: string;
  private templateName: string;

  constructor(token: string, phoneNumberId: string, templateName: string) {
    this.token = token;
    this.phoneNumberId = phoneNumberId;
    this.templateName = templateName;
  }

  async send(to: DeliveryRecipient, msg: RenderedMessage): Promise<SendResult> {
    const params = templateParamsFor(msg);
    const body = {
      messaging_product: "whatsapp",
      to: toWhatsAppNumber(to.address),
      type: "template",
      template: {
        name: this.templateName,
        language: { code: TEMPLATE_LANGUAGE },
        components: [
          {
            type: "body",
            parameters: params.map((text) => ({ type: "text", text })),
          },
        ],
      },
    };

    // Bound the request so a hung Meta socket can't stall the sequential cron.
    // A timeout aborts the fetch (TimeoutError), which propagates as a clean throw
    // → dispatch records a `failed` row and retries next run (no synthetic success,
    // no backup host for WhatsApp). We surface a stable message without the token.
    let res: Response;
    try {
      res = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
    } catch (e) {
      const name = (e as { name?: string } | null)?.name;
      if (name === "TimeoutError" || name === "AbortError") {
        throw new Error(
          `WhatsApp send failed: request timed out after ${REQUEST_TIMEOUT_MS}ms`,
        );
      }
      throw e;
    }

    const json = (await res.json().catch(() => null)) as
      | { messages?: { id: string }[]; error?: { message?: string; code?: number } }
      | null;

    if (!res.ok || !json?.messages?.[0]?.id) {
      // Surface Meta's error message but never the bearer token.
      const detail = json?.error?.message ?? `HTTP ${res.status}`;
      throw new Error(`WhatsApp send failed: ${detail}`);
    }

    return { providerMessageId: json.messages[0].id };
  }
}

/**
 * Build the WhatsApp provider for the messaging registry. Returns the live Meta
 * Cloud provider only when token + phone-number-id are present; the template
 * name falls back to "weekly_reminder" if unset. NOOP otherwise.
 */
export function createWhatsAppProvider(): ChannelProvider {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return new NoopWhatsAppProvider();
  }
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? "weekly_reminder";
  return new WhatsAppCloudProvider(token, phoneNumberId, templateName);
}

// Re-export so callers building a RenderedWhatsApp can reach the renderer
// through the provider module if they wish (the registry stage may prefer
// importing both from lib/messaging/render.ts directly).
export { renderWhatsApp };
export { WhatsAppCloudProvider, NoopWhatsAppProvider };

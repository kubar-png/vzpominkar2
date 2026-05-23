import "server-only";

/**
 * EmailProvider - abstract email delivery so we can swap Resend for
 * Ecomail / Mailerlite later (per spec §9) without touching callers.
 */

export interface EmailMessage {
  to: string;
  /** RFC-822 friendly name + email, e.g. `Vzpomínkář <ahoj@vzpominkar.cz>`. */
  from?: string;
  /** Reply-To address; defaults to ahoj@vzpominkar.cz so replies hit a real inbox. */
  replyTo?: string;
  bcc?: string[];
  subject: string;
  /** Pre-rendered HTML body. */
  html: string;
  /** Plaintext fallback. Strongly recommended — many inboxes hide HTML. */
  text?: string;
  /** Tag for analytics; e.g. "weekly_reminder". */
  tag?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id: string }>;
}

class NoopProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<{ id: string }> {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email:noop] would send "${message.subject}" to ${message.to}`);
    }
    return { id: `noop-${Date.now()}` };
  }
}

class ResendProvider implements EmailProvider {
  private key: string;
  private defaultFrom: string;
  private defaultReplyTo: string;

  constructor(apiKey: string, defaultFrom: string, defaultReplyTo: string) {
    this.key = apiKey;
    this.defaultFrom = defaultFrom;
    this.defaultReplyTo = defaultReplyTo;
  }

  async send(message: EmailMessage): Promise<{ id: string }> {
    // Lazy-import the SDK so missing keys don't pull it into builds where
    // the noop path is in effect.
    const { Resend } = await import("resend");
    const client = new Resend(this.key);
    const { data, error } = await client.emails.send({
      from: message.from ?? this.defaultFrom,
      replyTo: message.replyTo ?? this.defaultReplyTo,
      to: message.to,
      bcc: message.bcc,
      subject: message.subject,
      html: message.html,
      text: message.text,
      tags: message.tag ? [{ name: "category", value: message.tag }] : undefined,
    });
    if (error || !data?.id) {
      throw new Error(`Resend send failed: ${error?.message ?? "unknown"}`);
    }
    return { id: data.id };
  }
}

let _provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (_provider) return _provider;
  const key = process.env.RESEND_API_KEY;
  // TODO(domain): switch the fallback to `Vzpomínkář <ahoj@vzpominkar.cz>`
  // once the apex domain is verified in Resend. Until then we keep the
  // resend.dev sandbox so dev sends don't 403.
  const from = process.env.EMAIL_FROM ?? "Vzpomínkář <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO ?? "ahoj@vzpominkar.cz";
  if (!key) {
    _provider = new NoopProvider();
    return _provider;
  }
  _provider = new ResendProvider(key, from, replyTo);
  return _provider;
}

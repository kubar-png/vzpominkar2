import "server-only";
import type {
  ChannelProvider,
  DeliveryRecipient,
  RenderedMessage,
  SendResult,
} from "@/lib/messaging/types";
import { getEmailProvider } from "@/lib/email/provider";

/**
 * Email ChannelProvider — a thin generalization of the existing
 * lib/email/provider.ts so the messaging registry can treat email like any
 * other channel. Behaviour is UNCHANGED: it delegates to getEmailProvider()
 * (Resend in prod, Noop when RESEND_API_KEY is unset), inheriting that path's
 * from/replyTo defaults and noop fallback.
 *
 * Unlike lib/email/send.ts (which swallows errors so user-facing flows never
 * block), this provider lets the underlying send throw so dispatchPrompt can
 * record a `failed` delivery-log row — matching the SMS/WhatsApp providers.
 */
export class EmailChannelProvider implements ChannelProvider {
  readonly channel = "email" as const;

  /**
   * Email is the safe fallback channel, so it reports `isLive` to mirror the
   * underlying getEmailProvider() decision: live when RESEND_API_KEY is set,
   * a noop otherwise. (The cron's email fallback path only makes sense if email
   * itself is live; this lets a caller verify that.)
   */
  get isLive(): boolean {
    return Boolean(process.env.RESEND_API_KEY);
  }

  async send(to: DeliveryRecipient, msg: RenderedMessage): Promise<SendResult> {
    if (!msg.subject || !msg.html) {
      throw new Error("[messaging:email] RenderedMessage missing subject/html for email send");
    }
    const { id } = await getEmailProvider().send({
      to: to.address,
      bcc: to.ownerBcc ? [to.ownerBcc] : undefined,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      tag: msg.tag,
    });
    return { providerMessageId: id };
  }
}

import "server-only";
import { getEmailProvider, type EmailMessage } from "@/lib/email/provider";

/**
 * Thin wrapper that swallows errors so transactional sends never block
 * the user-facing flow. Callers that genuinely need delivery confirmation
 * should call getEmailProvider().send() directly.
 */
export async function sendEmail(message: EmailMessage): Promise<{ id: string } | null> {
  try {
    return await getEmailProvider().send(message);
  } catch (err) {
    console.error("[email] send failed", { subject: message.subject, to: message.to, err });
    return null;
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getEmailProvider } from "@/lib/email/provider";
import { leadNotificationEmail } from "@/lib/email/templates";
import { checkRateLimitWithHeaders } from "@/lib/rate-limit";

/**
 * POST /api/leads
 *
 * Lead-magnet form on the marketing homepage posts here. Accepts an email,
 * validates it, optionally notifies the team via Resend, and 303-redirects
 * back to `/?signup=success` so the static form-action flow shows a
 * "thanks" state without needing JS.
 *
 * TODO: when a `leads` table is added to Supabase, persist there.
 *       For now we just log + email-notify the team — the user always
 *       lands on the success state, no 404.
 */

const leadSchema = z.object({
  email: z.string().email(),
});

const SUCCESS_URL = "/?signup=success#signup";
const ERROR_URL = "/?signup=error#signup";

export async function POST(request: Request) {
  const rl = await checkRateLimitWithHeaders("leads", request.headers);
  if (!rl.ok) {
    return NextResponse.redirect(new URL(ERROR_URL, request.url), 303);
  }

  let email: string | undefined;

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      email = leadSchema.parse(body).email;
    } else {
      const form = await request.formData();
      email = leadSchema.parse({ email: form.get("email") }).email;
    }
  } catch {
    return NextResponse.redirect(new URL(ERROR_URL, request.url), 303);
  }

  // Best-effort: log to server console (visible in Vercel logs) and try a
  // notification email. Neither failure blocks the success redirect — this
  // is a marketing pixel, not a transactional path.
  console.log(`[leads] new lead-magnet signup: ${email}`);

  try {
    const notifyTo = process.env.LEADS_NOTIFY_TO ?? process.env.EMAIL_FROM;
    if (notifyTo && process.env.RESEND_API_KEY) {
      // leadNotificationEmail already escapes the user-supplied address before
      // interpolating it into HTML — Zod validates RFC syntax but a value like
      // `"x"@foo<script>…` would still pass.
      const tpl = leadNotificationEmail({ email, source: "homepage / lead-magnet" });
      const provider = getEmailProvider();
      await provider.send({
        to: notifyTo.replace(/^.*<|>$/g, ""),
        replyTo: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tag: "lead_magnet",
      });
    }
  } catch (err) {
    console.error("[leads] notify failed (non-fatal):", err);
  }

  // Browsers form-post here, so 303 forces a GET on the redirect target.
  return NextResponse.redirect(new URL(SUCCESS_URL, request.url), 303);
}

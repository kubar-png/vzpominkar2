import { NextResponse } from "next/server";
import { z } from "zod";
import { getEmailProvider } from "@/lib/email/provider";
import { sendEmail } from "@/lib/email/send";
import { leadNotificationEmail, leadWelcomeEmail } from "@/lib/email/templates";
import { checkRateLimitWithHeaders } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/leads
 *
 * Lead-magnet form on the marketing homepage posts here. Accepts an email plus
 * an explicit, REQUIRED marketing-consent tick (GDPR opt-in), validates both,
 * persists the lead + the exact consent text shown, fires the visitor's single
 * welcome e-mail (the promised sample + 200 Kč coupon), best-effort notifies the
 * team, and 303-redirects back to `/?signup=success` so the static form-action
 * flow shows a "thanks" state without needing JS.
 *
 * Consent is mandatory on BOTH the client (required checkbox) and here on the
 * server: a submission without `marketing_consent === true` is rejected.
 *
 * Persists to the `leads` table (service-role). The user always lands on the
 * success state, no 404. The autoresponder + team notification are best-effort —
 * the lead row + consent are saved first, before any send.
 */

// The exact label rendered next to the checkbox on the homepage form. Stored
// verbatim on the lead row so the opt-in is auditable — keep in sync with
// app/page.tsx.
export const LEAD_CONSENT_TEXT =
  "Souhlasím, že mi Vzpomínkář může poslat ukázku a občasné tipy e-mailem (kdykoli se odhlásíte).";

const leadSchema = z.object({
  email: z.string().email(),
  // Checkbox submits "on" (HTML default) or "true"; JSON may send a boolean.
  // A missing/null value (unchecked box) is a valid request that simply
  // carries no consent → caught by the consent gate below, not the parse catch.
  consent: z
    .union([z.string(), z.boolean(), z.null(), z.undefined()])
    .transform((v) => v === true || v === "on" || v === "true" || v === "1"),
});

const SUCCESS_URL = "/?signup=success#signup";
const ERROR_URL = "/?signup=error#signup";
const CONSENT_ERROR_URL = "/?signup=consent#signup";

export async function POST(request: Request) {
  const rl = await checkRateLimitWithHeaders("leads", request.headers);
  if (!rl.ok) {
    return NextResponse.redirect(new URL(ERROR_URL, request.url), 303);
  }

  let email: string | undefined;
  let consent = false;

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const parsed = leadSchema.parse(body);
      email = parsed.email;
      consent = parsed.consent;
    } else {
      const form = await request.formData();
      const parsed = leadSchema.parse({
        email: form.get("email"),
        consent: form.get("consent"),
      });
      email = parsed.email;
      consent = parsed.consent;
    }
  } catch {
    return NextResponse.redirect(new URL(ERROR_URL, request.url), 303);
  }

  // Consent is mandatory — without an explicit tick we don't have a lawful
  // basis to e-mail, so reject before storing anything. The form makes the
  // checkbox required client-side; this is the server-side enforcement.
  if (!consent) {
    return NextResponse.redirect(new URL(CONSENT_ERROR_URL, request.url), 303);
  }

  // Persist the lead first (best-effort) — the durable record, independent of
  // whether the e-mail provider is configured or up. Service-role insert on an
  // RLS-protected table; re-submits (same email) refresh the consent snapshot.
  try {
    await createAdminClient()
      .from("leads")
      .upsert(
        {
          email,
          source: "homepage",
          marketing_consent: true,
          consent_text: LEAD_CONSENT_TEXT,
          consent_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );
  } catch (err) {
    console.error("[leads] store failed (non-fatal):", err);
  }

  // Autoresponder to the VISITOR: the single warm welcome e-mail promised by
  // the form (sample intro + gold CTA + 200 Kč coupon). Best-effort — if
  // RESEND/SMTP is unset this no-ops/logs until the domain is live. The lead
  // row + consent above are already saved regardless.
  try {
    const tpl = leadWelcomeEmail();
    await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tag: "lead_welcome",
    });
  } catch (err) {
    console.error("[leads] welcome send failed (non-fatal):", err);
  }

  // Best-effort INTERNAL notification; failure doesn't block the success
  // redirect — this is a marketing pixel, not a transactional path. The
  // Resend notification IS the audit trail; no separate console log.
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

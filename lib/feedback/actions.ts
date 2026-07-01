"use server";

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUser } from "@/lib/auth/permissions";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import type { Json } from "@/types/database";

export type FeedbackResult = { ok: true } | { ok: false; error: string };

/**
 * Persist a tester's /testovani survey answers.
 *
 * Rate-limited on the fail-open "leads" limiter (marketing-surface write; a
 * flaky/missing KV must never block honest feedback). The current owner, if
 * signed in, is attributed via profile_id — anonymous testers just get null.
 *
 * Writes through the service-role admin client, which bypasses RLS (the
 * test_feedback table has RLS on with no policies). Never throws to the UI on a
 * DB failure: it returns a generic error result so the survey can show a calm
 * message instead of a crash.
 */
export async function submitFeedback(
  answers: Record<string, unknown>,
  contactEmail?: string,
): Promise<FeedbackResult> {
  const rl = await checkRateLimit("leads", "feedback");
  if (!rl.ok) return { ok: false, error: rateLimitMessage(rl.retryAfterSec) };

  if (!answers || typeof answers !== "object" || Object.keys(answers).length === 0) {
    return { ok: false, error: "Formulář je prázdný." };
  }

  // Optional-auth: attribute to the signed-in owner when we have one, otherwise
  // record an anonymous response.
  const user = await currentUser().catch(() => null);

  const email = contactEmail?.trim() || null;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("test_feedback").insert({
      profile_id: user?.id ?? null,
      answers: answers as Json,
      contact_email: email,
      meta: {
        role: user?.role ?? null,
        familyId: user?.familyId ?? null,
      },
    });
    if (error) {
      console.error("[submitFeedback] insert failed", error);
      return { ok: false, error: "Odeslání se nezdařilo. Zkuste to prosím znovu." };
    }
  } catch (err) {
    console.error("[submitFeedback] unexpected error", err);
    return { ok: false, error: "Odeslání se nezdařilo. Zkuste to prosím znovu." };
  }

  return { ok: true };
}

import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Mark a book as paid and grant the family LIFETIME access (one-time model —
 * no expiry). Writes an audit row. Caller is responsible for idempotency
 * (e.g. the webhook checks `book.paid` first) so this isn't double-applied.
 *
 * Lives outside the "use server" checkout module so both the checkout action
 * and the Stripe webhook route can call it without exposing it as an action.
 */
export async function markBookPaid(
  admin: Admin,
  opts: {
    bookId: string;
    familyId: string;
    actorId?: string | null;
    amountCzk: number;
    paymentIntentId?: string | null;
  },
): Promise<void> {
  await admin
    .from("books")
    .update({
      paid: true,
      paid_at: new Date().toISOString(),
      amount_czk: opts.amountCzk,
      ...(opts.paymentIntentId ? { stripe_payment_intent_id: opts.paymentIntentId } : {}),
    })
    .eq("id", opts.bookId);

  await admin
    .from("families")
    .update({ subscription_status: "active", subscription_expires_at: null })
    .eq("id", opts.familyId);

  await admin.from("activity_log").insert({
    family_id: opts.familyId,
    actor_id: opts.actorId ?? null,
    action: "book.activated",
    // No PII/secrets — visible to the whole family via RLS.
    metadata: { bookId: opts.bookId },
  });
}

/** How many paid books a family already has (0 → next purchase is the base). */
export async function countPaidBooks(admin: Admin, familyId: string): Promise<number> {
  const { count } = await admin
    .from("books")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId)
    .eq("paid", true);
  return count ?? 0;
}

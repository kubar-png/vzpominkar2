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

/**
 * The senior's current collecting book — the paid, not-yet-full volume that new
 * prompts and answers belong to. Returns null when the senior has no payable
 * room (no paid book, or the latest is full/printed → they need another díl).
 * Falls back to a family-level book with no senior_id (legacy/backfill).
 */
export async function currentBookForSenior(
  admin: Admin,
  familyId: string,
  seniorId: string | null,
): Promise<{ id: string; sequence_no: number } | null> {
  // Fetch the family's collecting paid books and pick in JS — avoids
  // interpolating the (client-supplied) seniorId into a PostgREST .or() filter,
  // which would be an injection vector.
  const { data } = await admin
    .from("books")
    .select("id, sequence_no, senior_id")
    .eq("family_id", familyId)
    .eq("paid", true)
    .eq("status", "collecting")
    .order("sequence_no", { ascending: false })
    .returns<{ id: string; sequence_no: number; senior_id: string | null }[]>();

  const books = data ?? [];
  // Prefer this senior's own volume; fall back to a family-level book whose
  // senior_id is still null (onboarding creates the base book before the
  // senior profile exists).
  const book =
    (seniorId ? books.find((b) => b.senior_id === seniorId) : undefined) ??
    books.find((b) => b.senior_id === null) ??
    null;
  return book ? { id: book.id, sequence_no: book.sequence_no } : null;
}

/**
 * Recompute a book's fullness and flip it to 'full' once it has reached its
 * prompt cap (default 52) of answered prompts. Idempotent. Call after a prompt
 * is answered. Never downgrades a printed/ordered book.
 */
export async function refreshBookFullness(admin: Admin, bookId: string): Promise<void> {
  const { data: book } = await admin
    .from("books")
    .select("id, status, prompt_cap")
    .eq("id", bookId)
    .maybeSingle<{ id: string; status: string; prompt_cap: number }>();
  if (!book || book.status !== "collecting") return;

  const { count } = await admin
    .from("prompt_assignments")
    .select("id", { count: "exact", head: true })
    .eq("book_id", bookId)
    .not("answered_memory_id", "is", null);

  if ((count ?? 0) >= book.prompt_cap) {
    await admin.from("books").update({ status: "full" }).eq("id", bookId);
  }
}

/**
 * Called right after a prompt assignment is answered: stamps the answering
 * memory with the assignment's book and re-checks whether that book is now
 * full. No-op when the assignment isn't tied to a book.
 */
export async function onAssignmentAnswered(
  admin: Admin,
  assignmentId: string,
  memoryId: string,
): Promise<void> {
  const { data: assignment } = await admin
    .from("prompt_assignments")
    .select("book_id")
    .eq("id", assignmentId)
    .maybeSingle<{ book_id: string | null }>();
  const bookId = assignment?.book_id;
  if (!bookId) return;

  await admin.from("memories").update({ book_id: bookId }).eq("id", memoryId);
  await refreshBookFullness(admin, bookId);
}

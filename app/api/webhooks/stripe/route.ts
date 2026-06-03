import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { markBookPaid } from "@/lib/books/server";

export const runtime = "nodejs"; // need Node crypto for signature verification
export const dynamic = "force-dynamic";

/**
 * Stripe webhook receiver — one-time payments only (no subscriptions).
 *
 * Idempotency: book payments use an atomic paid=false→true claim in
 * markBookPaid; print orders are keyed on the unique
 * book_orders.stripe_payment_intent_id with a pre-check. Duplicate / retried
 * deliveries are safe either way.
 *
 * Events handled (all checkout.session.completed):
 *   - productType book_base / book_addon → mark the book paid (lifetime access)
 *   - productType book_print             → mark the print order paid
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }
    // Any other event type is acknowledged so Stripe stops retrying.
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }
}

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
}

/* -------------------------------------------------------------------------- */
async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const familyId = meta.familyId;
  const productType = meta.productType;
  if (!familyId || !productType) return;

  const admin = createAdminClient();
  const pi = paymentIntentId(session);
  const amountCzk = Math.round((session.amount_total ?? 0) / 100);

  // ── Book access (base or add-on) ──────────────────────────────────────
  if (productType === "book_base" || productType === "book_addon") {
    const bookId = meta.bookId;
    if (!bookId) return;

    // markBookPaid is idempotent (atomic claim on paid=false) and re-asserts the
    // family grant on every delivery, so duplicate / retried webhooks are safe.
    await markBookPaid(admin, {
      bookId,
      familyId,
      actorId: meta.ownerId ?? null,
      amountCzk,
      paymentIntentId: pi,
    });
    return;
  }

  // ── Print order ───────────────────────────────────────────────────────
  if (productType === "book_print") {
    const orderId = meta.bookOrderId;
    if (!orderId) return;

    // Idempotent: if this PI is already recorded against any order, skip.
    if (pi) {
      const { data: existing } = await admin
        .from("book_orders")
        .select("id")
        .eq("stripe_payment_intent_id", pi)
        .maybeSingle();
      if (existing) return;
    }

    await admin
      .from("book_orders")
      .update({ status: "paid", amount_czk: amountCzk, stripe_payment_intent_id: pi })
      .eq("id", orderId);

    await admin.from("activity_log").insert({
      family_id: familyId,
      action: "book_order.paid",
      metadata: { orderId },
    });
  }
}

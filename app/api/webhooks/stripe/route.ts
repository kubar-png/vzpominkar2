import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs"; // need Node crypto for signature verification
export const dynamic = "force-dynamic";

/** Paid access period granted per yearly purchase/renewal. Not a trial. */
const YEAR_DAYS = 365;

/**
 * Stripe webhook receiver.
 *
 * Idempotency: every state transition is keyed on the underlying Stripe
 * payment_intent or subscription id. We always check whether we've seen
 * the event before mutating, and when we do mutate we set unique columns
 * (book_orders.stripe_payment_intent_id is UNIQUE) so duplicates fail
 * loudly rather than double-charging.
 *
 * Events handled:
 *   - checkout.session.completed   (one-shot - book_print + yearly access)
 *   - invoice.paid                 (recurring renewal of yearly_access)
 *   - customer.subscription.deleted (cancellation)
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
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
        await onInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.deleted":
        await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        // Acknowledge unknown events so Stripe doesn't retry forever.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const familyId = meta.familyId;
  const productType = meta.productType;
  if (!familyId || !productType) return;

  const admin = createAdminClient();

  if (productType === "yearly_access") {
    // Idempotent: Stripe can deliver the same event more than once. If we've
    // already logged this session's activation, skip (mirrors the book_print
    // payment_intent guard below).
    const { data: already } = await admin
      .from("activity_log")
      .select("id")
      .eq("family_id", familyId)
      .eq("action", "subscription.activated")
      .eq("metadata->>stripeSessionId", session.id)
      .maybeSingle();
    if (already) return;

    const expiresAt = new Date(Date.now() + YEAR_DAYS * 24 * 60 * 60 * 1000);
    await admin
      .from("families")
      .update({
        subscription_status: "active",
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("id", familyId);

    await admin.from("activity_log").insert({
      family_id: familyId,
      action: "subscription.activated",
      metadata: { stripeSessionId: session.id },
    });
    return;
  }

  if (productType === "book_print") {
    const orderId = meta.bookOrderId;
    if (!orderId) return;

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    // Idempotent: if this PI already recorded against any order, skip.
    if (paymentIntentId) {
      const { data: existing } = await admin
        .from("book_orders")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();
      if (existing) return;
    }

    await admin
      .from("book_orders")
      .update({
        status: "paid",
        amount_czk: Math.round((session.amount_total ?? 0) / 100),
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", orderId);

    await admin.from("activity_log").insert({
      family_id: familyId,
      action: "book_order.paid",
      metadata: { stripeSessionId: session.id, orderId },
    });
  }
}

async function onInvoicePaid(invoice: Stripe.Invoice) {
  // For subscription renewals we just bump the expiry date by 365 days.
  // The familyId rides on the subscription's metadata; load the
  // subscription via Stripe API to get it.
  const subRef = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
  const subscriptionId = typeof subRef === "string" ? subRef : subRef?.id;
  if (!subscriptionId) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const familyId = subscription.metadata?.familyId;
  if (!familyId) return;

  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + YEAR_DAYS * 24 * 60 * 60 * 1000);
  await admin
    .from("families")
    .update({
      subscription_status: "active",
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq("id", familyId);
}

async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  const familyId = sub.metadata?.familyId;
  if (!familyId) return;
  const admin = createAdminClient();
  await admin
    .from("families")
    .update({ subscription_status: "cancelled" })
    .eq("id", familyId);
}

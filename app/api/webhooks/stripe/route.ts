import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { markBookPaid } from "@/lib/books/server";
import { SITE_URL } from "@/lib/site";
import { sendEmail } from "@/lib/email/send";
import { shopGiftOrderConfirmationEmail } from "@/lib/email/templates";

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
 *   - productType shop_book              → mark the guest gift order paid + email
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
  const productType = meta.productType;
  if (!productType) return;

  const admin = createAdminClient();
  const pi = paymentIntentId(session);
  const amountCzk = Math.round((session.amount_total ?? 0) / 100);

  // ── Guest gift book (no account, no family) ───────────────────────────
  // Handled before the familyId guard below — these orders have no family.
  if (productType === "shop_book") {
    await onShopBookCompleted(session, amountCzk);
    return;
  }

  const familyId = meta.familyId;
  if (!familyId) return;

  // ── Book access (base or add-on) ──────────────────────────────────────
  if (productType === "book_base" || productType === "book_addon") {
    const bookId = meta.bookId;
    if (!bookId) return;

    // Defense-in-depth: bookId + familyId both come from metadata we set at
    // checkout creation, but verify they actually belong together before
    // granting — a mismatched pair must never activate the wrong family.
    const { data: book } = await admin
      .from("books")
      .select("family_id")
      .eq("id", bookId)
      .maybeSingle();
    if (!book || book.family_id !== familyId) {
      console.error("[stripe webhook] book/family mismatch — refusing to grant", {
        bookId,
        familyId,
      });
      return;
    }

    // markBookPaid is idempotent (atomic claim on paid=false) and re-asserts the
    // family grant on every delivery, so duplicate / retried webhooks are safe.
    await markBookPaid(admin, {
      bookId,
      familyId,
      actorId: meta.ownerId ?? null,
      amountCzk,
      paymentIntentId: pi,
    });

    // Order bump: a second printed copy was bought alongside base access. The
    // checkout action inserted a draft book_orders row and threaded its id here.
    // markBookPaid only grants access — without this the paid copy stays "draft"
    // and never gets printed. Reconcile it now (paid = delivered).
    if (meta.bookOrderId) {
      await reconcileExtraCopyOrder(admin, {
        orderId: meta.bookOrderId,
        familyId,
        amountCzk,
        paymentIntentId: pi,
      });
    }
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

/* -------------------------------------------------------------------------- */
/**
 * Promote a second-printed-copy order (the base/add-on order bump) from draft to
 * paid and attach the payment intent so fulfilment prints it.
 *
 * Idempotent under duplicate / retried deliveries — mirrors markBookPaid: the
 * row is claimed with an atomic `status = 'draft' → 'paid'` update, so only the
 * delivery that actually transitions the row writes the audit log. A retried
 * webhook (row already 'paid') claims 0 rows and is a silent no-op.
 */
export async function reconcileExtraCopyOrder(
  admin: ReturnType<typeof createAdminClient>,
  opts: {
    orderId: string;
    familyId: string;
    amountCzk: number;
    paymentIntentId: string | null;
  },
): Promise<void> {
  const { data: claimed } = await admin
    .from("book_orders")
    .update({
      status: "paid",
      amount_czk: opts.amountCzk,
      stripe_payment_intent_id: opts.paymentIntentId,
    })
    .eq("id", opts.orderId)
    .eq("status", "draft") // atomic claim — only the first delivery transitions
    .select("id");

  // Audit only on the actual transition so retries don't duplicate the row.
  if ((claimed?.length ?? 0) > 0) {
    await admin.from("activity_log").insert({
      family_id: opts.familyId,
      action: "book_order.paid",
      metadata: { orderId: opts.orderId, reason: "extra_copy" },
    });
  }
}

/* -------------------------------------------------------------------------- */
/**
 * Guest gift-book order (createGiftOrder). Resolve by stripe_session_id, else
 * by metadata.shopOrderId. Idempotent: the draft→paid update is an atomic claim
 * (eq status 'draft'), and the confirmation e-mail is sent only when this
 * delivery is the one that flipped the row — so retries don't double-send.
 */
async function onShopBookCompleted(session: Stripe.Checkout.Session, amountCzk: number) {
  const admin = createAdminClient();
  const meta = session.metadata ?? {};
  const shopOrderId = meta.shopOrderId ?? null;

  let query = admin
    .from("shop_orders")
    .update({ status: "paid", amount_czk: amountCzk, paid_at: new Date().toISOString() })
    .eq("status", "draft"); // atomic claim — only the first delivery transitions

  if (session.id) {
    query = query.eq("stripe_session_id", session.id);
  } else if (shopOrderId) {
    query = query.eq("id", shopOrderId);
  } else {
    return;
  }

  const { data: updated } = await query.select(
    "id, buyer_name, buyer_email, questions",
  );

  // No row transitioned → already paid (duplicate delivery) or not found. Either
  // way, nothing more to do — this keeps the handler idempotent.
  const order = updated?.[0];
  if (!order) return;

  const questions = (order.questions ?? {}) as Record<string, unknown[]>;
  const questionCount = Object.values(questions).reduce(
    (n, arr) => n + (Array.isArray(arr) ? arr.length : 0),
    0,
  );

  if (order.buyer_email) {
    const mail = shopGiftOrderConfirmationEmail({
      buyerName: order.buyer_name ?? "",
      questionCount,
      amountCzk,
      orderNumber: order.id.slice(0, 8),
      appUrl: SITE_URL,
    });
    await sendEmail({
      to: order.buyer_email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "shop_gift_order",
    });
  }
}

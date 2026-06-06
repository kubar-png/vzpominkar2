"use server";

import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, priceForProductCzk } from "@/lib/stripe/server";
import { SITE_URL } from "@/lib/site";
import { sendEmail } from "@/lib/email/send";
import { shopGiftOrderConfirmationEmail } from "@/lib/email/templates";
import {
  COVER_BG,
  COVER_TEXT,
  isLegibleCover,
  isPremiumCover,
  type CoverBg,
  type CoverText,
} from "@/lib/book/cover";
import type { Json } from "@/types/database";

/* ────────────────────────────────────────────────────────────────────────
 * Guest gift-book order ("Kniha vzpomínek", /kniha/sestavit).
 *
 * No account. The client holds the whole draft in localStorage (questions +
 * recipient gender + cover design) and passes it here. We insert a `draft`
 * shop_order via the service-role admin client (the table is service-role only),
 * then either:
 *   - price 0  → mark paid + send the confirmation e-mail (free path, works now)
 *   - price >0 → create a Stripe guest-checkout session and hand back its URL
 *
 * The CLIENT performs the redirect (window.location.assign(result.redirect)),
 * so this action returns a plain result instead of calling redirect().
 * ──────────────────────────────────────────────────────────────────────── */

const coverBgValues = COVER_BG.map((o) => o.value) as [CoverBg, ...CoverBg[]];
const coverTextValues = COVER_TEXT.map((o) => o.value) as [CoverText, ...CoverText[]];

const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  custom: z.boolean().optional(),
});

// Record<phaseKey, Question[]> — the assembled selection from the configurator.
const QuestionsSchema = z.record(z.string(), z.array(QuestionSchema));

// A paid book has to go somewhere — name + full address are required.
// Only the order note stays optional.
const ShippingAddressSchema = z.object({
  name: z.string().trim().min(2, "Vyplňte prosím jméno a příjmení.").max(160),
  street: z.string().trim().min(2, "Vyplňte prosím ulici a číslo popisné.").max(200),
  city: z.string().trim().min(2, "Vyplňte prosím město.").max(120),
  zip: z.string().trim().min(3, "Vyplňte prosím PSČ.").max(20),
  note: z.string().trim().max(500).optional(),
});

const InputSchema = z.object({
  buyerName: z.string().trim().min(2, "Vyplňte prosím jméno.").max(160),
  buyerEmail: z.string().trim().toLowerCase().email("Zadejte platný e-mail."),
  recipientGender: z.enum(["male", "female"]).nullable().optional(),
  coverBg: z.enum(coverBgValues).optional(),
  coverText: z.enum(coverTextValues).optional(),
  giftwrap: z.boolean().optional(),
  dedication: z.string().trim().max(500).optional(),
  copies: z.coerce.number().int().min(1).max(10).optional(),
  // Which gift-book product this is. The configurator (/kniha/sestavit) sends
  // "custom" (899); the simple standard checkout sends "standard" (599).
  tier: z.enum(["standard", "custom"]).optional(),
  questions: QuestionsSchema,
  shippingAddress: ShippingAddressSchema,
});

export type CreateGiftOrderInput = z.input<typeof InputSchema>;

export type CreateGiftOrderResult =
  | { ok: true; orderId: string; redirect: string }
  | { ok: false; error: string };

function countQuestions(questions: Record<string, { id: string }[]>): number {
  return Object.values(questions).reduce((n, arr) => n + arr.length, 0);
}

export async function createGiftOrder(
  rawInput: CreateGiftOrderInput,
): Promise<CreateGiftOrderResult> {
  const parsed = InputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Zkontrolujte prosím zadané údaje.";
    return { ok: false, error: first };
  }
  const input = parsed.data;

  // Drop blank questions (an unfilled custom box) so they aren't counted, priced,
  // or printed as empty lines.
  const questions: typeof input.questions = {};
  for (const [phaseKey, arr] of Object.entries(input.questions)) {
    const kept = arr.filter((q) => q.text.trim().length > 0);
    if (kept.length > 0) questions[phaseKey] = kept;
  }

  const total = countQuestions(questions);
  if (total === 0) {
    return { ok: false, error: "Vyberte aspoň jednu otázku." };
  }

  // Cover: only persist a legible pair; otherwise drop it (the print pipeline
  // falls back to its own defaults). Guards against a tampered client payload.
  const coverBg = input.coverBg ?? null;
  const coverText =
    coverBg && input.coverText && isLegibleCover(coverBg, input.coverText)
      ? input.coverText
      : null;

  // Server is authoritative on price — never trust a client-supplied amount.
  // Tiered base declared by the flow: standard (599, curated questions, simple
  // checkout) vs custom (899, the configurator). Then add premium cover (+99),
  // giftwrap (+290) and each extra printed copy (the first is included).
  const baseProduct = input.tier === "standard" ? "shop_book_standard" : "shop_book_custom";

  const giftwrap = input.giftwrap ?? false;
  const copies = input.copies ?? 1;
  const dedication =
    giftwrap && input.dedication && input.dedication.length > 0 ? input.dedication : null;

  const priceCzk =
    priceForProductCzk(baseProduct) +
    (coverBg && isPremiumCover(coverBg) ? priceForProductCzk("book_cover_premium") : 0) +
    (giftwrap ? priceForProductCzk("book_giftwrap") : 0) +
    (copies > 1 ? (copies - 1) * priceForProductCzk("book_print_extra") : 0);

  const admin = createAdminClient();

  // 1) Insert the draft. We own this row end-to-end (service-role).
  const { data: order, error: insertErr } = await admin
    .from("shop_orders")
    .insert({
      status: "draft",
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      recipient_gender: input.recipientGender ?? null,
      cover_bg: coverBg,
      cover_text: coverText,
      giftwrap,
      dedication,
      copies,
      questions: questions as Json,
      shipping_address: input.shippingAddress as Json,
      amount_czk: priceCzk,
      currency: "czk",
    })
    .select("id")
    .single<{ id: string }>();

  if (insertErr || !order) {
    console.error("[shop] createGiftOrder insert failed", insertErr);
    return { ok: false, error: "Objednávku se nepodařilo vytvořit. Zkuste to prosím znovu." };
  }

  // 2) Free path — activate instantly + confirm by e-mail. Works without Stripe
  //    (no STRIPE_SECRET_KEY needed) so the flow is testable before launch.
  if (priceCzk === 0) {
    const { error: paidErr } = await admin
      .from("shop_orders")
      .update({ status: "paid", amount_czk: 0, paid_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", "draft"); // idempotent claim
    if (paidErr) {
      console.error("[shop] createGiftOrder free-path activate failed", paidErr);
      return { ok: false, error: "Objednávku se nepodařilo dokončit. Zkuste to prosím znovu." };
    }

    const mail = shopGiftOrderConfirmationEmail({
      buyerName: input.buyerName,
      questionCount: total,
      amountCzk: 0,
      orderNumber: order.id.slice(0, 8),
      appUrl: SITE_URL,
    });
    await sendEmail({
      to: input.buyerEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "shop_gift_order",
    });

    return { ok: true, orderId: order.id, redirect: "/kniha/hotovo" };
  }

  // 3) Paid path — Stripe guest checkout. The webhook flips the order to `paid`
  //    and sends the confirmation e-mail on checkout.session.completed.
  let sessionUrl: string | null = null;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Express wallets (Apple Pay / Google Pay): we intentionally do NOT pin
      // `payment_method_types: ["card"]` here. On Stripe-hosted Checkout, leaving
      // it unset surfaces every method enabled in the Stripe Dashboard — and the
      // card wallets (Apple Pay / Google Pay) render automatically on supported
      // devices/browsers, with NO Apple Pay domain verification needed (Stripe
      // hosts the page). They only become visible once Stripe is live (real
      // STRIPE_SECRET_KEY + the wallets toggled on in the Dashboard).
      customer_email: input.buyerEmail,
      line_items: [
        {
          price_data: {
            currency: "czk",
            unit_amount: priceCzk * 100, // CZK is 0-decimal; Stripe wants minor units
            product_data: { name: "Kniha vzpomínek — na míru" },
          },
          quantity: 1,
        },
      ],
      // Abandoned-cart recovery: enable Stripe's native after-expiration recovery
      // so an unfinished session gets a recovery URL and Stripe can re-engage the
      // buyer by e-mail (Checkout recovery e-mails are toggled on in the Stripe
      // Dashboard). `expires_at` defaults to 24h in the future, which satisfies
      // recovery's "must expire" requirement — no extra param needed. We already
      // persist the draft `shop_orders` row + buyer_email pre-redirect, so a
      // custom recovery e-mail remains a possible upgrade later; the native
      // toggle is the lightest effective option for this pass.
      after_expiration: { recovery: { enabled: true } },
      metadata: { productType: "shop_book", shopOrderId: order.id },
      success_url: `${SITE_URL}/kniha/hotovo?order=${order.id}`,
      cancel_url: `${SITE_URL}/kniha/sestavit?cancelled=1`,
    });
    sessionUrl = session.url;

    // Record the session id so the webhook can also resolve the order by it.
    await admin
      .from("shop_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);
  } catch (err) {
    console.error("[shop] createGiftOrder stripe session failed", err);
    return { ok: false, error: "Platební bránu se nepodařilo otevřít. Zkuste to prosím znovu." };
  }

  if (!sessionUrl) {
    return { ok: false, error: "Platební bránu se nepodařilo otevřít. Zkuste to prosím znovu." };
  }
  return { ok: true, orderId: order.id, redirect: sessionUrl };
}

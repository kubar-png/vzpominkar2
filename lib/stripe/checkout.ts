"use server";

import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, priceForProductCzk, type ProductType } from "@/lib/stripe/server";
import type { Json } from "@/types/database";

export interface CheckoutInput {
  familyId: string;
  productType: ProductType;
  /** Only used for book_print - pre-existing or freshly inserted order id. */
  bookOrderId?: string;
  /** Optional Czech address for receipts (book_print). */
  shippingAddress?: Json | null;
}

const TRIAL_DAYS = 365;

/**
 * Hub for both products. If the configured price is 0 CZK, mutate the DB
 * directly (no Stripe call) - useful while MVP-pricing is on. If the price
 * is > 0, create a Stripe Checkout Session and redirect to it.
 */
export async function createCheckout(input: CheckoutInput): Promise<never> {
  const owner = await requireOwnerOfFamily(input.familyId);
  const priceCzk = priceForProductCzk(input.productType);

  if (priceCzk === 0) {
    return await handleFreePath(input, owner.id);
  }

  return await handleStripePath(input, priceCzk, owner.id);
}

/* -------------------------------------------------------------------------- */
async function handleFreePath(input: CheckoutInput, ownerId: string): Promise<never> {
  const admin = createAdminClient();

  if (input.productType === "yearly_access") {
    const expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const { error } = await admin
      .from("families")
      .update({
        subscription_status: "active",
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("id", input.familyId);
    if (error) throw new Error("Aktivace ročního přístupu selhala.");

    await admin.from("activity_log").insert({
      family_id: input.familyId,
      actor_id: ownerId,
      action: "subscription.activated_free",
      metadata: { reason: "price_zero" },
    });

    revalidatePath("/dashboard");
    redirect("/dashboard?activated=1");
  }

  if (input.productType === "book_print") {
    const { error } = await admin
      .from("book_orders")
      .update({
        status: "paid",
        amount_czk: 0,
        shipping_address: input.shippingAddress ?? null,
      })
      .eq("id", input.bookOrderId!);
    if (error) throw new Error("Objednávku se nepodařilo aktivovat.");

    await admin.from("activity_log").insert({
      family_id: input.familyId,
      actor_id: ownerId,
      action: "book_order.paid_free",
      metadata: { orderId: input.bookOrderId, reason: "price_zero" },
    });

    revalidatePath(`/family/${input.familyId}/book`);
    redirect(`/family/${input.familyId}/book?ordered=1`);
  }

  throw new Error("Neznámý typ produktu.");
}

/* -------------------------------------------------------------------------- */
async function handleStripePath(
  input: CheckoutInput,
  priceCzk: number,
  ownerId: string,
): Promise<never> {
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const productMeta =
    input.productType === "yearly_access"
      ? { name: "Vzpomínkář - roční přístup", successPath: "/dashboard?activated=1" }
      : { name: "Vzpomínkář - tištěná kniha", successPath: `/family/${input.familyId}/book?ordered=1` };

  const session = await stripe.checkout.sessions.create({
    mode: input.productType === "yearly_access" ? "subscription" : "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "czk",
          unit_amount: priceCzk * 100, // CZK is 0-decimal, but Stripe still expects integer minor units
          product_data: { name: productMeta.name },
          ...(input.productType === "yearly_access"
            ? { recurring: { interval: "year" } }
            : {}),
        },
        quantity: 1,
      },
    ],
    metadata: {
      familyId: input.familyId,
      productType: input.productType,
      ownerId,
      ...(input.bookOrderId ? { bookOrderId: input.bookOrderId } : {}),
    },
    success_url: `${baseUrl}${productMeta.successPath}`,
    cancel_url: `${baseUrl}/dashboard?cancelled=1`,
  });

  if (!session.url) throw new Error("Stripe nevrátil URL pro checkout.");
  redirect(session.url);
}

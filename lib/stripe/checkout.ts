"use server";

import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwner, requireOwnerOfFamily } from "@/lib/auth/permissions";
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

/** Paid access period granted per yearly purchase. Not a trial. */
const YEAR_DAYS = 365;

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

/**
 * Form-action wrapper for the /predplatne renewal button. Derives the family
 * from the authed owner (never trusts a client-supplied id) and kicks off the
 * yearly-access flow — the free path when price is 0, Stripe Checkout once a
 * price is set. Usable as a `<form action={...}>` handler (formData ignored).
 */
export async function startYearlyCheckout(): Promise<never> {
  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");
  return await createCheckout({ familyId: owner.familyId, productType: "yearly_access" });
}

/* -------------------------------------------------------------------------- */
async function handleFreePath(input: CheckoutInput, ownerId: string): Promise<never> {
  const admin = createAdminClient();

  if (input.productType === "yearly_access") {
    const expiresAt = new Date(Date.now() + YEAR_DAYS * 24 * 60 * 60 * 1000);
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
      // Do not put PII or secrets in metadata — visible to every family member via RLS.
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
      // Do not put PII or secrets in metadata — visible to every family member via RLS.
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
    // For subscriptions, copy familyId onto the SUBSCRIPTION too. The
    // invoice.paid (renewal) and customer.subscription.deleted (cancellation)
    // webhooks read `subscription.metadata.familyId` — without this they'd
    // fire with no familyId and silently no-op.
    ...(input.productType === "yearly_access"
      ? { subscription_data: { metadata: { familyId: input.familyId } } }
      : {}),
    success_url: `${baseUrl}${productMeta.successPath}`,
    cancel_url: `${baseUrl}/dashboard?cancelled=1`,
  });

  if (!session.url) throw new Error("Stripe nevrátil URL pro checkout.");
  redirect(session.url);
}

"use server";

import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwner, requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { markBookPaid, countPaidBooks } from "@/lib/books/server";
import { getStripe, priceForProductCzk } from "@/lib/stripe/server";
import { SITE_URL } from "@/lib/site";
import type { Json } from "@/types/database";

/* ────────────────────────────────────────────────────────────────────────
 * Book access — one-time purchase, lifetime. First paid book in a family is
 * the base price; every further book (new senior OR another volume of an
 * existing senior) is the add-on price. Free path (price 0) activates instantly.
 * ──────────────────────────────────────────────────────────────────────── */
export async function purchaseBook(bookId: string): Promise<never> {
  const admin = createAdminClient();
  const { data: book } = await admin
    .from("books")
    .select("id, family_id, paid")
    .eq("id", bookId)
    .maybeSingle<{ id: string; family_id: string; paid: boolean }>();

  if (!book) redirect("/dashboard");
  const owner = await requireOwnerOfFamily(book.family_id);

  if (book.paid) {
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  // First paid book = base; any subsequent book = add-on. Computed server-side
  // so the price can't be chosen by the client.
  const isFirst = (await countPaidBooks(admin, book.family_id)) === 0;
  const productType = isFirst ? "book_base" : "book_addon";
  const priceCzk = priceForProductCzk(productType);

  if (priceCzk === 0) {
    await markBookPaid(admin, {
      bookId: book.id,
      familyId: book.family_id,
      actorId: owner.id,
      amountCzk: 0,
    });
    revalidatePath("/dashboard");
    // After the first (base) purchase, ask the acquisition-attribution
    // question; further volumes go straight back to the app.
    redirect(isFirst ? "/onboarding/zdroj" : "/dashboard?activated=1");
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "czk",
          unit_amount: priceCzk * 100, // CZK is 0-decimal; Stripe wants minor units
          product_data: {
            name: isFirst ? "Vzpomínkář — přístup ke knize" : "Vzpomínkář — další kniha",
          },
        },
        quantity: 1,
      },
    ],
    metadata: { familyId: book.family_id, productType, bookId: book.id, ownerId: owner.id },
    success_url: `${SITE_URL}${isFirst ? "/onboarding/zdroj" : "/dashboard?activated=1"}`,
    cancel_url: `${SITE_URL}/onboarding/platba?cancelled=1`,
  });

  if (!session.url) throw new Error("Stripe nevrátil URL pro checkout.");
  redirect(session.url);
}

/**
 * Form-action wrapper for the /predplatne button. Finds the family's pending
 * (unpaid) book — onboarding creates one — or makes a first one, then runs the
 * purchase. Derives the family from the authed owner (never trusts client ids).
 */
export async function startBaseCheckout(): Promise<never> {
  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");
  // NB: email verification is intentionally NOT gated here. It must not block
  // onboarding or payment — the owner verifies later from the in-app banner
  // once they're past the paywall and in the dashboard.

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("books")
    .select("id")
    .eq("family_id", owner.familyId)
    .eq("paid", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  let bookId = existing?.id;
  if (!bookId) {
    const { data: created, error } = await admin
      .from("books")
      .insert({
        family_id: owner.familyId,
        senior_display_name: owner.displayName,
        sequence_no: 1,
        title: "Díl 1",
      })
      .select("id")
      .single<{ id: string }>();
    if (error?.code === "23505") {
      // A concurrent submit already created the base book — reuse it.
      const { data: dup } = await admin
        .from("books")
        .select("id")
        .eq("family_id", owner.familyId)
        .is("senior_id", null)
        .eq("sequence_no", 1)
        .maybeSingle<{ id: string }>();
      if (!dup) throw new Error("Knihu se nepodařilo připravit.");
      bookId = dup.id;
    } else if (error || !created) {
      throw new Error("Knihu se nepodařilo připravit.");
    } else {
      bookId = created.id;
    }
  }

  return await purchaseBook(bookId);
}

/**
 * Add-on purchase for a given senior — buys the NEXT volume for them (Díl 2,
 * 3, …) or activates the first book of a newly-added senior. The price is the
 * add-on price (the family already has a paid base book). Reuses an existing
 * unpaid volume for that senior if one is pending.
 */
export async function startVolumeCheckout(seniorId: string): Promise<never> {
  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");

  const admin = createAdminClient();
  const { data: senior } = await admin
    .from("profiles")
    .select("id, family_id, display_name")
    .eq("id", seniorId)
    .eq("role", "senior")
    .maybeSingle<{ id: string; family_id: string | null; display_name: string | null }>();
  if (!senior || senior.family_id !== owner.familyId) redirect("/dashboard");

  // Reuse a pending unpaid volume for this senior, else create the next one.
  const { data: unpaid } = await admin
    .from("books")
    .select("id")
    .eq("family_id", owner.familyId)
    .eq("senior_id", seniorId)
    .eq("paid", false)
    .order("sequence_no", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  let bookId = unpaid?.id;
  if (!bookId) {
    const { data: last } = await admin
      .from("books")
      .select("sequence_no")
      .eq("family_id", owner.familyId)
      .eq("senior_id", seniorId)
      .order("sequence_no", { ascending: false })
      .limit(1)
      .maybeSingle<{ sequence_no: number }>();
    const nextSeq = (last?.sequence_no ?? 0) + 1;
    const { data: created, error } = await admin
      .from("books")
      .insert({
        family_id: owner.familyId,
        senior_id: seniorId,
        senior_display_name: senior.display_name,
        sequence_no: nextSeq,
        title: `Díl ${nextSeq}`,
      })
      .select("id")
      .single<{ id: string }>();
    if (error?.code === "23505") {
      // A concurrent submit already created this volume — reuse it.
      const { data: dup } = await admin
        .from("books")
        .select("id")
        .eq("family_id", owner.familyId)
        .eq("senior_id", seniorId)
        .eq("sequence_no", nextSeq)
        .maybeSingle<{ id: string }>();
      if (!dup) throw new Error("Další díl se nepodařilo připravit.");
      bookId = dup.id;
    } else if (error || !created) {
      throw new Error("Další díl se nepodařilo připravit.");
    } else {
      bookId = created.id;
    }
  }

  return await purchaseBook(bookId);
}

/* ────────────────────────────────────────────────────────────────────────
 * Print order — one-time payment for a physical copy of a finished book.
 * ──────────────────────────────────────────────────────────────────────── */
export async function createPrintCheckout(input: {
  familyId: string;
  bookOrderId: string;
  shippingAddress?: Json | null;
}): Promise<never> {
  const owner = await requireOwnerOfFamily(input.familyId);
  const priceCzk = priceForProductCzk("book_print");
  const admin = createAdminClient();

  if (priceCzk === 0) {
    const { error } = await admin
      .from("book_orders")
      .update({
        status: "paid",
        amount_czk: 0,
        shipping_address: input.shippingAddress ?? null,
      })
      .eq("id", input.bookOrderId);
    if (error) throw new Error("Objednávku se nepodařilo aktivovat.");

    await admin.from("activity_log").insert({
      family_id: input.familyId,
      actor_id: owner.id,
      action: "book_order.paid_free",
      metadata: { orderId: input.bookOrderId, reason: "price_zero" },
    });

    revalidatePath(`/family/${input.familyId}/book`);
    redirect(`/family/${input.familyId}/book?ordered=1`);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "czk",
          unit_amount: priceCzk * 100,
          product_data: { name: "Vzpomínkář — tištěná kniha" },
        },
        quantity: 1,
      },
    ],
    metadata: {
      familyId: input.familyId,
      productType: "book_print",
      bookOrderId: input.bookOrderId,
      ownerId: owner.id,
    },
    success_url: `${SITE_URL}/family/${input.familyId}/book?ordered=1`,
    cancel_url: `${SITE_URL}/family/${input.familyId}/book?cancelled=1`,
  });

  if (!session.url) throw new Error("Stripe nevrátil URL pro checkout.");
  redirect(session.url);
}

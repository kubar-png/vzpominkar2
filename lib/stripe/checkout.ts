"use server";

import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwner, requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { markBookPaid, countPaidBooks } from "@/lib/books/server";
import {
  getStripe,
  priceForProductCzk,
  discountedExtraCopyCzk,
} from "@/lib/stripe/server";
import { validateCoupon, recordRedemptionOnce } from "@/lib/coupons/server";
import { createVoucher, markVoucherPaid, parseVoucherConfig } from "@/lib/gift/voucher";
import { setGiftVoucherToken, clearGiftCookie, readGiftState } from "@/lib/gift/cookie";
import { SITE_URL } from "@/lib/site";
import type Stripe from "stripe";
import type { Json } from "@/types/database";

/* ────────────────────────────────────────────────────────────────────────
 * Book access — one-time purchase, lifetime. First paid book in a family is
 * the base price; every further book (new senior OR another volume of an
 * existing senior) is the add-on price. Free path (price 0) activates instantly.
 * ──────────────────────────────────────────────────────────────────────── */
export async function purchaseBook(
  bookId: string,
  // Order bump: the buyer opted into a second printed copy at the launch
  // discount. Only honoured on the FIRST (base) purchase — that's where the
  // bump is offered. Computed price always comes from the server.
  //
  // couponCode: a discount code the buyer typed at checkout. Re-validated
  // server-side here (the client-typed code is never trusted to be valid, and
  // no client-sent discount amount is ever honoured). Applies ONLY to the base
  // line on the FIRST purchase — never the add-on, never the extra-copy bump.
  //
  // giftVoucherToken: a dárkový poukaz the buyer configured on the paywall (gift
  // flow). Threaded into the payment so the webhook can mark it paid + the
  // confirmation screen can offer the PDF. Only meaningful on the base purchase.
  opts: { extraCopy?: boolean; couponCode?: string; giftVoucherToken?: string } = {},
): Promise<never> {
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
  const baseListCzk = priceForProductCzk(productType);

  // Coupon — re-validated server-side against the freshly-resolved productType
  // and the base list price. The discount applies ONLY to the base line (per
  // the default scope: book_base; the add-on path can still carry an 'all'
  // coupon, but the bump below is never discounted). The applied amount is
  // clamped so the base line never goes below 0 (if it hits 0 the free path
  // below activates the book without Stripe).
  let couponId: string | null = null;
  let couponDiscountCzk = 0;
  const couponCode = opts.couponCode?.trim();
  if (couponCode) {
    const result = await validateCoupon(admin, {
      code: couponCode,
      productType,
      subtotalCzk: baseListCzk,
    });
    if (result.ok) {
      couponId = result.couponId;
      couponDiscountCzk = Math.min(result.amountOffCzk, baseListCzk);
    }
    // Invalid / expired / wrong-product → silently no discount. The page
    // validated and displayed it already; a code that turns invalid between
    // page render and submit simply charges full price (never over-charges).
  }

  const priceCzk = Math.max(0, baseListCzk - couponDiscountCzk);

  // Gift voucher — only honoured on the FIRST (base) purchase, where the paywall
  // shows the configurator. A non-empty token means the buyer personalized a
  // poukaz; we thread it through payment and surface its PDF after. Cleared from
  // the cookie once threaded so a later non-gift purchase can't re-attach it.
  const giftVoucherToken = isFirst ? opts.giftVoucherToken?.trim() || null : null;
  function zdrojUrl(): string {
    return giftVoucherToken
      ? `/onboarding/zdroj?voucher=${encodeURIComponent(giftVoucherToken)}`
      : "/onboarding/zdroj";
  }

  // Extra printed copy (the launch-discounted order bump). Only on the base
  // purchase, and only when the env-configured price is non-zero — otherwise it
  // adds nothing and we never record copies=2 for a phantom upsell. The coupon
  // never touches this line.
  const extraCopyCzk = isFirst && opts.extraCopy ? discountedExtraCopyCzk() : 0;
  const wantsExtraCopy = extraCopyCzk > 0;
  const copies = wantsExtraCopy ? 2 : 1;
  const totalCzk = priceCzk + extraCopyCzk;

  // Record the extra-copy intent as a print order so fulfilment knows to print
  // a second copy. Status mirrors the payment outcome (free path → paid, Stripe
  // path → draft until the webhook flips it). book_id ties it to the volume.
  // Returns the inserted row id (null when no extra copy) so the Stripe path can
  // thread it through session metadata and the webhook can reconcile draft→paid.
  async function recordExtraCopyOrder(status: "draft" | "paid"): Promise<string | null> {
    if (!wantsExtraCopy || !book) return null;
    const { data, error } = await admin
      .from("book_orders")
      .insert({
        family_id: book.family_id,
        book_id: book.id,
        status,
        copies: 2,
        amount_czk: status === "paid" ? extraCopyCzk : 0,
      })
      .select("id")
      .single<{ id: string }>();
    if (error) throw new Error("Objednávku druhého výtisku se nepodařilo vytvořit.");
    return data.id;
  }

  if (totalCzk === 0) {
    await markBookPaid(admin, {
      bookId: book.id,
      familyId: book.family_id,
      actorId: owner.id,
      amountCzk: 0,
    });
    await recordExtraCopyOrder("paid");
    // Coupon applied on the free path (e.g. a 200 Kč code that zeroed an
    // already-free launch price, or a code that brought a paid base to 0).
    // Record it now, keyed on the book id so a re-run of this completion can't
    // double-count. recordRedemptionOnce no-ops if already recorded.
    if (couponId) {
      await recordRedemptionOnce(admin, {
        couponId,
        orderRef: book.id,
        email: owner.email ?? null,
        amountOffCzk: couponDiscountCzk,
        productType,
      });
    }
    // Gift voucher → mark paid (unlocks the PDF) + clear the marker. Best-effort.
    if (giftVoucherToken) {
      try {
        await markVoucherPaid(giftVoucherToken, book.id);
      } catch (err) {
        console.error("[checkout] free-path markVoucherPaid failed", err);
      }
      await clearGiftCookie();
    }
    revalidatePath("/dashboard");
    // After the first (base) purchase, ask the acquisition-attribution
    // question (carrying the voucher token so the screen can offer the PDF);
    // further volumes go straight back to the app.
    redirect(isFirst ? zdrojUrl() : "/dashboard?activated=1");
  }

  // Record the pending extra-copy order before redirecting to Stripe so it's not
  // lost if the buyer never returns. Its id is threaded through session metadata
  // (bookOrderId) so the webhook can promote it draft→paid once payment lands.
  const extraCopyOrderId = await recordExtraCopyOrder("draft");

  const baseLineName = isFirst
    ? "Vzpomínkář — přístup ke knize"
    : "Vzpomínkář — další kniha";
  // Derive the line-item type from the create params themselves. The Stripe SDK
  // re-exports `SessionCreateParams` as a plain type alias on the top-level
  // `Stripe.Checkout` namespace (not a namespace), so the nested
  // `SessionCreateParams.LineItem` path isn't reachable there — indexing the
  // `line_items` array element is the version-stable way to name it.
  type CheckoutLineItem = NonNullable<
    Stripe.Checkout.SessionCreateParams["line_items"]
  >[number];
  const lineItems: CheckoutLineItem[] = [];
  // Base line is the FULL list price; the coupon is expressed to Stripe as a
  // separate discount below so the buyer sees "Kniha 2 890 Kč − sleva 200 Kč"
  // on the Stripe page (honest, Stripe-native). On the rare path where the base
  // list price is 0 but the bump keeps totalCzk > 0, there's no base line.
  if (baseListCzk > 0) {
    lineItems.push({
      price_data: {
        currency: "czk",
        unit_amount: baseListCzk * 100, // CZK is 0-decimal; Stripe wants minor units
        product_data: { name: baseLineName },
      },
      quantity: 1,
    });
  }
  if (extraCopyCzk > 0) {
    lineItems.push({
      price_data: {
        currency: "czk",
        unit_amount: extraCopyCzk * 100,
        product_data: { name: "Vzpomínkář — druhý výtisk" },
      },
      quantity: 1,
    });
  }

  const stripe = getStripe();

  // Express the coupon to Stripe as a one-off amount_off coupon applied to this
  // session. We mint a fresh, single-use Stripe coupon per checkout (rather than
  // mirroring our coupon catalogue into Stripe) so our DB stays the single
  // source of truth for validity/caps; Stripe only needs to subtract the amount
  // we already validated. Guarded by couponDiscountCzk > 0, so the free path and
  // no-coupon path never touch this. Discounts can't exceed the line subtotal in
  // Stripe, and couponDiscountCzk is already clamped to <= baseListCzk.
  type SessionDiscount = NonNullable<
    Stripe.Checkout.SessionCreateParams["discounts"]
  >[number];
  let discounts: SessionDiscount[] | undefined;
  if (couponDiscountCzk > 0) {
    const stripeCoupon = await stripe.coupons.create({
      amount_off: couponDiscountCzk * 100,
      currency: "czk",
      duration: "once",
      max_redemptions: 1,
      name: `Sleva ${couponCode ?? ""}`.trim(),
    });
    discounts = [{ coupon: stripeCoupon.id }];
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // Express wallets: omit `payment_method_types` so Stripe-hosted Checkout
    // shows every Dashboard-enabled method and renders Apple Pay / Google Pay
    // automatically on supported devices (no Apple Pay domain verification —
    // Stripe hosts the page). Visible once Stripe is live (real key + wallets
    // enabled in the Dashboard).
    line_items: lineItems,
    // The validated coupon as a Stripe-native discount (undefined when none).
    ...(discounts ? { discounts } : {}),
    // Abandoned-cart recovery: Stripe's native after-expiration recovery gives
    // the abandoned session a recovery URL and lets Stripe re-engage the buyer
    // by e-mail (toggled on in the Dashboard). `expires_at` defaults to 24h, so
    // the "session must expire" requirement is met without extra params.
    after_expiration: { recovery: { enabled: true } },
    metadata: {
      familyId: book.family_id,
      productType,
      bookId: book.id,
      ownerId: owner.id,
      copies: String(copies),
      // Present only when a second printed copy was bought — lets the webhook
      // reconcile the extra-copy book_orders row (draft→paid) after payment.
      ...(extraCopyOrderId ? { bookOrderId: extraCopyOrderId } : {}),
      // Coupon — threaded so the webhook can record the redemption (keyed on the
      // payment intent) once the payment actually completes. amountOffCzk is the
      // server-validated amount, never a client value.
      ...(couponId
        ? { couponId, couponAmountOffCzk: String(couponDiscountCzk) }
        : {}),
      // Gift voucher — threaded so the webhook marks it paid once the payment
      // lands (the PDF download gates on paid).
      ...(giftVoucherToken ? { voucherToken: giftVoucherToken } : {}),
    },
    success_url: `${SITE_URL}${isFirst ? zdrojUrl() : "/dashboard?activated=1"}`,
    cancel_url: `${SITE_URL}/onboarding/platba?cancelled=1`,
  });

  if (!session.url) throw new Error("Stripe nevrátil URL pro checkout.");
  redirect(session.url);
}

/* ────────────────────────────────────────────────────────────────────────
 * Extra printed copies of a FINISHED book (the Kniha-page upsell). The first
 * copy ships with book_base; this orders N *additional* copies (e.g. for a
 * sister) at the extra-copy price. Reuses the print-order machinery: a draft
 * book_orders row, the same Stripe checkout shape, and the same
 * productType: "book_print" webhook path that flips the order draft→paid using
 * the session's actual amount_total. The price is recomputed server-side from
 * discountedExtraCopyCzk() (the env value) × copies — never trusted from the
 * client. When the env price is 0 the upsell isn't offered, so this is reached
 * only with a real charged price; a forged 0-price submit is rejected.
 * ──────────────────────────────────────────────────────────────────────── */
export async function createExtraCopiesCheckout(input: {
  familyId: string;
  bookOrderId: string;
  copies: number;
  shippingAddress?: Json | null;
}): Promise<never> {
  const owner = await requireOwnerOfFamily(input.familyId);
  const unitCzk = discountedExtraCopyCzk();
  // Clamp to a sane range so a forged quantity can't run away. The upsell UI
  // offers 1–5; the server is authoritative.
  const copies = Math.min(5, Math.max(1, Math.floor(input.copies)));
  const totalCzk = unitCzk * copies;
  const admin = createAdminClient();

  // The extra copy is a paid product; if the env price is unset (0) there is
  // nothing to charge and we must not silently "deliver" a phantom free order.
  if (totalCzk === 0) {
    await admin
      .from("book_orders")
      .update({ status: "cancelled" })
      .eq("id", input.bookOrderId);
    redirect(`/family/${input.familyId}/book`);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "czk",
          unit_amount: unitCzk * 100,
          product_data: { name: "Vzpomínkář — další tištěný výtisk" },
        },
        quantity: copies,
      },
    ],
    after_expiration: { recovery: { enabled: true } },
    metadata: {
      familyId: input.familyId,
      // Reuse the print-order webhook path — it flips this book_orders row
      // draft→paid using the session's amount_total.
      productType: "book_print",
      bookOrderId: input.bookOrderId,
      ownerId: owner.id,
      copies: String(copies),
    },
    success_url: `${SITE_URL}/family/${input.familyId}/book?ordered=1`,
    cancel_url: `${SITE_URL}/family/${input.familyId}/book?cancelled=1`,
  });

  if (!session.url) throw new Error("Stripe nevrátil URL pro checkout.");
  redirect(session.url);
}

/**
 * Form-action wrapper for the /predplatne button. Finds the family's pending
 * (unpaid) book — onboarding creates one — or makes a first one, then runs the
 * purchase. Derives the family from the authed owner (never trusts client ids).
 */
export async function startBaseCheckout(formData?: FormData): Promise<never> {
  // Order bump: the paywall offers a second printed copy at the launch discount.
  // The checkbox is named "extra_copy"; honour it only when truthy. The price is
  // never read from the client — purchaseBook recomputes it server-side.
  const extraCopy = formData?.get("extra_copy") != null;

  // Coupon code typed (or URL-prefilled) on the paywall. Passed as a raw string;
  // purchaseBook re-validates it server-side against the live coupon table and
  // sizes the discount itself — we never trust a client-sent discount amount.
  const couponRaw = formData?.get("coupon");
  const couponCode = typeof couponRaw === "string" && couponRaw.trim() ? couponRaw : undefined;

  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");

  // Gift flow — when the paywall is in gift mode it submits the voucher
  // configurator's hidden fields (voucher_*). Mint the dárkový poukaz now
  // (unpaid) and stash its token in the gift cookie; purchaseBook threads it
  // into the payment so the webhook/free path can mark it paid. Reuse a token
  // already minted on a prior submit (e.g. a Stripe cancel → re-pay) so a
  // re-attempt doesn't pile up vouchers. Best-effort: never block payment.
  let giftVoucherToken: string | undefined;
  if (formData) {
    const { isGift, voucherToken: existing } = await readGiftState();
    if (isGift) {
      if (existing) {
        giftVoucherToken = existing;
      } else {
        const config = parseVoucherConfig(formData);
        if (config) {
          try {
            const created = await createVoucher({ productType: "book_base", ...config });
            giftVoucherToken = created.token;
            await setGiftVoucherToken(created.token);
          } catch (err) {
            console.error("[checkout] gift voucher create failed (non-fatal)", err);
          }
        }
      }
    }
  }
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

  return await purchaseBook(bookId, { extraCopy, couponCode, giftVoucherToken });
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
    // Express wallets: omit `payment_method_types` so Stripe-hosted Checkout
    // renders Apple Pay / Google Pay automatically on supported devices (no
    // domain verification needed). Visible once Stripe is live.
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
    // Abandoned-cart recovery: Stripe-native after-expiration recovery (24h
    // default expiry) so an abandoned print order can be re-engaged by e-mail.
    after_expiration: { recovery: { enabled: true } },
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

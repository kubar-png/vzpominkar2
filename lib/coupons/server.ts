import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type Admin = ReturnType<typeof createAdminClient>;
type CouponRow = Database["public"]["Tables"]["coupons"]["Row"];

/** Why a coupon was rejected (stable codes — the caller maps these to copy). */
export type CouponRejectReason =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "max_redeemed"
  | "wrong_product";

export type ValidateCouponResult =
  | { ok: true; couponId: string; amountOffCzk: number }
  | { ok: false; reason: CouponRejectReason };

/** Normalize a user-entered code to its stored form (trim + uppercase). */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Pure decision logic for an already-fetched coupon row. Separated from the DB
 * lookup so the active / window / cap / product rules are unit-testable without
 * a database. `now` is injectable for deterministic tests.
 *
 * Rules (in order):
 *  - active flag must be true
 *  - now must be >= valid_from (if set) and <= valid_until (if set)
 *  - redeemed_count must be < max_redemptions (if set)
 *  - applies_to must equal the productType, or be the wildcard 'all'
 */
export function decideCoupon(
  coupon: Pick<
    CouponRow,
    | "id"
    | "amount_off_czk"
    | "applies_to"
    | "active"
    | "valid_from"
    | "valid_until"
    | "max_redemptions"
    | "redeemed_count"
  >,
  productType: string,
  now: Date = new Date(),
): ValidateCouponResult {
  if (!coupon.active) return { ok: false, reason: "inactive" };

  const nowMs = now.getTime();
  if (coupon.valid_from && nowMs < new Date(coupon.valid_from).getTime()) {
    return { ok: false, reason: "not_started" };
  }
  if (coupon.valid_until && nowMs > new Date(coupon.valid_until).getTime()) {
    return { ok: false, reason: "expired" };
  }

  if (coupon.max_redemptions != null && coupon.redeemed_count >= coupon.max_redemptions) {
    return { ok: false, reason: "max_redeemed" };
  }

  if (coupon.applies_to !== "all" && coupon.applies_to !== productType) {
    return { ok: false, reason: "wrong_product" };
  }

  return { ok: true, couponId: coupon.id, amountOffCzk: coupon.amount_off_czk };
}

/**
 * Validate a coupon code entered at checkout. Looks the coupon up via the
 * service-role admin client (RLS denies all other access) and applies the rules
 * in {@link decideCoupon}.
 *
 * `subtotalCzk` is accepted so the caller can size the discount, but a coupon is
 * never invalid because of the subtotal — the caller is responsible for clamping
 * the applied discount so the charged total never goes below 0.
 */
export async function validateCoupon(
  admin: Admin,
  opts: { code: string; productType: string; subtotalCzk: number },
): Promise<ValidateCouponResult> {
  const code = normalizeCouponCode(opts.code);
  if (!code) return { ok: false, reason: "not_found" };

  // Codes are stored uppercased; the normalized code matches the row directly.
  const { data, error } = await admin
    .from("coupons")
    .select(
      "id, amount_off_czk, applies_to, active, valid_from, valid_until, max_redemptions, redeemed_count",
    )
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return { ok: false, reason: "not_found" };

  return decideCoupon(data, opts.productType);
}

/**
 * Record a successful redemption: insert a coupon_redemptions row AND increment
 * the coupon's running count. The increment is atomic — it re-reads and writes
 * back under a conditional `redeemed_count = previous` guard so concurrent
 * redemptions can't lose an increment (the loser retries against the new value).
 *
 * Call this only after the purchase has actually succeeded.
 */
export async function recordRedemption(
  admin: Admin,
  opts: {
    couponId: string;
    email?: string | null;
    orderRef?: string | null;
    amountOffCzk: number;
    productType?: string | null;
  },
): Promise<void> {
  const { error: insErr } = await admin.from("coupon_redemptions").insert({
    coupon_id: opts.couponId,
    email: opts.email ?? null,
    order_ref: opts.orderRef ?? null,
    amount_off_czk: opts.amountOffCzk,
    product_type: opts.productType ?? null,
  });
  if (insErr) throw insErr;

  // Atomic compare-and-set increment. Bounded retry loop: a concurrent writer
  // can only bump the count, so each retry sees a strictly higher value and the
  // loop terminates quickly.
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data: current, error: readErr } = await admin
      .from("coupons")
      .select("redeemed_count")
      .eq("id", opts.couponId)
      .single();
    if (readErr) throw readErr;
    if (!current) return;

    const prev = current.redeemed_count;
    const { data: claimed, error: updErr } = await admin
      .from("coupons")
      .update({ redeemed_count: prev + 1 })
      .eq("id", opts.couponId)
      .eq("redeemed_count", prev)
      .select("id");
    if (updErr) throw updErr;
    if ((claimed?.length ?? 0) > 0) return; // increment landed
    // else: someone else incremented between our read and write — retry.
  }
}

/**
 * Idempotent-friendly wrapper around {@link recordRedemption}: records a
 * redemption AT MOST ONCE for a given (couponId, orderRef) pair. The order
 * reference is the natural idempotency key — a book id on the free path, the
 * Stripe payment intent on the paid path — so a retried Stripe webhook (or a
 * re-run of a completion handler) never double-counts a redemption or
 * double-increments the coupon's `redeemed_count`.
 *
 * `orderRef` is REQUIRED here (unlike recordRedemption, where it's optional):
 * without a stable key there is nothing to dedupe on, so callers that can't
 * supply one must use recordRedemption directly and accept its at-least-once
 * semantics.
 *
 * NB: this is a check-then-insert, not a DB-level unique constraint, so it is
 * not bullet-proof against two truly-simultaneous deliveries of the same order.
 * In practice Stripe serialises retries of the same event with a back-off, and
 * the free path runs inside a single request, so the window is negligible. The
 * worst case is a rare double-count, never a wrong charge.
 */
export async function recordRedemptionOnce(
  admin: Admin,
  opts: {
    couponId: string;
    orderRef: string;
    email?: string | null;
    amountOffCzk: number;
    productType?: string | null;
  },
): Promise<void> {
  const { data: existing, error: lookErr } = await admin
    .from("coupon_redemptions")
    .select("id")
    .eq("coupon_id", opts.couponId)
    .eq("order_ref", opts.orderRef)
    .limit(1)
    .maybeSingle();
  if (lookErr) throw lookErr;
  if (existing) return; // already recorded for this order — no-op.

  await recordRedemption(admin, {
    couponId: opts.couponId,
    orderRef: opts.orderRef,
    email: opts.email ?? null,
    amountOffCzk: opts.amountOffCzk,
    productType: opts.productType ?? null,
  });
}

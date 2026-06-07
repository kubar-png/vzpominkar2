import { describe, it, expect } from "vitest";
import { decideCoupon, normalizeCouponCode, validateCoupon } from "@/lib/coupons/server";

const NOW = new Date("2026-06-07T12:00:00Z");

// A fully-valid coupon for book_base; tests override individual fields.
function coupon(overrides: Partial<Parameters<typeof decideCoupon>[0]> = {}) {
  return {
    id: "c1",
    amount_off_czk: 200,
    applies_to: "book_base",
    active: true,
    valid_from: null as string | null,
    valid_until: null as string | null,
    max_redemptions: null as number | null,
    redeemed_count: 0,
    ...overrides,
  };
}

describe("normalizeCouponCode", () => {
  it("trims and uppercases", () => {
    expect(normalizeCouponCode("  vitejte200 ")).toBe("VITEJTE200");
  });
});

describe("decideCoupon — decision logic", () => {
  it("accepts a fully-valid coupon for the matching product", () => {
    expect(decideCoupon(coupon(), "book_base", NOW)).toEqual({
      ok: true,
      couponId: "c1",
      amountOffCzk: 200,
    });
  });

  it("accepts a wildcard 'all' coupon for any product", () => {
    expect(decideCoupon(coupon({ applies_to: "all" }), "shop_book_custom", NOW).ok).toBe(true);
  });

  it("rejects an inactive coupon", () => {
    expect(decideCoupon(coupon({ active: false }), "book_base", NOW)).toMatchObject({
      ok: false,
      reason: "inactive",
    });
  });

  it("rejects before valid_from (not_started)", () => {
    expect(
      decideCoupon(coupon({ valid_from: "2026-07-01T00:00:00Z" }), "book_base", NOW),
    ).toMatchObject({ ok: false, reason: "not_started" });
  });

  it("rejects after valid_until (expired)", () => {
    expect(
      decideCoupon(coupon({ valid_until: "2026-05-01T00:00:00Z" }), "book_base", NOW),
    ).toMatchObject({ ok: false, reason: "expired" });
  });

  it("accepts inside the validity window", () => {
    expect(
      decideCoupon(
        coupon({ valid_from: "2026-06-01T00:00:00Z", valid_until: "2026-06-30T00:00:00Z" }),
        "book_base",
        NOW,
      ).ok,
    ).toBe(true);
  });

  it("rejects when the redemption cap is reached (max_redeemed)", () => {
    expect(
      decideCoupon(coupon({ max_redemptions: 5, redeemed_count: 5 }), "book_base", NOW),
    ).toMatchObject({ ok: false, reason: "max_redeemed" });
  });

  it("accepts when still under the redemption cap", () => {
    expect(
      decideCoupon(coupon({ max_redemptions: 5, redeemed_count: 4 }), "book_base", NOW).ok,
    ).toBe(true);
  });

  it("rejects a product the coupon doesn't apply to (wrong_product)", () => {
    expect(decideCoupon(coupon(), "book_addon", NOW)).toMatchObject({
      ok: false,
      reason: "wrong_product",
    });
  });
});

// Minimal admin-client stub mirroring the markBookPaid test style. The query
// builder resolves to whatever `result` the coupons lookup should return.
function makeAdmin(result: unknown) {
  const b: Record<string, unknown> = {};
  for (const m of ["select", "eq"]) b[m] = () => b;
  b.maybeSingle = () => Promise.resolve(result);
  return { from: () => b };
}
const asAdmin = (m: unknown) => m as unknown as Parameters<typeof validateCoupon>[0];

describe("validateCoupon — DB lookup", () => {
  it("returns not_found when the code is blank", async () => {
    const res = await validateCoupon(asAdmin(makeAdmin({ data: null, error: null })), {
      code: "   ",
      productType: "book_base",
      subtotalCzk: 2890,
    });
    expect(res).toEqual({ ok: false, reason: "not_found" });
  });

  it("returns not_found when no row matches", async () => {
    const res = await validateCoupon(asAdmin(makeAdmin({ data: null, error: null })), {
      code: "NOPE",
      productType: "book_base",
      subtotalCzk: 2890,
    });
    expect(res).toEqual({ ok: false, reason: "not_found" });
  });

  it("returns ok with the discount when a valid row is found", async () => {
    const res = await validateCoupon(
      asAdmin(
        makeAdmin({
          data: {
            id: "c1",
            amount_off_czk: 200,
            applies_to: "book_base",
            active: true,
            valid_from: null,
            valid_until: null,
            max_redemptions: null,
            redeemed_count: 0,
          },
          error: null,
        }),
      ),
      { code: " vitejte200 ", productType: "book_base", subtotalCzk: 2890 },
    );
    expect(res).toEqual({ ok: true, couponId: "c1", amountOffCzk: 200 });
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { priceForProductCzk } from "@/lib/stripe/server";

describe("priceForProductCzk", () => {
  const originalYearly = process.env.PRICE_YEARLY_ACCESS_CZK;
  const originalBook = process.env.PRICE_BOOK_PRINT_CZK;

  beforeEach(() => {
    delete process.env.PRICE_YEARLY_ACCESS_CZK;
    delete process.env.PRICE_BOOK_PRINT_CZK;
  });

  afterEach(() => {
    process.env.PRICE_YEARLY_ACCESS_CZK = originalYearly;
    process.env.PRICE_BOOK_PRINT_CZK = originalBook;
  });

  it("defaults to 0 when env unset", () => {
    expect(priceForProductCzk("yearly_access")).toBe(0);
    expect(priceForProductCzk("book_print")).toBe(0);
  });

  it("reads positive integer prices", () => {
    process.env.PRICE_YEARLY_ACCESS_CZK = "999";
    process.env.PRICE_BOOK_PRINT_CZK = "1490";
    expect(priceForProductCzk("yearly_access")).toBe(999);
    expect(priceForProductCzk("book_print")).toBe(1490);
  });

  it("treats non-numeric as 0 (so app never breaks on misconfiguration)", () => {
    process.env.PRICE_YEARLY_ACCESS_CZK = "free";
    expect(priceForProductCzk("yearly_access")).toBe(0);
  });

  it("clamps negative prices to 0", () => {
    process.env.PRICE_YEARLY_ACCESS_CZK = "-50";
    expect(priceForProductCzk("yearly_access")).toBe(0);
  });

  it("floors fractional prices (CZK is integer)", () => {
    process.env.PRICE_YEARLY_ACCESS_CZK = "499.9";
    expect(priceForProductCzk("yearly_access")).toBe(499);
  });
});

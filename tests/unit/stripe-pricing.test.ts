import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { priceForProductCzk } from "@/lib/stripe/server";

describe("priceForProductCzk", () => {
  const originalBase = process.env.PRICE_BOOK_BASE_CZK;
  const originalAddon = process.env.PRICE_BOOK_ADDON_CZK;
  const originalPrint = process.env.PRICE_BOOK_PRINT_CZK;

  beforeEach(() => {
    delete process.env.PRICE_BOOK_BASE_CZK;
    delete process.env.PRICE_BOOK_ADDON_CZK;
    delete process.env.PRICE_BOOK_PRINT_CZK;
  });

  afterEach(() => {
    process.env.PRICE_BOOK_BASE_CZK = originalBase;
    process.env.PRICE_BOOK_ADDON_CZK = originalAddon;
    process.env.PRICE_BOOK_PRINT_CZK = originalPrint;
  });

  it("defaults to 0 when env unset", () => {
    expect(priceForProductCzk("book_base")).toBe(0);
    expect(priceForProductCzk("book_addon")).toBe(0);
    expect(priceForProductCzk("book_print")).toBe(0);
  });

  it("reads positive integer prices", () => {
    process.env.PRICE_BOOK_BASE_CZK = "2890";
    process.env.PRICE_BOOK_ADDON_CZK = "1790";
    process.env.PRICE_BOOK_PRINT_CZK = "1490";
    expect(priceForProductCzk("book_base")).toBe(2890);
    expect(priceForProductCzk("book_addon")).toBe(1790);
    expect(priceForProductCzk("book_print")).toBe(1490);
  });

  it("treats non-numeric as 0 (so app never breaks on misconfiguration)", () => {
    process.env.PRICE_BOOK_BASE_CZK = "free";
    expect(priceForProductCzk("book_base")).toBe(0);
  });

  it("clamps negative prices to 0", () => {
    process.env.PRICE_BOOK_ADDON_CZK = "-50";
    expect(priceForProductCzk("book_addon")).toBe(0);
  });

  it("floors fractional prices (CZK is integer)", () => {
    process.env.PRICE_BOOK_BASE_CZK = "499.9";
    expect(priceForProductCzk("book_base")).toBe(499);
  });
});

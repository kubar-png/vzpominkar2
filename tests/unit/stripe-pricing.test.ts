import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  priceForProductCzk,
  assertDisplayPriceMatchesCharged,
} from "@/lib/stripe/server";

describe("priceForProductCzk", () => {
  const originalBase = process.env.PRICE_BOOK_BASE_CZK;
  const originalAddon = process.env.PRICE_BOOK_ADDON_CZK;
  const originalPrint = process.env.PRICE_BOOK_PRINT_CZK;
  const originalStandard = process.env.PRICE_SHOP_BOOK_STANDARD_CZK;
  const originalShop = process.env.PRICE_SHOP_BOOK_CUSTOM_CZK;
  const originalCover = process.env.PRICE_BOOK_COVER_PREMIUM_CZK;
  const originalGiftwrap = process.env.PRICE_BOOK_GIFTWRAP_CZK;

  beforeEach(() => {
    delete process.env.PRICE_BOOK_BASE_CZK;
    delete process.env.PRICE_BOOK_ADDON_CZK;
    delete process.env.PRICE_BOOK_PRINT_CZK;
    delete process.env.PRICE_SHOP_BOOK_STANDARD_CZK;
    delete process.env.PRICE_SHOP_BOOK_CUSTOM_CZK;
    delete process.env.PRICE_BOOK_COVER_PREMIUM_CZK;
    delete process.env.PRICE_BOOK_GIFTWRAP_CZK;
  });

  afterEach(() => {
    process.env.PRICE_BOOK_BASE_CZK = originalBase;
    process.env.PRICE_BOOK_ADDON_CZK = originalAddon;
    process.env.PRICE_BOOK_PRINT_CZK = originalPrint;
    process.env.PRICE_SHOP_BOOK_STANDARD_CZK = originalStandard;
    process.env.PRICE_SHOP_BOOK_CUSTOM_CZK = originalShop;
    process.env.PRICE_BOOK_COVER_PREMIUM_CZK = originalCover;
    process.env.PRICE_BOOK_GIFTWRAP_CZK = originalGiftwrap;
  });

  it("defaults to 0 when env unset", () => {
    expect(priceForProductCzk("book_base")).toBe(0);
    expect(priceForProductCzk("book_addon")).toBe(0);
    expect(priceForProductCzk("book_print")).toBe(0);
    expect(priceForProductCzk("book_print_extra")).toBe(0);
  });

  it("gift book is tiered: standard 599, custom 899; explicit 0 takes the free path", () => {
    expect(priceForProductCzk("shop_book_standard")).toBe(599);
    expect(priceForProductCzk("shop_book_custom")).toBe(899);
    process.env.PRICE_SHOP_BOOK_CUSTOM_CZK = "0";
    expect(priceForProductCzk("shop_book_custom")).toBe(0);
    process.env.PRICE_SHOP_BOOK_STANDARD_CZK = "699";
    expect(priceForProductCzk("shop_book_standard")).toBe(699);
  });

  it("pure-margin add-ons default to their code price (cover +99, giftwrap +290)", () => {
    expect(priceForProductCzk("book_cover_premium")).toBe(99);
    expect(priceForProductCzk("book_giftwrap")).toBe(290);
    process.env.PRICE_BOOK_COVER_PREMIUM_CZK = "149";
    expect(priceForProductCzk("book_cover_premium")).toBe(149);
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

describe("assertDisplayPriceMatchesCharged", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function setNodeEnv(value: string) {
    vi.stubEnv("NODE_ENV", value);
  }

  it("does not fire when display equals charged", () => {
    expect(() => assertDisplayPriceMatchesCharged(599, 599, "t")).not.toThrow();
    expect(() => assertDisplayPriceMatchesCharged(0, 0, "t")).not.toThrow();
  });

  it("does not fire when charged is non-zero (paid path)", () => {
    // A higher display next to a real charge is a different problem; this guard
    // only protects the free path (charged 0 must not show a non-zero price).
    expect(() => assertDisplayPriceMatchesCharged(2890, 2890, "t")).not.toThrow();
  });

  it("throws in development when a non-zero price sits next to a free charge", () => {
    setNodeEnv("development");
    expect(() => assertDisplayPriceMatchesCharged(2890, 0, "platba")).toThrow(
      /price-trap/,
    );
  });

  it("throws in test env (anything non-production) on the price trap", () => {
    setNodeEnv("test");
    expect(() => assertDisplayPriceMatchesCharged(599, 0, "objednat")).toThrow();
  });

  it("logs (never throws) in production so a live checkout cannot crash", () => {
    setNodeEnv("production");
    const spy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(() => assertDisplayPriceMatchesCharged(2890, 0, "platba")).not.toThrow();
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0]?.[0]).toMatch(/price-trap/);
    spy.mockRestore();
  });
});

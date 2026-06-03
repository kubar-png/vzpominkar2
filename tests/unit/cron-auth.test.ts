import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { safeEqual, verifyCronAuth } from "@/lib/cron";

describe("safeEqual (constant-time compare)", () => {
  it("is true for equal strings", () => expect(safeEqual("abc", "abc")).toBe(true));
  it("is false for different same-length strings", () => expect(safeEqual("abc", "abd")).toBe(false));
  it("is false for different-length strings", () => expect(safeEqual("abc", "abcd")).toBe(false));
});

describe("verifyCronAuth", () => {
  const real = process.env.CRON_SECRET;
  beforeEach(() => {
    process.env.CRON_SECRET = "s3cret";
  });
  afterEach(() => {
    if (real === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = real;
  });

  const reqWith = (auth?: string) =>
    new Request("https://x/api/cron/job", auth ? { headers: { authorization: auth } } : undefined);

  it("accepts the correct Bearer token", () => {
    expect(verifyCronAuth(reqWith("Bearer s3cret"))).toBe(true);
  });
  it("rejects a wrong token", () => {
    expect(verifyCronAuth(reqWith("Bearer nope"))).toBe(false);
  });
  it("rejects a missing Authorization header", () => {
    expect(verifyCronAuth(reqWith())).toBe(false);
  });
  it("denies all requests when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    expect(verifyCronAuth(reqWith("Bearer s3cret"))).toBe(false);
  });
});

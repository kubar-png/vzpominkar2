import { describe, it, expect, beforeAll } from "vitest";
import { createPrintToken, verifyPrintToken } from "@/lib/print/token";
import { resolveGender } from "@/lib/gender";

/**
 * The voucher PDF pipeline reuses the print HMAC token (lib/print/token):
 * /api/print/voucher signs the voucher's high-entropy public token, and
 * /print/voucher/[token] verifies it before loading the row. These tests pin
 * that round-trip for a voucher-shaped token (64 hex chars), plus the
 * gender-resolved message line rendered on the card.
 */

// Token module reads PRINT_SIGNING_SECRET lazily, so set it before any call.
beforeAll(() => {
  process.env.PRINT_SIGNING_SECRET = "test-voucher-secret";
});

// A voucher token: 32 random bytes → 64 hex chars (encode(gen_random_bytes(32))).
const VOUCHER_TOKEN = "a".repeat(64);

describe("print token — gift voucher capability", () => {
  it("round-trips a voucher token through sign/verify", () => {
    const token = createPrintToken(VOUCHER_TOKEN);
    expect(verifyPrintToken(token)).toBe(VOUCHER_TOKEN);
  });

  it("rejects a token with a tampered signature", () => {
    const token = createPrintToken(VOUCHER_TOKEN);
    const tampered = token.slice(0, -1) + (token.endsWith("0") ? "1" : "0");
    expect(verifyPrintToken(tampered)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = createPrintToken(VOUCHER_TOKEN, -1); // already expired
    expect(verifyPrintToken(token)).toBeNull();
  });

  it("rejects a malformed token", () => {
    expect(verifyPrintToken("not-a-token")).toBeNull();
    expect(verifyPrintToken(`${VOUCHER_TOKEN}.123`)).toBeNull();
  });
});

describe("voucher message — gender resolution", () => {
  const LINE = "Proto jsem ti {koupil|koupila} Vzpomínkář.";

  it("renders the slash form when no buyer gender is stored (default)", () => {
    expect(resolveGender(LINE, null)).toBe("Proto jsem ti koupil/a Vzpomínkář.");
  });

  it("renders the masculine form for a male buyer", () => {
    expect(resolveGender(LINE, "male")).toBe("Proto jsem ti koupil Vzpomínkář.");
  });

  it("renders the feminine form for a female buyer", () => {
    expect(resolveGender(LINE, "female")).toBe("Proto jsem ti koupila Vzpomínkář.");
  });
});

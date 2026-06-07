import { describe, it, expect, beforeAll } from "vitest";
import { signAdminSession, verifyAdminSession } from "@/lib/admin/session";

const SECRET = "test-admin-session-secret-0123456789abcdef";
const MAX_AGE = 12 * 60 * 60;
// Fixed clock so expiry checks are deterministic regardless of wall time.
const NOW = 1_700_000_000;

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = SECRET;
});

describe("admin-session", () => {
  it("signs a token that verifies before expiry", async () => {
    const token = await signAdminSession(NOW, MAX_AGE);
    // Still inside the window: NOW + 1h < NOW + 12h.
    expect(await verifyAdminSession(token, NOW + 60 * 60)).toBe(true);
    // And right at issue time.
    expect(await verifyAdminSession(token, NOW)).toBe(true);
  });

  it("rejects a tampered payload", async () => {
    const token = await signAdminSession(NOW, MAX_AGE);
    const [payload, sig] = token.split(".");
    // Flip a char in the payload but keep the original signature.
    const firstChar = payload![0] === "A" ? "B" : "A";
    const tampered = `${firstChar}${payload!.slice(1)}.${sig}`;
    expect(await verifyAdminSession(tampered, NOW)).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const token = await signAdminSession(NOW, MAX_AGE);
    const [payload, sig] = token.split(".");
    const firstChar = sig![0] === "A" ? "B" : "A";
    const tampered = `${payload}.${firstChar}${sig!.slice(1)}`;
    expect(await verifyAdminSession(tampered, NOW)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const token = await signAdminSession(NOW, MAX_AGE);
    // One second past expiry.
    expect(await verifyAdminSession(token, NOW + MAX_AGE + 1)).toBe(false);
    // Exactly at expiry (exp is not > now) → rejected.
    expect(await verifyAdminSession(token, NOW + MAX_AGE)).toBe(false);
  });

  it("rejects malformed / missing tokens", async () => {
    expect(await verifyAdminSession(undefined, NOW)).toBe(false);
    expect(await verifyAdminSession(null, NOW)).toBe(false);
    expect(await verifyAdminSession("", NOW)).toBe(false);
    expect(await verifyAdminSession("no-dot-here", NOW)).toBe(false);
    expect(await verifyAdminSession(".onlysig", NOW)).toBe(false);
    expect(await verifyAdminSession("onlypayload.", NOW)).toBe(false);
    expect(await verifyAdminSession("a.b.c", NOW)).toBe(false);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signAdminSession(NOW, MAX_AGE);
    process.env.ADMIN_SESSION_SECRET = "a-completely-different-secret-value";
    try {
      expect(await verifyAdminSession(token, NOW)).toBe(false);
    } finally {
      process.env.ADMIN_SESSION_SECRET = SECRET;
    }
  });

  it("returns false when the secret is unset (fail closed)", async () => {
    const prev = process.env.ADMIN_SESSION_SECRET;
    const token = await signAdminSession(NOW, MAX_AGE);
    delete process.env.ADMIN_SESSION_SECRET;
    try {
      expect(await verifyAdminSession(token, NOW)).toBe(false);
    } finally {
      process.env.ADMIN_SESSION_SECRET = prev;
    }
  });
});

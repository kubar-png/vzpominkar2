import { describe, it, expect } from "vitest";
import { hasActiveAccess } from "@/lib/auth/permissions";

// The paywall gate: only an explicitly 'active' subscription still within its
// paid period grants access. There is no free trial.
describe("hasActiveAccess (paywall gate)", () => {
  it("grants access for an active, open-ended subscription", () => {
    expect(hasActiveAccess({ subscriptionStatus: "active", subscriptionExpiresAt: null })).toBe(true);
  });

  it("grants access for an active subscription still within its paid period", () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(hasActiveAccess({ subscriptionStatus: "active", subscriptionExpiresAt: future })).toBe(true);
  });

  it("denies an active subscription whose period has expired", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(hasActiveAccess({ subscriptionStatus: "active", subscriptionExpiresAt: past })).toBe(false);
  });

  it("denies trial / expired / cancelled / unknown / null statuses", () => {
    for (const status of ["trial", "expired", "cancelled", "something-else", null]) {
      expect(hasActiveAccess({ subscriptionStatus: status, subscriptionExpiresAt: null })).toBe(false);
    }
  });
});

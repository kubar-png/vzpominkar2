import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * resolveSeniorIdByToken — read-only token → senior-id lookup.
 *
 * This is the lightweight resolver the /q/{token} route uses to detect, BEFORE
 * consuming anything, that a DIFFERENT user (the owner) is already signed in —
 * so the senior magic link never clobbers a logged-in owner session. It must:
 *   - reject malformed tokens cheaply, with NO admin/DB call (same regex guard as
 *     the consuming path)
 *   - for a well-formed token, return the senior id the DB resolves, or null.
 *
 * We mock the service-role client and count how often it is constructed, to prove
 * the malformed path short-circuits before touching the DB.
 */

let adminCalls = 0;
let resolvedRow: { id: string } | null = null;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    adminCalls += 1;
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: resolvedRow }),
            }),
          }),
        }),
      }),
    };
  },
}));

import { resolveSeniorIdByToken } from "@/lib/auth/senior-magic";

const VALID_TOKEN = "a".repeat(64); // 64 hex chars (32 bytes)

describe("resolveSeniorIdByToken", () => {
  beforeEach(() => {
    adminCalls = 0;
    resolvedRow = null;
  });

  it.each([
    "",
    "short",
    "g".repeat(64), // non-hex char
    "A".repeat(64), // uppercase hex not allowed by the guard
    "a".repeat(31), // one below the lower bound
    "a".repeat(129), // one above the upper bound
    "a".repeat(64) + " ", // trailing space
    "../../etc/passwd",
  ])("rejects malformed token %j with NO db hit", async (bad) => {
    const result = await resolveSeniorIdByToken(bad);
    expect(result).toBeNull();
    expect(adminCalls).toBe(0);
  });

  it("returns the senior id when the token resolves", async () => {
    resolvedRow = { id: "senior-123" };
    const result = await resolveSeniorIdByToken(VALID_TOKEN);
    expect(result).toBe("senior-123");
    expect(adminCalls).toBe(1);
  });

  it("returns null when a well-formed token matches no senior", async () => {
    resolvedRow = null;
    const result = await resolveSeniorIdByToken(VALID_TOKEN);
    expect(result).toBeNull();
    expect(adminCalls).toBe(1);
  });
});

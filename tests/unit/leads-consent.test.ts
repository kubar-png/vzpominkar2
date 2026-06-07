import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * /api/leads — marketing-consent enforcement + autoresponder (GDPR opt-in).
 *
 * Invariants:
 *   • A submit WITHOUT a ticked consent box is rejected before anything is
 *     stored or sent — redirect carries ?signup=consent.
 *   • A submit WITH consent stores marketing_consent=true + the exact label
 *     text + a consent_at timestamp, then fires the single welcome e-mail.
 *   • The welcome template carries the VITEJTE200 coupon both in the CTA link
 *     (/onboarding?coupon=VITEJTE200) and as visible text.
 *
 * Everything the route imports is mocked; we record the leads upsert payload
 * and every sendEmail call.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/site", () => ({ SITE_URL: "https://vzpominkar.cz" }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitWithHeaders: vi.fn(async () => ({ ok: true })),
}));

const sendEmail = vi.fn(async (_msg: { to: string; tag?: string }) => ({ id: "e1" }));
vi.mock("@/lib/email/send", () => ({
  sendEmail: (msg: { to: string; tag?: string }) => sendEmail(msg),
}));

const providerSend = vi.fn(async () => ({ id: "n1" }));
vi.mock("@/lib/email/provider", () => ({
  getEmailProvider: () => ({ send: providerSend }),
}));

// Record the leads upsert payload + onConflict opts.
let upsertCalls: Array<{ payload: unknown; opts: unknown }>;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (_table: string) => ({
      upsert: (payload: unknown, opts: unknown) => {
        upsertCalls.push({ payload, opts });
        return Promise.resolve({ error: null });
      },
    }),
  }),
}));

import { POST, LEAD_CONSENT_TEXT } from "@/app/api/leads/route";
import { leadWelcomeEmail, LEAD_WELCOME_COUPON } from "@/lib/email/templates";

function formRequest(fields: Record<string, string>): Request {
  const body = new URLSearchParams(fields);
  return new Request("https://vzpominkar.cz/api/leads", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

beforeEach(() => {
  upsertCalls = [];
  sendEmail.mockClear();
  providerSend.mockClear();
});

describe("/api/leads — consent enforcement", () => {
  it("rejects a submit without the consent checkbox (no store, no send)", async () => {
    const res = await POST(formRequest({ email: "test@example.com" }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("signup=consent");
    expect(upsertCalls).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects when consent is present but not affirmatively ticked", async () => {
    const res = await POST(formRequest({ email: "test@example.com", consent: "off" }));
    expect(res.headers.get("location")).toContain("signup=consent");
    expect(upsertCalls).toHaveLength(0);
  });

  it("rejects an invalid email outright (signup=error)", async () => {
    const res = await POST(formRequest({ email: "not-an-email", consent: "on" }));
    expect(res.headers.get("location")).toContain("signup=error");
    expect(upsertCalls).toHaveLength(0);
  });
});

describe("/api/leads — accepted submit with consent", () => {
  it("stores consent fields and sends the single welcome e-mail", async () => {
    const res = await POST(formRequest({ email: "test@example.com", consent: "on" }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("signup=success");

    // Lead persisted first, with the auditable consent snapshot.
    expect(upsertCalls).toHaveLength(1);
    const payload = upsertCalls[0]!.payload as Record<string, unknown>;
    expect(payload.email).toBe("test@example.com");
    expect(payload.marketing_consent).toBe(true);
    expect(payload.consent_text).toBe(LEAD_CONSENT_TEXT);
    expect(typeof payload.consent_at).toBe("string");
    expect(Number.isNaN(Date.parse(payload.consent_at as string))).toBe(false);

    // Exactly one autoresponder to the visitor.
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const msg = sendEmail.mock.calls[0]![0];
    expect(msg.to).toBe("test@example.com");
    expect(msg.tag).toBe("lead_welcome");
  });
});

describe("leadWelcomeEmail template", () => {
  it("carries the launch coupon in the CTA link and as visible text", () => {
    const tpl = leadWelcomeEmail();
    expect(LEAD_WELCOME_COUPON).toBe("VITEJTE200");
    expect(tpl.html).toContain("/onboarding?coupon=VITEJTE200");
    expect(tpl.html).toContain("VITEJTE200");
    expect(tpl.html).toContain("platí 200 Kč sleva, použijte i příště");
    expect(tpl.text).toContain("https://vzpominkar.cz/onboarding?coupon=VITEJTE200");
    expect(tpl.text).toContain("VITEJTE200");
    expect(tpl.subject).toMatch(/200 Kč/);
  });
});

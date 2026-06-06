import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * updateDeliverySettings — owner attestation persistence (corr-03).
 *
 * GDPR Art. 6(1)(f): SMS/WhatsApp are sent on a legitimate-interest basis after a
 * truthful OWNER attestation (NOT consent on the senior's behalf). Persisting a
 * FRESH attestation must also clear that channel's `*_opt_out_at` (corr-03) so a
 * (re-)attested number is not permanently masked by a prior opt-out — otherwise an
 * owner who fixes a number / re-confirms could never resume delivery.
 *
 * We mock the owner-permission check, next/cache, and the Supabase admin client,
 * capturing the exact `profiles` UPDATE payload, and FREEZE time so the
 * `*_attested_at` stamp is deterministic. Tests assert:
 *   - sms attestation:      sms_opt_out_at = null (corr-03), whatsapp untouched
 *   - whatsapp attestation:  whatsapp_opt_out_at = null (corr-03), sms untouched
 *   - email (no attestation): NEITHER *_opt_out_at key is written (a save can't
 *                             silently un-opt-out a phone channel)
 *   - the attested-at timestamp equals the frozen `now`
 */

vi.mock("@/lib/auth/permissions", () => ({
  requireOwnerOfFamily: vi.fn(async () => ({ id: "owner-1" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Capture the profiles UPDATE payload + the row filters.
interface Captured {
  update: Record<string, unknown> | null;
  eqs: [string, unknown][];
}
let captured: Captured;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "profiles") throw new Error(`unexpected table: ${table}`);
      const b: Record<string, unknown> = {};
      b.update = (payload: Record<string, unknown>) => {
        captured.update = payload;
        return b;
      };
      b.eq = (col: string, val: unknown) => {
        captured.eqs.push([col, val]);
        return b;
      };
      // Awaiting the update→eq→eq→eq chain resolves to { error: null }.
      b.then = (resolve: (v: unknown) => void) => resolve({ error: null });
      return b;
    },
  }),
}));

import { updateDeliverySettings } from "@/lib/auth/senior-actions";

const FROZEN = "2026-06-06T10:00:00.000Z";

function baseForm(over: Record<string, unknown> = {}) {
  return {
    contactChannel: "sms",
    contactAddress: null,
    phoneE164: "+420777123456",
    channelAttestation: true,
    channelAttestationText: "Potvrzuji, že …",
    promptFrequency: 1 as const,
    ...over,
  };
}

describe("updateDeliverySettings — corr-03 fresh attestation clears *_opt_out_at", () => {
  beforeEach(() => {
    captured = { update: null, eqs: [] };
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FROZEN));
  });

  it("a fresh SMS attestation clears sms_opt_out_at and stamps sms_attested_at = now()", async () => {
    const res = await updateDeliverySettings("fam-1", "senior-1", baseForm());
    vi.useRealTimers();

    expect(res).toEqual({ ok: true });
    const u = captured.update!;
    expect(u.contact_channel).toBe("sms");
    expect(u.phone_e164).toBe("+420777123456");
    expect(u.channel_attestation_text).toBe("Potvrzuji, že …");
    expect(u.sms_attested_at).toBe(FROZEN); // frozen → deterministic stamp
    expect(u.whatsapp_attested_at).toBeNull();
    // corr-03: the SMS opt-out is cleared on a fresh SMS attestation …
    expect("sms_opt_out_at" in u).toBe(true);
    expect(u.sms_opt_out_at).toBeNull();
    // … but the OTHER channel's opt-out is NOT touched.
    expect("whatsapp_opt_out_at" in u).toBe(false);
    // Scoped to the right senior row.
    expect(captured.eqs).toEqual(
      expect.arrayContaining([
        ["id", "senior-1"],
        ["family_id", "fam-1"],
        ["role", "senior"],
      ]),
    );
  });

  it("a fresh WhatsApp attestation clears whatsapp_opt_out_at and leaves sms_opt_out_at untouched", async () => {
    const res = await updateDeliverySettings(
      "fam-1",
      "senior-1",
      baseForm({ contactChannel: "whatsapp" }),
    );
    vi.useRealTimers();

    expect(res).toEqual({ ok: true });
    const u = captured.update!;
    expect(u.contact_channel).toBe("whatsapp");
    expect(u.whatsapp_attested_at).toBe(FROZEN);
    expect(u.sms_attested_at).toBeNull();
    // corr-03: WhatsApp opt-out cleared; SMS opt-out key absent.
    expect("whatsapp_opt_out_at" in u).toBe(true);
    expect(u.whatsapp_opt_out_at).toBeNull();
    expect("sms_opt_out_at" in u).toBe(false);
  });

  it("switching to EMAIL writes NEITHER *_opt_out_at key (a save cannot silently un-opt-out a phone channel)", async () => {
    const res = await updateDeliverySettings(
      "fam-1",
      "senior-1",
      baseForm({
        contactChannel: "email",
        contactAddress: "marie@example.com",
        phoneE164: null,
        channelAttestation: false,
        channelAttestationText: null,
      }),
    );
    vi.useRealTimers();

    expect(res).toEqual({ ok: true });
    const u = captured.update!;
    expect(u.contact_channel).toBe("email");
    // No attestation → both attested-at columns nulled, phone cleared, attestation text cleared.
    expect(u.sms_attested_at).toBeNull();
    expect(u.whatsapp_attested_at).toBeNull();
    expect(u.phone_e164).toBeNull();
    expect(u.channel_attestation_text).toBeNull();
    expect(u.contact_address).toBe("marie@example.com");
    // Crucially: NO opt-out clear is spread for a non-attestation save.
    expect("sms_opt_out_at" in u).toBe(false);
    expect("whatsapp_opt_out_at" in u).toBe(false);
  });

  it("rejects an SMS save without a phone number (never trusts the client)", async () => {
    const res = await updateDeliverySettings(
      "fam-1",
      "senior-1",
      baseForm({ phoneE164: null }),
    );
    vi.useRealTimers();
    expect(res.ok).toBe(false);
    // No UPDATE attempted when the attestation gate fails.
    expect(captured.update).toBeNull();
  });

  it("rejects an SMS save without the owner attestation flag", async () => {
    const res = await updateDeliverySettings(
      "fam-1",
      "senior-1",
      baseForm({ channelAttestation: false }),
    );
    vi.useRealTimers();
    expect(res.ok).toBe(false);
    expect(captured.update).toBeNull();
  });
});

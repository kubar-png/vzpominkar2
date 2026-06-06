import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * dispatchPrompt — the single delivery seam (spec §4.2 / §8).
 *
 * We mock the provider registry (@/lib/messaging/index) so we can assert whether
 * a provider was invoked, and drive a hand-rolled Supabase admin stub keyed on
 * the prompt_delivery_log lookup. Tests cover:
 *   - a 'sent' log row short-circuits to 'skipped' WITHOUT calling the provider
 *   - no log row → provider is called and the row is updated to 'sent'
 *   - an opted-out (sms_opt_out_at set) sms senior falls back to the EMAIL channel
 */

// ── Mock the provider registry: getProvider(channel).send(...) ────────────────
// isLive: true mirrors a credential-backed provider — resolveDelivery (corr-01)
// only routes sms/whatsapp when getProvider(channel).isLive, falling back to
// email for a noop, so the mock must report itself live to exercise that path.
const sendMock = vi.fn(async () => ({ providerMessageId: "prov-msg-1", segments: 3, price: 1.5 }));
const getProviderMock = vi.fn((_channel: string) => ({ send: sendMock, isLive: true }));

vi.mock("@/lib/messaging/index", () => ({
  getProvider: (channel: string) => getProviderMock(channel),
}));

import { dispatchPrompt, type DispatchContext } from "@/lib/messaging/dispatch";

// ── Supabase admin stub ───────────────────────────────────────────────────────
type LogRow = { id: string; status: string } | null;

interface AdminState {
  /** What the (assignment, channel) lookup on prompt_delivery_log returns. */
  existing: LogRow;
  /** Recorded update payloads against prompt_delivery_log. */
  updates: Record<string, unknown>[];
  /** Recorded inserts against prompt_delivery_log. */
  inserts: Record<string, unknown>[];
}

function makeAdmin(state: AdminState) {
  // Builder for prompt_delivery_log. select→eq→eq→maybeSingle returns `existing`;
  // insert→select→maybeSingle returns a fresh id; update→eq records the payload.
  function logBuilder() {
    let mode: "select" | "insert" | "update" = "select";
    let insertPayload: Record<string, unknown> | null = null;
    let updatePayload: Record<string, unknown> | null = null;
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.eq = () => b;
    b.insert = (payload: Record<string, unknown>) => {
      mode = "insert";
      insertPayload = payload;
      state.inserts.push(payload);
      return b;
    };
    b.update = (payload: Record<string, unknown>) => {
      mode = "update";
      updatePayload = payload;
      return b;
    };
    b.maybeSingle = async () => {
      if (mode === "insert") return { data: { id: "new-log-id" }, error: null };
      return { data: state.existing, error: null };
    };
    // update path resolves on awaiting the .eq() chain
    b.then = (resolve: (v: unknown) => void) => {
      if (mode === "update" && updatePayload) state.updates.push(updatePayload);
      resolve({ data: null, error: null });
    };
    void insertPayload;
    return b;
  }

  return {
    from: (table: string) => {
      if (table === "prompt_delivery_log") return logBuilder();
      throw new Error(`unexpected table in dispatch test: ${table}`);
    },
  };
}

const asAdmin = (m: unknown) => m as unknown as Parameters<typeof dispatchPrompt>[0];

function baseCtx(over: Partial<DispatchContext> = {}): DispatchContext {
  return {
    assignmentId: "a1",
    familyId: "f1",
    question: "Vzpomeneš si na svůj první školní den?",
    appUrl: "https://vzpominkar.cz",
    senior: {
      display_name: "Babička Marie",
      email: "marie@example.com",
      contact_channel: "email",
      contact_address: null,
      magic_token: "tok-123",
      phone_e164: null,
      sms_attested_at: null,
      whatsapp_attested_at: null,
      sms_opt_out_at: null,
      whatsapp_opt_out_at: null,
    },
    owner: { email: "owner@example.com", display_name: "Jakub Novák" },
    ...over,
  };
}

describe("dispatchPrompt — idempotency", () => {
  beforeEach(() => {
    sendMock.mockClear();
    getProviderMock.mockClear();
  });

  it("returns 'skipped' and does NOT call the provider when a 'sent' row exists", async () => {
    const state: AdminState = { existing: { id: "log-1", status: "sent" }, updates: [], inserts: [] };
    const res = await dispatchPrompt(asAdmin(makeAdmin(state)), baseCtx());

    expect(res).toEqual({ status: "skipped", channel: "email" });
    expect(sendMock).not.toHaveBeenCalled();
    expect(state.inserts).toHaveLength(0);
    expect(state.updates).toHaveLength(0);
  });

  it("when no row exists: inserts pending, calls the provider, updates the row to 'sent'", async () => {
    const state: AdminState = { existing: null, updates: [], inserts: [] };
    const res = await dispatchPrompt(asAdmin(makeAdmin(state)), baseCtx());

    expect(res).toEqual({ status: "sent", channel: "email" });
    expect(getProviderMock).toHaveBeenCalledWith("email");
    expect(sendMock).toHaveBeenCalledOnce();
    // pending row inserted
    expect(state.inserts[0]).toMatchObject({ channel: "email", status: "pending" });
    // final update flips it to sent with the provider message id
    const sentUpdate = state.updates.find((u) => u.status === "sent");
    expect(sentUpdate).toBeTruthy();
    expect(sentUpdate).toMatchObject({ status: "sent", provider_message_id: "prov-msg-1" });
  });
});

describe("dispatchPrompt — opt-out channel resolution", () => {
  beforeEach(() => {
    sendMock.mockClear();
    getProviderMock.mockClear();
  });

  it("an opted-OUT sms senior falls back to email", async () => {
    const state: AdminState = { existing: null, updates: [], inserts: [] };
    const ctx = baseCtx({
      senior: {
        display_name: "Babička Marie",
        email: "marie@example.com",
        contact_channel: "sms",
        contact_address: null,
        magic_token: "tok-123",
        phone_e164: "+420777123456",
        sms_attested_at: "2026-01-01T00:00:00Z",
        whatsapp_attested_at: null,
        sms_opt_out_at: "2026-05-01T00:00:00Z", // opted back out
        whatsapp_opt_out_at: null,
      },
    });

    const res = await dispatchPrompt(asAdmin(makeAdmin(state)), ctx);

    expect(res.status).toBe("sent");
    expect(res.channel).toBe("email"); // demoted from sms → email
    expect(getProviderMock).toHaveBeenCalledWith("email");
    expect(getProviderMock).not.toHaveBeenCalledWith("sms");
    expect(state.inserts[0]).toMatchObject({ channel: "email", recipient_address: "marie@example.com" });
  });

  it("a properly opted-in sms senior dispatches on the sms channel", async () => {
    const state: AdminState = { existing: null, updates: [], inserts: [] };
    const ctx = baseCtx({
      senior: {
        display_name: "Babička Marie",
        email: "marie@example.com",
        contact_channel: "sms",
        contact_address: null,
        magic_token: "tok-123",
        phone_e164: "+420777123456",
        sms_attested_at: "2026-01-01T00:00:00Z",
        whatsapp_attested_at: null,
        sms_opt_out_at: null, // still opted in (attested, not opted out)
        whatsapp_opt_out_at: null,
      },
    });

    const res = await dispatchPrompt(asAdmin(makeAdmin(state)), ctx);

    expect(res).toEqual({ status: "sent", channel: "sms" });
    expect(getProviderMock).toHaveBeenCalledWith("sms");
    expect(state.inserts[0]).toMatchObject({ channel: "sms", recipient_address: "+420777123456" });
  });

  it("an attested sms senior whose provider is NOT live falls back to email (corr-01)", async () => {
    // Provider reports isLive:false (creds unset / noop) → resolveDelivery must
    // demote to email so a synthetic 'sent' never silently loses the question.
    getProviderMock.mockImplementation((_channel: string) => ({ send: sendMock, isLive: false }));
    const state: AdminState = { existing: null, updates: [], inserts: [] };
    const ctx = baseCtx({
      senior: {
        display_name: "Babička Marie",
        email: "marie@example.com",
        contact_channel: "sms",
        contact_address: null,
        magic_token: "tok-123",
        phone_e164: "+420777123456",
        sms_attested_at: "2026-01-01T00:00:00Z",
        whatsapp_attested_at: null,
        sms_opt_out_at: null,
        whatsapp_opt_out_at: null,
      },
    });

    const res = await dispatchPrompt(asAdmin(makeAdmin(state)), ctx);

    expect(res.channel).toBe("email"); // demoted: sms provider not live
    expect(getProviderMock).toHaveBeenCalledWith("sms"); // liveness was consulted
    expect(state.inserts[0]).toMatchObject({ channel: "email", recipient_address: "marie@example.com" });

    // Restore the default live implementation so the override doesn't leak.
    getProviderMock.mockImplementation((_channel: string) => ({ send: sendMock, isLive: true }));
  });
});

/**
 * FIX 5 — double-send hazard. The provider.send() is irreversible. If the confirm
 * write fails (returns { error } OR throws) AFTER the message went out, the row
 * must NOT be marked 'failed' (that would make the cron leave reminded_at NULL and
 * RESEND a real SMS). dispatchPrompt must return 'sent' so the cron stamps
 * reminded_at and the row is never re-selected/re-sent.
 *
 * supabase-js never throws on a DB error (it resolves { error }), so the confirm
 * path must check { error } — not rely on a try/catch.
 */
describe("dispatchPrompt — irreversible-send confirm safety (FIX 5)", () => {
  beforeEach(() => {
    sendMock.mockClear();
    getProviderMock.mockClear();
  });

  type ConfirmBehavior = "error" | "throw" | "ok";

  /**
   * Admin stub whose prompt_delivery_log UPDATE that sets status:'sent' (the
   * confirm) misbehaves per `confirm`. The pending-insert + pending-reset updates
   * still succeed. Records every attempted update payload.
   */
  function makeConfirmAdmin(confirm: ConfirmBehavior, updates: Record<string, unknown>[]) {
    function logBuilder() {
      let mode: "select" | "insert" | "update" = "select";
      let updatePayload: Record<string, unknown> | null = null;
      const b: Record<string, unknown> = {};
      b.select = () => b;
      b.eq = () => b;
      b.insert = () => {
        mode = "insert";
        return b;
      };
      b.update = (payload: Record<string, unknown>) => {
        mode = "update";
        updatePayload = payload;
        return b;
      };
      b.maybeSingle = async () => {
        if (mode === "insert") return { data: { id: "new-log-id" }, error: null };
        return { data: null, error: null }; // no existing row
      };
      b.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
        if (mode === "update" && updatePayload) {
          updates.push(updatePayload);
          const isConfirm = updatePayload.status === "sent";
          if (isConfirm && confirm === "throw") {
            (reject ?? (() => {}))(new Error("DB connection reset"));
            return;
          }
          if (isConfirm && confirm === "error") {
            resolve({ data: null, error: { message: "confirm write failed" } });
            return;
          }
        }
        resolve({ data: null, error: null });
      };
      return b;
    }
    return {
      from: (table: string) => {
        if (table === "prompt_delivery_log") return logBuilder();
        throw new Error(`unexpected table: ${table}`);
      },
    };
  }

  it("send OK but the confirm UPDATE returns { error } → still 'sent' (never resend)", async () => {
    const updates: Record<string, unknown>[] = [];
    const res = await dispatchPrompt(asAdmin(makeConfirmAdmin("error", updates)), baseCtx());

    // The message is OUT — must report 'sent' so the cron stamps reminded_at.
    expect(res).toEqual({ status: "sent", channel: "email" });
    expect(sendMock).toHaveBeenCalledOnce();
    // Crucially: the row was NEVER marked 'failed'.
    expect(updates.some((u) => u.status === "failed")).toBe(false);
    // It DID attempt the confirm (and retried it).
    expect(updates.filter((u) => u.status === "sent").length).toBeGreaterThanOrEqual(1);
  });

  it("send OK but the confirm UPDATE THROWS → still 'sent' (never resend)", async () => {
    const updates: Record<string, unknown>[] = [];
    const res = await dispatchPrompt(asAdmin(makeConfirmAdmin("throw", updates)), baseCtx());

    expect(res).toEqual({ status: "sent", channel: "email" });
    expect(sendMock).toHaveBeenCalledOnce();
    expect(updates.some((u) => u.status === "failed")).toBe(false);
  });

  it("provider.send() THROWS → 'failed' (safe to retry next run, marks row failed)", async () => {
    const updates: Record<string, unknown>[] = [];
    sendMock.mockRejectedValueOnce(new Error("smsbrana err=9 (insufficient credit)"));

    const res = await dispatchPrompt(asAdmin(makeConfirmAdmin("ok", updates)), baseCtx());

    expect(res.status).toBe("failed");
    expect(res.channel).toBe("email");
    // The row WAS marked failed (message never went out → safe to resend).
    expect(updates.some((u) => u.status === "failed")).toBe(true);
    expect(updates.some((u) => u.status === "sent")).toBe(false);
  });
});

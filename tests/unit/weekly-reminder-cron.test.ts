import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * weekly-reminder cron — per-row isolation regression guard (spec §8.1).
 *
 * The key invariant: if dispatchPrompt THROWS for one senior, the loop must keep
 * going for the rest of the batch, and the failing row's reminded_at must NOT be
 * stamped (so it retries next run). Everything the route imports is mocked; we
 * drive a fake admin client whose prompt_assignments/profiles/books queries are
 * fixtures, and we record every reminded_at update by assignment id.
 */

// ── Mocks for every module the route imports ──────────────────────────────────
vi.mock("@/lib/cron", () => ({ verifyCronAuth: () => true }));
vi.mock("@/lib/prompts/schedule", () => ({
  planWeeklyQueue: vi.fn(async () => ({ planned: 0, skipped: 0 })),
}));
vi.mock("@/lib/gender", () => ({ resolveGender: (q: string) => q }));
vi.mock("@/lib/site", () => ({ SITE_URL: "https://vzpominkar.cz" }));
vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn(async () => ({ id: "e1" })) }));
vi.mock("@/lib/email/templates", () => ({
  bookFullEmail: () => ({ subject: "s", html: "h", text: "t" }),
}));
vi.mock("@/lib/stripe/server", () => ({ priceForProductCzk: () => 1790 }));

// dispatchPrompt is the unit under isolation — throws for one specific senior.
const dispatchPrompt = vi.fn();
vi.mock("@/lib/messaging/dispatch", () => ({
  dispatchPrompt: (...args: unknown[]) => dispatchPrompt(...args),
}));

// Admin client fixtures + recorded reminded_at writes.
interface CronFixtures {
  assignments: unknown[];
  profiles: unknown[];
  books: unknown[];
  remindedUpdates: string[]; // assignment ids whose reminded_at write was ATTEMPTED
  /** assignment ids whose reminded_at update should resolve { error } (FIX 6). */
  stampError?: Set<string>;
  /** assignment ids whose reminded_at update should THROW at the transport layer. */
  stampThrow?: Set<string>;
}
let fixtures: CronFixtures;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => makeAdmin(),
}));

function makeAdmin() {
  function builder(table: string) {
    let isUpdate = false;
    let eqId: string | null = null;
    const b: Record<string, unknown> = {};
    const chain = [
      "select",
      "eq",
      "in",
      "lte",
      "gte",
      "is",
      "limit",
      "contains",
    ];
    for (const m of chain) {
      b[m] = (...args: unknown[]) => {
        if (m === "eq" && isUpdate && args[0] === "id") eqId = args[1] as string;
        return b;
      };
    }
    b.update = (_payload: Record<string, unknown>) => {
      isUpdate = true;
      return b;
    };
    b.insert = () => b;
    // .returns<T>() resolves the select to { data, error }.
    b.returns = async () => {
      if (table === "prompt_assignments") return { data: fixtures.assignments, error: null };
      if (table === "profiles") return { data: fixtures.profiles, error: null };
      if (table === "books") return { data: fixtures.books, error: null };
      return { data: [], error: null };
    };
    b.maybeSingle = async () => ({ data: null, error: null });
    // Awaiting the update chain (update→eq) records the reminded_at write.
    b.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
      if (isUpdate && table === "prompt_assignments" && eqId) {
        fixtures.remindedUpdates.push(eqId);
        // FIX 6: the stamp update may resolve { error } or reject at the transport
        // layer — the route must catch/continue and NOT abort the batch.
        if (fixtures.stampThrow?.has(eqId)) {
          (reject ?? (() => {}))(new Error("transport reset stamping reminded_at"));
          return;
        }
        if (fixtures.stampError?.has(eqId)) {
          resolve({ data: null, error: { message: "stamp write failed" } });
          return;
        }
      }
      resolve({ data: null, error: null });
    };
    return b;
  }
  return { from: (table: string) => builder(table) };
}

// Import the route AFTER the mocks are registered.
import { GET } from "@/app/api/cron/weekly-reminder/route";

function req() {
  return new Request("https://vzpominkar.cz/api/cron/weekly-reminder", {
    headers: { authorization: "Bearer test" },
  }) as unknown as Parameters<typeof GET>[0];
}

function assignment(id: string, familyId: string) {
  return {
    id,
    family_id: familyId,
    scheduled_for: "2026-06-01",
    prompts: { question: `Otázka ${id}?` },
    families: { senior_display_name: "Senior" },
    books: { status: "collecting" },
  };
}

describe("weekly-reminder cron — per-row isolation", () => {
  beforeEach(() => {
    dispatchPrompt.mockReset();
    fixtures = {
      assignments: [
        assignment("a1", "f1"),
        assignment("a2", "f2"), // this senior's dispatch throws
        assignment("a3", "f3"),
      ],
      profiles: [],
      books: [],
      remindedUpdates: [],
    };
  });

  it("one throwing senior does NOT abort the batch; only the successful rows stamp reminded_at", async () => {
    dispatchPrompt.mockImplementation(async (_admin: unknown, ctx: { assignmentId: string }) => {
      if (ctx.assignmentId === "a2") throw new Error("provider blew up");
      return { status: "sent", channel: "email" };
    });

    const res = await GET(req());
    const body = (await res.json()) as { sent: number; skipped: number; total: number };

    // All three rows were visited despite a2 throwing.
    expect(dispatchPrompt).toHaveBeenCalledTimes(3);
    // a1 and a3 sent; a2 failed → not counted as sent.
    expect(body.sent).toBe(2);
    expect(body.total).toBe(3);

    // The regression guard: a2's reminded_at is NOT stamped (it retries next run);
    // a1 and a3 ARE stamped.
    expect(fixtures.remindedUpdates).toContain("a1");
    expect(fixtures.remindedUpdates).toContain("a3");
    expect(fixtures.remindedUpdates).not.toContain("a2");
  });

  it("a 'skipped' status is counted as skipped and does NOT stamp reminded_at", async () => {
    dispatchPrompt.mockImplementation(async (_admin: unknown, ctx: { assignmentId: string }) => {
      if (ctx.assignmentId === "a2") return { status: "skipped", channel: "email" };
      return { status: "sent", channel: "email" };
    });

    const res = await GET(req());
    const body = (await res.json()) as { sent: number; skipped: number };

    expect(body.sent).toBe(2);
    expect(body.skipped).toBe(1);
    expect(fixtures.remindedUpdates).not.toContain("a2");
  });

  it("a dispatch that resolves 'failed' leaves reminded_at NULL (retried next run)", async () => {
    dispatchPrompt.mockImplementation(async (_admin: unknown, ctx: { assignmentId: string }) => {
      if (ctx.assignmentId === "a2") return { status: "failed", channel: "sms" };
      return { status: "sent", channel: "email" };
    });

    const res = await GET(req());
    const body = (await res.json()) as { sent: number; skipped: number };

    // failed is counted in neither sent nor skipped.
    expect(body.sent).toBe(2);
    expect(body.skipped).toBe(0);
    expect(fixtures.remindedUpdates).not.toContain("a2");
  });
});

/**
 * FIX 6 — the reminded_at stamp is now inside per-row error handling. A stamp
 * update that resolves { error } OR rejects at the transport layer must NOT abort
 * the remaining batch, and the affected row must not be counted as 'sent'.
 */
describe("weekly-reminder cron — reminded_at stamp failure isolation (FIX 6)", () => {
  beforeEach(() => {
    dispatchPrompt.mockReset();
    fixtures = {
      assignments: [assignment("a1", "f1"), assignment("a2", "f2"), assignment("a3", "f3")],
      profiles: [],
      books: [],
      remindedUpdates: [],
    };
    dispatchPrompt.mockResolvedValue({ status: "sent", channel: "email" });
  });

  it("a stamp update that resolves { error } does NOT abort the batch; that row is not counted sent", async () => {
    fixtures.stampError = new Set(["a2"]);

    const res = await GET(req());
    const body = (await res.json()) as { sent: number; total: number };

    // All three rows visited; a2's stamp errored → only a1 + a3 counted sent.
    expect(dispatchPrompt).toHaveBeenCalledTimes(3);
    expect(body.total).toBe(3);
    expect(body.sent).toBe(2);
    // a3 was still attempted AFTER a2's stamp error → batch did not abort.
    expect(fixtures.remindedUpdates).toContain("a3");
  });

  it("a stamp update that THROWS at the transport layer does NOT abort the batch", async () => {
    fixtures.stampThrow = new Set(["a1"]);

    const res = await GET(req());
    const body = (await res.json()) as { sent: number; total: number };

    expect(dispatchPrompt).toHaveBeenCalledTimes(3);
    expect(body.total).toBe(3);
    // a1's stamp threw → not counted; a2 + a3 succeed.
    expect(body.sent).toBe(2);
    expect(fixtures.remindedUpdates).toContain("a2");
    expect(fixtures.remindedUpdates).toContain("a3");
  });
});

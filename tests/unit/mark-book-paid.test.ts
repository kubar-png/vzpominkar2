import { describe, it, expect } from "vitest";
import { markBookPaid } from "@/lib/books/server";

type Call = { table: string; method: string };

// Minimal chainable + awaitable Supabase query-builder stub. Every method
// returns the same builder (chainable); awaiting it (or .single/.maybeSingle)
// resolves to `result`. Each invocation is recorded in `log`.
function builder(table: string, result: unknown, log: Call[]) {
  const b: Record<string, unknown> = {};
  for (const m of ["update", "insert", "select", "eq", "is", "order", "limit"]) {
    b[m] = (..._args: unknown[]) => {
      log.push({ table, method: m });
      return b;
    };
  }
  b.maybeSingle = () => Promise.resolve(result);
  b.single = () => Promise.resolve(result);
  // thenable → `await admin.from(...).update(...).eq(...).select(...)` resolves to result
  b.then = (resolve: (v: unknown) => void) => resolve(result);
  return b;
}

function makeAdmin(booksResult: unknown, log: Call[]) {
  return {
    from: (table: string) =>
      builder(table, table === "books" ? booksResult : { data: null, error: null }, log),
  };
}

const asAdmin = (m: unknown) => m as unknown as Parameters<typeof markBookPaid>[0];
const OPTS = { bookId: "b1", familyId: "f1", actorId: "o1", amountCzk: 2890, paymentIntentId: "pi_1" };

describe("markBookPaid — idempotency", () => {
  it("first payment: activates the family and writes exactly one audit row", async () => {
    const log: Call[] = [];
    await markBookPaid(asAdmin(makeAdmin({ data: [{ id: "b1" }], error: null }, log)), OPTS);
    expect(log.some((c) => c.table === "families" && c.method === "update")).toBe(true);
    expect(log.filter((c) => c.table === "activity_log" && c.method === "insert")).toHaveLength(1);
  });

  it("duplicate delivery (0 rows claimed): re-asserts the family grant, no new audit row", async () => {
    const log: Call[] = [];
    await markBookPaid(asAdmin(makeAdmin({ data: [], error: null }, log)), OPTS);
    expect(log.some((c) => c.table === "families" && c.method === "update")).toBe(true);
    expect(log.some((c) => c.table === "activity_log")).toBe(false);
  });

  it("unique violation (23505) is treated as already-applied, not an error", async () => {
    const log: Call[] = [];
    await expect(
      markBookPaid(asAdmin(makeAdmin({ data: null, error: { code: "23505" } }, log)), OPTS),
    ).resolves.toBeUndefined();
    expect(log.some((c) => c.table === "activity_log")).toBe(false);
  });

  it("propagates other DB errors so the webhook 500s and Stripe retries", async () => {
    const log: Call[] = [];
    await expect(
      markBookPaid(asAdmin(makeAdmin({ data: null, error: { code: "23503", message: "fk" } }, log)), OPTS),
    ).rejects.toBeTruthy();
  });
});

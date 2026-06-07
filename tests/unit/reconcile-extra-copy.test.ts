import { describe, it, expect } from "vitest";
import { reconcileExtraCopyOrder } from "@/app/api/webhooks/stripe/route";

/**
 * reconcileExtraCopyOrder — MONEY path (K1).
 *
 * A paid second printed copy must be flipped draft→paid in book_orders with the
 * amount + payment intent attached, or fulfilment never prints it (violates
 * "paid = delivered"). Mirrors markBookPaid idempotency: the row is claimed with
 * an atomic `status = 'draft' → 'paid'` update, so duplicate / retried webhooks
 * are safe and the audit row is written ONLY on the actual transition.
 *
 * We mock the admin client with a chainable + awaitable builder (like the
 * markBookPaid test) and assert which tables/methods/payloads were touched.
 */

type Call = { table: string; method: string; args: unknown[] };

function builder(table: string, result: unknown, log: Call[]) {
  const b: Record<string, unknown> = {};
  for (const m of ["update", "insert", "select", "eq"]) {
    b[m] = (...args: unknown[]) => {
      log.push({ table, method: m, args });
      return b;
    };
  }
  // Awaiting the update→eq→eq→select(...) chain resolves to `result`.
  b.then = (resolve: (v: unknown) => void) => resolve(result);
  return b;
}

// `claimResult` is what the book_orders update→...→select resolves to:
// non-empty data => the row transitioned; empty => duplicate delivery (no-op).
function makeAdmin(claimResult: unknown, log: Call[]) {
  return {
    from: (table: string) =>
      builder(table, table === "book_orders" ? claimResult : { data: null, error: null }, log),
  };
}

const asAdmin = (m: unknown) => m as unknown as Parameters<typeof reconcileExtraCopyOrder>[0];
const OPTS = { orderId: "ord-1", familyId: "fam-1", amountCzk: 1253, paymentIntentId: "pi_extra" };

describe("reconcileExtraCopyOrder — draft→paid idempotency", () => {
  it("first delivery: claims the draft row as paid (amount + PI) and writes exactly one audit row", async () => {
    const log: Call[] = [];
    await reconcileExtraCopyOrder(asAdmin(makeAdmin({ data: [{ id: "ord-1" }], error: null }, log)), OPTS);

    // The book_orders row is updated with status=paid + amount + payment intent.
    const upd = log.find((c) => c.table === "book_orders" && c.method === "update");
    expect(upd).toBeDefined();
    expect(upd!.args[0]).toMatchObject({
      status: "paid",
      amount_czk: 1253,
      stripe_payment_intent_id: "pi_extra",
    });

    // Atomic claim: scoped to this id AND status='draft' so only the first
    // delivery transitions it.
    const eqs = log.filter((c) => c.table === "book_orders" && c.method === "eq").map((c) => c.args);
    expect(eqs).toEqual(
      expect.arrayContaining([
        ["id", "ord-1"],
        ["status", "draft"],
      ]),
    );

    // Exactly one audit row, tagged as an extra-copy reconciliation.
    const logs = log.filter((c) => c.table === "activity_log" && c.method === "insert");
    expect(logs).toHaveLength(1);
    expect(logs[0]!.args[0]).toMatchObject({
      family_id: "fam-1",
      action: "book_order.paid",
      metadata: { orderId: "ord-1", reason: "extra_copy" },
    });
  });

  it("duplicate delivery (0 rows claimed): no audit row is written", async () => {
    const log: Call[] = [];
    await reconcileExtraCopyOrder(asAdmin(makeAdmin({ data: [], error: null }, log)), OPTS);

    // The claim still ran (idempotent), but no row transitioned → no audit log.
    expect(log.some((c) => c.table === "book_orders" && c.method === "update")).toBe(true);
    expect(log.some((c) => c.table === "activity_log")).toBe(false);
  });

  it("null/undefined claim result is treated as no transition (no audit row)", async () => {
    const log: Call[] = [];
    await reconcileExtraCopyOrder(asAdmin(makeAdmin({ data: null, error: null }, log)), OPTS);
    expect(log.some((c) => c.table === "activity_log")).toBe(false);
  });
});

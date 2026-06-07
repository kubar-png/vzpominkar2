import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  type Period,
  type SeriesPoint,
  type WindowRange,
  bucketize,
  deltaPct,
  windowBounds,
} from "@/lib/admin/stats-window";

/**
 * Read-only business-stats data layer for the admin dashboard.
 *
 * All reads go through the SERVICE-ROLE client (bypasses RLS) — this module is
 * `server-only` and must never be imported from a Client Component. It only
 * reads existing tables; no mutations, no migrations.
 *
 * Periods are ROLLING windows (last 24h / 7d / 30d / 365d). Each metric exposes
 * `value` (current window), `previous` (the equal window before it, for a delta
 * %) and, where useful, a bucketed `series` for a recharts trend.
 *
 * Pure window/delta math lives in `./stats-window` (no DB, fully unit-tested).
 */

export type { Period };
export {
  windowBounds,
  deltaPct,
  PERIOD_MS,
  PERIOD_BUCKET,
  type SeriesPoint,
} from "@/lib/admin/stats-window";

/** A numeric metric over the window, with a precomputed delta vs. previous. */
export interface Metric {
  value: number;
  previous: number;
  /** deltaPct(value, previous), rounded to 1 decimal. */
  deltaPct: number;
}

/** A metric that also carries a trend series for charting. */
export interface SeriesMetric extends Metric {
  series: SeriesPoint[];
}

/** Lightweight row for the "recent paid orders" / "recent leads" tables. */
export interface RecentOrder {
  id: string;
  kind: "book" | "gift" | "reprint";
  amountCzk: number;
  /** ISO timestamp used for sorting/display. */
  at: string;
  /** Best-available human label (buyer name/email, family id, etc.). */
  label: string | null;
}

export interface RecentLead {
  id: string;
  email: string;
  marketingConsent: boolean;
  source: string | null;
  at: string;
}

export interface MemoryTypeBreakdown {
  audio: number;
  text: number;
  photo: number;
}

/** Everything the dashboard renders, for a single period. */
export interface StatsBundle {
  period: Period;
  /** ms-since-epoch anchor the windows were computed against. */
  nowMs: number;
  current: WindowRange;
  previous: WindowRange;

  // — Obchod —
  /** Sum of all paid revenue (books + gift orders + reprints), CZK. */
  revenueCzk: SeriesMetric;
  /** Paid book accesses (first paid book per family = the 2 890 base sale). */
  booksPaid: SeriesMetric;
  /** Paid gift books (shop_orders). */
  giftOrders: Metric;
  /** Paid reprint orders (book_orders). */
  reprints: Metric;
  /** Redeemed coupons (count) + total discount given (CZK). */
  couponsRedeemed: Metric;
  couponDiscountCzk: Metric;

  // — Uživatelé —
  /** New owner families in window; `allTime` = total owners ever. */
  owners: Metric & { allTime: number };
  /** New senior profiles in window; `allTime` = total seniors ever. */
  seniors: Metric & { allTime: number };
  /** Active subscriptions, point-in-time total (no delta). */
  activeSubscriptions: number;

  // — Aktivita —
  /** New memories in window, with all-time type breakdown. */
  memories: SeriesMetric & { byType: MemoryTypeBreakdown };
  /** Answered prompt assignments in window. */
  answeredQuestions: Metric;

  // — Trychtýř —
  /** New leads in window; `withConsent` = how many opted into marketing. */
  leads: Metric & { withConsent: number };

  // — Recent tables —
  recentOrders: RecentOrder[];
  recentLeads: RecentLead[];
}

// ── small helpers ────────────────────────────────────────────────────────────

const ZERO_METRIC: Metric = { value: 0, previous: 0, deltaPct: 0 };

function metric(value: number, previous: number): Metric {
  return { value, previous, deltaPct: deltaPct(value, previous) };
}

function seriesMetric(value: number, previous: number, series: SeriesPoint[]): SeriesMetric {
  return { ...metric(value, previous), series };
}

function ms(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

/** Count rows whose `tsCol` is in the half-open window — exact head-count. */
function inWindow<T>(rows: T[] | null, tsCol: keyof T, range: WindowRange): T[] {
  if (!rows) return [];
  return rows.filter((r) => {
    const t = ms(r[tsCol] as unknown as string | null);
    return t != null && t >= range.startMs && t < range.endMs;
  });
}

/** Null-safe sum of `amount_czk`-like fields. */
function sumAmount<T>(rows: T[], key: keyof T): number {
  let total = 0;
  for (const r of rows) {
    const v = r[key] as unknown as number | null | undefined;
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

// ── main entry point ─────────────────────────────────────────────────────────

/**
 * Fetch the full {@link StatsBundle} for a rolling `period`. `now` is injectable
 * for testing/consistency but defaults to the wall clock; the actual window
 * math is the pure, tested `windowBounds`.
 */
export async function getStats(
  period: Period,
  now: number = Date.now(),
): Promise<StatsBundle> {
  const bounds = windowBounds(period, now);
  const { current, previous } = bounds;
  const admin = createAdminClient();

  // We fetch each metric's rows back to the start of the PREVIOUS window so a
  // single ranged query covers current + previous (and the series). Small data
  // — a 2-window scan per table is cheap and keeps the code obvious.
  const sinceISO = previous.startISO;

  const [
    booksRes,
    shopRes,
    bookOrdersRes,
    couponsRes,
    ownersWinRes,
    ownersAllRes,
    seniorsWinRes,
    seniorsAllRes,
    activeSubsRes,
    memoriesWinRes,
    memoriesTypeRes,
    answeredRes,
    leadsRes,
    recentLeadsRes,
  ] = await Promise.all([
    // Books: paid sales, by paid_at.
    admin
      .from("books")
      .select("id, family_id, amount_czk, paid_at")
      .eq("paid", true)
      .gte("paid_at", sinceISO)
      .returns<
        { id: string; family_id: string; amount_czk: number; paid_at: string | null }[]
      >(),

    // Gift books (shop_orders): paid, by paid_at.
    admin
      .from("shop_orders")
      .select("id, amount_czk, paid_at, buyer_name, buyer_email")
      .eq("status", "paid")
      .gte("paid_at", sinceISO)
      .returns<
        {
          id: string;
          amount_czk: number | null;
          paid_at: string | null;
          buyer_name: string | null;
          buyer_email: string | null;
        }[]
      >(),

    // Reprints (book_orders): paid; no paid_at column → use created_at.
    admin
      .from("book_orders")
      .select("id, family_id, amount_czk, created_at")
      .eq("status", "paid")
      .gte("created_at", sinceISO)
      .returns<
        { id: string; family_id: string; amount_czk: number; created_at: string }[]
      >(),

    // Coupon redemptions, by redeemed_at.
    admin
      .from("coupon_redemptions")
      .select("id, amount_off_czk, redeemed_at")
      .gte("redeemed_at", sinceISO)
      .returns<{ id: string; amount_off_czk: number; redeemed_at: string }[]>(),

    // Owners created in the two-window range.
    admin
      .from("profiles")
      .select("id, created_at")
      .eq("role", "owner")
      .gte("created_at", sinceISO)
      .returns<{ id: string; created_at: string }[]>(),

    // Owners all-time (pure count).
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner"),

    // Seniors created in the two-window range.
    admin
      .from("profiles")
      .select("id, created_at")
      .eq("role", "senior")
      .gte("created_at", sinceISO)
      .returns<{ id: string; created_at: string }[]>(),

    // Seniors all-time (pure count).
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "senior"),

    // Active subscriptions, point-in-time count.
    admin
      .from("families")
      .select("id", { count: "exact", head: true })
      .eq("subscription_status", "active"),

    // Memories created in the two-window range (for window value + series).
    admin
      .from("memories")
      .select("id, created_at")
      .gte("created_at", sinceISO)
      .returns<{ id: string; created_at: string }[]>(),

    // Memory type breakdown (all-time): fields needed to infer the type.
    admin
      .from("memories")
      .select("audio_path, text_content")
      .returns<{ audio_path: string | null; text_content: string | null }[]>(),

    // Answered questions: prompt_assignments with an answered_memory_id.
    admin
      .from("prompt_assignments")
      .select("id, created_at, answered_memory_id")
      .not("answered_memory_id", "is", null)
      .gte("created_at", sinceISO)
      .returns<
        { id: string; created_at: string; answered_memory_id: string | null }[]
      >(),

    // Leads created in the two-window range.
    admin
      .from("leads")
      .select("id, created_at, marketing_consent")
      .gte("created_at", sinceISO)
      .returns<{ id: string; created_at: string; marketing_consent: boolean }[]>(),

    // Most recent leads (for the recent-leads table).
    admin
      .from("leads")
      .select("id, email, marketing_consent, source, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<
        {
          id: string;
          email: string;
          marketing_consent: boolean;
          source: string | null;
          created_at: string;
        }[]
      >(),
  ]);

  // ── Obchod: revenue + counts ───────────────────────────────────────────────
  const booksCur = inWindow(booksRes.data, "paid_at", current);
  const booksPrev = inWindow(booksRes.data, "paid_at", previous);
  const shopCur = inWindow(shopRes.data, "paid_at", current);
  const shopPrev = inWindow(shopRes.data, "paid_at", previous);
  const reprintsCur = inWindow(bookOrdersRes.data, "created_at", current);
  const reprintsPrev = inWindow(bookOrdersRes.data, "created_at", previous);

  const revenueCur =
    sumAmount(booksCur, "amount_czk") +
    sumAmount(shopCur, "amount_czk") +
    sumAmount(reprintsCur, "amount_czk");
  const revenuePrev =
    sumAmount(booksPrev, "amount_czk") +
    sumAmount(shopPrev, "amount_czk") +
    sumAmount(reprintsPrev, "amount_czk");

  // Revenue series: every paid event in the current window, valued by amount.
  const revenueEvents = [
    ...booksCur.map((b) => ({ tsMs: ms(b.paid_at)!, value: b.amount_czk ?? 0 })),
    ...shopCur.map((s) => ({ tsMs: ms(s.paid_at)!, value: s.amount_czk ?? 0 })),
    ...reprintsCur.map((r) => ({ tsMs: ms(r.created_at)!, value: r.amount_czk ?? 0 })),
  ].filter((e) => Number.isFinite(e.tsMs));
  const revenueSeries = bucketize(revenueEvents, period, now);

  const revenueCzk = seriesMetric(revenueCur, revenuePrev, revenueSeries);

  // Books paid (count) + series.
  const booksSeries = bucketize(
    booksCur.map((b) => ({ tsMs: ms(b.paid_at)! })).filter((e) => Number.isFinite(e.tsMs)),
    period,
    now,
  );
  const booksPaid = seriesMetric(booksCur.length, booksPrev.length, booksSeries);

  const giftOrders = metric(shopCur.length, shopPrev.length);
  const reprints = metric(reprintsCur.length, reprintsPrev.length);

  // Coupons.
  const couponsCur = inWindow(couponsRes.data, "redeemed_at", current);
  const couponsPrev = inWindow(couponsRes.data, "redeemed_at", previous);
  const couponsRedeemed = metric(couponsCur.length, couponsPrev.length);
  const couponDiscountCzk = metric(
    sumAmount(couponsCur, "amount_off_czk"),
    sumAmount(couponsPrev, "amount_off_czk"),
  );

  // ── Uživatelé ────────────────────────────────────────────────────────────
  const ownersCur = inWindow(ownersWinRes.data, "created_at", current);
  const ownersPrev = inWindow(ownersWinRes.data, "created_at", previous);
  const owners = {
    ...metric(ownersCur.length, ownersPrev.length),
    allTime: ownersAllRes.count ?? 0,
  };

  const seniorsCur = inWindow(seniorsWinRes.data, "created_at", current);
  const seniorsPrev = inWindow(seniorsWinRes.data, "created_at", previous);
  const seniors = {
    ...metric(seniorsCur.length, seniorsPrev.length),
    allTime: seniorsAllRes.count ?? 0,
  };

  const activeSubscriptions = activeSubsRes.count ?? 0;

  // ── Aktivita ─────────────────────────────────────────────────────────────
  const memCur = inWindow(memoriesWinRes.data, "created_at", current);
  const memPrev = inWindow(memoriesWinRes.data, "created_at", previous);
  const memSeries = bucketize(
    memCur.map((m) => ({ tsMs: ms(m.created_at)! })).filter((e) => Number.isFinite(e.tsMs)),
    period,
    now,
  );
  const byType: MemoryTypeBreakdown = { audio: 0, text: 0, photo: 0 };
  for (const m of memoriesTypeRes.data ?? []) {
    if (m.audio_path != null) byType.audio++;
    else if (m.text_content != null) byType.text++;
    else byType.photo++;
  }
  const memories = { ...seriesMetric(memCur.length, memPrev.length, memSeries), byType };

  const ansCur = inWindow(answeredRes.data, "created_at", current);
  const ansPrev = inWindow(answeredRes.data, "created_at", previous);
  const answeredQuestions = metric(ansCur.length, ansPrev.length);

  // ── Trychtýř ─────────────────────────────────────────────────────────────
  const leadsCur = inWindow(leadsRes.data, "created_at", current);
  const leadsPrev = inWindow(leadsRes.data, "created_at", previous);
  const leads = {
    ...metric(leadsCur.length, leadsPrev.length),
    withConsent: leadsCur.filter((l) => l.marketing_consent === true).length,
  };

  // ── Recent tables ─────────────────────────────────────────────────────────
  const recentOrders: RecentOrder[] = [
    ...(booksRes.data ?? [])
      .filter((b) => b.paid_at != null)
      .map<RecentOrder>((b) => ({
        id: b.id,
        kind: "book",
        amountCzk: b.amount_czk ?? 0,
        at: b.paid_at!,
        label: b.family_id,
      })),
    ...(shopRes.data ?? [])
      .filter((s) => s.paid_at != null)
      .map<RecentOrder>((s) => ({
        id: s.id,
        kind: "gift",
        amountCzk: s.amount_czk ?? 0,
        at: s.paid_at!,
        label: s.buyer_name ?? s.buyer_email,
      })),
    ...(bookOrdersRes.data ?? []).map<RecentOrder>((r) => ({
      id: r.id,
      kind: "reprint",
      amountCzk: r.amount_czk ?? 0,
      at: r.created_at,
      label: r.family_id,
    })),
  ]
    .sort((a, b) => (ms(b.at) ?? 0) - (ms(a.at) ?? 0))
    .slice(0, 10);

  const recentLeads: RecentLead[] = (recentLeadsRes.data ?? []).map((l) => ({
    id: l.id,
    email: l.email,
    marketingConsent: l.marketing_consent,
    source: l.source,
    at: l.created_at,
  }));

  return {
    period,
    nowMs: now,
    current,
    previous,
    revenueCzk,
    booksPaid,
    giftOrders,
    reprints,
    couponsRedeemed,
    couponDiscountCzk,
    owners,
    seniors,
    activeSubscriptions,
    memories,
    answeredQuestions,
    leads,
    recentOrders,
    recentLeads,
  };
}

// Re-exported so a caller can build an "empty" placeholder without a DB hit.
export const EMPTY_METRIC = ZERO_METRIC;

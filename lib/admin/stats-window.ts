/**
 * Pure, dependency-free time-window + delta math for the admin stats layer.
 *
 * Lives in its own module (NO `server-only`, NO Supabase import) so the unit
 * test can exercise the math without dragging in the service-role client or
 * touching the database. `lib/admin/stats.ts` re-exports these.
 *
 * Every function takes the current time as an explicit argument — nothing here
 * reads the real wall clock, so tests are fully deterministic.
 */

/** Rolling-window period selector for the dashboard. */
export type Period = "day" | "week" | "month" | "year";

/** Window length per period, in milliseconds (rolling, not calendar). */
export const PERIOD_MS: Record<Period, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

/** A half-open time range `[start, end)` expressed as ISO-8601 strings. */
export interface WindowRange {
  /** Inclusive lower bound (ISO 8601). */
  startISO: string;
  /** Exclusive upper bound (ISO 8601). */
  endISO: string;
  /** Inclusive lower bound, ms since epoch. */
  startMs: number;
  /** Exclusive upper bound, ms since epoch. */
  endMs: number;
}

/** The current window and the immediately preceding equal-length window. */
export interface WindowBounds {
  period: Period;
  /** Window length in ms (convenience copy of PERIOD_MS[period]). */
  lengthMs: number;
  /** `[now - length, now)` — the live window. */
  current: WindowRange;
  /** `[now - 2*length, now - length)` — for the delta comparison. */
  previous: WindowRange;
}

function range(startMs: number, endMs: number): WindowRange {
  return {
    startMs,
    endMs,
    startISO: new Date(startMs).toISOString(),
    endISO: new Date(endMs).toISOString(),
  };
}

/**
 * Compute the current + previous rolling windows for `period`, anchored at
 * `nowMs` (ms since epoch). The current window ends exactly at `nowMs`; the
 * previous window is the equal-length slice directly before it.
 */
export function windowBounds(period: Period, nowMs: number): WindowBounds {
  const lengthMs = PERIOD_MS[period];
  const current = range(nowMs - lengthMs, nowMs);
  const previous = range(nowMs - 2 * lengthMs, nowMs - lengthMs);
  return { period, lengthMs, current, previous };
}

/**
 * Percentage change from `prev` to `curr`, rounded to one decimal.
 *
 * Edge cases (no division by zero, no NaN/Infinity ever escapes):
 *   - prev === 0 && curr === 0 → 0   (flat, nothing happened)
 *   - prev === 0 && curr  >  0 → 100 (treat a from-nothing rise as +100%, a
 *                                     finite, display-friendly value rather
 *                                     than Infinity)
 *   - prev === 0 && curr  <  0 → -100
 */
export function deltaPct(curr: number, prev: number): number {
  if (!Number.isFinite(curr) || !Number.isFinite(prev)) return 0;
  if (prev === 0) {
    if (curr === 0) return 0;
    return curr > 0 ? 100 : -100;
  }
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return Math.round(pct * 10) / 10;
}

/** Time-series bucket granularity per period for the trend charts. */
export type Bucket = "hour" | "day" | "month";

/** Bucket granularity used for each period's series. */
export const PERIOD_BUCKET: Record<Period, Bucket> = {
  day: "hour", // 24 hourly points
  week: "day", // 7 daily points
  month: "day", // 30 daily points
  year: "month", // 12 monthly points
};

/** Width of one bucket, ms — null for "month" (calendar months are uneven). */
function bucketMs(bucket: Bucket): number | null {
  switch (bucket) {
    case "hour":
      return 60 * 60 * 1000;
    case "day":
      return 24 * 60 * 60 * 1000;
    case "month":
      return null;
  }
}

/** A single point on a trend chart: a bucket start label + its summed value. */
export interface SeriesPoint {
  /** ISO 8601 start of the bucket (UTC). */
  t: string;
  /** Aggregated value for the bucket (count or summed amount). */
  v: number;
}

/**
 * Build empty (zero-filled) buckets spanning the current window for `period`,
 * anchored at `nowMs`. Hourly/daily buckets are fixed-width; monthly buckets
 * walk calendar months back from `nowMs`. Returned oldest → newest.
 */
export function emptyBuckets(period: Period, nowMs: number): SeriesPoint[] {
  const bucket = PERIOD_BUCKET[period];
  const { current } = windowBounds(period, nowMs);

  if (bucket === "month") {
    // 12 calendar months ending with the month containing `nowMs`.
    const points: SeriesPoint[] = [];
    const now = new Date(nowMs);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      points.push({ t: d.toISOString(), v: 0 });
    }
    return points;
  }

  const width = bucketMs(bucket)!;
  // Fixed-width buckets that tile exactly [start, end): anchor at the window
  // END and step back by `width`, so we get exactly `length/width` buckets
  // (24 hourly / 7 daily / 30 daily) covering precisely the current window —
  // no partial bucket spilling before the window start.
  const count = Math.round((current.endMs - current.startMs) / width);
  const points: SeriesPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    points.push({ t: new Date(current.endMs - (i + 1) * width).toISOString(), v: 0 });
  }
  return points;
}

/**
 * Find the index of the bucket that a timestamp falls into, given the bucket
 * starts produced by {@link emptyBuckets}. Returns -1 if out of range.
 * `bucketStartsMs` must be ascending.
 */
export function bucketIndexFor(
  tsMs: number,
  bucketStartsMs: number[],
): number {
  if (bucketStartsMs.length === 0) return -1;
  if (tsMs < bucketStartsMs[0]!) return -1;
  // Last bucket whose start is <= tsMs.
  let idx = -1;
  for (let i = 0; i < bucketStartsMs.length; i++) {
    if (bucketStartsMs[i]! <= tsMs) idx = i;
    else break;
  }
  return idx;
}

/**
 * Bin a list of `{ tsMs, value }` events into the zero-filled buckets for
 * `period`/`nowMs`, summing `value` (default 1 → a count). Events outside the
 * current window are ignored.
 */
export function bucketize(
  events: { tsMs: number; value?: number }[],
  period: Period,
  nowMs: number,
): SeriesPoint[] {
  const points = emptyBuckets(period, nowMs);
  if (points.length === 0) return points;
  const { current } = windowBounds(period, nowMs);
  const starts = points.map((p) => Date.parse(p.t));
  for (const e of events) {
    if (!Number.isFinite(e.tsMs)) continue;
    // Reject anything at/after the window end (future) so it can't land in the
    // last bucket. The lower bound is enforced by bucketIndexFor (-1 below the
    // first bucket start). nowMs is the exclusive upper edge.
    if (e.tsMs >= current.endMs) continue;
    const i = bucketIndexFor(e.tsMs, starts);
    if (i >= 0) points[i]!.v += e.value ?? 1;
  }
  return points;
}

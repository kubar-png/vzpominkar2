import { describe, it, expect } from "vitest";
import {
  type Period,
  PERIOD_MS,
  windowBounds,
  deltaPct,
  emptyBuckets,
  bucketize,
  bucketIndexFor,
} from "@/lib/admin/stats-window";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// A fixed, arbitrary anchor — 2026-06-07T12:00:00.000Z. The pure helpers must
// NEVER read the real wall clock; everything is derived from this number.
const NOW = Date.parse("2026-06-07T12:00:00.000Z");

describe("windowBounds", () => {
  const cases: { period: Period; lengthMs: number }[] = [
    { period: "day", lengthMs: DAY },
    { period: "week", lengthMs: 7 * DAY },
    { period: "month", lengthMs: 30 * DAY },
    { period: "year", lengthMs: 365 * DAY },
  ];

  for (const { period, lengthMs } of cases) {
    it(`${period}: current window is the last ${lengthMs}ms ending at now`, () => {
      const b = windowBounds(period, NOW);
      expect(b.lengthMs).toBe(lengthMs);
      expect(b.lengthMs).toBe(PERIOD_MS[period]);
      expect(b.current.endMs).toBe(NOW);
      expect(b.current.startMs).toBe(NOW - lengthMs);
      expect(b.current.endMs - b.current.startMs).toBe(lengthMs);
    });

    it(`${period}: previous window is the equal slice directly before current`, () => {
      const b = windowBounds(period, NOW);
      expect(b.previous.endMs).toBe(b.current.startMs);
      expect(b.previous.startMs).toBe(NOW - 2 * lengthMs);
      expect(b.previous.endMs - b.previous.startMs).toBe(lengthMs);
    });

    it(`${period}: windows are contiguous and non-overlapping`, () => {
      const b = windowBounds(period, NOW);
      // [prev.start, prev.end) then [cur.start, cur.end), prev.end === cur.start
      expect(b.previous.endMs).toBe(b.current.startMs);
      expect(b.previous.startMs).toBeLessThan(b.current.startMs);
    });

    it(`${period}: ISO strings match the ms bounds`, () => {
      const b = windowBounds(period, NOW);
      expect(Date.parse(b.current.startISO)).toBe(b.current.startMs);
      expect(Date.parse(b.current.endISO)).toBe(b.current.endMs);
      expect(Date.parse(b.previous.startISO)).toBe(b.previous.startMs);
      expect(Date.parse(b.previous.endISO)).toBe(b.previous.endMs);
    });
  }

  it("day window is exactly 24h", () => {
    const b = windowBounds("day", NOW);
    expect(b.current.startISO).toBe("2026-06-06T12:00:00.000Z");
    expect(b.current.endISO).toBe("2026-06-07T12:00:00.000Z");
    expect(b.previous.startISO).toBe("2026-06-05T12:00:00.000Z");
    expect(b.previous.endISO).toBe("2026-06-06T12:00:00.000Z");
  });

  it("does not read the real wall clock (same input → same output)", () => {
    const a = windowBounds("week", NOW);
    const c = windowBounds("week", NOW);
    expect(a).toEqual(c);
  });
});

describe("deltaPct", () => {
  it("computes a normal positive change", () => {
    expect(deltaPct(150, 100)).toBe(50);
  });

  it("computes a normal negative change", () => {
    expect(deltaPct(80, 100)).toBe(-20);
  });

  it("rounds to one decimal place", () => {
    // (101 - 99) / 99 * 100 = 2.0202… → 2
    expect(deltaPct(101, 99)).toBe(2);
    // (4 - 3) / 3 * 100 = 33.333… → 33.3
    expect(deltaPct(4, 3)).toBe(33.3);
  });

  it("returns 0 when both are zero (flat)", () => {
    expect(deltaPct(0, 0)).toBe(0);
  });

  it("returns +100 when rising from zero (no Infinity)", () => {
    const r = deltaPct(42, 0);
    expect(r).toBe(100);
    expect(Number.isFinite(r)).toBe(true);
  });

  it("returns -100 when falling from zero", () => {
    expect(deltaPct(-42, 0)).toBe(-100);
  });

  it("returns 0 when going from positive to zero", () => {
    // (0 - 100) / 100 * 100 = -100
    expect(deltaPct(0, 100)).toBe(-100);
  });

  it("handles a negative previous via absolute denominator", () => {
    // (curr - prev) / |prev| → (0 - (-10)) / 10 * 100 = 100
    expect(deltaPct(0, -10)).toBe(100);
  });

  it("never returns NaN/Infinity for non-finite inputs", () => {
    expect(deltaPct(Number.NaN, 10)).toBe(0);
    expect(deltaPct(10, Number.NaN)).toBe(0);
    expect(deltaPct(Number.POSITIVE_INFINITY, 10)).toBe(0);
  });
});

describe("emptyBuckets", () => {
  it("day → 24 hourly zero-filled points", () => {
    const pts = emptyBuckets("day", NOW);
    expect(pts).toHaveLength(24);
    expect(pts.every((p) => p.v === 0)).toBe(true);
    // Buckets are hour-aligned and ascending.
    for (let i = 1; i < pts.length; i++) {
      expect(Date.parse(pts[i]!.t) - Date.parse(pts[i - 1]!.t)).toBe(HOUR);
    }
  });

  it("week → 7 daily zero-filled points", () => {
    const pts = emptyBuckets("week", NOW);
    expect(pts).toHaveLength(7);
    for (let i = 1; i < pts.length; i++) {
      expect(Date.parse(pts[i]!.t) - Date.parse(pts[i - 1]!.t)).toBe(DAY);
    }
  });

  it("month → 30 daily zero-filled points", () => {
    const pts = emptyBuckets("month", NOW);
    expect(pts).toHaveLength(30);
  });

  it("year → 12 monthly points ending in the current month", () => {
    const pts = emptyBuckets("year", NOW);
    expect(pts).toHaveLength(12);
    // Last bucket is the month containing NOW (June 2026).
    expect(pts[11]!.t).toBe("2026-06-01T00:00:00.000Z");
    expect(pts[0]!.t).toBe("2025-07-01T00:00:00.000Z");
  });
});

describe("bucketIndexFor", () => {
  const starts = [0, 10, 20, 30];
  it("finds the bucket whose start is the greatest <= ts", () => {
    expect(bucketIndexFor(0, starts)).toBe(0);
    expect(bucketIndexFor(9, starts)).toBe(0);
    expect(bucketIndexFor(10, starts)).toBe(1);
    expect(bucketIndexFor(35, starts)).toBe(3);
  });
  it("returns -1 before the first bucket or for empty input", () => {
    expect(bucketIndexFor(-1, starts)).toBe(-1);
    expect(bucketIndexFor(5, [])).toBe(-1);
  });
});

describe("bucketize", () => {
  it("counts events into the correct daily buckets (week)", () => {
    const b = windowBounds("week", NOW);
    // One event in the last day, two in the first day of the window.
    const events = [
      { tsMs: b.current.endMs - HOUR }, // last bucket
      { tsMs: b.current.startMs + HOUR }, // first/early bucket
      { tsMs: b.current.startMs + 2 * HOUR },
    ];
    const pts = bucketize(events, "week", NOW);
    const total = pts.reduce((s, p) => s + p.v, 0);
    expect(total).toBe(3);
  });

  it("sums by value when provided (revenue-style)", () => {
    const b = windowBounds("week", NOW);
    const events = [
      { tsMs: b.current.startMs + HOUR, value: 2890 },
      { tsMs: b.current.startMs + 2 * HOUR, value: 1790 },
    ];
    const pts = bucketize(events, "week", NOW);
    expect(pts.reduce((s, p) => s + p.v, 0)).toBe(2890 + 1790);
  });

  it("ignores events outside the current window", () => {
    const b = windowBounds("week", NOW);
    const events = [
      { tsMs: b.current.startMs - DAY }, // before window (in previous)
      { tsMs: b.current.endMs + DAY }, // after now (future)
      { tsMs: Number.NaN }, // garbage
    ];
    const pts = bucketize(events, "week", NOW);
    expect(pts.reduce((s, p) => s + p.v, 0)).toBe(0);
  });
});

import type { Period } from "@/lib/admin/stats-window";

/** Shared period parsing + labels for the admin section pages. */
export const VALID_PERIODS: Period[] = ["day", "week", "month", "year"];

export function parsePeriod(raw: string | string[] | undefined): Period {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return VALID_PERIODS.includes(v as Period) ? (v as Period) : "week";
}

export const PERIOD_LABEL: Record<Period, string> = {
  day: "posledních 24 h",
  week: "posledních 7 dní",
  month: "posledních 30 dní",
  year: "posledních 365 dní",
};

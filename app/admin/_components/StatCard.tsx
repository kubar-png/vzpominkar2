import { formatCzk } from "@/lib/utils";
import type { SeriesPoint } from "@/lib/admin/stats-window";
import { TrendChart } from "./TrendChart";

/**
 * A single dense metric card: small label, big value, an optional delta badge
 * vs the previous equal window, an optional secondary line, and — for headline
 * metrics — an inline recharts trend. Neutral / monochrome; emerald/red is used
 * only for the delta direction.
 */
type StatCardProps = {
  label: string;
  /** Raw numeric value. Pass `money` to format it as CZK. */
  value: number;
  money?: boolean;
  /** deltaPct vs previous window; omit to hide the badge. */
  deltaPct?: number;
  /** Secondary muted line under the value (e.g. "celkem 42" / consent rate). */
  hint?: string;
  /** Inline trend series (renders a chart when present). */
  series?: SeriesPoint[];
  /** Chart style when `series` is given. */
  chartVariant?: "area" | "bar";
};

function fmt(value: number, money: boolean): string {
  return money ? formatCzk(value) : value.toLocaleString("cs-CZ");
}

function DeltaBadge({ deltaPct }: { deltaPct: number }) {
  const up = deltaPct > 0;
  const down = deltaPct < 0;
  const tone = up
    ? "bg-emerald-50 text-emerald-700"
    : down
      ? "bg-red-50 text-red-700"
      : "bg-zinc-100 text-zinc-500";
  const arrow = up ? "↑" : down ? "↓" : "·";
  const abs = Math.abs(deltaPct);
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${tone}`}
      title="oproti předchozímu období"
    >
      <span aria-hidden>{arrow}</span>
      {abs.toLocaleString("cs-CZ")} %
    </span>
  );
}

export function StatCard({
  label,
  value,
  money = false,
  deltaPct,
  hint,
  series,
  chartVariant = "area",
}: StatCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </span>
        {typeof deltaPct === "number" ? <DeltaBadge deltaPct={deltaPct} /> : null}
      </div>

      <div className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">
        {fmt(value, money)}
      </div>

      {hint ? <div className="mt-0.5 text-xs text-zinc-500">{hint}</div> : null}

      {series && series.length > 0 ? (
        <div className="mt-3">
          <TrendChart data={series} variant={chartVariant} money={money} />
        </div>
      ) : null}
    </div>
  );
}

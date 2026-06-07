import { formatCzk } from "@/lib/utils";
import type { SeriesPoint } from "@/lib/admin/stats-window";
import { TrendChart } from "./TrendChart";

/**
 * A single metric card: small label, big value, an optional delta vs the
 * previous equal window, an optional secondary line, and — for headline
 * metrics — an inline recharts trend. Monochrome / zinc; a restrained
 * emerald/red is used only for the delta direction.
 */
type StatCardProps = {
  label: string;
  value: number;
  money?: boolean;
  deltaPct?: number;
  hint?: string;
  series?: SeriesPoint[];
  chartVariant?: "area" | "bar";
};

function fmt(value: number, money: boolean): string {
  return money ? formatCzk(value) : value.toLocaleString("cs-CZ");
}

function DeltaBadge({ deltaPct }: { deltaPct: number }) {
  const up = deltaPct > 0;
  const down = deltaPct < 0;
  const tone = up
    ? "text-emerald-600"
    : down
      ? "text-red-500"
      : "text-zinc-400";
  const arrow = up ? "↑" : down ? "↓" : "·";
  const abs = Math.abs(deltaPct);
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${tone}`}
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
    <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(9,9,11,0.04)] transition-colors hover:border-zinc-300">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-zinc-500">{label}</span>
        {typeof deltaPct === "number" ? <DeltaBadge deltaPct={deltaPct} /> : null}
      </div>

      <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-zinc-900">
        {fmt(value, money)}
      </div>

      {hint ? <div className="mt-1 text-xs text-zinc-400">{hint}</div> : null}

      {series && series.length > 0 ? (
        <div className="mt-4">
          <TrendChart data={series} variant={chartVariant} money={money} />
        </div>
      ) : null}
    </div>
  );
}

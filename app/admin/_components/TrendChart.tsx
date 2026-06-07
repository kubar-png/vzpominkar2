"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SeriesPoint } from "@/lib/admin/stats-window";

/**
 * Tiny neutral trend chart for a headline StatCard. Fed serializable
 * `SeriesPoint[]` from the server (no recharts on the server). Monochrome
 * zinc palette — this is a sparkline, not a full chart, so no axes/grid.
 */
type TrendChartProps = {
  data: SeriesPoint[];
  /** "area" for amounts/cumulative-feel metrics, "bar" for discrete counts. */
  variant?: "area" | "bar";
  /** Whether tooltip values are CZK money (formats with a Kč suffix). */
  money?: boolean;
  height?: number;
};

function formatValue(v: number, money: boolean): string {
  if (money) return `${Math.round(v).toLocaleString("cs-CZ")} Kč`;
  return v.toLocaleString("cs-CZ");
}

function TrendTooltip({
  active,
  payload,
  money,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  money: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const raw = payload[0]?.value;
  const v = typeof raw === "number" ? raw : Number(raw ?? 0);
  return (
    <div className="rounded border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-700 shadow-sm">
      {formatValue(v, money)}
    </div>
  );
}

export function TrendChart({
  data,
  variant = "area",
  money = false,
  height = 48,
}: TrendChartProps) {
  // Recharts needs a stable numeric key per point; map to a plain shape.
  const chartData = data.map((p) => ({ t: p.t, v: p.v }));
  const stroke = "#71717a"; // zinc-500
  const fill = "#e4e4e7"; // zinc-200

  return (
    <div style={{ width: "100%", height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <Tooltip
              cursor={{ fill: "rgba(228,228,231,0.4)" }}
              content={<TrendTooltip money={money} />}
            />
            <Bar dataKey="v" fill={stroke} radius={[1, 1, 0, 0]} isAnimationActive={false} />
          </BarChart>
        ) : (
          <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fill} stopOpacity={0.9} />
                <stop offset="100%" stopColor={fill} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Tooltip content={<TrendTooltip money={money} />} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={stroke}
              strokeWidth={1.5}
              fill="url(#trend-fill)"
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

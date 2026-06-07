import Link from "next/link";
import type { Period } from "@/lib/admin/stats-window";

/**
 * Den / Týden / Měsíc / Rok segmented control. Pure links that set `?period=`
 * (server-rendered — no client JS); the active period is highlighted.
 */
const OPTIONS: { period: Period; label: string }[] = [
  { period: "day", label: "Den" },
  { period: "week", label: "Týden" },
  { period: "month", label: "Měsíc" },
  { period: "year", label: "Rok" },
];

export function PeriodToggle({ active }: { active: Period }) {
  return (
    <nav
      aria-label="Období"
      className="inline-flex items-center rounded-md border border-zinc-200 bg-white p-0.5"
    >
      {OPTIONS.map(({ period, label }) => {
        const isActive = period === active;
        return (
          <Link
            key={period}
            href={`/admin?period=${period}`}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "rounded px-3 py-1 text-sm font-medium text-zinc-900 bg-zinc-100"
                : "rounded px-3 py-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

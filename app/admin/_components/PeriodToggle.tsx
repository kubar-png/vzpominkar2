"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Period } from "@/lib/admin/stats-window";

/**
 * Den / Týden / Měsíc / Rok segmented control. Links set `?period=` on the
 * CURRENT admin page (preserved via usePathname) so the chosen window carries
 * across sections. Server-rendered links — no client fetching.
 */
const OPTIONS: { period: Period; label: string }[] = [
  { period: "day", label: "Den" },
  { period: "week", label: "Týden" },
  { period: "month", label: "Měsíc" },
  { period: "year", label: "Rok" },
];

export function PeriodToggle({ active }: { active: Period }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Období"
      className="inline-flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white p-1"
    >
      {OPTIONS.map(({ period, label }) => {
        const isActive = period === active;
        return (
          <Link
            key={period}
            href={`${pathname}?period=${period}`}
            aria-current={isActive ? "page" : undefined}
            className={
              "rounded-full px-3.5 py-1 text-sm font-medium transition-colors " +
              (isActive
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900")
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

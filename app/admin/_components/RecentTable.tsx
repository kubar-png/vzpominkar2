import type { ReactNode } from "react";

/**
 * Dense neutral table for the dashboard's "recent rows" panels. Generic over
 * the row type via a small column spec so it serves both recent orders and
 * recent leads without prop sprawl. Renders an empty-state when there are no
 * rows.
 */
export type Column<T> = {
  /** Header label. */
  header: string;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  /** Right-align (for amounts / dates). */
  align?: "left" | "right";
  /** Optional fixed/utility class on the cell + header. */
  className?: string;
};

type RecentTableProps<T> = {
  title: string;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  emptyLabel?: string;
};

export function RecentTable<T>({
  title,
  rows,
  columns,
  rowKey,
  emptyLabel = "Žádná data",
}: RecentTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-sm text-zinc-500">{emptyLabel}</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-400 ${
                    col.align === "right" ? "text-right" : ""
                  } ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-zinc-100 last:border-0">
                {columns.map((col, i) => (
                  <td
                    key={i}
                    className={`px-4 py-2 text-zinc-700 ${
                      col.align === "right" ? "text-right tabular-nums" : ""
                    } ${col.className ?? ""}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

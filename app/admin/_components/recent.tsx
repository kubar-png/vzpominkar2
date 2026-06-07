import { formatCzk } from "@/lib/utils";
import type { RecentOrder, RecentLead } from "@/lib/admin/stats";
import type { Column } from "./RecentTable";

/** Compact CZ datetime for the recent tables. */
export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ORDER_KIND_LABEL: Record<RecentOrder["kind"], string> = {
  book: "Kniha",
  gift: "Dárek",
  reprint: "Dotisk",
};

export const orderColumns: Column<RecentOrder>[] = [
  { header: "Typ", cell: (r) => ORDER_KIND_LABEL[r.kind] },
  { header: "Komu / rodina", cell: (r) => <span className="text-zinc-500">{r.label ?? "—"}</span> },
  { header: "Částka", align: "right", cell: (r) => formatCzk(r.amountCzk) },
  { header: "Kdy", align: "right", cell: (r) => <span className="text-zinc-500">{dateTime(r.at)}</span> },
];

export const leadColumns: Column<RecentLead>[] = [
  { header: "E-mail", cell: (l) => l.email },
  { header: "Zdroj", cell: (l) => <span className="text-zinc-500">{l.source ?? "—"}</span> },
  {
    header: "Souhlas",
    cell: (l) =>
      l.marketingConsent ? (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          ano
        </span>
      ) : (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
          ne
        </span>
      ),
  },
  { header: "Kdy", align: "right", cell: (l) => <span className="text-zinc-500">{dateTime(l.at)}</span> },
];

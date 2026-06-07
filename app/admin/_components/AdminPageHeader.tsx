import type { Period } from "@/lib/admin/stats-window";
import { PERIOD_LABEL } from "../_period";
import { PeriodToggle } from "./PeriodToggle";

/** Section header: title + active-window label on the left, period toggle right. */
export function AdminPageHeader({ title, period }: { title: string; period: Period }) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        <p className="mt-0.5 text-sm text-zinc-500">{PERIOD_LABEL[period]}</p>
      </div>
      <PeriodToggle active={period} />
    </div>
  );
}

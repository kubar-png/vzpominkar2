import type { Metadata } from "next";
import { getStats } from "@/lib/admin/stats";
import { parsePeriod } from "../_period";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { StatCard } from "../_components/StatCard";
import { RecentTable } from "../_components/RecentTable";
import { leadColumns } from "../_components/recent";

export const metadata: Metadata = {
  title: "Admin · leady",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLeadyPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const period = parsePeriod((await searchParams).period);
  const stats = await getStats(period);

  const consentRate =
    stats.leads.value > 0
      ? Math.round((stats.leads.withConsent / stats.leads.value) * 100)
      : 0;

  return (
    <div>
      <AdminPageHeader title="Leady" period={period} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Nové leady"
          value={stats.leads.value}
          deltaPct={stats.leads.deltaPct}
          hint={`S marketingovým souhlasem ${stats.leads.withConsent} (${consentRate} %)`}
        />
      </div>

      <h2 className="mb-3 mt-9 text-sm font-semibold text-zinc-900">Poslední leady</h2>
      <RecentTable
        title="Poslední leady"
        rows={stats.recentLeads}
        columns={leadColumns}
        rowKey={(l) => l.id}
        emptyLabel="Zatím žádné leady"
      />
    </div>
  );
}

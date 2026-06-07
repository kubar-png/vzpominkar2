import type { Metadata } from "next";
import { formatCzk } from "@/lib/utils";
import { getStats } from "@/lib/admin/stats";
import { parsePeriod } from "../_period";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { StatCard } from "../_components/StatCard";
import { RecentTable } from "../_components/RecentTable";
import { orderColumns } from "../_components/recent";

export const metadata: Metadata = {
  title: "Admin · obchod",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminObchodPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const period = parsePeriod((await searchParams).period);
  const stats = await getStats(period);

  return (
    <div>
      <AdminPageHeader title="Obchod" period={period} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Obrat celkem"
          value={stats.revenueCzk.value}
          money
          deltaPct={stats.revenueCzk.deltaPct}
          series={stats.revenueCzk.series}
          chartVariant="area"
        />
        <StatCard
          label="Prodané přístupy ke knize"
          value={stats.booksPaid.value}
          deltaPct={stats.booksPaid.deltaPct}
          series={stats.booksPaid.series}
          chartVariant="bar"
        />
        <StatCard
          label="Prodané dárkové knihy"
          value={stats.giftOrders.value}
          deltaPct={stats.giftOrders.deltaPct}
        />
        <StatCard
          label="Doobjednané výtisky"
          value={stats.reprints.value}
          deltaPct={stats.reprints.deltaPct}
        />
        <StatCard
          label="Uplatněné kupóny"
          value={stats.couponsRedeemed.value}
          deltaPct={stats.couponsRedeemed.deltaPct}
          hint={`Sleva celkem ${formatCzk(stats.couponDiscountCzk.value)}`}
        />
      </div>

      <h2 className="mb-3 mt-9 text-sm font-semibold text-zinc-900">Poslední objednávky</h2>
      <RecentTable
        title="Poslední zaplacené objednávky"
        rows={stats.recentOrders}
        columns={orderColumns}
        rowKey={(r) => `${r.kind}:${r.id}`}
        emptyLabel="Zatím žádné objednávky"
      />
    </div>
  );
}

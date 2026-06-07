import type { Metadata } from "next";
import { getStats } from "@/lib/admin/stats";
import { parsePeriod } from "../_period";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { StatCard } from "../_components/StatCard";

export const metadata: Metadata = {
  title: "Admin · aktivita",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAktivitaPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const period = parsePeriod((await searchParams).period);
  const stats = await getStats(period);

  return (
    <div>
      <AdminPageHeader title="Aktivita" period={period} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Nové vzpomínky"
          value={stats.memories.value}
          deltaPct={stats.memories.deltaPct}
          series={stats.memories.series}
          chartVariant="bar"
          hint={`Audio ${stats.memories.byType.audio} · Text ${stats.memories.byType.text} · Foto ${stats.memories.byType.photo}`}
        />
        <StatCard
          label="Zodpovězené otázky"
          value={stats.answeredQuestions.value}
          deltaPct={stats.answeredQuestions.deltaPct}
        />
      </div>
    </div>
  );
}

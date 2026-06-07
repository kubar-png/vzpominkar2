import type { Metadata } from "next";
import { formatCzk } from "@/lib/utils";
import { getStats, type Period, type RecentOrder, type RecentLead } from "@/lib/admin/stats";
import { StatCard } from "./_components/StatCard";
import { PeriodToggle } from "./_components/PeriodToggle";
import { RecentTable, type Column } from "./_components/RecentTable";

export const metadata: Metadata = {
  title: "Admin · přehled",
  robots: { index: false, follow: false },
};

// Always fresh: this is a live operator dashboard reading the production DB.
export const dynamic = "force-dynamic";

const VALID_PERIODS: Period[] = ["day", "week", "month", "year"];

function parsePeriod(raw: string | string[] | undefined): Period {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return VALID_PERIODS.includes(v as Period) ? (v as Period) : "week";
}

const PERIOD_LABEL: Record<Period, string> = {
  day: "posledních 24 h",
  week: "posledních 7 dní",
  month: "posledních 30 dní",
  year: "posledních 365 dní",
};

function dateTime(iso: string): string {
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-8 text-sm font-semibold text-zinc-900 first:mt-0">{children}</h2>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const stats = await getStats(period);

  const consentRate =
    stats.leads.value > 0
      ? Math.round((stats.leads.withConsent / stats.leads.value) * 100)
      : 0;

  const orderColumns: Column<RecentOrder>[] = [
    { header: "Typ", cell: (r) => ORDER_KIND_LABEL[r.kind] },
    {
      header: "Komu / rodina",
      cell: (r) => <span className="text-zinc-500">{r.label ?? "—"}</span>,
    },
    { header: "Částka", align: "right", cell: (r) => formatCzk(r.amountCzk) },
    {
      header: "Kdy",
      align: "right",
      cell: (r) => <span className="text-zinc-500">{dateTime(r.at)}</span>,
    },
  ];

  const leadColumns: Column<RecentLead>[] = [
    { header: "E-mail", cell: (l) => l.email },
    {
      header: "Zdroj",
      cell: (l) => <span className="text-zinc-500">{l.source ?? "—"}</span>,
    },
    {
      header: "Souhlas",
      cell: (l) =>
        l.marketingConsent ? (
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
            ano
          </span>
        ) : (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">
            ne
          </span>
        ),
    },
    {
      header: "Kdy",
      align: "right",
      cell: (l) => <span className="text-zinc-500">{dateTime(l.at)}</span>,
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Přehled</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{PERIOD_LABEL[period]}</p>
        </div>
        <PeriodToggle active={period} />
      </div>

      {/* — Obchod — */}
      <SectionTitle>Obchod</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* — Uživatelé — */}
      <SectionTitle>Uživatelé</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Nové rodiny"
          value={stats.owners.value}
          deltaPct={stats.owners.deltaPct}
          hint={`Celkem ${stats.owners.allTime.toLocaleString("cs-CZ")}`}
        />
        <StatCard
          label="Noví senioři"
          value={stats.seniors.value}
          deltaPct={stats.seniors.deltaPct}
          hint={`Celkem ${stats.seniors.allTime.toLocaleString("cs-CZ")}`}
        />
        <StatCard
          label="Aktivní předplatná"
          value={stats.activeSubscriptions}
          hint="aktuální stav"
        />
      </div>

      {/* — Aktivita — */}
      <SectionTitle>Aktivita</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* — Trychtýř — */}
      <SectionTitle>Trychtýř</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Nové leady"
          value={stats.leads.value}
          deltaPct={stats.leads.deltaPct}
          hint={`S marketingovým souhlasem ${stats.leads.withConsent} (${consentRate} %)`}
        />
      </div>

      {/* — Poslední záznamy — */}
      <SectionTitle>Poslední záznamy</SectionTitle>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RecentTable
          title="Poslední zaplacené objednávky"
          rows={stats.recentOrders}
          columns={orderColumns}
          rowKey={(r) => `${r.kind}:${r.id}`}
          emptyLabel="Zatím žádné objednávky"
        />
        <RecentTable
          title="Poslední leady"
          rows={stats.recentLeads}
          columns={leadColumns}
          rowKey={(l) => l.id}
          emptyLabel="Zatím žádné leady"
        />
      </div>
    </div>
  );
}

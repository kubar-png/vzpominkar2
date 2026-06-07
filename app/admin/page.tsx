import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · přehled",
  robots: { index: false, follow: false },
};

/**
 * Placeholder dashboard — replaced in stage 3 (stats data layer + UI). Exists
 * now only so `/admin` resolves behind the auth guard.
 */
export default function AdminDashboardPage() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-zinc-900">Přehled</h1>
      <p className="mt-1 text-sm text-zinc-500">Statistiky se připravují.</p>
    </div>
  );
}

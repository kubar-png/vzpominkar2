import type { Metadata } from "next";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { SeniorCard } from "./senior-card";
import { AddSeniorPanel } from "./add-senior-panel";

export const metadata: Metadata = { title: "Rodina" };

export default async function RodinaPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  await requireOwnerOfFamily(familyId);

  const admin = createAdminClient();

  const { data: seniors } = await admin
    .from("profiles")
    .select("id, display_name, username, senior_role, contact_channel, contact_address, prompt_frequency, is_senior, created_at")
    .eq("family_id", familyId)
    .eq("role", "senior")
    .order("created_at")
    .returns<{ id: string; display_name: string | null; username: string | null; senior_role: string | null; contact_channel: string | null; contact_address: string | null; prompt_frequency: number; is_senior: boolean; created_at: string }[]>();

  const seniorList = seniors ?? [];

  const seniorIds = seniorList.map((s) => s.id);
  const { data: memoryCounts } = seniorIds.length
    ? await admin
        .from("memories")
        .select("author_id")
        .in("author_id", seniorIds)
        .eq("family_id", familyId)
        .returns<{ author_id: string }[]>()
    : { data: [] };

  const countById = new Map<string, number>();
  for (const m of memoryCounts ?? []) {
    countById.set(m.author_id, (countById.get(m.author_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-10">
      <AppPageHeader
        numeral="III"
        sectionLabel="Rodina"
        title="Rodina"
        description="Kdo vypráví, jak se přihlašuje a jak se mu otázky doručují."
        italic
      />

      <div className="space-y-3">
        {seniorList.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] py-16 text-center text-[var(--color-text-muted)]">
            Zatím žádný blízký. Přidejte prvního níže.
          </div>
        ) : (
          seniorList.map((senior) => (
            <SeniorCard
              key={senior.id}
              familyId={familyId}
              senior={{
                id: senior.id,
                display_name: senior.display_name,
                username: senior.username,
                senior_role: senior.senior_role,
                contact_channel: senior.contact_channel,
                contact_address: senior.contact_address,
                prompt_frequency: senior.prompt_frequency,
                is_senior: senior.is_senior ?? true,
                memoryCount: countById.get(senior.id) ?? 0,
              }}
              manageHref={`/family/${familyId}/senior?seniorId=${senior.id}`}
            />
          ))
        )}

        <AddSeniorPanel familyId={familyId} />
      </div>
    </div>
  );
}

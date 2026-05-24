import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { StatusBlock } from "@/components/app/StatusBlock";
import {
  ProgressWidgetAsync,
  ProgressWidgetSkeleton,
} from "@/components/app/ProgressWidget";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MemoryFeedAsync, MemoryFeedSkeleton } from "./memory-feed-async";
import type { SeniorOption } from "./types";

export const metadata: Metadata = { title: "Domů" };

const RECENT_LIMIT = 6;

export default async function DashboardPage() {
  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");

  // Fast queries the page header + StatusBlock need (seniors for greeting,
  // next prompt for the status row). The heavy memory feed + signed URLs
  // stream in below via <Suspense> so the shell paints immediately.
  const supabase = createAdminClient();
  const [{ data: rawSeniors }, { data: rawNext }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("family_id", owner.familyId)
      .eq("role", "senior")
      .returns<{ id: string; display_name: string | null }[]>(),
    supabase
      .from("prompt_assignments")
      .select("scheduled_for, senior_id, prompts(question)")
      .eq("family_id", owner.familyId)
      .is("answered_memory_id", null)
      .order("scheduled_for", { ascending: true })
      .limit(1)
      .returns<{
        scheduled_for: string;
        senior_id: string | null;
        prompts: { question: string } | null;
      }[]>(),
  ]);

  const seniors: SeniorOption[] = (rawSeniors ?? []).map((s) => ({
    id: s.id,
    displayName: s.display_name ?? "Blízký",
  }));
  const seniorNameById = new Map(seniors.map((s) => [s.id, s.displayName]));

  const onlySenior = seniors.length === 1 ? seniors[0] : null;
  const firstName = onlySenior
    ? (onlySenior.displayName.split(/\s+/)[0] || onlySenior.displayName)
    : null;
  const description = firstName
    ? `Co ${firstName} zatím vyprávěl${firstName.endsWith("a") || firstName.endsWith("á") ? "a" : ""}.`
    : seniors.length > 1
      ? "Co vaši blízcí zatím vyprávěli."
      : "Tady se objeví vzpomínky, jakmile začne první vyprávění.";

  const nextRow = rawNext?.[0];
  const next = nextRow && nextRow.prompts
    ? {
        question: nextRow.prompts.question,
        scheduledFor: nextRow.scheduled_for,
        seniorName: nextRow.senior_id
          ? (seniorNameById.get(nextRow.senior_id) ?? null)
          : null,
      }
    : null;

  return (
    <div className="space-y-10">
      <AppPageHeader
        title={`Vítejte zpět${firstName ? `, ${firstName}` : ""}.`}
        description={description}
        action={
          <Link
            href={`/family/${owner.familyId}/prompts`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Poslat další otázku
            <span aria-hidden>↗</span>
          </Link>
        }
      />

      <Suspense fallback={<ProgressWidgetSkeleton />}>
        <ProgressWidgetAsync familyId={owner.familyId} />
      </Suspense>

      <StatusBlock
        familyId={owner.familyId}
        next={next}
        onlySeniorFirstName={firstName}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-[17px] font-semibold tracking-tight text-[var(--color-navy-900)]">
            Poslední vzpomínky
          </h2>
          <Link
            href={`/family/${owner.familyId}/memories`}
            className="shrink-0 text-sm text-[var(--color-navy-700)] underline-offset-2 hover:underline"
          >
            Všechny vzpomínky →
          </Link>
        </div>

        <Suspense fallback={<MemoryFeedSkeleton />}>
          <MemoryFeedAsync
            familyId={owner.familyId}
            seniors={seniors}
            limit={RECENT_LIMIT}
          />
        </Suspense>
      </div>
    </div>
  );
}

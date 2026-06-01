import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { UserPlus, Check } from "lucide-react";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { StatusBlock } from "@/components/app/StatusBlock";
import { Card, CardContent } from "@/components/ui/card";
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

  const hasSenior = seniors.length > 0;

  // No storyteller yet (creating their account is now optional, done here
  // rather than during onboarding) → focused empty state instead of the feed.
  if (!hasSenior) {
    return (
      <div className="space-y-10">
        <AppPageHeader
          title="Vítejte ve vašem Vzpomínkáři."
          description="Zbývá jediný krok — přidat vypravěče, jehož příběhy budete sbírat."
        />
        <AddStorytellerCard familyId={owner.familyId} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <AppPageHeader
        title="Vítejte zpět ve vašem Vzpomínkáři."
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

/**
 * Shown on the dashboard when the family has no storyteller yet — the
 * post-onboarding nudge to create their access. Links to the family page where
 * the AddSeniorPanel lives.
 */
function AddStorytellerCard({ familyId }: { familyId: string }) {
  const PERKS = [
    "Vlastní přihlášení — jen jméno a heslo, žádný e-mail",
    "Otázky mu chodí samy, odpovídá hlasem nebo psaním",
    "Vše se rovnou ukládá do jeho knihy",
  ];
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-6 p-7 sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold-100)] text-[var(--color-gold-600)]">
          <UserPlus size={24} aria-hidden />
        </span>
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal leading-tight text-[var(--color-ink-900)] sm:text-3xl">
            Přidejte vypravěče
          </h2>
          <p className="max-w-[48ch] text-[15px] leading-relaxed text-[var(--color-text-muted)]">
            Vytvoříte mu jednoduchý přístup — jméno a&nbsp;heslo si zapíšete a&nbsp;předáte.
            Zabere to minutu a&nbsp;pak už můžou chodit první otázky.
          </p>
        </div>
        <ul className="space-y-2.5">
          {PERKS.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-[15px] text-[var(--color-text)]">
              <Check size={18} className="mt-0.5 shrink-0 text-[var(--color-gold-600)]" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
        <Link
          href={`/family/${familyId}/rodina`}
          className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full justify-center sm:w-auto")}
        >
          Přidat vypravěče
          <span aria-hidden>↗</span>
        </Link>
      </CardContent>
    </Card>
  );
}

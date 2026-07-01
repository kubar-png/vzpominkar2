import type { Metadata } from "next";
import Link from "next/link";
import { Settings2, Inbox } from "lucide-react";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { plural } from "@/lib/format/czech-plural";
import { ScheduledList } from "./scheduled-list";
import { PromptPickers } from "./prompt-pickers";
import { resolveGender, type Gender } from "@/lib/gender";

export const metadata: Metadata = { title: "Otázky" };

const CATEGORY_LABELS: Record<string, string> = {
  detstvi: "Dětství",
  skola: "Škola",
  mladi: "Mladí",
  laska: "Láska",
  rodina: "Rodina",
  prace: "Práce",
  zajmy: "Zájmy",
  moudro: "Životní moudro",
  vlastni: "Vaše otázky",
};
const CATEGORY_ORDER = ["detstvi", "skola", "mladi", "laska", "rodina", "prace", "zajmy", "moudro"];

export default async function PromptsPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  await requireOwnerOfFamily(familyId);
  const supabase = createAdminClient();

  // Fetch seniors and prompts/assignments in parallel
  const [seniorsResult, assignmentsResult, promptsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, gender")
      .eq("family_id", familyId)
      .eq("role", "senior")
      .order("created_at")
      .returns<{ id: string; display_name: string | null; gender: string | null }[]>(),

    supabase
      .from("prompt_assignments")
      .select("id, scheduled_for, answered_memory_id, senior_id, prompts(question, category, family_id)")
      .eq("family_id", familyId)
      .order("scheduled_for", { ascending: true })
      .returns<{
        id: string;
        scheduled_for: string;
        answered_memory_id: string | null;
        senior_id: string | null;
        prompts: { question: string; category: string | null; family_id: string | null } | null;
      }[]>(),

    supabase
      .from("prompts")
      .select("id, family_id, category, question, is_active, order_index")
      .or(`family_id.is.null,family_id.eq.${familyId}`)
      .eq("is_active", true)
      .order("order_index", { ascending: true })
      .returns<{
        id: string;
        family_id: string | null;
        category: string | null;
        question: string;
        is_active: boolean;
        order_index: number;
      }[]>(),
  ]);

  const seniors = seniorsResult.data ?? [];
  const seniorNameById = new Map(seniors.map((s) => [s.id, s.display_name]));
  const seniorGenderById = new Map(
    seniors.map((s) => [s.id, (s.gender as Gender | null) ?? null]),
  );
  const showSeniorName = seniors.length > 1;

  // Gender for the {masc|fem} tokens. Per-assignment lists key off the
  // assignment's senior_id. The library + custom lists are NOT per-senior, so
  // they can only be gendered when the whole family shares one gender (or there
  // is a single senior). Mixed/unknown → null, which renders the slash form —
  // the correct fallback for an audience of more than one gender.
  const distinctGenders = new Set(seniors.map((s) => (s.gender as Gender | null) ?? null));
  const libraryGender: Gender | null =
    distinctGenders.size === 1 ? ([...distinctGenders][0] ?? null) : null;
  const genderForAssignment = (seniorId: string | null): Gender | null =>
    seniorId ? (seniorGenderById.get(seniorId) ?? null) : libraryGender;

  const assignments = assignmentsResult.data ?? [];
  const upcoming = assignments
    .filter((a) => !a.answered_memory_id)
    .map((a) => ({
      id: a.id,
      scheduledFor: a.scheduled_for,
      question: a.prompts?.question
        ? resolveGender(a.prompts.question, genderForAssignment(a.senior_id))
        : "(odstraněná otázka)",
      seniorName: a.senior_id ? (seniorNameById.get(a.senior_id) ?? null) : null,
    }));
  // Newest first — the base query is scheduled_for ascending (oldest first),
  // which is right for the upcoming queue but reversed for answered: people
  // expect the most recently answered question at the top.
  const answered = assignments
    .filter(
      (a): a is typeof a & { answered_memory_id: string } => !!a.answered_memory_id,
    )
    .sort((a, b) => b.scheduled_for.localeCompare(a.scheduled_for));

  const allPrompts = promptsResult.data ?? [];
  const customPrompts = allPrompts
    .filter((p) => p.family_id === familyId)
    .map((p) => ({ id: p.id, question: resolveGender(p.question, libraryGender) }));
  const systemPrompts = allPrompts.filter((p) => !p.family_id);

  // Group system prompts by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    prompts: systemPrompts
      .filter((p) => p.category === cat)
      .map((p) => ({ id: p.id, question: resolveGender(p.question, libraryGender) })),
  })).filter((g) => g.prompts.length > 0);

  return (
    <div className="space-y-10">
      <AppPageHeader
        title="Otázky"
        description="Knihovna otázek pro vašeho blízkého."
        action={
          <Link
            href="/settings/otazky"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            <Settings2 size={14} aria-hidden />
            <span className="hidden sm:inline">Nastavení doručování</span>
            <span className="sm:hidden">Nastavení</span>
          </Link>
        }
      />

      {/* Scheduled queue — quiet section heading, not boxed in a card. */}
      <section className="space-y-4">
        <SectionHeading
          title="Naplánované"
          subtitle={
            upcoming.length === 0
              ? "Nic ve frontě. Naplánujte další z knihovny níže."
              : `${upcoming.length} ${plural(upcoming.length, ["otázka", "otázky", "otázek"])} ${plural(upcoming.length, ["čeká", "čekají", "čeká"])} na vašeho blízkého.`
          }
        />
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<Inbox size={18} aria-hidden />}
            title="Fronta otázek je prázdná"
            description="Vyberte další otázku z knihovny — odešle se v následující určený den."
          />
        ) : (
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-2">
            <ScheduledList
              familyId={familyId}
              upcoming={upcoming}
              showSeniorName={showSeniorName}
            />
          </div>
        )}
      </section>

      {/* Answered — collapsed list */}
      {answered.length > 0 ? (
        <section className="space-y-4">
          <SectionHeading
            title="Zodpovězené"
            subtitle={`${answered.length} ${plural(answered.length, ["otázka", "otázky", "otázek"])} - klikněte pro otevření vzpomínky.`}
          />
          <ul className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white">
            {answered.map((a, i) => (
              <li
                key={a.id}
                className={i > 0 ? "border-t border-[var(--color-border)]" : undefined}
              >
                <Link
                  href={`/family/${familyId}/memories/${a.answered_memory_id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--color-paper-50)]"
                >
                  <span className="min-w-0 truncate text-sm text-[var(--color-text)]">
                    {a.prompts?.question ? resolveGender(a.prompts.question, genderForAssignment(a.senior_id)) : "(odstraněná otázka)"}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Zodpovězeno
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Library + custom — handled in the picker component */}
      <PromptPickers
        familyId={familyId}
        seniors={seniors.map((s) => ({ id: s.id, displayName: s.display_name }))}
        groups={grouped}
        customPrompts={customPrompts}
      />
    </div>
  );
}


function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="text-[17px] font-semibold tracking-tight text-[var(--color-navy-900)]">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

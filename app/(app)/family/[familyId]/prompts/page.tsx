import type { Metadata } from "next";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { BookProgressCard } from "@/components/app/BookProgressCard";
import { ScheduledList } from "./scheduled-list";
import { PromptPickers } from "./prompt-pickers";

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
  const [seniorsResult, assignmentsResult, promptsResult, memoryCountResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("family_id", familyId)
      .eq("role", "senior")
      .order("created_at")
      .returns<{ id: string; display_name: string | null }[]>(),

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

    supabase
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("family_id", familyId)
      .eq("status", "published"),
  ]);
  const memoryCount = memoryCountResult.count ?? 0;

  const seniors = seniorsResult.data ?? [];
  const seniorNameById = new Map(seniors.map((s) => [s.id, s.display_name]));
  const showSeniorName = seniors.length > 1;

  const assignments = assignmentsResult.data ?? [];
  const upcoming = assignments
    .filter((a) => !a.answered_memory_id)
    .map((a) => ({
      id: a.id,
      scheduledFor: a.scheduled_for,
      question: a.prompts?.question ?? "(odstraněná otázka)",
      seniorName: a.senior_id ? (seniorNameById.get(a.senior_id) ?? null) : null,
    }));
  const answered = assignments.filter(
    (a): a is typeof a & { answered_memory_id: string } => !!a.answered_memory_id,
  );

  const allPrompts = promptsResult.data ?? [];
  const customPrompts = allPrompts
    .filter((p) => p.family_id === familyId)
    .map((p) => ({ id: p.id, question: p.question }));
  const systemPrompts = allPrompts.filter((p) => !p.family_id);

  // Group system prompts by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    prompts: systemPrompts
      .filter((p) => p.category === cat)
      .map((p) => ({ id: p.id, question: p.question })),
  })).filter((g) => g.prompts.length > 0);

  return (
    <div className="space-y-10">
      <AppPageHeader
        numeral="IV"
        sectionLabel="Plánování"
        title="Otázky"
        description="Co se vašich blízkých v které pondělí zeptáme."
        action={
          <div className="flex items-center gap-3">
            <BookProgressCard
              familyId={familyId}
              count={memoryCount}
              variant="compact"
            />
            <Link
              href="/settings/otazky"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              <Settings2 size={14} aria-hidden />
              <span className="hidden sm:inline">Nastavení doručování</span>
              <span className="sm:hidden">Nastavení</span>
            </Link>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Naplánované otázky</CardTitle>
          <CardDescription>
            {upcoming.length === 0
              ? "Žádné nezodpovězené otázky. Přidejte další níže."
              : `${upcoming.length} otázek čeká na vašeho blízkého.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduledList
            familyId={familyId}
            upcoming={upcoming}
            showSeniorName={showSeniorName}
          />
        </CardContent>
      </Card>

      {answered.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Zodpovězené otázky</CardTitle>
            <CardDescription>{answered.length} dokončených - klikněte pro otevření vzpomínky.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-[var(--color-border)]">
              {answered.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/family/${familyId}/memories/${a.answered_memory_id}`}
                    className="-mx-2 flex items-center justify-between gap-4 rounded-[var(--radius-sm)] px-2 py-3 transition-colors hover:bg-[var(--color-paper-100)]"
                  >
                    <span className="text-[var(--color-text-muted)] group-hover:text-[var(--color-navy-900)]">
                      {a.prompts?.question ?? "(odstraněná otázka)"}
                    </span>
                    <Badge tone="navy">Hotovo</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <PromptPickers
        familyId={familyId}
        seniors={seniors.map((s) => ({ id: s.id, displayName: s.display_name }))}
        groups={grouped}
        customPrompts={customPrompts}
      />
    </div>
  );
}

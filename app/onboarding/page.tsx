import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm, type CategoryGroup } from "./onboarding-form";

export const metadata: Metadata = { title: "Nastavení rodiny" };

const CATEGORY_LABELS: Record<string, string> = {
  detstvi: "Dětství",
  skola: "Škola",
  mladi: "Mladí",
  laska: "Láska",
  rodina: "Rodina",
  prace: "Práce",
  zajmy: "Zájmy",
  moudro: "Životní moudro",
};
const CATEGORY_ORDER = ["detstvi", "skola", "mladi", "laska", "rodina", "prace", "zajmy", "moudro"];

export default async function OnboardingStartPage() {
  const owner = await requireOwner();
  if (owner.familyId) redirect("/onboarding/credentials");

  const supabase = await createClient();
  const { data: prompts } = await supabase
    .from("prompts")
    .select("id, category, question, order_index")
    .is("family_id", null)
    .eq("is_active", true)
    .order("order_index", { ascending: true })
    .returns<{ id: string; category: string | null; question: string; order_index: number }[]>();

  const list = prompts ?? [];
  const groups: CategoryGroup[] = CATEGORY_ORDER.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    prompts: list
      .filter((p) => p.category === cat)
      .map((p) => ({ id: p.id, question: p.question })),
  })).filter((g) => g.prompts.length > 0);

  return (
    <div className="space-y-10">
      {/* Progress strip - two-segment chapter bar */}
      <div className="flex items-center gap-4">
        <span className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-red-700)]">
          I.
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
          Krok první ze dvou
        </span>
        <div className="ml-2 flex flex-1 items-center gap-1.5">
          <span className="h-[2px] flex-1 bg-[var(--color-red-700)]" />
          <span className="h-[2px] flex-1 bg-[var(--color-paper-300)]" />
        </div>
      </div>

      <div className="space-y-5">
        <h1
          className="max-w-[20ch] font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.1] tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Začneme tím, koho chcete vyzpovídat.
        </h1>
        <p className="max-w-[52ch] font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text-muted)]">
          Pojmenujte rodinný projekt, řekněte nám jméno seniora a vyberte
          pár otázek na začátek. Otázky můžete kdykoliv přidat nebo upravit.
        </p>
      </div>

      <OnboardingForm categories={groups} />
    </div>
  );
}

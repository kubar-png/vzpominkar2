import Link from "next/link";
import type { Metadata } from "next";
import { requireSenior } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { SeniorHeading } from "@/components/senior/SeniorHeading";
import { seniorButtonVariants } from "@/components/senior/SeniorButton";

export const metadata: Metadata = { title: "Domů" };

export default async function SeniorHomePage() {
  const user = await requireSenior();
  const supabase = createAdminClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: dueRaw } = await supabase
    .from("prompt_assignments")
    .select("id, scheduled_for, prompt_id, prompts(question)")
    .eq("senior_id", user.id)
    .is("answered_memory_id", null)
    .lte("scheduled_for", todayIso)
    .order("scheduled_for", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      scheduled_for: string;
      prompt_id: string;
      prompts: { question: string } | null;
    }>();

  let active = dueRaw;
  if (!active) {
    const { data: upcoming } = await supabase
      .from("prompt_assignments")
      .select("id, scheduled_for, prompt_id, prompts(question)")
      .eq("senior_id", user.id)
      .is("answered_memory_id", null)
      .gt("scheduled_for", todayIso)
      .order("scheduled_for", { ascending: true })
      .limit(1)
      .maybeSingle<{
        id: string;
        scheduled_for: string;
        prompt_id: string;
        prompts: { question: string } | null;
      }>();
    active = upcoming ?? null;
  }

  // Surface a "continue draft" entry point when the senior left a half-written
  // text memory behind. Audio + photo go straight to published, so drafts are
  // text-only.
  const { data: draft } = await supabase
    .from("memories")
    .select("id, text_content, updated_at")
    .eq("author_id", user.id)
    .eq("status", "draft")
    .not("text_content", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; text_content: string | null; updated_at: string }>();

  const firstName = user.displayName?.split(" ")[0] ?? null;

  return (
    <div className="flex flex-col h-full px-6">

      {/* Greeting - compact top strip */}
      <div className="shrink-0 pt-6 pb-4">
        <SeniorHeading level={1}>
          Dobrý den{firstName ? `, ${firstName}` : ""}.
        </SeniorHeading>
        <div aria-hidden className="mt-2 h-[2px] w-12 rounded-full bg-gold-400" />
      </div>

      {/* Card - fills remaining space, scrollable within on very small screens */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2">
        {active?.prompts ? (
          <div className="bg-paper-50 border border-paper-300 rounded-[var(--radius-senior-card)] shadow-[0_4px_24px_rgba(10,44,77,0.10),0_1px_3px_rgba(10,44,77,0.06)] px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-paper-500 mb-3">
              Vaše otázka
            </p>

            <SeniorHeading level={2} className="mb-5">
              {active.prompts.question}
            </SeniorHeading>

            <div
              aria-hidden
              className="h-px mb-5 bg-gradient-to-r from-gold-400 via-gold-300 to-transparent opacity-60"
            />

            <div className="space-y-3">
              {/* Primary path - speaking is the easiest, most natural mode */}
              <Link
                href={{ pathname: "/new-memory/audio", query: { assignment: active.id } }}
                className={`${seniorButtonVariants({ variant: "accent", size: "xl" })} text-center w-full`}
              >
                Nahrát hlasem
              </Link>
              {/* Alternatives - same row, smaller, equal weight */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={{ pathname: "/new-memory/text", query: { assignment: active.id } }}
                  className={`${seniorButtonVariants({ variant: "primary", size: "md" })} text-center w-full`}
                >
                  Napsat
                </Link>
                <Link
                  href={{ pathname: "/new-memory/photo", query: { assignment: active.id } }}
                  className={`${seniorButtonVariants({ variant: "secondary", size: "md" })} text-center w-full`}
                >
                  Přidat fotku
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-paper-50 border border-paper-300 rounded-[var(--radius-senior-card)] shadow-[0_4px_24px_rgba(10,44,77,0.10),0_1px_3px_rgba(10,44,77,0.06)] px-6 py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-paper-500 mb-4">
              Otázka týdne
            </p>
            <SeniorHeading level={2} className="mb-4">
              Otázka brzy přijde
            </SeniorHeading>
            <p className="text-[length:var(--text-senior)] text-paper-600 leading-relaxed">
              Rodina vám vybere otázku, na kterou si vzpomenete.
              Až bude připravena, ukáže se vám tady.
            </p>
          </div>
        )}
      </div>

      {/* Footer - draft pill (if any) + link to my memories */}
      <div className="shrink-0 py-4 border-t border-paper-200 space-y-3">
        {draft ? (
          <Link
            href={{ pathname: "/new-memory/text", query: { memory: draft.id } }}
            className="block rounded-[var(--radius-md)] border-2 border-gold-300 bg-gold-50 px-4 py-3 text-[length:var(--text-senior-sm)] text-navy-900 hover:border-gold-400 hover:bg-gold-100 transition-colors"
          >
            <span className="font-semibold">Pokračovat v rozepsané vzpomínce</span>
            <span className="block text-paper-600 line-clamp-1 mt-0.5">
              &bdquo;{draft.text_content?.slice(0, 80) ?? ""}{(draft.text_content?.length ?? 0) > 80 ? "…" : ""}&ldquo;
            </span>
          </Link>
        ) : null}
        <div className="flex items-center gap-3">
          <div aria-hidden className="h-px w-6 bg-paper-300" />
          <Link
            href="/my-memories"
            className="text-[length:var(--text-senior)] font-medium text-navy-700 underline-offset-4 hover:text-navy-900 hover:underline transition-colors"
          >
            Moje vzpomínky →
          </Link>
        </div>
      </div>

    </div>
  );
}

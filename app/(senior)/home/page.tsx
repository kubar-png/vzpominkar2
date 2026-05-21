import Link from "next/link";
import type { Metadata } from "next";
import { requireSenior } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Domů" };

/**
 * Senior /home — editorial direction.
 *
 * Layout:
 *   • Greeting (h1 with PP Pangaia)
 *   • Eyebrow "Otázka týdne"
 *   • Italic PP Pangaia question (the prompt)
 *   • Three large action cards stacked: Vyprávět nahlas / Napsat / Přidat fotku
 *   • Optional draft pill
 *   • "Moje vzpomínky" arrow-link at the bottom
 *
 * All interactive elements are ≥ 64px (cards are 88px), navy ink on cream,
 * AAA contrast throughout.
 */
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
    <div className="pt-10 sm:pt-14 pb-6">
      {/* Greeting */}
      <h1 className="mb-3">
        Dobrý den{firstName ? `, ${firstName}` : ""}.
      </h1>
      <div
        aria-hidden
        className="h-[2px] w-16 rounded-full"
        style={{ background: "var(--gold)" }}
      />

      {/* Question card */}
      <section className="es-card mt-10">
        {active?.prompts ? (
          <>
            <span className="es-eyebrow">Otázka týdne</span>
            <h2 className="es-question">{active.prompts.question}</h2>
            <div className="es-rule-gold" />
            <p className="text-[18px] sm:text-[19px] text-[var(--ink-soft)] mb-7 leading-relaxed">
              Vyberte si, jak chcete odpovědět. Vyprávění nahlas je nejjednodušší —
              prostě mluvte tak, jak vám to půjde.
            </p>

            <div className="space-y-3">
              <Link
                href={{ pathname: "/new-memory/audio", query: { assignment: active.id } }}
                className="es-action"
                aria-label="Vyprávět nahlas"
              >
                <span className="es-action-icon tone-gold" aria-hidden>
                  ●
                </span>
                <div className="es-action-body">
                  <div className="es-action-title">Vyprávět nahlas</div>
                  <div className="es-action-meta">Nahrávání hlasem — doporučeno</div>
                </div>
                <span className="es-action-arrow" aria-hidden>↗</span>
              </Link>

              <Link
                href={{ pathname: "/new-memory/text", query: { assignment: active.id } }}
                className="es-action"
                aria-label="Napsat odpověď"
              >
                <span className="es-action-icon tone-navy" aria-hidden>
                  ✎
                </span>
                <div className="es-action-body">
                  <div className="es-action-title">Napsat</div>
                  <div className="es-action-meta">Krátká odpověď textem</div>
                </div>
                <span className="es-action-arrow" aria-hidden>↗</span>
              </Link>

              <Link
                href={{ pathname: "/new-memory/photo", query: { assignment: active.id } }}
                className="es-action"
                aria-label="Přidat fotku"
              >
                <span className="es-action-icon tone-paper" aria-hidden>
                  ◷
                </span>
                <div className="es-action-body">
                  <div className="es-action-title">Přidat fotku</div>
                  <div className="es-action-meta">Vyfotit nebo vybrat ze galerie</div>
                </div>
                <span className="es-action-arrow" aria-hidden>↗</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <span className="es-eyebrow">Otázka týdne</span>
            <h2 className="es-question">Otázka brzy přijde.</h2>
            <div className="es-rule-gold" />
            <p className="text-[19px] text-[var(--ink-soft)] leading-relaxed">
              Rodina vám vybírá otázku, na kterou si vzpomenete. Jakmile bude
              připravena, najdete ji tady. Můžete zatím procházet už uložené
              vzpomínky.
            </p>
          </>
        )}
      </section>

      {/* Draft pill */}
      {draft ? (
        <Link
          href={{ pathname: "/new-memory/text", query: { memory: draft.id } }}
          className="mt-6 block rounded-xl border-2 border-dashed px-5 py-4 transition-colors hover:bg-white"
          style={{
            borderColor: "var(--gold)",
            background: "rgba(247, 233, 192, 0.55)",
          }}
        >
          <p className="text-[14px] uppercase tracking-[0.18em] font-semibold text-[var(--ink-soft)] mb-1">
            Pokračovat v rozepsané vzpomínce
          </p>
          <p className="text-[18px] text-[var(--ink)] line-clamp-2 italic">
            &bdquo;{draft.text_content?.slice(0, 120) ?? ""}
            {(draft.text_content?.length ?? 0) > 120 ? "…" : ""}&ldquo;
          </p>
        </Link>
      ) : null}

      {/* Footer link to memory archive */}
      <div className="mt-10 flex items-center gap-4">
        <div aria-hidden className="h-px w-8" style={{ background: "var(--line-2)" }} />
        <Link href="/my-memories" className="es-arrow-link">
          Moje vzpomínky <span aria-hidden>↗</span>
        </Link>
      </div>
    </div>
  );
}

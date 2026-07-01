import Link from "next/link";
import type { Metadata } from "next";
import { requireSenior } from "@/lib/auth/permissions";
import { getAssignmentContext } from "@/lib/memories/server";
import { resolveGender } from "@/lib/gender";
import { MemoryWhenHint } from "@/components/senior/MemoryWhenHint";
import { AudioMemoryForm } from "./audio-form";

export const metadata: Metadata = { title: "Vyprávět nahlas" };

// The save action transcribes audio AFTER the response (via `after()`), which
// keeps the function warm past the redirect — give it room beyond the default.
export const maxDuration = 60;

/**
 * Audio answer page — editorial direction.
 *
 * Top strip: back link + the question as the leading heading. Then the
 * recording stage, which fills the remainder. The form owns its own
 * action button at the bottom so the recording phase can swap the
 * button label (Začít / Hotovo / Uložit) without rerendering the strip.
 */
export default async function NewAudioMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string }>;
}) {
  const senior = await requireSenior();
  const params = await searchParams;
  const ctx = await getAssignmentContext(params.assignment ?? null, senior.familyId);

  return (
    <div className="pt-10 sm:pt-14 pb-10">
      <div className="mb-8">
        <Link href="/home" className="es-back-link">
          <span aria-hidden>←</span> Zpět
        </Link>
      </div>

      <header className="mb-10">
        {ctx ? (
          <h2 className="es-question">{resolveGender(ctx.question, senior.gender)}</h2>
        ) : (
          <h2 className="es-question">Vyprávějte vzpomínku nahlas.</h2>
        )}
        <div className="es-rule-gold" />
      </header>

      <MemoryWhenHint />

      <AudioMemoryForm assignmentId={ctx?.assignmentId ?? null} />
    </div>
  );
}

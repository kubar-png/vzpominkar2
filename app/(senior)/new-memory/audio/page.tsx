import Link from "next/link";
import type { Metadata } from "next";
import { requireSenior } from "@/lib/auth/permissions";
import { getAssignmentContext } from "@/lib/memories/server";
import { AudioMemoryForm } from "./audio-form";

export const metadata: Metadata = { title: "Vyprávět nahlas" };

/**
 * Audio answer page — editorial direction.
 *
 * Top strip: back link + eyebrow + PP Pangaia italic question. Then the
 * recording stage, which fills the remainder. The form owns its own
 * action button at the bottom so the recording phase can swap the
 * button label (Začít / Hotovo / Uložit) without rerendering the strip.
 */
export default async function NewAudioMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string }>;
}) {
  await requireSenior();
  const params = await searchParams;
  const ctx = await getAssignmentContext(params.assignment ?? null);

  return (
    <div className="pt-10 sm:pt-14 pb-10">
      <div className="mb-8">
        <Link href="/home" className="es-back-link">
          <span aria-hidden>←</span> Zpět
        </Link>
      </div>

      <header className="mb-10">
        {ctx ? (
          <>
            <span className="es-eyebrow">Vaše otázka</span>
            <h2 className="es-question">{ctx.question}</h2>
          </>
        ) : (
          <h2 className="es-question">Vyprávějte vzpomínku nahlas.</h2>
        )}
        <div className="es-rule-gold" />
      </header>

      <AudioMemoryForm assignmentId={ctx?.assignmentId ?? null} />
    </div>
  );
}

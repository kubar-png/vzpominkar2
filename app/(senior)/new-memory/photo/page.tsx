import Link from "next/link";
import type { Metadata } from "next";
import { getAssignmentContext } from "@/lib/memories/server";
import { PhotoMemoryForm } from "./photo-form";

export const metadata: Metadata = { title: "Přidat fotku" };

/**
 * Photo answer page — editorial direction.
 *
 * Back link + eyebrow + PP Pangaia italic question, then the photo
 * picker + optional caption inside an editorial card.
 */
export default async function NewPhotoMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getAssignmentContext(params.assignment ?? null);

  return (
    <div className="pt-10 sm:pt-14 pb-10">
      <div className="mb-8">
        <Link href="/home" className="es-back-link">
          <span aria-hidden>←</span> Zpět
        </Link>
      </div>

      <header className="mb-8">
        {ctx ? (
          <>
            <span className="es-eyebrow">Vaše otázka</span>
            <h2 className="es-question">{ctx.question}</h2>
          </>
        ) : (
          <h2 className="es-question">Přidat fotku.</h2>
        )}
        <div className="es-rule-gold" />
      </header>

      <PhotoMemoryForm assignmentId={ctx?.assignmentId ?? null} />
    </div>
  );
}

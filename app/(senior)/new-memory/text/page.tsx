import Link from "next/link";
import type { Metadata } from "next";
import { requireSenior } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAssignmentContext } from "@/lib/memories/server";
import { MemoryWhenHint } from "@/components/senior/MemoryWhenHint";
import { TextMemoryForm } from "./text-form";

export const metadata: Metadata = { title: "Napsat odpověď" };

/**
 * Text answer page — editorial direction.
 *
 * Back link + eyebrow + PP Pangaia italic question on top, then the large
 * cream textarea inside an editorial card. Autosave logic is unchanged.
 */
export default async function NewTextMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string; memory?: string }>;
}) {
  const senior = await requireSenior();
  const params = await searchParams;
  const ctx = await getAssignmentContext(params.assignment ?? null, senior.familyId);

  // Resume an existing draft when /new-memory/text?memory=ID is hit.
  let draft: { id: string; text: string } | null = null;
  if (params.memory) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("memories")
      .select("id, text_content, status")
      .eq("id", params.memory)
      .eq("author_id", senior.id)
      .eq("status", "draft")
      .maybeSingle<{ id: string; text_content: string | null; status: string }>();
    if (data) draft = { id: data.id, text: data.text_content ?? "" };
  }

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
          <h2 className="es-question">Napsat vzpomínku.</h2>
        )}
        <div className="es-rule-gold" />
      </header>

      <MemoryWhenHint />

      <TextMemoryForm
        assignmentId={ctx?.assignmentId ?? null}
        draft={draft}
      />
    </div>
  );
}

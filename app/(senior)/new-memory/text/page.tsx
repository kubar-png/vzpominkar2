import Link from "next/link";
import type { Metadata } from "next";
import { requireSenior } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAssignmentContext } from "@/lib/memories/server";
import { SeniorHeading } from "@/components/senior/SeniorHeading";
import { TextMemoryForm } from "./text-form";

export const metadata: Metadata = { title: "Napsat odpověď" };

export default async function NewTextMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string; memory?: string }>;
}) {
  const senior = await requireSenior();
  const params = await searchParams;
  const ctx = await getAssignmentContext(params.assignment ?? null);

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
    <div className="flex flex-col h-full">
      {/* Top strip - question + back link */}
      <div className="shrink-0 px-6 pt-4 pb-3 border-b border-paper-200 bg-paper-50">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm text-paper-500 hover:text-navy-900 mb-2 transition-colors"
        >
          ← Zpět na hlavní stránku
        </Link>
        {ctx ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-paper-500 mb-1">
              Vaše otázka
            </p>
            <SeniorHeading level={3}>
              {ctx.question}
            </SeniorHeading>
          </>
        ) : (
          <SeniorHeading level={3}>Napsat vzpomínku</SeniorHeading>
        )}
        <div className="mt-2 h-px bg-gradient-to-r from-gold-400 via-gold-300 to-transparent opacity-60" />
      </div>

      {/* Form fills the remaining height - button pinned at bottom inside */}
      <TextMemoryForm
        assignmentId={ctx?.assignmentId ?? null}
        draft={draft}
      />
    </div>
  );
}

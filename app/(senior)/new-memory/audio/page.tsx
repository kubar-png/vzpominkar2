import Link from "next/link";
import type { Metadata } from "next";
import { requireSenior } from "@/lib/auth/permissions";
import { getAssignmentContext } from "@/lib/memories/server";
import { SeniorHeading } from "@/components/senior/SeniorHeading";
import { AudioMemoryForm } from "./audio-form";

export const metadata: Metadata = { title: "Nahrát hlasem" };

export default async function NewAudioMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string }>;
}) {
  await requireSenior();
  const params = await searchParams;
  const ctx = await getAssignmentContext(params.assignment ?? null);

  return (
    <div className="flex flex-col h-full">
      {/* Top strip */}
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
          <SeniorHeading level={3}>Nahrát vzpomínku hlasem</SeniorHeading>
        )}
        <div className="mt-2 h-px bg-gradient-to-r from-gold-400 via-gold-300 to-transparent opacity-60" />
      </div>

      {/* Audio form - fills rest, vertically centered */}
      <AudioMemoryForm assignmentId={ctx?.assignmentId ?? null} />
    </div>
  );
}

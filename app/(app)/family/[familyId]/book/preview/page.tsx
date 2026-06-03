import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchSignUrls } from "@/lib/family/server";
import { BookPreviewClient } from "./book-preview-client";
import { resolveGender } from "@/lib/gender";

export const metadata: Metadata = { title: "Náhled knihy" };

type Spread = {
  id: string;
  title: string | null;
  text: string | null;
  question: string | null;
  authorName: string | null;
  date: string;
  imageUrls: string[];
};

export default async function BookPreviewPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  await requireOwnerOfFamily(familyId);

  const admin = createAdminClient();

  const [{ data: family }, { data: rawMemories }] = await Promise.all([
    admin
      .from("families")
      .select("display_name, senior_display_name")
      .eq("id", familyId)
      .maybeSingle<{ display_name: string | null; senior_display_name: string | null }>(),
    admin
      .from("memories")
      .select(
        `id, title, text_content, audio_transcript, status, created_at, memory_date,
         prompts(question),
         profiles!memories_author_id_fkey(display_name, gender)`,
      )
      .eq("family_id", familyId)
      .eq("status", "published")
      .order("memory_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .returns<{
        id: string;
        title: string | null;
        text_content: string | null;
        audio_transcript: string | null;
        status: string;
        created_at: string;
        memory_date: string | null;
        prompts: { question: string } | null;
        profiles: { display_name: string | null; gender: string | null } | null;
      }[]>(),
  ]);

  const list = rawMemories ?? [];
  const ids = list.map((m) => m.id);

  const { data: rawAttachments } = ids.length
    ? await admin
        .from("memory_attachments")
        .select("memory_id, storage_path, mime_type")
        .in("memory_id", ids)
        .returns<{ memory_id: string; storage_path: string; mime_type: string }[]>()
    : { data: [] };

  const attachPaths = (rawAttachments ?? [])
    .filter((a) => a.mime_type.startsWith("image/"))
    .map((a) => a.storage_path);
  const signed = await batchSignUrls("memory-attachments", attachPaths);

  const imagesByMemory = new Map<string, string[]>();
  for (const a of rawAttachments ?? []) {
    if (!a.mime_type.startsWith("image/")) continue;
    const url = signed.get(a.storage_path);
    if (!url) continue;
    const arr = imagesByMemory.get(a.memory_id) ?? [];
    arr.push(url);
    imagesByMemory.set(a.memory_id, arr);
  }

  const spreads: Spread[] = list.map((m) => ({
    id: m.id,
    title: m.title,
    text: m.text_content || m.audio_transcript,
    question: m.prompts?.question
      ? resolveGender(m.prompts.question, (m.profiles?.gender as "male" | "female" | null) ?? null)
      : null,
    authorName: m.profiles?.display_name ?? null,
    date: formatDate(m.memory_date ?? m.created_at),
    imageUrls: imagesByMemory.get(m.id) ?? [],
  }));

  const familyName = family?.display_name ?? family?.senior_display_name ?? "Vzpomínky";
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/family/${familyId}/book`}
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-navy-700)]"
        >
          <ArrowLeft size={14} aria-hidden />
          Zpět na knihu
        </Link>
      </div>

      {/* Header */}
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(28px,4vw,38px)] font-medium leading-[1.1] tracking-[-0.02em] text-[var(--color-navy-900)]">
          Náhled vaší knihy
        </h1>
        <p className="text-[15px] text-[var(--color-text-muted)]">
          Listujte stranu po straně. Vyberte vzhled přebalu — kniha se ihned převlékne.
        </p>
      </header>

      {/* Interactive flip book + cover picker */}
      <BookPreviewClient
        familyName={familyName}
        year={currentYear}
        memories={spreads}
      />
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

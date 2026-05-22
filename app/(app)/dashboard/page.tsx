import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchSignUrls } from "@/lib/family/server";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { StatusBlock } from "@/components/app/StatusBlock";
import { BookProgressCard } from "@/components/app/BookProgressCard";
import { MemoryFeed } from "./memory-feed";

export const metadata: Metadata = { title: "Domů" };

export type MemoryAttachment = {
  storage_path: string;
  signedUrl: string;
  mime_type: string;
  caption: string | null;
};

export type MemoryItem = {
  id: string;
  title: string | null;
  text_content: string | null;
  audio_path: string | null;
  audioUrl: string | null;
  audio_duration_seconds: number | null;
  status: string;
  is_favorite: boolean;
  created_at: string;
  memory_date: string | null;
  question: string | null;
  authorId: string | null;
  authorName: string | null;
  attachments: MemoryAttachment[];
};

export type SeniorOption = { id: string; displayName: string };

const RECENT_LIMIT = 6;

export default async function DashboardPage() {
  const owner = await requireOwner();
  if (!owner.familyId) redirect("/onboarding");

  const supabase = createAdminClient();

  const [
    { data: rawMemories },
    { data: rawSeniors },
    { data: rawNext },
    { count: publishedCount },
  ] = await Promise.all([
    supabase
      .from("memories")
      .select(
        "id, title, text_content, audio_path, audio_duration_seconds, status, is_favorite, created_at, memory_date, prompts(question), profiles!memories_author_id_fkey(id, display_name)",
      )
      .eq("family_id", owner.familyId)
      .order("is_favorite", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT)
      .returns<
        {
          id: string;
          title: string | null;
          text_content: string | null;
          audio_path: string | null;
          audio_duration_seconds: number | null;
          status: string;
          is_favorite: boolean;
          created_at: string;
          memory_date: string | null;
          prompts: { question: string } | null;
          profiles: { id: string; display_name: string | null } | null;
        }[]
      >(),
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("family_id", owner.familyId)
      .eq("role", "senior")
      .returns<{ id: string; display_name: string | null }[]>(),
    supabase
      .from("prompt_assignments")
      .select("scheduled_for, senior_id, prompts(question)")
      .eq("family_id", owner.familyId)
      .is("answered_memory_id", null)
      .order("scheduled_for", { ascending: true })
      .limit(1)
      .returns<{
        scheduled_for: string;
        senior_id: string | null;
        prompts: { question: string } | null;
      }[]>(),
    supabase
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("family_id", owner.familyId)
      .eq("status", "published"),
  ]);

  const list = rawMemories ?? [];
  const ids = list.map((m) => m.id);

  const { data: rawAttachments } = ids.length
    ? await supabase
        .from("memory_attachments")
        .select("memory_id, storage_path, mime_type, caption")
        .in("memory_id", ids)
        .returns<
          { memory_id: string; storage_path: string; mime_type: string; caption: string | null }[]
        >()
    : { data: [] };

  const audioPaths = list.flatMap((m) => (m.audio_path ? [m.audio_path] : []));
  const attachPaths = (rawAttachments ?? []).map((a) => a.storage_path);

  const [audioUrls, attachUrls] = await Promise.all([
    batchSignUrls("memory-audio", audioPaths),
    batchSignUrls("memory-attachments", attachPaths),
  ]);

  // Group attachments by memory id
  const attachByMemory = new Map<
    string,
    { storage_path: string; mime_type: string; caption: string | null }[]
  >();
  for (const a of rawAttachments ?? []) {
    const arr = attachByMemory.get(a.memory_id) ?? [];
    arr.push(a);
    attachByMemory.set(a.memory_id, arr);
  }

  const memories: MemoryItem[] = list.map((m) => ({
    id: m.id,
    title: m.title,
    text_content: m.text_content,
    audio_path: m.audio_path,
    audioUrl: m.audio_path ? (audioUrls.get(m.audio_path) ?? null) : null,
    audio_duration_seconds: m.audio_duration_seconds,
    status: m.status,
    is_favorite: m.is_favorite ?? false,
    created_at: m.created_at,
    memory_date: m.memory_date,
    question: m.prompts?.question ?? null,
    authorId: m.profiles?.id ?? null,
    authorName: m.profiles?.display_name ?? null,
    attachments: (attachByMemory.get(m.id) ?? []).map((a) => ({
      storage_path: a.storage_path,
      signedUrl: attachUrls.get(a.storage_path) ?? "",
      mime_type: a.mime_type,
      caption: a.caption,
    })),
  }));

  const seniors: SeniorOption[] = (rawSeniors ?? []).map((s) => ({
    id: s.id,
    displayName: s.display_name ?? "Blízký",
  }));
  const seniorNameById = new Map(seniors.map((s) => [s.id, s.displayName]));

  const onlySenior = seniors.length === 1 ? seniors[0] : null;
  const firstName = onlySenior
    ? (onlySenior.displayName.split(/\s+/)[0] || onlySenior.displayName)
    : null;
  const description = firstName
    ? `Co ${firstName} zatím vyprávěl${firstName.endsWith("a") || firstName.endsWith("á") ? "a" : ""}.`
    : seniors.length > 1
      ? "Co vaši blízcí zatím vyprávěli."
      : "Tady se objeví vzpomínky, jakmile začne první vyprávění.";

  const nextRow = rawNext?.[0];
  const next = nextRow && nextRow.prompts
    ? {
        question: nextRow.prompts.question,
        scheduledFor: nextRow.scheduled_for,
        seniorName: nextRow.senior_id
          ? (seniorNameById.get(nextRow.senior_id) ?? null)
          : null,
      }
    : null;

  return (
    <div className="space-y-10">
      <AppPageHeader
        numeral="I"
        sectionLabel="Tento týden"
        title="Domů"
        description={description}
        italic
      />

      <StatusBlock
        familyId={owner.familyId}
        next={next}
        onlySeniorFirstName={firstName}
      />

      <BookProgressCard familyId={owner.familyId} count={publishedCount ?? 0} />

      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--color-border)] pb-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal tracking-tight text-[var(--color-navy-900)]">
            Poslední vzpomínky
          </h2>
          <Link
            href={`/family/${owner.familyId}/memories`}
            className="shrink-0 text-sm text-[var(--color-navy-700)] underline-offset-2 hover:underline"
          >
            Všechny vzpomínky →
          </Link>
        </div>

        <MemoryFeed memories={memories} seniors={seniors} familyId={owner.familyId} />
      </div>
    </div>
  );
}

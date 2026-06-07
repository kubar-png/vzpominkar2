import { createAdminClient } from "@/lib/supabase/admin";
import { batchSignUrls } from "@/lib/family/server";
import { MemoryFeed } from "./memory-feed";
import type { MemoryItem, SeniorOption } from "./types";

interface MemoryFeedAsyncProps {
  familyId: string;
  seniors: SeniorOption[];
  limit: number;
}

/**
 * Heavy fetch (memories + attachments + N signed-URL roundtrips) wrapped
 * for <Suspense> so the dashboard shell and "Poslední vzpomínky" heading
 * paint immediately on every navigation. Cards stream in once storage
 * has handed back signed URLs.
 */
export async function MemoryFeedAsync({ familyId, seniors, limit }: MemoryFeedAsyncProps) {
  const supabase = createAdminClient();

  const { data: rawMemories } = await supabase
    .from("memories")
    .select(
      "id, title, text_content, audio_path, audio_duration_seconds, status, is_favorite, created_at, memory_date, prompts(question), profiles!memories_author_id_fkey(id, display_name, gender)",
    )
    .eq("family_id", familyId)
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
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
        profiles: { id: string; display_name: string | null; gender: string | null } | null;
      }[]
    >();

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
    authorGender: (m.profiles?.gender as "male" | "female" | null) ?? null,
    attachments: (attachByMemory.get(m.id) ?? []).map((a) => ({
      storage_path: a.storage_path,
      signedUrl: attachUrls.get(a.storage_path) ?? "",
      mime_type: a.mime_type,
      caption: a.caption,
    })),
  }));

  return <MemoryFeed memories={memories} seniors={seniors} familyId={familyId} />;
}

/** Skeleton row of memory cards — keeps the page bottom from jumping. */
export function MemoryFeedSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white"
            style={{ opacity: 0.55 }}
          />
        ))}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchSignUrls } from "@/lib/family/server";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { MemoriesArchive, type ArchiveMemory, type ArchiveSenior } from "./memories-archive";

export const metadata: Metadata = { title: "Vzpomínky" };

export default async function FamilyMemoriesPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = await params;
  await requireOwnerOfFamily(familyId);
  const supabase = createAdminClient();

  const [{ data: rawMemories }, { data: rawSeniors }] = await Promise.all([
    supabase
      .from("memories")
      .select(
        "id, title, text_content, audio_path, audio_duration_seconds, status, is_favorite, created_at, prompts(question), profiles!memories_author_id_fkey(id, display_name)",
      )
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
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
          prompts: { question: string } | null;
          profiles: { id: string; display_name: string | null } | null;
        }[]
      >(),
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("family_id", familyId)
      .eq("role", "senior")
      .returns<{ id: string; display_name: string | null }[]>(),
  ]);

  const list = rawMemories ?? [];
  const ids = list.map((m) => m.id);

  const audioPaths = list.flatMap((m) => (m.audio_path ? [m.audio_path] : []));
  const { data: rawAttachments } = ids.length
    ? await supabase
        .from("memory_attachments")
        .select("memory_id, storage_path, mime_type, caption")
        .in("memory_id", ids)
        .returns<
          { memory_id: string; storage_path: string; mime_type: string; caption: string | null }[]
        >()
    : { data: [] };

  const attachmentPaths = (rawAttachments ?? []).map((a) => a.storage_path);
  const [audioUrls, attachmentUrls] = await Promise.all([
    batchSignUrls("memory-audio", audioPaths),
    batchSignUrls("memory-attachments", attachmentPaths),
  ]);

  const attachByMemory = new Map<
    string,
    { storage_path: string; mime_type: string; caption: string | null; signedUrl: string }[]
  >();
  for (const a of rawAttachments ?? []) {
    const arr = attachByMemory.get(a.memory_id) ?? [];
    arr.push({ ...a, signedUrl: attachmentUrls.get(a.storage_path) ?? "" });
    attachByMemory.set(a.memory_id, arr);
  }

  const memories: ArchiveMemory[] = list.map((m) => ({
    id: m.id,
    title: m.title,
    text: m.text_content,
    audioUrl: m.audio_path ? (audioUrls.get(m.audio_path) ?? null) : null,
    audioDurationSeconds: m.audio_duration_seconds,
    status: m.status,
    isFavorite: m.is_favorite ?? false,
    createdAt: m.created_at,
    question: m.prompts?.question ?? null,
    authorId: m.profiles?.id ?? null,
    authorName: m.profiles?.display_name ?? null,
    images: (attachByMemory.get(m.id) ?? []).filter((a) => a.mime_type.startsWith("image/")),
  }));

  const seniors: ArchiveSenior[] = (rawSeniors ?? []).map((s) => ({
    id: s.id,
    displayName: s.display_name ?? "Blízký",
  }));

  return (
    <div className="space-y-10">
      <AppPageHeader
        title="Vzpomínky"
        description="Vše, co jste zatím nahráli."
      />

      <MemoriesArchive memories={memories} seniors={seniors} familyId={familyId} />
    </div>
  );
}

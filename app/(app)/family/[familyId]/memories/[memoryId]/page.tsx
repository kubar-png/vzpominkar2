import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchSignUrls } from "@/lib/family/server";
import { MemoryDetail } from "./memory-detail";

type Params = { familyId: string; memoryId: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { memoryId } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("memories").select("title").eq("id", memoryId).maybeSingle();
  return { title: data?.title ?? "Vzpomínka" };
}

export type MemoryDetailData = {
  id: string;
  familyId: string;
  title: string | null;
  text_content: string | null;
  audio_path: string | null;
  audioUrl: string | null;
  audio_duration_seconds: number | null;
  audio_transcript: string | null;
  is_favorite: boolean;
  status: string;
  created_at: string;
  memory_date: string | null;
  question: string | null;
  authorName: string | null;
  authorRole: string | null;
  attachments: {
    storage_path: string;
    signedUrl: string;
    mime_type: string;
    caption: string | null;
  }[];
};

export default async function MemoryDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { familyId, memoryId } = await params;
  await requireOwnerOfFamily(familyId);

  const admin = createAdminClient();

  const { data: raw } = await admin
    .from("memories")
    .select(
      `id, title, text_content, audio_path, audio_duration_seconds, audio_transcript, status, is_favorite, created_at, memory_date,
       prompts(question),
       profiles!memories_author_id_fkey(display_name, senior_role)`,
    )
    .eq("id", memoryId)
    .eq("family_id", familyId)
    .maybeSingle<{
      id: string;
      title: string | null;
      text_content: string | null;
      audio_path: string | null;
      audio_duration_seconds: number | null;
      audio_transcript: string | null;
      status: string;
      is_favorite: boolean;
      created_at: string;
      memory_date: string | null;
      prompts: { question: string } | null;
      profiles: { display_name: string | null; senior_role: string | null } | null;
    }>();

  if (!raw) notFound();

  const { data: rawAttachments } = await admin
    .from("memory_attachments")
    .select("storage_path, mime_type, caption")
    .eq("memory_id", memoryId)
    .returns<{ storage_path: string; mime_type: string; caption: string | null }[]>();

  const audioPaths = raw.audio_path ? [raw.audio_path] : [];
  const attachPaths = (rawAttachments ?? []).map((a) => a.storage_path);

  const [audioUrls, attachUrls] = await Promise.all([
    batchSignUrls("memory-audio", audioPaths),
    batchSignUrls("memory-attachments", attachPaths),
  ]);

  const memory: MemoryDetailData = {
    id: raw.id,
    familyId,
    title: raw.title,
    text_content: raw.text_content,
    audio_path: raw.audio_path,
    audioUrl: raw.audio_path ? (audioUrls.get(raw.audio_path) ?? null) : null,
    audio_duration_seconds: raw.audio_duration_seconds,
    audio_transcript: raw.audio_transcript,
    is_favorite: raw.is_favorite ?? false,
    status: raw.status,
    created_at: raw.created_at,
    memory_date: raw.memory_date,
    question: raw.prompts?.question ?? null,
    authorName: raw.profiles?.display_name ?? null,
    authorRole: raw.profiles?.senior_role ?? null,
    attachments: (rawAttachments ?? []).map((a) => ({
      storage_path: a.storage_path,
      signedUrl: attachUrls.get(a.storage_path) ?? "",
      mime_type: a.mime_type,
      caption: a.caption,
    })),
  };

  return <MemoryDetail memory={memory} />;
}

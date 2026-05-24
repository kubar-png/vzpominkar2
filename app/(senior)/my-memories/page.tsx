import Link from "next/link";
import type { Metadata } from "next";
import { requireSenior } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { MemoryItem } from "./memory-item";

export const metadata: Metadata = { title: "Moje vzpomínky" };

/**
 * Senior archive — editorial direction.
 *
 * Chronological list of published memories. Each entry shows the date in
 * small-caps eyebrow, the original question in PP Pangaia italic, then the
 * memory body (audio player, text, photos). Audio uses the same signed-URL
 * batch the legacy version did.
 */
export default async function MyMemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const senior = await requireSenior();
  const params = await searchParams;
  const supabase = createAdminClient();

  const { data: memories } = await supabase
    .from("memories")
    .select("id, title, text_content, audio_path, audio_transcript, audio_transcript_polished, status, created_at, prompt_id, prompts(question)")
    .eq("family_id", senior.familyId ?? "")
    .eq("author_id", senior.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<
      {
        id: string;
        title: string | null;
        text_content: string | null;
        audio_path: string | null;
        audio_transcript: string | null;
        audio_transcript_polished: string | null;
        status: string;
        created_at: string;
        prompt_id: string | null;
        prompts: { question: string } | null;
      }[]
    >();

  const list = memories ?? [];

  const ids = list.map((m) => m.id);
  const { data: attachments } = ids.length
    ? await supabase
        .from("memory_attachments")
        .select("id, memory_id, storage_path, mime_type, caption")
        .in("memory_id", ids)
        .returns<
          {
            id: string;
            memory_id: string;
            storage_path: string;
            mime_type: string;
            caption: string | null;
          }[]
        >()
    : { data: [] };

  const attachmentByMemory = new Map<
    string,
    { storage_path: string; mime_type: string; caption: string | null; signedUrl: string | null }[]
  >();
  for (const a of attachments ?? []) {
    const list = attachmentByMemory.get(a.memory_id) ?? [];
    list.push({ ...a, signedUrl: null });
    attachmentByMemory.set(a.memory_id, list);
  }

  const audioPaths = list.flatMap((m) => (m.audio_path ? [m.audio_path] : []));
  const attachmentPaths = (attachments ?? []).map((a) => a.storage_path);

  const [signedAudioUrls, signedAttachmentUrls] = await Promise.all([
    batchSign(supabase, "memory-audio", audioPaths),
    batchSign(supabase, "memory-attachments", attachmentPaths),
  ]);
  for (const [, atts] of attachmentByMemory) {
    for (const a of atts) {
      a.signedUrl = signedAttachmentUrls.get(a.storage_path) ?? null;
    }
  }

  return (
    <div className="pb-10">
      {/* Header strip */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="es-eyebrow">Archiv</span>
          <h1>Moje vzpomínky</h1>
        </div>
        <Link href="/home" className="es-btn es-btn-outline">
          <span aria-hidden>←</span> Domů
        </Link>
      </div>

      {params.saved ? (
        <div role="status" className="es-banner es-banner-success mb-8">
          Hotovo. Vaše vzpomínka je uložena.
        </div>
      ) : null}

      {list.length === 0 ? (
        <div className="es-card">
          <span className="es-eyebrow">Zatím prázdno</span>
          <h2 className="es-question mb-4">Tady se objeví, co vyprávíte.</h2>
          <p className="text-[19px] text-[var(--ink-soft)] leading-relaxed">
            Až odpovíte na první otázku, najdete ji tady — i nahrávku, i text,
            i fotky. Všechno na jednom místě, chronologicky.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {list.map((m) => (
            <MemoryItem
              key={m.id}
              isSenior={senior.isSenior}
              memory={{
                id: m.id,
                title: m.title,
                text: m.text_content,
                createdAt: m.created_at,
                question: m.prompts?.question ?? null,
                audioUrl: m.audio_path ? signedAudioUrls.get(m.audio_path) ?? null : null,
                audioTranscript: m.audio_transcript,
                audioTranscriptPolished: m.audio_transcript_polished,
                attachments: attachmentByMemory.get(m.id) ?? [],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type SupabaseClient = ReturnType<typeof createAdminClient>;

async function batchSign(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, 60 * 15);
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) out.set(row.path, row.signedUrl);
  }
  return out;
}

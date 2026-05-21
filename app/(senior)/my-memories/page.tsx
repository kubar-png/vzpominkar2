import Link from "next/link";
import type { Metadata } from "next";
import { requireSenior } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { SeniorCard } from "@/components/senior/SeniorCard";
import { SeniorHeading } from "@/components/senior/SeniorHeading";
import { seniorButtonVariants } from "@/components/senior/SeniorButton";
import { MemoryItem } from "./memory-item";

export const metadata: Metadata = { title: "Moje vzpomínky" };

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
    .select("id, title, text_content, audio_path, status, created_at, prompt_id, prompts(question)")
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
        status: string;
        created_at: string;
        prompt_id: string | null;
        prompts: { question: string } | null;
      }[]
    >();

  const list = memories ?? [];

  // Resolve attachments + signed URLs in one bulk roundtrip.
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

  // Sign URLs for audio + attachments (15 min)
  const audioPaths = list.flatMap((m) => (m.audio_path ? [m.audio_path] : []));
  const signedAudioUrls = await batchSign(supabase, "memory-audio", audioPaths);

  const attachmentPaths = (attachments ?? []).map((a) => a.storage_path);
  const signedAttachmentUrls = await batchSign(supabase, "memory-attachments", attachmentPaths);
  for (const [, atts] of attachmentByMemory) {
    for (const a of atts) {
      a.signedUrl = signedAttachmentUrls.get(a.storage_path) ?? null;
    }
  }

  return (
    <div className="space-y-8">
      {params.saved ? (
        <p
          role="status"
          className="rounded-[var(--radius-senior-input)] bg-[var(--color-navy-50)] border-2 border-[var(--color-navy-200)] p-4 text-[var(--text-senior)]"
        >
          Hotovo. Vaše vzpomínka je uložena.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <SeniorHeading level={1}>Moje vzpomínky</SeniorHeading>
        <Link
          href="/home"
          className={seniorButtonVariants({ variant: "secondary", size: "md" })}
        >
          ← Domů
        </Link>
      </div>

      {list.length === 0 ? (
        <SeniorCard>
          <p className="text-[var(--text-senior)]">
            Zatím nemáte žádnou uloženou vzpomínku. Až odpovíte na první otázku, najdete ji tady.
          </p>
        </SeniorCard>
      ) : (
        <div className="space-y-6">
          {list.map((m) => (
            <MemoryItem
              key={m.id}
              memory={{
                id: m.id,
                title: m.title,
                text: m.text_content,
                createdAt: m.created_at,
                question: m.prompts?.question ?? null,
                audioUrl: m.audio_path ? signedAudioUrls.get(m.audio_path) ?? null : null,
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

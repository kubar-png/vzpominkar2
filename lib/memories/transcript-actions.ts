"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUser } from "@/lib/auth/permissions";
import { polishTranscript, type PolishLevel } from "@/lib/memories/polish";

export type TranscriptActionState =
  | { ok: true; text: string }
  | { ok: false; error: string }
  | null;

/**
 * Authorize the caller against a memory: must be either the owner of the
 * family or the senior who authored the memory. Returns the family/memory
 * row when allowed.
 */
async function loadAuthorizedMemory(memoryId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Nepřihlášený uživatel.");
  const admin = createAdminClient();

  const { data: memory } = await admin
    .from("memories")
    .select("id, family_id, author_id, audio_transcript, audio_transcript_polished")
    .eq("id", memoryId)
    .maybeSingle<{
      id: string;
      family_id: string;
      author_id: string;
      audio_transcript: string | null;
      audio_transcript_polished: string | null;
    }>();
  if (!memory) throw new Error("Vzpomínka neexistuje.");

  if (user.role === "owner") {
    const { data: profile } = await admin
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .maybeSingle<{ family_id: string | null }>();
    if (profile?.family_id !== memory.family_id) {
      throw new Error("Nemáte oprávnění upravovat tuto vzpomínku.");
    }
  } else if (user.role === "senior") {
    if (memory.author_id !== user.id) {
      throw new Error("Nemáte oprávnění upravovat tuto vzpomínku.");
    }
  } else {
    throw new Error("Neznámá role.");
  }
  return { memory, familyId: memory.family_id };
}

/**
 * Run AI polish (light or full) on the memory's current transcript.
 * Persists the result to `audio_transcript_polished` and returns it.
 */
export async function aiPolishMemoryTranscript(
  _prev: TranscriptActionState,
  formData: FormData,
): Promise<TranscriptActionState> {
  try {
    const memoryId = String(formData.get("memoryId") ?? "");
    const levelStr = String(formData.get("level") ?? "light");
    if (levelStr !== "light" && levelStr !== "full") {
      return { ok: false, error: "Neznámá úroveň úpravy." };
    }
    const level = levelStr as PolishLevel;

    const { memory, familyId } = await loadAuthorizedMemory(memoryId);
    const source = memory.audio_transcript_polished ?? memory.audio_transcript;
    if (!source || !source.trim()) {
      return { ok: false, error: "Vzpomínka nemá přepis k úpravě." };
    }

    const polished = await polishTranscript(source, level);
    if (!polished) {
      return { ok: false, error: "AI úpravu se nepodařilo dokončit. Zkuste znovu." };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("memories")
      .update({
        audio_transcript_polished: polished,
        transcript_edited_at: new Date().toISOString(),
      })
      .eq("id", memoryId);
    if (error) return { ok: false, error: "Uložení úpravy se nezdařilo." };

    revalidatePath(`/family/${familyId}/memories/${memoryId}`);
    revalidatePath(`/my-memories`);
    return { ok: true, text: polished };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Něco se pokazilo." };
  }
}

/**
 * Save a manually-edited transcript. Empty/whitespace clears the polished
 * column (so UI falls back to the raw Whisper output).
 */
export async function saveEditedTranscript(
  _prev: TranscriptActionState,
  formData: FormData,
): Promise<TranscriptActionState> {
  try {
    const memoryId = String(formData.get("memoryId") ?? "");
    const text = String(formData.get("text") ?? "").trim();

    const { familyId } = await loadAuthorizedMemory(memoryId);

    const admin = createAdminClient();
    const { error } = await admin
      .from("memories")
      .update({
        audio_transcript_polished: text || null,
        transcript_edited_at: new Date().toISOString(),
      })
      .eq("id", memoryId);
    if (error) return { ok: false, error: "Uložení textu se nezdařilo." };

    revalidatePath(`/family/${familyId}/memories/${memoryId}`);
    revalidatePath(`/my-memories`);
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Něco se pokazilo." };
  }
}

/**
 * Revert to the raw Whisper transcript by clearing the polished column.
 */
export async function revertTranscript(
  _prev: TranscriptActionState,
  formData: FormData,
): Promise<TranscriptActionState> {
  try {
    const memoryId = String(formData.get("memoryId") ?? "");
    const { memory, familyId } = await loadAuthorizedMemory(memoryId);

    const admin = createAdminClient();
    const { error } = await admin
      .from("memories")
      .update({
        audio_transcript_polished: null,
        transcript_edited_at: new Date().toISOString(),
      })
      .eq("id", memoryId);
    if (error) return { ok: false, error: "Vrátit původní přepis se nepodařilo." };

    revalidatePath(`/family/${familyId}/memories/${memoryId}`);
    revalidatePath(`/my-memories`);
    return { ok: true, text: memory.audio_transcript ?? "" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Něco se pokazilo." };
  }
}

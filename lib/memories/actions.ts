"use server";

import "server-only";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSenior } from "@/lib/auth/permissions";
import { invalidateFamilyStats } from "@/lib/family/stats";
import { sendEmail } from "@/lib/email/send";
import { newMemoryNotificationEmail } from "@/lib/email/templates";
import { transcribeAudio } from "@/lib/memories/transcribe";
import { polishTranscript } from "@/lib/memories/polish";
import { extractYear } from "@/lib/memories/extract-metadata";
import { checkAiRateLimit, aiRateLimitMessage } from "@/lib/rate-limit";
import { onAssignmentAnswered, currentBookForSenior } from "@/lib/books/server";
import { SITE_URL } from "@/lib/site";
import { sniffImageMime, mimeToExt } from "@/lib/memories/image-sniff";

/**
 * Detect Next.js's internal redirect throw. `redirect()` propagates by
 * throwing an error with `digest` starting with "NEXT_REDIRECT"; if we
 * swallow it in a catch we'd kill the navigation and surface it as an
 * app error to the user. Rethrow in every Server Action catch block.
 */
function isNextRedirect(e: unknown): boolean {
  return (
    e instanceof Error &&
    "digest" in e &&
    typeof (e as { digest?: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

async function notifyOwnerOfNewMemory(opts: {
  familyId: string;
  seniorId: string;
}): Promise<void> {
  // Best-effort owner notification. Swallowed errors keep the senior flow
  // unblocked; the cron job is still the safety net.
  try {
    const admin = createAdminClient();
    const [{ data: owner }, { data: senior }] = await Promise.all([
      admin
        .from("profiles")
        .select("email, display_name")
        .eq("family_id", opts.familyId)
        .eq("role", "owner")
        .maybeSingle<{ email: string | null; display_name: string | null }>(),
      admin
        .from("profiles")
        .select("display_name, gender")
        .eq("id", opts.seniorId)
        .maybeSingle<{ display_name: string | null; gender: string | null }>(),
    ]);
    if (!owner?.email) return;
    const tpl = newMemoryNotificationEmail({
      ownerDisplayName: owner.display_name ?? "",
      seniorDisplayName: senior?.display_name ?? "Váš blízký",
      count: 1,
      appUrl: SITE_URL,
      seniorGender: (senior?.gender as "male" | "female" | null) ?? null,
    });
    await sendEmail({
      to: owner.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tag: "memory_notification",
    });
  } catch (err) {
    console.error("[memories] owner notify failed", err);
  }
}

export type MemoryActionState =
  | { ok: true; memoryId?: string }
  | { ok: false; error: string }
  | null;

/**
 * Resolve or create a draft memory for the current senior. Returns the
 * memory id ready for further updates / uploads. Uses a fresh server
 * client so PostgrestRowType inference works at the call site.
 */
async function ensureDraftMemory(opts: {
  assignmentId?: string | null;
  existingMemoryId?: string | null;
}): Promise<{ memoryId: string; familyId: string; userId: string }> {
  const senior = await requireSenior();
  if (!senior.familyId) throw new Error("Senior nemá přiřazenou rodinu.");
  const admin = createAdminClient();

  // Gate the paid AI pipeline: a senior may only create memories while their
  // family has an active, not-yet-full paid book to collect into. Seniors of
  // unpaid or over-cap families would otherwise consume transcription / AI
  // cost without an entitlement. Resolve it once and attribute the memory to
  // that volume from the start.
  const currentBook = await currentBookForSenior(admin, senior.familyId, senior.id);
  if (!currentBook) {
    throw new Error("Tato kniha zatím není aktivní.");
  }

  if (opts.existingMemoryId) {
    const { data } = await admin
      .from("memories")
      .select("id")
      .eq("id", opts.existingMemoryId)
      .eq("author_id", senior.id)
      .maybeSingle<{ id: string }>();
    if (data) return { memoryId: data.id, familyId: senior.familyId, userId: senior.id };
  }

  let promptId: string | null = null;
  if (opts.assignmentId) {
    // Verify the assignment is for this senior — family-id alone wasn't
    // enough, since families can contain multiple seniors and we don't want
    // one to answer another's prompt.
    const { data } = await admin
      .from("prompt_assignments")
      .select("prompt_id, family_id, senior_id")
      .eq("id", opts.assignmentId)
      .eq("senior_id", senior.id)
      .maybeSingle<{ prompt_id: string; family_id: string; senior_id: string }>();
    if (data && data.family_id === senior.familyId) {
      promptId = data.prompt_id;
    }
  }

  const { data, error } = await admin
    .from("memories")
    .insert({
      family_id: senior.familyId,
      author_id: senior.id,
      prompt_id: promptId,
      book_id: currentBook.id,
      status: "draft",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error("Nepodařilo se založit vzpomínku.");
  }
  return { memoryId: data.id, familyId: senior.familyId, userId: senior.id };
}

/* -------------------------------------------------------------------------- */
/* Text memory: autosave on each call, "publish" on Hotovo                    */
/* -------------------------------------------------------------------------- */

export async function saveTextMemory(
  _prev: MemoryActionState,
  formData: FormData,
): Promise<MemoryActionState> {
  try {
    const memoryId = String(formData.get("memoryId") ?? "");
    const text = String(formData.get("text") ?? "").trim();
    const finalize = formData.get("finalize") === "1";
    const assignmentId = String(formData.get("assignmentId") ?? "") || null;

    const { memoryId: realId, familyId, userId } = await ensureDraftMemory({
      existingMemoryId: memoryId || null,
      assignmentId,
    });

    // Rate-limit only finalize (not the silent autosave pings every 5s)
    if (finalize) {
      const rl = await checkAiRateLimit("text", userId, familyId);
      if (!rl.ok) return { ok: false, error: aiRateLimitMessage(rl) };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("memories")
      .update({
        text_content: text,
        status: finalize ? "published" : "draft",
      })
      .eq("id", realId);
    if (error) return { ok: false, error: "Uložení se nezdařilo." };

    if (finalize && assignmentId) {
      const admin = createAdminClient();
      // .eq("senior_id", userId) blocks one senior from marking another's
      // assignment as answered.
      await admin
        .from("prompt_assignments")
        .update({ answered_memory_id: realId })
        .eq("id", assignmentId)
        .eq("senior_id", userId);
      await onAssignmentAnswered(admin, assignmentId, realId);
    }

    if (finalize) {
      // Background year extraction — non-blocking on the user's save flow.
      // The redirect below fires while extraction runs server-side.
      void extractAndStoreYear(realId, text);
      await notifyOwnerOfNewMemory({ familyId, seniorId: userId });
      revalidatePath("/my-memories");
      invalidateFamilyStats(familyId);
      redirect("/my-memories?saved=1");
    }
    return { ok: true, memoryId: realId };
  } catch (e) {
    if (isNextRedirect(e)) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "Něco se pokazilo." };
  }
}

/** Fire-and-forget: pull a year mention out of the text via AI and stamp it
 * onto the memory row. Silent on failure; the memory simply has no temporal
 * anchor. */
async function extractAndStoreYear(memoryId: string, text: string): Promise<void> {
  try {
    const result = await extractYear(text);
    if (!result.year && !result.year_label) return;
    const admin = createAdminClient();
    const { data } = await admin
      .from("memories")
      .update({
        extracted_year: result.year,
        extracted_year_label: result.year_label,
        extracted_year_confidence: result.confidence,
      })
      .eq("id", memoryId)
      .select("family_id")
      .maybeSingle<{ family_id: string | null }>();
    invalidateFamilyStats(data?.family_id);
  } catch (err) {
    console.warn("[extractAndStoreYear] failed (non-fatal):", err);
  }
}

/* -------------------------------------------------------------------------- */
/* Audio memory: receives a Blob via FormData and uploads it                  */
/* -------------------------------------------------------------------------- */

export async function saveAudioMemory(
  _prev: MemoryActionState,
  formData: FormData,
): Promise<MemoryActionState> {
  try {
    const file = formData.get("audio");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Žádná nahrávka - zkuste znovu." };
    }
    const durationSeconds = Number(formData.get("duration") ?? 0);
    const assignmentId = String(formData.get("assignmentId") ?? "") || null;
    const existingMemoryId = String(formData.get("memoryId") ?? "") || null;

    const { memoryId, familyId, userId } = await ensureDraftMemory({
      existingMemoryId,
      assignmentId,
    });

    // Gate AI cost — Whisper transcription is the priciest call per memory.
    // Per-user hourly + per-family daily ceiling protects against a
    // compromised senior account hammering OpenAI.
    const rl = await checkAiRateLimit("audio", userId, familyId);
    if (!rl.ok) return { ok: false, error: aiRateLimitMessage(rl) };

    const admin = createAdminClient();
    const ext = file.name.split(".").pop() || "webm";
    const path = `${familyId}/${memoryId}/original.${ext}`;

    const { error: uploadErr } = await admin.storage
      .from("memory-audio")
      .upload(path, file, {
        upsert: true,
        contentType: file.type || "audio/webm",
      });
    if (uploadErr) return { ok: false, error: "Nahrání zvuku selhalo." };

    const { error: updErr } = await admin
      .from("memories")
      .update({
        audio_path: path,
        audio_duration_seconds: Number.isFinite(durationSeconds)
          ? Math.max(0, Math.round(durationSeconds))
          : null,
        status: "published",
      })
      .eq("id", memoryId);
    if (updErr) return { ok: false, error: "Uložení vzpomínky selhalo." };

    // Transcription is slow (Whisper) and must NOT block the senior's save.
    // The memory is already published; transcribe + extract the year AFTER
    // the response is sent. Failures leave audio_transcript NULL, which the
    // transcribe-backfill cron retries.
    after(async () => {
      try {
        const t = await transcribeAudio(file);
        if (t) {
          const a = createAdminClient();
          await a.from("memories").update({ audio_transcript: t }).eq("id", memoryId);
          await extractAndStoreYear(memoryId, t);
          // Auto correct + improve (invisible to the senior): context-fix
          // mis-heard words, then smooth into readable prose. The raw Whisper
          // text stays in audio_transcript for the "show original" toggle; the
          // improved version becomes what's shown by default.
          const improved = await polishTranscript(t.slice(0, 8000), "full");
          if (improved) {
            await a
              .from("memories")
              .update({
                audio_transcript_polished: improved,
                transcript_edited_at: new Date().toISOString(),
              })
              .eq("id", memoryId);
          }
        }
      } catch (err) {
        console.error("[saveAudioMemory] async transcription failed", { memoryId, err });
      }
    });

    if (assignmentId) {
      const admin = createAdminClient();
      await admin
        .from("prompt_assignments")
        .update({ answered_memory_id: memoryId })
        .eq("id", assignmentId)
        .eq("senior_id", userId);
      await onAssignmentAnswered(admin, assignmentId, memoryId);
    }

    await notifyOwnerOfNewMemory({ familyId, seniorId: userId });
    revalidatePath("/my-memories");
    invalidateFamilyStats(familyId);
    redirect("/my-memories?saved=1");
  } catch (e) {
    if (isNextRedirect(e)) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "Něco se pokazilo." };
  }
}

/* -------------------------------------------------------------------------- */
/* Photo memory: uploads an image as an attachment                            */
/* -------------------------------------------------------------------------- */

export async function savePhotoMemory(
  _prev: MemoryActionState,
  formData: FormData,
): Promise<MemoryActionState> {
  try {
    // Collect every file under the "photo" key - multi-photo upload.
    const files = formData
      .getAll("photo")
      .filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) {
      return { ok: false, error: "Vyberte fotku, prosím." };
    }
    // Per-file size cap so a malicious client can't blow past the action
    // body limit by feeding us a 24MB image.
    for (const f of files) {
      if (f.size > MAX_PHOTO_BYTES) {
        return { ok: false, error: "Fotka je příliš velká (max 10 MB)." };
      }
      if (!f.type.startsWith("image/")) {
        return { ok: false, error: "Všechny soubory musí být obrázky." };
      }
    }
    // Magic-byte sniff each file so a renamed .exe.jpg can't sneak in. The
    // browser-reported file.type is not authoritative.
    for (const f of files) {
      const head = new Uint8Array(await f.slice(0, 16).arrayBuffer());
      const detected = sniffImageMime(head);
      if (!detected) {
        return { ok: false, error: "Nepodporovaný formát obrázku." };
      }
    }

    const caption = String(formData.get("caption") ?? "").trim() || null;
    const assignmentId = String(formData.get("assignmentId") ?? "") || null;

    const { memoryId, familyId, userId } = await ensureDraftMemory({ assignmentId });

    const admin = createAdminClient();

    for (const file of files) {
      const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      const sniffed = sniffImageMime(head) ?? file.type;
      const ext = mimeToExt(sniffed) ?? (file.name.split(".").pop() || "jpg").toLowerCase();
      const attachmentId = crypto.randomUUID();
      const path = `${familyId}/${memoryId}/${attachmentId}.${ext}`;

      const { error: upErr } = await admin.storage
        .from("memory-attachments")
        .upload(path, file, { upsert: false, contentType: sniffed });
      if (upErr) return { ok: false, error: "Nahrání fotky selhalo." };

      const { error: attErr } = await admin.from("memory_attachments").insert({
        id: attachmentId,
        memory_id: memoryId,
        storage_path: path,
        // Trust the sniffed value over the client-reported one.
        mime_type: sniffed,
        // Caption applies to the memory as a whole; per-attachment captions
        // come later via owner edit.
        caption: null,
      });
      if (attErr) return { ok: false, error: "Uložení přílohy selhalo." };
    }

    const { error: updErr } = await admin
      .from("memories")
      .update({
        title: caption,
        status: "published",
      })
      .eq("id", memoryId);
    if (updErr) return { ok: false, error: "Uložení vzpomínky selhalo." };

    if (assignmentId) {
      const admin = createAdminClient();
      await admin
        .from("prompt_assignments")
        .update({ answered_memory_id: memoryId })
        .eq("id", assignmentId)
        .eq("senior_id", userId);
      await onAssignmentAnswered(admin, assignmentId, memoryId);
    }

    await notifyOwnerOfNewMemory({ familyId, seniorId: userId });
    revalidatePath("/my-memories");
    invalidateFamilyStats(familyId);
    redirect("/my-memories?saved=1");
  } catch (e) {
    if (isNextRedirect(e)) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "Něco se pokazilo." };
  }
}

/* -------------------------------------------------------------------------- */
/* Upload safety helpers                                                      */
/* -------------------------------------------------------------------------- */

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

// sniffImageMime / mimeToExt now live in lib/memories/image-sniff.ts (pure,
// unit-tested, importable from outside this "use server" module).

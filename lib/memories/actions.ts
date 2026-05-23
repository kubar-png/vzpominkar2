"use server";

import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSenior } from "@/lib/auth/permissions";
import { sendEmail } from "@/lib/email/send";
import { newMemoryNotificationEmail } from "@/lib/email/templates";
import { transcribeAudio } from "@/lib/memories/transcribe";

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
        .select("display_name")
        .eq("id", opts.seniorId)
        .maybeSingle<{ display_name: string | null }>(),
    ]);
    if (!owner?.email) return;
    const tpl = newMemoryNotificationEmail({
      ownerDisplayName: owner.display_name ?? "",
      seniorDisplayName: senior?.display_name ?? "Váš blízký",
      count: 1,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://vzpominkar.cz",
    });
    await sendEmail({
      to: owner.email,
      subject: tpl.subject,
      html: tpl.html,
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
    }

    if (finalize) {
      await notifyOwnerOfNewMemory({ familyId, seniorId: userId });
      revalidatePath("/my-memories");
      redirect("/my-memories?saved=1");
    }
    return { ok: true, memoryId: realId };
  } catch (e) {
    if (isNextRedirect(e)) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "Něco se pokazilo." };
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

    // Best-effort transcription - null means "skipped or failed"; the column
    // stays NULL so a future cron retry can fill it in.
    const transcript = await transcribeAudio(file);
    if (transcript) {
      await admin.from("memories").update({ audio_transcript: transcript }).eq("id", memoryId);
    }

    if (assignmentId) {
      const admin = createAdminClient();
      await admin
        .from("prompt_assignments")
        .update({ answered_memory_id: memoryId })
        .eq("id", assignmentId)
        .eq("senior_id", userId);
    }

    await notifyOwnerOfNewMemory({ familyId, seniorId: userId });
    revalidatePath("/my-memories");
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
    }

    await notifyOwnerOfNewMemory({ familyId, seniorId: userId });
    revalidatePath("/my-memories");
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

/**
 * Inspect the first 12-16 bytes of an image and return the detected MIME, or
 * null if it doesn't match a format we accept. Magic numbers per
 * https://en.wikipedia.org/wiki/List_of_file_signatures.
 */
function sniffImageMime(head: Uint8Array): string | null {
  if (head.length < 4) return null;
  // JPEG: FF D8 FF
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF: "GIF8"
  if (
    head[0] === 0x47 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x38
  ) {
    return "image/gif";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return "image/webp";
  }
  // HEIC / HEIF: "....ftyp<brand>" at offset 4
  if (
    head.length >= 12 &&
    head[4] === 0x66 &&
    head[5] === 0x74 &&
    head[6] === 0x79 &&
    head[7] === 0x70
  ) {
    const brand = String.fromCharCode(head[8]!, head[9]!, head[10]!, head[11]!);
    if (
      brand === "heic" ||
      brand === "heix" ||
      brand === "mif1" ||
      brand === "msf1" ||
      brand === "hevc" ||
      brand === "hevx"
    ) {
      return "image/heic";
    }
  }
  return null;
}

function mimeToExt(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    default:
      return null;
  }
}

import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transcribeAudio } from "@/lib/memories/transcribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Constant-time equality so a brute-force can't extract the secret byte-by-byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Bounded per run so a long Whisper queue can't blow the function budget —
// it just drains a chunk each pass.
const BATCH = 20;

/**
 * Retry transcription for published audio memories whose transcript is still
 * NULL (the post-response `after()` transcription in saveAudioMemory failed,
 * timed out, or was skipped). Downloads the stored audio and re-runs Whisper.
 * Idempotent: a filled transcript no longer matches the query.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected || !safeEqual(auth, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: pending, error } = await admin
    .from("memories")
    .select("id, audio_path")
    .eq("status", "published")
    .not("audio_path", "is", null)
    .is("audio_transcript", null)
    .order("created_at", { ascending: true })
    .limit(BATCH)
    .returns<{ id: string; audio_path: string | null }[]>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let filled = 0;
  let failed = 0;
  for (const m of pending ?? []) {
    if (!m.audio_path) continue;
    try {
      const { data: blob, error: dlErr } = await admin.storage
        .from("memory-audio")
        .download(m.audio_path);
      if (dlErr || !blob) {
        failed++;
        continue;
      }
      const name = m.audio_path.split("/").pop() || "audio.webm";
      const file = new File([blob], name, { type: blob.type || "audio/webm" });
      const transcript = await transcribeAudio(file);
      if (transcript) {
        await admin.from("memories").update({ audio_transcript: transcript }).eq("id", m.id);
        filled++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error("[transcribe-backfill] failed", { id: m.id, err });
      failed++;
    }
  }

  return NextResponse.json({ ok: true, filled, failed, scanned: pending?.length ?? 0 });
}

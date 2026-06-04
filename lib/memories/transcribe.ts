import "server-only";

const TRANSCRIBE_TIMEOUT_MS = 25_000; // give up before Vercel's 30s function ceiling

const PLACEHOLDER_TRANSCRIPT =
  "testovací nahrávku zapsána, zde bude text, který blízký namluví.";

/**
 * Transcribe an audio Blob via OpenAI Whisper. Returns null when the call
 * fails - callers should treat null as "skipped" and persist no transcript.
 *
 * When no OPENAI_API_KEY is configured we return null in PRODUCTION — the
 * transcript stays NULL so the backfill cron retries once a real key is wired
 * up, and we never persist a placeholder into a real recording, the book, or the
 * public QR page. In development we return a placeholder so the UI can be
 * exercised end-to-end before the real key exists.
 *
 * Czech is hinted via `language=cs` so Whisper picks the right tokenizer.
 */
export async function transcribeAudio(file: File): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return process.env.NODE_ENV === "production" ? null : PLACEHOLDER_TRANSCRIPT;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("model", "whisper-1");
  fd.append("language", "cs");
  fd.append("response_format", "text");

  const ctl = new AbortController();
  const timeout = setTimeout(() => ctl.abort(), TRANSCRIBE_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
      signal: ctl.signal,
    });
    if (!res.ok) {
      console.error("[transcribe] non-200", res.status, await res.text().catch(() => ""));
      return null;
    }
    const text = (await res.text()).trim();
    return text || null;
  } catch (err) {
    console.error("[transcribe] failed", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

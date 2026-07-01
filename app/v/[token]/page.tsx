import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchSignUrls } from "@/lib/family/server";
import { resolveGender, type Gender } from "@/lib/gender";
import { Logo } from "@/components/brand/Logo";

/**
 * Public memory playback — the page a printed QR code points to (/v/{token}).
 *
 * No login: the unguessable `public_token` IS the access capability (anyone who
 * holds the book can play the recording). Audio lives in the PRIVATE
 * `memory-audio` bucket; we mint a short-lived signed URL server-side, so the
 * recording is reachable only through this token page, not world-readable.
 *
 * Sharing is permanent by design — the token is printed and must keep working
 * for years. The QR encodes `${SITE_URL}/v/{token}`, so switching to the real
 * domain just changes the URL prefix (see PRE-LAUNCH #15).
 */

// Private memories must never be indexed by search engines.
export const metadata: Metadata = {
  title: "Vzpomínka — Vzpomínkář",
  robots: { index: false, follow: false },
};

const NAVY = "#1B2E4D";
const CREAM = "#FEF7D7";
const OXBLOOD = "#CF364C";
const INK_SOFT = "rgba(27,46,77,0.72)";
const BODY_FONT = "var(--font-sans-loaded), 'Host Grotesk', system-ui, -apple-system, sans-serif";
const DISPLAY_FONT = "var(--font-display-loaded), 'Bree Serif', Georgia, serif";

type PublicMemory = {
  id: string;
  title: string | null;
  text_content: string | null;
  audio_path: string | null;
  audio_transcript_polished: string | null;
  audio_transcript: string | null;
  audio_duration_seconds: number | null;
  memory_date: string | null;
  created_at: string;
  status: string;
  prompts: { question: string } | null;
  profiles: { display_name: string | null; gender: string | null } | null;
};

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

export default async function PublicMemoryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: memory } = await admin
    .from("memories")
    .select(
      `id, title, text_content, audio_path, audio_transcript_polished, audio_transcript,
       audio_duration_seconds, memory_date, created_at, status,
       prompts(question),
       profiles!memories_author_id_fkey(display_name, gender)`,
    )
    .eq("public_token", token)
    .maybeSingle<PublicMemory>();

  if (!memory || memory.status !== "published") {
    return <NotAvailable />;
  }

  const gender = (memory.profiles?.gender as Gender | null) ?? null;
  const question = memory.prompts?.question ? resolveGender(memory.prompts.question, gender) : null;
  const author = memory.profiles?.display_name ?? null;
  const date = formatDate(memory.memory_date ?? memory.created_at);
  const transcript = memory.audio_transcript_polished ?? memory.audio_transcript ?? memory.text_content ?? null;

  // Sign the private audio for ~6h (long enough that a left-open page keeps working).
  let audioUrl: string | null = null;
  if (memory.audio_path) {
    const signed = await batchSignUrls("memory-audio", [memory.audio_path], 60 * 60 * 6);
    audioUrl = signed.get(memory.audio_path) ?? null;
  }

  const { data: atts } = await admin
    .from("memory_attachments")
    .select("storage_path, mime_type, caption")
    .eq("memory_id", memory.id)
    .returns<{ storage_path: string; mime_type: string; caption: string | null }[]>();
  const imgPaths = (atts ?? []).filter((a) => a.mime_type.startsWith("image/")).map((a) => a.storage_path);
  const signedImgs = await batchSignUrls("memory-attachments", imgPaths, 60 * 60 * 6);
  const images = imgPaths.map((p) => signedImgs.get(p)).filter((u): u is string => Boolean(u));

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: CREAM,
        color: NAVY,
        fontFamily: BODY_FONT,
        display: "flex",
        justifyContent: "center",
        padding: "32px 20px 56px",
      }}
    >
      <article style={{ width: "100%", maxWidth: 560 }}>
        {question ? (
          <h1 style={{ fontFamily: DISPLAY_FONT, fontSize: 25, lineHeight: 1.25, fontWeight: 500, margin: "0 0 8px" }}>{question}</h1>
        ) : memory.title ? (
          <h1 style={{ fontFamily: DISPLAY_FONT, fontSize: 25, lineHeight: 1.25, fontWeight: 500, margin: "0 0 8px" }}>{memory.title}</h1>
        ) : null}

        <p style={{ fontSize: 14, color: INK_SOFT, margin: "0 0 24px" }}>
          {author ? <>Vypráví {author} · </> : null}
          {date}
        </p>

        {audioUrl ? (
          <audio controls preload="metadata" src={audioUrl} style={{ width: "100%", marginBottom: 24 }} />
        ) : (
          <p style={{ fontSize: 15, color: INK_SOFT, marginBottom: 24 }}>
            U této vzpomínky není nahrávka — přečtěte si ji níže.
          </p>
        )}

        {images.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: images.length === 1 ? "1fr" : "1fr 1fr",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                style={{ width: "100%", borderRadius: 8, border: "1px solid rgba(207,54,76,0.25)" }}
              />
            ))}
          </div>
        ) : null}

        {transcript ? (
          <p style={{ fontSize: 17, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: "0 0 32px" }}>{transcript}</p>
        ) : null}

        <footer style={{ borderTop: "1px solid rgba(27,46,77,0.15)", paddingTop: 16, textAlign: "center" }}>
          <Logo variant="full" tone="raspberry" height={26} style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13, color: INK_SOFT, margin: 0 }}>
            Uchováno v knize vzpomínek vašich blízkých.
          </p>
          <p style={{ fontSize: 13, color: INK_SOFT, margin: "10px 0 0" }}>
            <Link
              href="/darek"
              style={{ color: OXBLOOD, textDecoration: "underline", textUnderlineOffset: 4 }}
            >
              Vytvořte podobnou knihu pro svého blízkého
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}

function NotAvailable() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: CREAM,
        color: NAVY,
        fontFamily: BODY_FONT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px 24px",
      }}
    >
      <h1 style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 500, margin: "0 0 10px" }}>Vzpomínka není dostupná</h1>
      <p style={{ fontSize: 15, color: INK_SOFT, maxWidth: 420, margin: 0 }}>
        Tuto vzpomínku se nepodařilo najít. Možná byla odstraněna, nebo odkaz není úplný.
      </p>
    </main>
  );
}

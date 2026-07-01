import { InlineAudioPlayer } from "@/components/audio/InlineAudioPlayer";
import { TranscriptEditor } from "@/components/memories/TranscriptEditor";

interface Memory {
  id: string;
  title: string | null;
  text: string | null;
  createdAt: string;
  question: string | null;
  audioUrl: string | null;
  audioTranscript: string | null;
  audioTranscriptPolished: string | null;
  attachments: { storage_path: string; mime_type: string; caption: string | null; signedUrl: string | null }[];
}

/**
 * Single memory card — editorial direction.
 *
 * Date as plain metadata → display-serif question quote → optional title →
 * audio player / text body / photo grid. The card uses the paper surface
 * like the marketing site's testimonial cards.
 */
export function MemoryItem({ memory, isSenior }: { memory: Memory; isSenior: boolean }) {
  const date = new Date(memory.createdAt).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const photoAttachments = memory.attachments.filter(
    (a) => a.signedUrl && a.mime_type.startsWith("image/"),
  );

  return (
    <article className="es-memory">
      <div
        style={{
          fontFamily: "var(--font-body-editorial)",
          fontSize: 15,
          color: "var(--ink-mute)",
          marginBottom: 10,
        }}
      >
        {date}
      </div>

      {memory.question ? (
        <p className="es-memory-q">&bdquo;{memory.question}&ldquo;</p>
      ) : null}

      {memory.title ? (
        <h3 className="es-memory-title">{memory.title}</h3>
      ) : null}

      {memory.audioUrl ? (
        <div className="mb-4">
          <InlineAudioPlayer src={memory.audioUrl} tone="senior" />
        </div>
      ) : null}

      {/* Klasik mode: editable transcript with AI cleanup. Senior mode: nothing
       * — the audio + question is enough, no clutter. */}
      {!isSenior && memory.audioTranscript ? (
        <div className="mb-4">
          <TranscriptEditor
            memoryId={memory.id}
            rawTranscript={memory.audioTranscript}
            polishedTranscript={memory.audioTranscriptPolished}
          />
        </div>
      ) : null}

      {memory.text ? <p className="es-memory-text">{memory.text}</p> : null}

      {photoAttachments.length > 0 && (
        <div
          className={
            photoAttachments.length === 1
              ? "mt-4"
              : "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
          }
        >
          {photoAttachments.map((a) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.storage_path}
              src={a.signedUrl ?? ""}
              alt={a.caption ?? "Fotka ke vzpomínce"}
              loading="lazy"
              decoding="async"
              className="es-memory-photo"
              style={
                photoAttachments.length === 1
                  ? { maxHeight: "28rem", objectFit: "contain" }
                  : { aspectRatio: "1 / 1", objectFit: "cover" }
              }
            />
          ))}
        </div>
      )}
    </article>
  );
}

import { SeniorCard } from "@/components/senior/SeniorCard";
import { InlineAudioPlayer } from "@/components/audio/InlineAudioPlayer";

interface Memory {
  id: string;
  title: string | null;
  text: string | null;
  createdAt: string;
  question: string | null;
  audioUrl: string | null;
  attachments: { storage_path: string; mime_type: string; caption: string | null; signedUrl: string | null }[];
}

export function MemoryItem({ memory }: { memory: Memory }) {
  const date = new Date(memory.createdAt).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <SeniorCard className="space-y-4">
      <p className="text-[var(--text-senior-sm)] uppercase tracking-wider text-[var(--color-text-subtle)]">
        {date}
      </p>
      {memory.question ? (
        <p className="text-[var(--text-senior)] text-[var(--color-text-muted)]">
          „{memory.question}“
        </p>
      ) : null}

      {memory.title ? (
        <h3 className="font-[family-name:var(--font-display)] text-[var(--text-senior-h3)] text-[var(--color-navy-900)]">
          {memory.title}
        </h3>
      ) : null}

      {memory.audioUrl ? (
        <InlineAudioPlayer src={memory.audioUrl} tone="senior" />
      ) : null}

      {memory.text ? (
        <p className="whitespace-pre-line text-[var(--text-senior)] leading-relaxed">{memory.text}</p>
      ) : null}

      {memory.attachments
        .filter((a) => a.signedUrl && a.mime_type.startsWith("image/"))
        .map((a) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={a.storage_path}
            src={a.signedUrl ?? ""}
            alt={a.caption ?? "Fotka ke vzpomínce"}
            className="max-h-[28rem] w-full rounded-[var(--radius-lg)] object-contain"
          />
        ))}
    </SeniorCard>
  );
}

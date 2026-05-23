"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { InlineAudioPlayer } from "@/components/audio/InlineAudioPlayer";
import { toggleMemoryFavorite } from "@/lib/memories/owner-actions";
import type { MemoryItem } from "./page";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MemoryCard({ memory: m, familyId }: { memory: MemoryItem; familyId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [favorite, setFavorite] = useState(m.is_favorite);
  const [, startTransition] = useTransition();

  const date = formatDate(m.memory_date ?? m.created_at);
  const images = m.attachments.filter((a) => a.mime_type.startsWith("image/"));
  const visibleImages = images.slice(0, 3);
  const extraImages = images.length - 3;

  const textLong = (m.text_content?.length ?? 0) > 300;

  function onToggleFavorite() {
    const next = !favorite;
    setFavorite(next); // optimistic
    startTransition(async () => {
      const result = await toggleMemoryFavorite(familyId, m.id, next);
      if (result.ok === false) setFavorite(!next); // revert
    });
  }

  return (
    <Card className="transition-shadow duration-200 hover:shadow-[0_8px_24px_-16px_rgba(8,35,61,0.10)]">
      <CardContent className="space-y-4 p-5 md:p-6">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-[var(--color-navy-900)]">
              {date}
              {m.authorName ? (
                <span className="font-normal text-[var(--color-text-muted)]"> · {m.authorName}</span>
              ) : null}
              {m.audio_duration_seconds ? (
                <span className="font-normal text-[var(--color-text-subtle)]"> · {formatDuration(m.audio_duration_seconds)}</span>
              ) : null}
            </p>
            {m.question ? (
              <p className="text-sm text-[var(--color-text-muted)]">&#8222;{m.question}&#8220;</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-label={favorite ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
              aria-pressed={favorite}
              className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-paper-200)]"
            >
              <Heart
                size={18}
                className={favorite ? "text-[var(--color-red-600)]" : "text-[var(--color-text-subtle)]"}
                fill={favorite ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>

        {/* Title — card-title spec from DESIGN.md (Inter 17/600, not display) */}
        {m.title ? (
          <h3 className="text-[17px] font-semibold tracking-tight text-[var(--color-navy-900)]">
            {m.title}
          </h3>
        ) : null}

        {/* Audio player */}
        {m.audioUrl ? (
          <InlineAudioPlayer
            src={m.audioUrl}
            duration={m.audio_duration_seconds}
            tone="owner"
          />
        ) : null}

        {/* Text content */}
        {m.text_content ? (
          <div>
            <p
              className={[
                "whitespace-pre-line leading-relaxed text-[var(--color-text)]",
                !expanded && textLong ? "line-clamp-4" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {m.text_content}
            </p>
            {textLong ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 text-sm text-[var(--color-navy-700)] underline-offset-2 hover:underline"
              >
                {expanded ? "Méně" : "Číst vše"}
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Link to full detail */}
        <Link
          href={`/family/${familyId}/memories/${m.id}`}
          className="block text-sm text-[var(--color-text-muted)] underline-offset-2 hover:text-[var(--color-navy-700)] hover:underline"
        >
          Celá vzpomínka
        </Link>

        {/* Photo grid */}
        {visibleImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {visibleImages.map((img, i) => (
              <div key={img.storage_path} className="relative overflow-hidden rounded-[var(--radius-md)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.signedUrl}
                  alt={img.caption ?? `Fotka ${i + 1}`}
                  className="aspect-square w-full object-cover"
                />
                {i === 2 && extraImages > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-navy-900)]/60">
                    <span className="text-sm font-medium text-white">+{extraImages}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

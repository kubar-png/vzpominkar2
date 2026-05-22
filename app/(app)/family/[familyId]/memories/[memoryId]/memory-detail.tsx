"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Download, Heart, Pencil, Check, X } from "lucide-react";
import { SENIOR_ROLE_OPTIONS } from "@/lib/validations/auth";
import { toggleMemoryFavorite, updateMemoryText } from "@/lib/memories/owner-actions";
import { TranscriptEditor } from "@/components/memories/TranscriptEditor";
import type { MemoryDetailData } from "./page";

// ── helpers ──────────────────────────────────────────────────────────────────

function roleLabel(role: string | null) {
  if (!role) return null;
  return SENIOR_ROLE_OPTIONS.find((r) => r.value === role)?.label ?? null;
}

function formatDate(dateStr: string, style: "long" | "short" = "long") {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: style === "long" ? "long" : "numeric",
    year: "numeric",
  });
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Seeded waveform - FNV-1a hash → deterministic bar heights
function seedRng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h >>> 16;
    h = Math.imul(h, 0x45d9f3b);
    h ^= h >>> 16;
    return ((h >>> 0) / 4294967296);
  };
}

function generateWaveform(id: string, count = 90): number[] {
  const rand = seedRng(id);
  return Array.from({ length: count }, (_, i) => {
    const envelope = Math.sin(i * 0.14) * 0.28 + Math.sin(i * 0.055) * 0.22 + 0.48;
    const noise = (rand() - 0.5) * 0.38;
    return Math.max(0.06, Math.min(0.97, envelope + noise));
  });
}

// ── Waveform Player ───────────────────────────────────────────────────────────

function WaveformPlayer({
  src,
  duration: initialDuration,
  memoryId,
  downloadName,
}: {
  src: string;
  duration: number | null;
  memoryId: string;
  downloadName: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration ?? 0);
  const bars = generateWaveform(memoryId);
  const count = bars.length;

  const tick = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!audioRef.current.paused) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function handleEnded() {
    setPlaying(false);
    setCurrentTime(0);
  }

  function seek(idx: number) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const t = (idx / count) * duration;
    audio.currentTime = t;
    setCurrentTime(t);
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-navy-950)]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => {
          // WebM from MediaRecorder reports duration as Infinity; fall back
          // to the DB-stored seconds (initialDuration) when that happens.
          const d = audioRef.current?.duration;
          setDuration(
            typeof d === "number" && Number.isFinite(d) && d > 0
              ? d
              : initialDuration ?? 0
          );
        }}
        onDurationChange={() => {
          const d = audioRef.current?.duration;
          if (typeof d === "number" && Number.isFinite(d) && d > 0) {
            setDuration(d);
          }
        }}
        onEnded={handleEnded}
      />

      {/* Header strip */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--color-navy-600)]">
          Hlasová nahrávka
        </p>
        <p className="font-mono text-xs tabular-nums text-[var(--color-navy-500)]">
          {formatTime(currentTime)}{" "}
          <span className="text-[var(--color-navy-700)]">/</span>{" "}
          {formatTime(duration)}
        </p>
      </div>

      {/* Waveform — neutral bars in back, gold bars clipped to progress in front */}
      <div
        className="relative mx-6"
        style={{ height: 72 }}
        role="slider"
        aria-label="Průběh nahrávky"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Neutral layer */}
        <div className="flex h-full cursor-pointer items-end gap-[2px]">
          {bars.map((h, i) => (
            <div
              key={i}
              onClick={() => seek(i)}
              className="flex-1 rounded-full"
              style={{
                height: `${Math.round(h * 100)}%`,
                minWidth: 2,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>
        {/* Played overlay — clipped from the right edge to current progress.
         * Updates every animation frame via tick(), so it slides smoothly
         * with playback instead of jumping bar-by-bar. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-end gap-[2px]"
          style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
        >
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: `${Math.round(h * 100)}%`,
                minWidth: 2,
                backgroundColor: "var(--color-gold-400)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pozastavit" : "Přehrát"}
          className="group flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-navy-700)] text-[var(--color-paper-400)] transition-colors hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-400)]"
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="translate-x-px" />}
        </button>

        <a
          href={src}
          download={downloadName}
          className="text-xs text-[var(--color-navy-600)] underline-offset-2 transition-colors hover:text-[var(--color-navy-400)] hover:underline"
        >
          <Download size={12} className="mr-1 inline-block align-middle" />
          Uložit nahrávku
        </a>
      </div>
    </div>
  );
}

// ── Photo / Video Gallery ─────────────────────────────────────────────────────

function MediaGallery({
  attachments,
}: {
  attachments: MemoryDetailData["attachments"];
}) {
  const images = attachments.filter((a) => a.mime_type.startsWith("image/"));
  const videos = attachments.filter((a) => a.mime_type.startsWith("video/"));

  if (images.length === 0 && videos.length === 0) return <PhotoPlaceholder />;

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div
          className={[
            "grid gap-3",
            images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3",
          ].join(" ")}
        >
          {images.map((img, i) => (
            <a key={img.storage_path} href={img.signedUrl} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.signedUrl}
                alt={img.caption ?? `Fotografie ${i + 1}`}
                className="w-full rounded-[var(--radius-lg)] object-cover"
                style={{ aspectRatio: images.length === 1 ? "4/3" : "1/1" }}
              />
              {img.caption && (
                <p className="mt-1.5 text-center text-xs italic text-[var(--color-text-subtle)]">
                  {img.caption}
                </p>
              )}
            </a>
          ))}
        </div>
      )}

      {videos.map((v) => (
        <video
          key={v.storage_path}
          src={v.signedUrl}
          controls
          className="w-full rounded-[var(--radius-lg)]"
        />
      ))}
    </div>
  );
}

// ── SVG Photo Placeholder ─────────────────────────────────────────────────────

function PhotoPlaceholder() {
  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-paper-100)]" style={{ aspectRatio: "4/3" }}>
      {/* Corner ornaments */}
      {[
        "top-3 left-3",
        "top-3 right-3 rotate-90",
        "bottom-3 right-3 rotate-180",
        "bottom-3 left-3 -rotate-90",
      ].map((cls, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 18 18" className={`absolute ${cls} opacity-30`} fill="none">
          <path d="M1 17V1h16" stroke="var(--color-gold-400)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ))}

      {/* Center ornament */}
      <div className="flex flex-col items-center gap-3 text-center">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-20">
          <polygon points="24,2 46,24 24,46 2,24" stroke="var(--color-gold-500)" strokeWidth="1.5" fill="none" />
          <polygon points="24,10 38,24 24,38 10,24" stroke="var(--color-gold-500)" strokeWidth="1" fill="none" />
          <circle cx="24" cy="24" r="3" fill="var(--color-gold-500)" />
        </svg>
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--color-gold-500)] opacity-50">
          Fotografie
        </p>
      </div>
    </div>
  );
}

// ── Gold decorative divider ───────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[var(--color-border)]" />
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <polygon points="5,0.5 9.5,5 5,9.5 0.5,5" stroke="var(--color-gold-400)" strokeWidth="1" />
      </svg>
      <span className="h-px flex-1 bg-[var(--color-border)]" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MemoryDetail({ memory: m }: { memory: MemoryDetailData }) {
  const [expanded, setExpanded] = useState(false);
  // Audio-only memories: the transcript IS the body text - surface it open.
  const audioOnly = !!m.audioUrl && !m.text_content && !!m.audio_transcript;
  const [transcriptOpen, setTranscriptOpen] = useState(audioOnly);
  const [favorite, setFavorite] = useState(m.is_favorite);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(m.text_content ?? "");
  const [text, setText] = useState(m.text_content);
  const [editError, setEditError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const textLong = (text?.length ?? 0) > 400;
  const label = roleLabel(m.authorRole);
  const memoryDate = m.memory_date ? formatDate(m.memory_date) : null;
  const recordedDate = formatDate(m.created_at, "short");

  function onToggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleMemoryFavorite(m.familyId, m.id, next);
      if (result.ok === false) setFavorite(!next);
    });
  }

  function onSaveEdit() {
    setEditError(null);
    startTransition(async () => {
      const result = await updateMemoryText(m.familyId, m.id, draftText);
      if (result.ok) {
        setText(draftText.trim() || null);
        setEditing(false);
      } else {
        setEditError(result.error);
      }
    });
  }

  return (
    <article className="mx-auto max-w-[720px] space-y-0">

      {/* Back navigation */}
      <div className="pb-8">
        <Link
          href={`/family/${m.familyId}/memories`}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-text-muted)]"
        >
          <ArrowLeft size={12} />
          Zpět na vzpomínky
        </Link>
      </div>

      {/* Chapter header */}
      <header className="space-y-5 pb-8">
        {/* Label row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-[var(--color-gold-500)]">
            <svg width="6" height="6" viewBox="0 0 8 8" className="mr-2 inline-block" fill="none">
              <polygon points="4,0.5 7.5,4 4,7.5 0.5,4" stroke="var(--color-gold-400)" strokeWidth="1" />
            </svg>
            Vzpomínka
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-label={favorite ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
              aria-pressed={favorite}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-paper-200)]"
            >
              <Heart
                size={18}
                className={favorite ? "text-[var(--color-red-600)]" : "text-[var(--color-text-subtle)]"}
                fill={favorite ? "currentColor" : "none"}
              />
            </button>
            <span className={[
              "rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              m.status === "published"
                ? "bg-[var(--color-navy-100)] text-[var(--color-navy-700)]"
                : "bg-[var(--color-paper-300)] text-[var(--color-text-muted)]",
            ].join(" ")}>
              {m.status === "published" ? "Hotovo" : "Koncept"}
            </span>
          </div>
        </div>

        {/* Title */}
        {m.title ? (
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.08] tracking-[-0.02em] text-[var(--color-navy-900)] md:text-5xl">
            {m.title}
          </h1>
        ) : (
          <h1 className="font-[family-name:var(--font-display)] text-2xl italic text-[var(--color-text-muted)]">
            {m.question ? `„${m.question}"` : "Bez názvu"}
          </h1>
        )}

        <GoldDivider />

        {/* Metadata */}
        <div className="grid grid-cols-[1fr_auto] items-end gap-y-1 text-sm">
          <div className="space-y-0.5">
            {m.authorName && (
              <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-navy-900)]">
                {m.authorName}
                {label && (
                  <span className="ml-2 text-xs font-normal uppercase tracking-widest text-[var(--color-gold-500)]">
                    {label}
                  </span>
                )}
              </p>
            )}
            {memoryDate && (
              <p className="text-xs text-[var(--color-text-muted)]">
                Vzpomíná na: <span className="text-[var(--color-text)]">{memoryDate}</span>
              </p>
            )}
            <p className="text-xs text-[var(--color-text-subtle)]">
              Nahráno: {recordedDate}
            </p>
          </div>

          {/* Decorative ornament */}
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-15" aria-hidden>
            <polygon points="24,1 47,24 24,47 1,24" stroke="var(--color-gold-500)" strokeWidth="1.2" fill="none" />
            <polygon points="24,9 39,24 24,39 9,24" stroke="var(--color-gold-500)" strokeWidth="0.8" fill="none" />
            <circle cx="24" cy="24" r="2.5" fill="var(--color-gold-400)" />
          </svg>
        </div>
      </header>

      {/* Question - if any */}
      {m.question && m.title && (
        <div className="pb-8">
          <blockquote className="border-l-2 border-[var(--color-gold-300)] pl-5">
            <p className="font-[family-name:var(--font-display)] text-lg italic leading-relaxed text-[var(--color-text-muted)]">
              &#8222;{m.question}&#8220;
            </p>
          </blockquote>
        </div>
      )}

      {/* Audio player */}
      {m.audioUrl && (
        <div className="pb-8 space-y-3">
          <WaveformPlayer
            src={m.audioUrl}
            duration={m.audio_duration_seconds}
            memoryId={m.id}
            downloadName={`vzpominka-${m.id.slice(0, 8)}.m4a`}
          />
          {m.audio_transcript ? (
            <TranscriptEditor
              memoryId={m.id}
              rawTranscript={m.audio_transcript}
              polishedTranscript={m.audio_transcript_polished}
            />
          ) : null}
        </div>
      )}

      {/* Text content (editable) */}
      <div className="pb-8">
        {editing ? (
          <div className="space-y-4">
            <textarea
              autoFocus
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="te-textarea"
              style={{ minHeight: 240 }}
              placeholder="Napište text vzpomínky…"
            />
            {editError ? (
              <p className="te-error">{editError}</p>
            ) : null}
            <div className="te-actions justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraftText(text ?? "");
                  setEditError(null);
                }}
                className="te-btn te-btn-outline"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                className="te-btn te-btn-gold"
              >
                Uložit úpravy <span className="te-btn-circle" aria-hidden>↗</span>
              </button>
            </div>
          </div>
        ) : text ? (
          <>
            <div className="group relative">
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setDraftText(text);
                }}
                aria-label="Upravit text"
                className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-text-subtle)] opacity-0 transition-opacity hover:bg-[var(--color-paper-200)] hover:text-[var(--color-navy-700)] focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Pencil size={12} aria-hidden />
              </button>
              <div
                className={[
                  "leading-[1.85] text-[var(--color-text)]",
                  !expanded && textLong ? "line-clamp-[8]" : "",
                ].filter(Boolean).join(" ")}
                style={{ fontSize: "1.0625rem", whiteSpace: "pre-line" }}
              >
                <span
                  className="float-left mr-2 font-[family-name:var(--font-display)] leading-none text-[var(--color-navy-900)]"
                  style={{ fontSize: "4.25rem", lineHeight: 0.82, paddingTop: "0.12em" }}
                  aria-hidden
                >
                  {text[0]}
                </span>
                {text.slice(1)}
              </div>
            </div>
            {textLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 text-sm text-[var(--color-navy-700)] underline-offset-2 hover:underline"
              >
                {expanded ? "Méně" : "Číst celý text"}
              </button>
            )}
          </>
        ) : (
          /* No text yet - offer to add one (e.g. for audio-only memories) */
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setDraftText("");
            }}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-4 py-3 text-sm text-[var(--color-text-muted)] hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-700)]"
          >
            <Pencil size={14} aria-hidden />
            Přidat text k vzpomínce
          </button>
        )}
      </div>

      {/* Media */}
      <div className="pb-8">
        <MediaGallery attachments={m.attachments} />
      </div>

      {/* Bottom ornament */}
      <footer className="pb-4 pt-2">
        <GoldDivider />
        <div className="mt-6 flex justify-center">
          <svg width="80" height="20" viewBox="0 0 80 20" fill="none" className="opacity-20" aria-hidden>
            <path d="M1 10 H30 M50 10 H79" stroke="var(--color-gold-500)" strokeWidth="0.8" />
            <polygon points="40,2 48,10 40,18 32,10" stroke="var(--color-gold-500)" strokeWidth="0.8" fill="none" />
          </svg>
        </div>
      </footer>
    </article>
  );
}

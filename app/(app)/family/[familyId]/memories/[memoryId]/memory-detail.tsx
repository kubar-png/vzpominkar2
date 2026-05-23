"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Download, Heart, Pencil, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { SENIOR_ROLE_OPTIONS } from "@/lib/validations/auth";
import { toggleMemoryFavorite, updateMemoryText } from "@/lib/memories/owner-actions";
import { TranscriptEditor } from "@/components/memories/TranscriptEditor";
import type { MemoryDetailData } from "./page";

// ── helpers ──────────────────────────────────────────────────────────────────

function roleLabel(role: string | null) {
  if (!role) return null;
  return SENIOR_ROLE_OPTIONS.find((r) => r.value === role)?.label ?? null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
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
//
// Warm-brown surface (a deliberate contrast moment — per DESIGN.md the
// audio waveform is one of the spots where the editorial system allows a
// dark feature surface). Plays back as the workhorse for senior voice
// recordings, so the controls stay big and the gold "played" overlay reads
// as state, not as decoration.

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
    <div className="overflow-hidden rounded-[var(--radius-xl)] bg-[#1c1814]">
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
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-paper-400)]">
          Nahrávka
        </p>
        <p className="font-mono text-xs tabular-nums text-[var(--color-paper-300)]">
          {formatTime(currentTime)}
          <span className="text-[var(--color-paper-500)]"> / </span>
          {formatTime(duration)}
        </p>
      </div>

      {/* Waveform — neutral bars in back, gold bars clipped to progress in front */}
      <div
        className="relative mx-5"
        style={{ height: 64 }}
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
                backgroundColor: "rgba(255,255,255,0.10)",
              }}
            />
          ))}
        </div>
        {/* Played overlay — clipped from the right edge to current progress. */}
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
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pozastavit" : "Přehrát"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] text-[var(--color-paper-200)] transition-colors hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1814]"
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="translate-x-px" />}
        </button>

        <a
          href={src}
          download={downloadName}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-paper-300)] underline-offset-2 transition-colors hover:text-[var(--color-paper-100)] hover:underline"
        >
          <Download size={12} aria-hidden />
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

  if (images.length === 0 && videos.length === 0) return null;

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
                <p className="mt-1.5 text-center text-xs text-[var(--color-text-subtle)]">
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

// ── Main Component ────────────────────────────────────────────────────────────
//
// Reading layout per DESIGN.md: narrow 720px column centered on the cream
// page, single Pangaia H1, meta row above title, single action row inline
// (favorite + share + edit + kebab). No corner ornaments, no dropcaps, no
// decorative gold dividers — those belong on the marketing surface and on
// the print preview page.

export function MemoryDetail({ memory: m }: { memory: MemoryDetailData }) {
  const [expanded, setExpanded] = useState(false);
  // Audio-only memories: the transcript IS the body text - surface it open.
  const audioOnly = !!m.audioUrl && !m.text_content && !!m.audio_transcript;
  // Acknowledge `audioOnly` for future expansion; it's currently used as a
  // signal inside <TranscriptEditor>, surfaced via its own `open` state.
  void audioOnly;
  const [favorite, setFavorite] = useState(m.is_favorite);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(m.text_content ?? "");
  const [text, setText] = useState(m.text_content);
  const [editError, setEditError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const textLong = (text?.length ?? 0) > 600;
  const label = roleLabel(m.authorRole);
  const memoryDate = m.memory_date ? formatDate(m.memory_date) : null;
  const recordedDate = formatDate(m.created_at);

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
        toast.success("Vzpomínka uložena");
      } else {
        setEditError(result.error);
      }
    });
  }

  const titleText =
    m.title ??
    (memoryDate ? `Vzpomínka z ${memoryDate}` : "Vzpomínka");

  return (
    <article className="mx-auto max-w-[720px]">
      {/* Breadcrumb */}
      <div className="pb-6">
        <Link
          href={`/family/${m.familyId}/memories`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-navy-700)]"
        >
          <ArrowLeft size={14} aria-hidden />
          Vzpomínky
        </Link>
      </div>

      {/* Action row — single horizontal strip above the title */}
      <div className="flex items-center justify-end gap-1 pb-4">
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={favorite ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
          aria-pressed={favorite}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-paper-100)] hover:text-[var(--color-navy-900)]"
        >
          <Heart
            size={15}
            className={favorite ? "text-[var(--color-red-600)]" : ""}
            fill={favorite ? "currentColor" : "none"}
            aria-hidden
          />
          <span className="hidden sm:inline">{favorite ? "Oblíbené" : "Přidat oblíbenou"}</span>
        </button>
        {!editing && text ? (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setDraftText(text);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-paper-100)] hover:text-[var(--color-navy-900)]"
          >
            <Pencil size={14} aria-hidden />
            <span className="hidden sm:inline">Upravit text</span>
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Další akce"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-paper-100)] hover:text-[var(--color-navy-900)]"
        >
          <MoreHorizontal size={16} aria-hidden />
        </button>
      </div>

      {/* Meta row */}
      <p className="text-[13px] tabular-nums text-[var(--color-text-muted)]">
        {recordedDate}
        {m.authorName ? (
          <>
            {" · "}
            <span className="text-[var(--color-text)]">{m.authorName}</span>
            {label ? (
              <span className="text-[var(--color-text-subtle)]">, {label}</span>
            ) : null}
          </>
        ) : null}
      </p>

      {/* Title — Pangaia 32-38px per DESIGN.md page-title */}
      <h1
        className={[
          "mt-3 font-[family-name:var(--font-display)] font-medium",
          "leading-[1.1] tracking-[-0.02em]",
          m.title
            ? "text-[var(--color-navy-900)]"
            : "text-[var(--color-text-muted)]",
          "text-[clamp(1.75rem,3.5vw,2.375rem)]",
        ].join(" ")}
      >
        {titleText}
      </h1>

      {memoryDate ? (
        <p className="mt-2 text-[13px] text-[var(--color-text-subtle)]">
          Vzpomínka na: <span className="text-[var(--color-text-muted)]">{memoryDate}</span>
        </p>
      ) : null}

      {/* Question quote — small, calm, not gold */}
      {m.question ? (
        <blockquote className="mt-6 border-l-2 border-[var(--color-border-strong)] pl-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
          &bdquo;{m.question}&ldquo;
        </blockquote>
      ) : null}

      {/* Audio player */}
      {m.audioUrl ? (
        <div className="mt-8 space-y-3">
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
      ) : null}

      {/* Text content (editable) */}
      <div className="mt-8">
        {editing ? (
          <div className="space-y-4">
            <textarea
              autoFocus
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-4 py-3 text-[15px] leading-relaxed text-[var(--color-text)] focus:border-[var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              style={{ minHeight: 240 }}
              placeholder="Napište text vzpomínky…"
            />
            {editError ? (
              <p role="alert" className="text-sm text-[var(--color-red-700)]">
                {editError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraftText(text ?? "");
                  setEditError(null);
                }}
                className="inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-paper-100)]"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-gold-500)] px-5 text-sm font-semibold text-[var(--color-navy-900)] transition-colors hover:bg-[var(--color-gold-400)]"
              >
                Uložit úpravy
                <span aria-hidden>↗</span>
              </button>
            </div>
          </div>
        ) : text ? (
          <>
            <div
              className={[
                "leading-[1.7] text-[var(--color-text)]",
                !expanded && textLong ? "line-clamp-[10]" : "",
              ].filter(Boolean).join(" ")}
              style={{ fontSize: "1.0625rem", whiteSpace: "pre-line", maxWidth: "65ch" }}
            >
              {text}
            </div>
            {textLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 text-sm font-medium text-[var(--color-navy-700)] underline-offset-2 hover:underline"
              >
                {expanded ? "Méně" : "Číst celý text"}
              </button>
            )}
          </>
        ) : !m.audioUrl ? (
          /* No text and no audio - offer to add */
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setDraftText("");
            }}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-4 py-3 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-700)]"
          >
            <Pencil size={14} aria-hidden />
            Přidat text k vzpomínce
          </button>
        ) : null}
      </div>

      {/* Media */}
      {m.attachments.length > 0 ? (
        <div className="mt-10">
          <MediaGallery attachments={m.attachments} />
        </div>
      ) : null}
    </article>
  );
}

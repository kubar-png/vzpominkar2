"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Download } from "lucide-react";

// Seeded waveform — FNV-1a hash → deterministic bar heights (stable per memory).
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
    return (h >>> 0) / 4294967296;
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

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

interface WaveformPlayerProps {
  src: string;
  duration: number | null;
  /** Stable seed for the deterministic waveform. */
  memoryId: string;
  /** Filename for the download link (full variant only). */
  downloadName?: string;
  /**
   * "full" — feature surface on the detail page (header + download link).
   * "compact" — single-row player for list cards.
   */
  variant?: "full" | "compact";
  className?: string;
}

/**
 * Dark waveform audio player — the app's signature playback surface. A
 * deliberate warm-dark contrast moment (per DESIGN.md the waveform is one of
 * the few spots the editorial system allows a dark feature surface). Neutral
 * bars sit behind a gold "played" overlay clipped to progress.
 */
export function WaveformPlayer({
  src,
  duration: initialDuration,
  memoryId,
  downloadName,
  variant = "full",
  className,
}: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration ?? 0);

  const compact = variant === "compact";
  const bars = generateWaveform(memoryId, compact ? 56 : 90);
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
      void audio.play();
      setPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function seek(idx: number) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const t = (idx / count) * duration;
    audio.currentTime = t;
    setCurrentTime(t);
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  const audioEl = (
    <audio
      ref={audioRef}
      src={src}
      preload="metadata"
      onLoadedMetadata={() => {
        // WebM from MediaRecorder reports duration as Infinity; fall back to
        // the DB-stored seconds when that happens.
        const d = audioRef.current?.duration;
        setDuration(
          typeof d === "number" && Number.isFinite(d) && d > 0 ? d : initialDuration ?? 0,
        );
      }}
      onDurationChange={() => {
        const d = audioRef.current?.duration;
        if (typeof d === "number" && Number.isFinite(d) && d > 0) setDuration(d);
      }}
      onEnded={() => {
        setPlaying(false);
        setCurrentTime(0);
      }}
    />
  );

  const waveform = (height: number) => (
    <div
      className="relative flex-1"
      style={{ height }}
      role="slider"
      aria-label="Průběh nahrávky"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="flex h-full cursor-pointer items-end gap-[2px]">
        {bars.map((h, i) => (
          <div
            key={i}
            onClick={() => seek(i)}
            className="flex-1 rounded-full"
            style={{
              height: `${Math.round(h * 100)}%`,
              minWidth: 2,
              backgroundColor: "var(--color-navy-200)",
            }}
          />
        ))}
      </div>
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
              backgroundColor: "var(--color-navy-700)",
            }}
          />
        ))}
      </div>
    </div>
  );

  const playButton = (size: number) => (
    <button
      type="button"
      onClick={togglePlay}
      aria-label={playing ? "Pozastavit" : "Přehrát"}
      className="flex shrink-0 items-center justify-center rounded-full border border-[var(--color-navy-300)] text-[var(--color-navy-700)] transition-colors hover:border-[var(--color-navy-700)] hover:bg-[var(--color-navy-700)] hover:text-[var(--color-paper-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy-500)] focus-visible:ring-offset-2"
      style={{ height: size, width: size }}
    >
      {playing ? <Pause size={size < 44 ? 16 : 18} /> : <Play size={size < 44 ? 16 : 18} className="translate-x-px" />}
    </button>
  );

  // ── Compact: single row for list cards ──────────────────────────────────
  if (compact) {
    return (
      <div
        className={[
          "flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-paper-100)] px-3 py-2.5",
          className ?? "",
        ].join(" ")}
      >
        {audioEl}
        {playButton(40)}
        {waveform(32)}
        <p className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--color-navy-500)]">
          {formatTime(currentTime)}
          <span className="text-[var(--color-navy-300)]"> / </span>
          {formatTime(duration)}
        </p>
      </div>
    );
  }

  // ── Full: feature surface on the detail page ────────────────────────────
  return (
    <div
      className={[
        "overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-paper-100)]",
        className ?? "",
      ].join(" ")}
    >
      {audioEl}

      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-navy-400)]">
          Nahrávka
        </p>
        <p className="font-mono text-xs tabular-nums text-[var(--color-navy-500)]">
          {formatTime(currentTime)}
          <span className="text-[var(--color-navy-300)]"> / </span>
          {formatTime(duration)}
        </p>
      </div>

      <div className="mx-5">{waveform(64)}</div>

      <div className="flex items-center justify-between px-5 py-4">
        {playButton(44)}
        {downloadName ? (
          <a
            href={src}
            download={downloadName}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-navy-400)] underline-offset-2 transition-colors hover:text-[var(--color-navy-700)] hover:underline"
          >
            <Download size={12} aria-hidden />
            Uložit nahrávku
          </a>
        ) : null}
      </div>
    </div>
  );
}

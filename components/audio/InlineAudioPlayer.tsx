"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface InlineAudioPlayerProps {
  src: string;
  /** Initial duration hint (so the bar isn't blank before metadata loads). */
  duration?: number | null;
  /** Visual style - owner uses navy on cream, senior uses paper on white. */
  tone?: "owner" | "senior";
  className?: string;
}

/**
 * Compact custom audio player. Replaces native <audio controls> in places
 * where the browser-default tiny play button is too small (especially on
 * the senior surface). Big tap target, tabular-mono time, scrubbable bar.
 */
export function InlineAudioPlayer({
  src,
  duration: initialDuration,
  tone = "owner",
  className,
}: InlineAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [duration, setDuration] = useState(initialDuration ?? 0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setPos(a.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setPos(0);
    };
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setDuration(Math.round(a.duration));
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    a.addEventListener("loadedmetadata", onMeta);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  function seekFromEvent(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    const bar = barRef.current;
    if (!a || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setPos(a.currentTime);
  }

  const total = duration || 1;
  const pct = Math.min(100, (pos / total) * 100);

  const isSenior = tone === "senior";
  const buttonSize = isSenior ? "h-14 w-14" : "h-11 w-11";
  const iconSize = isSenior ? 24 : 18;
  const containerCls = isSenior
    ? "rounded-[var(--radius-senior-input)] border-2 border-paper-300 bg-white p-4"
    : "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-paper-50)] p-3";

  return (
    <div className={[containerCls, "flex items-center gap-4", className ?? ""].join(" ")}>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pozastavit" : "Přehrát"}
        className={[
          buttonSize,
          "flex shrink-0 items-center justify-center rounded-full bg-[var(--color-navy-900)] text-white",
          "transition-colors hover:bg-[var(--color-navy-800)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy-500)] focus-visible:ring-offset-2",
        ].join(" ")}
      >
        {playing ? <Pause size={iconSize} /> : <Play size={iconSize} className="ml-0.5" />}
      </button>
      <div className="flex-1 space-y-2">
        <div
          ref={barRef}
          onClick={seekFromEvent}
          role="progressbar"
          aria-label="Průběh nahrávky"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full cursor-pointer overflow-hidden rounded-full bg-[var(--color-paper-200)]"
        >
          <div
            className="h-full bg-[var(--color-navy-700)] transition-[width] duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={["font-mono tabular-nums text-[var(--color-text-subtle)]", isSenior ? "text-base" : "text-xs"].join(" ")}>
          {formatTime(Math.round(pos))} / {formatTime(duration)}
        </p>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface CarouselStep {
  roman: string;
  title: string;
  body: string;
  mediaLabel: string;
  mediaKind?: "image" | "video";
}

interface Props {
  steps: CarouselStep[];
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function StepCarousel({ steps }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const isAnimatingRef = useRef(false);

  const onScroll = useCallback(() => {
    if (isAnimatingRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const viewportCenter = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    track.querySelectorAll<HTMLElement>("[data-card]").forEach((card, i) => {
      const center = card.offsetLeft + card.clientWidth / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setIndex(best);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handler = () => onScroll();
    track.addEventListener("scroll", handler, { passive: true });
    return () => track.removeEventListener("scroll", handler);
  }, [onScroll]);

  const animateScrollTo = (track: HTMLElement, target: number, duration = 1000) => {
    const start = track.scrollLeft;
    const distance = target - start;
    if (Math.abs(distance) < 1) return;
    const startTime = performance.now();
    isAnimatingRef.current = true;
    track.style.scrollSnapType = "none";
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      track.scrollLeft = start + distance * easeInOutSine(t);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        track.scrollLeft = target;
        track.style.scrollSnapType = "";
        isAnimatingRef.current = false;
      }
    };
    requestAnimationFrame(tick);
  };

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelectorAll<HTMLElement>("[data-card]")[i];
    if (!card) return;
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const currentRelative = cardRect.left - trackRect.left;
    const desiredOffset = (trackRect.width - cardRect.width) / 2;
    const delta = currentRelative - desiredOffset;
    const max = track.scrollWidth - track.clientWidth;
    const clamped = Math.max(0, Math.min(track.scrollLeft + delta, max));
    setIndex(i);
    animateScrollTo(track, clamped);
  };

  const prev = () => goTo(Math.max(0, index - 1));
  const next = () => goTo(Math.min(steps.length - 1, index + 1));

  return (
    <div className="relative">
      {/* ── Track ───────────────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        className={cn(
          "overflow-x-auto",
          "snap-x snap-mandatory",
          "scroll-pl-[6vw] scroll-pr-[6vw] sm:scroll-pl-[10vw] sm:scroll-pr-[10vw]",
          "[scrollbar-width:none] [-ms-overflow-style:none]",
          "[&::-webkit-scrollbar]:hidden",
        )}
      >
        <div className="flex gap-2 pl-[6vw] sm:gap-3 sm:pl-[10vw]">
          {steps.map((s, i) => {
            const isActive = i === index;
            return (
              <article
                key={s.roman}
                data-card
                data-active={isActive || undefined}
                className={cn(
                  "relative shrink-0 snap-center",
                  "w-[88vw] sm:w-[80vw]",
                  "overflow-hidden rounded-[var(--radius-3xl)]",
                  "bg-[var(--color-navy-900)] text-[var(--color-paper-100)]",
                  "shadow-md",
                )}
              >
                {/* Paper grain */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
                  }}
                />

                {/* ── Card layout: media-top on mobile, side-by-side on sm+ ── */}
                <div className="relative flex flex-col sm:grid sm:min-h-[clamp(380px,48svh,540px)] sm:grid-cols-[1fr_1.25fr]">
                  {/* Media - top on mobile (order-first), right column on
                   * desktop. Framed (padded + rounded-xl) on every viewport
                   * so the card silhouette stays consistent. Mobile uses a
                   * 16:9 crop; desktop fills the grid cell height. */}
                  <div className="order-first p-4 sm:order-last sm:p-6">
                    <div className="aspect-[16/9] overflow-hidden rounded-[var(--radius-xl)] sm:aspect-auto sm:h-full">
                      <MediaTile kind={s.mediaKind ?? "image"} label={s.mediaLabel} />
                    </div>
                  </div>

                  {/* Text - below media on mobile (order-last), left column on
                   * desktop. On desktop the text alternates between top- and
                   * bottom-aligned across cards (1 = top, 2 = bottom, …) to
                   * give the carousel a zigzag rhythm instead of every card
                   * looking identical. */}
                  <div
                    className={cn(
                      "order-last px-7 pb-5 pt-1 sm:order-first sm:px-16 sm:py-16",
                      i % 2 === 0 ? "sm:self-start" : "sm:self-end",
                    )}
                  >
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-[var(--color-gold-300)]">
                      <span className="h-px w-6 bg-[var(--color-gold-500)]" />
                      Krok {i + 1}
                    </div>

                    <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium leading-[1.1] text-[var(--color-paper-50)] sm:mt-7 sm:text-3xl">
                      {s.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[var(--color-paper-300)] sm:mt-5 sm:max-w-[44ch] sm:text-base">
                      {s.body}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
          {/* Trailing spacer - fixes scrollWidth on last card */}
          <div aria-hidden className="w-[6vw] shrink-0 sm:w-[10vw]" />
        </div>
      </div>

      {/* ── Desktop arrow controls (absolute over cards) ─────────────────── */}
      {index > 0 && (
        <button
          type="button"
          onClick={prev}
          aria-label="Předchozí krok"
          className={cn(
            "absolute left-[10vw] top-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
            "hidden h-12 w-12 items-center justify-center rounded-[var(--radius-full)] sm:inline-flex",
            "bg-[var(--color-paper-50)]/95 backdrop-blur",
            "ring-1 ring-inset ring-[var(--color-paper-300)]",
            "text-[var(--color-navy-900)]",
            "transition-[background-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
            "hover:bg-[var(--color-paper-50)] hover:shadow-[var(--shadow-md)]",
          )}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
            <path d="M7 1L1 7l6 6M1 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {index < steps.length - 1 && (
        <button
          type="button"
          onClick={next}
          aria-label="Další krok"
          className={cn(
            "absolute right-[10vw] top-1/2 z-10 translate-x-1/2 -translate-y-1/2",
            "hidden h-12 w-12 items-center justify-center rounded-[var(--radius-full)] sm:inline-flex",
            "bg-[var(--color-paper-50)]/95 backdrop-blur",
            "ring-1 ring-inset ring-[var(--color-paper-300)]",
            "text-[var(--color-navy-900)]",
            "transition-[background-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
            "hover:bg-[var(--color-paper-50)] hover:shadow-[var(--shadow-md)]",
          )}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
            <path d="M11 1l6 6-6 6M17 7H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* ── Mobile controls: arrows + progress bar, no step labels ────────── */}
      <div className="mt-5 flex items-center gap-3 px-[6vw] sm:hidden">
        <button
          type="button"
          onClick={prev}
          aria-label="Předchozí krok"
          disabled={index === 0}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-full)]",
            "bg-[var(--color-navy-900)] text-[var(--color-paper-100)]",
            "transition-opacity duration-[var(--duration-fast)]",
            index === 0 ? "opacity-25" : "opacity-100",
          )}
        >
          <svg width="16" height="12" viewBox="0 0 18 14" fill="none" aria-hidden>
            <path d="M7 1L1 7l6 6M1 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Progress segments */}
        <div className="flex flex-1 gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Krok ${i + 1}`}
              className={cn(
                "h-[3px] flex-1 rounded-full",
                "transition-colors duration-[280ms] ease-[cubic-bezier(0.165,0.84,0.44,1)]",
                i === index
                  ? "bg-[var(--color-red-700)]"
                  : "bg-[var(--color-paper-300)]",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Další krok"
          disabled={index === steps.length - 1}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-full)]",
            "bg-[var(--color-navy-900)] text-[var(--color-paper-100)]",
            "transition-opacity duration-[var(--duration-fast)]",
            index === steps.length - 1 ? "opacity-25" : "opacity-100",
          )}
        >
          <svg width="16" height="12" viewBox="0 0 18 14" fill="none" aria-hidden>
            <path d="M11 1l6 6-6 6M17 7H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ── Desktop step labels (hidden on mobile) ────────────────────────── */}
      <div className="mt-10 hidden items-center justify-center gap-10 sm:flex">
        {steps.map((s, i) => (
          <button
            key={s.roman}
            type="button"
            onClick={() => goTo(i)}
            aria-current={i === index ? "step" : undefined}
            className={cn(
              "group flex flex-col items-center gap-2",
              "text-[10px] uppercase tracking-[0.32em]",
              "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)]",
              i === index
                ? "text-[var(--color-navy-900)]"
                : "text-[var(--color-text-subtle)] hover:text-[var(--color-navy-700)]",
            )}
          >
            <span>Krok {i + 1}</span>
            <span
              aria-hidden
              className={cn(
                "h-[2px] w-12",
                "transition-transform duration-[280ms] ease-[cubic-bezier(0.165,0.84,0.44,1)]",
                "origin-left",
                i === index
                  ? "scale-x-100 bg-[var(--color-red-700)]"
                  : "scale-x-30 bg-[var(--color-paper-300)] group-hover:scale-x-50",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function MediaTile({ kind, label }: { kind: "image" | "video"; label: string }) {
  return (
    <div
      className="relative isolate h-full w-full overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--color-gold-200) 0%, var(--color-gold-400) 45%, var(--color-gold-600) 100%)",
      }}
    >
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-[0.12] mix-blend-multiply"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="vzp-hatch-tile" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="var(--color-gold-800)" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vzp-hatch-tile)" />
      </svg>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 25% 20%, rgba(255,248,220,0.55) 0%, rgba(255,248,220,0) 55%)",
        }}
      />

      <div aria-hidden className="absolute right-3 top-3 h-3 w-3 rounded-[var(--radius-xs)] bg-[var(--color-red-700)]" />

      {kind === "video" && (
        <div aria-hidden className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-red-700)] text-white shadow-[var(--shadow-lg)]">
            <svg aria-hidden width="20" height="22" viewBox="0 0 20 22" fill="currentColor">
              <path d="M2 1.5v19l16-9.5L2 1.5z" />
            </svg>
          </div>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
        <span className="font-[family-name:var(--font-display)] text-base text-[var(--color-navy-800)]">
          {label}
        </span>
      </div>
    </div>
  );
}

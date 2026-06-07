"use client";

import { useEffect, useRef, useState } from "react";

interface QuestionDeckProps {
  questions: ReadonlyArray<{ category: string; question: string }>;
  totalCount: number;
}

const ANIM_MS = 520;

/**
 * Question Deck — paper-card slider with sample prompts + exit animation.
 * The outgoing card flips up + sideways (booktora-style toss); the incoming
 * card fades up from below. Auto-advances every 6s.
 */
export function QuestionDeck({ questions, totalCount }: QuestionDeckProps) {
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState<{ idx: number; dir: "next" | "prev" } | null>(null);
  const [paused, setPaused] = useState(false);
  const count = questions.length;
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Auto-advance every 6s — pauses once the user has interacted manually
  // so the carousel doesn't fight their input.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => {
      go(1);
    }, 6000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, paused]);

  // Clear any lingering exit timer on unmount
  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);

  function go(delta: number) {
    setIndex((current) => {
      const dir: "next" | "prev" = delta > 0 ? "next" : "prev";
      setExiting({ idx: current, dir });
      if (exitTimer.current) clearTimeout(exitTimer.current);
      exitTimer.current = setTimeout(() => setExiting(null), ANIM_MS);
      return (current + delta + count) % count;
    });
  }

  function jumpTo(target: number) {
    if (target === index) return;
    const delta = target > index ? 1 : -1;
    setIndex(() => {
      setExiting({ idx: index, dir: delta > 0 ? "next" : "prev" });
      if (exitTimer.current) clearTimeout(exitTimer.current);
      exitTimer.current = setTimeout(() => setExiting(null), ANIM_MS);
      return target;
    });
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (startX == null || startY == null) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    // Only treat as a swipe if mostly horizontal and >= 50px
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    setPaused(true);
    go(dx < 0 ? 1 : -1);
  }

  const current = questions[index];
  const leaving = exiting ? questions[exiting.idx] : null;
  if (!current) return null;

  return (
    <div className="q-deck">
      <div
        className="q-card-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {leaving && exiting && (
          <div
            className={`q-card q-card-exit q-card-exit-${exiting.dir}`}
            aria-hidden
            key={`exit-${exiting.idx}`}
          >
            <div className="q-card-head">
              <span className="q-card-eyebrow">{leaving.category}</span>
            </div>
            <blockquote className="q-card-question">{leaving.question}</blockquote>
            <div className="q-card-rule" aria-hidden />
          </div>
        )}

        <div className="q-card q-card-enter" key={`enter-${index}`}>
          <div className="q-card-head">
            <span className="q-card-eyebrow">{current.category}</span>
          </div>
          <blockquote className="q-card-question">{current.question}</blockquote>
          <div className="q-card-rule" aria-hidden />
        </div>
      </div>

      {/* Control row — arrows flank a pill-style pagination indicator */}
      <div className="q-controls">
        <button
          type="button"
          className="q-arrow"
          onClick={() => { setPaused(true); go(-1); }}
          aria-label="Předchozí otázka"
        >
          ←
        </button>

        <div className="q-dots" role="tablist">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Otázka ${i + 1}`}
              onClick={() => { setPaused(true); jumpTo(i); }}
              className={`q-dot${i === index ? " is-active" : ""}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="q-arrow"
          onClick={() => { setPaused(true); go(1); }}
          aria-label="Další otázka"
        >
          →
        </button>
      </div>

      <p className="q-footnote">
        A dalších {totalCount - count} otázek, na které možná nikdy nedostanete
        odpověď. Pokud se nezeptáte.
      </p>
    </div>
  );
}

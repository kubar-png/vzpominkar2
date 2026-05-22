"use client";

import { useEffect, useState } from "react";

interface QuestionDeckProps {
  questions: ReadonlyArray<{ category: string; question: string }>;
  totalCount: number;
}

/**
 * Question Deck — paper-card slider with sample prompts.
 * Editorial styling: cream paper card, italic PP Pangaia question,
 * top-left chapter eyebrow + top-right page count, oxblood pagination dots.
 * Inspired by booktora.cz; styled to match Vzpomínkář.
 */
export function QuestionDeck({ questions, totalCount }: QuestionDeckProps) {
  const [index, setIndex] = useState(0);
  const count = questions.length;

  // Auto-advance every 6s; pauses on hover/touch via :hover state on wrapper
  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => clearInterval(id);
  }, [count]);

  function go(delta: number) {
    setIndex((i) => (i + delta + count) % count);
  }

  const current = questions[index];
  if (!current) return null;

  return (
    <div className="q-deck">
      <button
        type="button"
        className="q-arrow q-arrow-left"
        onClick={() => go(-1)}
        aria-label="Předchozí otázka"
      >
        ←
      </button>

      <div className="q-card" key={index}>
        <div className="q-card-head">
          <span className="q-card-eyebrow">{current.category}</span>
          <span className="q-card-page">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        </div>

        <blockquote className="q-card-question">
          {current.question}
        </blockquote>

        <div className="q-card-foot">— Náhodně —</div>
      </div>

      <button
        type="button"
        className="q-arrow q-arrow-right"
        onClick={() => go(1)}
        aria-label="Další otázka"
      >
        →
      </button>

      <div className="q-dots" role="tablist">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Otázka ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`q-dot${i === index ? " is-active" : ""}`}
          />
        ))}
      </div>

      <p className="q-footnote">
        A dalších {totalCount - count} otázek, na které možná nikdy nedostanete
        odpověď. <em>Pokud se nezeptáte.</em>
      </p>
    </div>
  );
}

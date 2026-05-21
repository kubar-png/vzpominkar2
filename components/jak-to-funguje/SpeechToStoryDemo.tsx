"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "first" | "third" | "transcript";

interface ModeContent {
  /** The generated text in this mode. */
  text: string;
  /** Word fragments (case-sensitive) to softly highlight as the diff. */
  highlights: string[];
}

const SPOKEN =
  "No tak… to byl den, na který nikdy nezapomenu. S Honzou jsme se brali u svaté Anny v Brně, kousek od náměstí.";

const CONTENT: Record<Mode, ModeContent> = {
  first: {
    text: "Byl to den, který se mi navždy vryl do paměti. S Honzou jsme si řekli ano u svaté Anny v Brně, jen pár kroků od náměstí.",
    highlights: ["se mi navždy vryl do paměti", "si řekli ano", "jen pár kroků"],
  },
  third: {
    text: "Byl to den, který se Marii navždy vryl do paměti. S Honzou si u svaté Anny v Brně řekli ano, jen pár kroků od náměstí.",
    highlights: ["se Marii navždy vryl do paměti", "si u svaté Anny v Brně řekli ano", "jen pár kroků"],
  },
  transcript: {
    text:
      "No tak… to byl den, na který nikdy nezapomenu. S Honzou jsme se brali u svaté Anny v Brně, kousek od náměstí.",
    highlights: [],
  },
};

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "first", label: "1. osoba" },
  { id: "third", label: "3. osoba" },
  { id: "transcript", label: "Přepis" },
];

/** Splits the text on each highlight phrase and wraps matches with a styled span. */
function renderWithHighlights(text: string, highlights: string[]) {
  if (highlights.length === 0) return text;
  const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(re);
  return parts.map((part, i) => {
    if (highlights.includes(part)) {
      return (
        <mark
          key={i}
          className="rounded-sm bg-[var(--color-gold-200)]/70 px-0.5 py-px text-[var(--color-navy-900)]"
        >
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function SpeechToStoryDemo() {
  const [mode, setMode] = useState<Mode>("first");
  const content = useMemo(() => CONTENT[mode], [mode]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Outer parchment card - frames the demo, mirrors Remento's pale tray. */}
      <div className="relative rounded-[var(--radius-3xl)] bg-[var(--color-paper-200)] p-5 pt-16 shadow-sm sm:p-8 sm:pt-20">
        {/* Floating avatar - half above the spoken bubble */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-[var(--color-paper-200)] bg-[var(--color-paper-100)] shadow-md">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-navy-200)] via-[var(--color-paper-200)] to-[var(--color-gold-200)]">
              <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-navy-800)]">
                MV
              </span>
            </div>
          </div>
        </div>

        {/* Spoken words */}
        <div className="rounded-[var(--radius-2xl)] bg-[var(--color-surface)] p-6 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            Co řekla
          </p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-ink-900)] sm:text-xl">
            {SPOKEN}
          </p>
        </div>

        {/* Generated text */}
        <div className="mt-4 rounded-[var(--radius-2xl)] bg-[var(--color-surface)] p-6 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            {mode === "transcript" ? "Přepis (beze změn)" : "Příběh v knize"}
          </p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-ink-900)] sm:text-xl">
            {renderWithHighlights(content.text, content.highlights)}
          </p>
        </div>

        {/* Mode toggle */}
        <div
          role="tablist"
          aria-label="Styl výsledného textu"
          className="mt-6 flex gap-1 rounded-full bg-[var(--color-surface)] p-1 shadow-inner"
        >
          {MODES.map((m) => {
            const selected = m.id === mode;
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={selected}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-all sm:text-base",
                  selected
                    ? "bg-[var(--color-navy-900)] text-[var(--color-paper-50)] shadow-md"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-navy-900)]",
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

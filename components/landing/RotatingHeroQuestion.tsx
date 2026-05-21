"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* Real examples drawn from the question library - the hero teaser
 * advertises the *mechanic* (one question, every Monday) rather than the
 * promise. Five rotating items, ~4.5s each, crossfade. */
const QUESTIONS = [
  "Která vůně tě vrací zpátky do dětství?",
  "Co tě naučil tvůj otec, i když to nikdy neřekl nahlas?",
  "Vzpomínáš si na svou první výplatu - kolik to bylo a za co padla?",
  "Co ti běželo hlavou, když ses ráno na svatbě probudil(a)?",
  "Jaká písnička v rádiu tě vždycky zastavila?",
];

const FADE_MS = 360;
const HOLD_MS = 4500;

export function RotatingHeroQuestion() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setI((prev) => (prev + 1) % QUESTIONS.length);
        setVisible(true);
      }, FADE_MS);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      data-hero-stagger
      style={{ ["--stagger-delay" as string]: "380ms" }}
      className="mt-6 flex items-start gap-4 sm:mt-7"
    >
      {/* Slim red rule - echoes the hero bookmark ribbon */}
      <span
        aria-hidden
        className="mt-2 inline-block h-7 w-px shrink-0 bg-[var(--color-red-700)]"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-red-700)]">
          Otázka, kterou tento týden posíláme
        </p>
        <p
          aria-live="polite"
          className={cn(
            "mt-2 font-[family-name:var(--font-display)] text-lg font-normal leading-snug text-[var(--color-navy-800)] transition-opacity sm:text-xl",
            visible ? "opacity-100" : "opacity-0",
          )}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        >
          {`„${QUESTIONS[i]}"`}
        </p>
      </div>
    </div>
  );
}

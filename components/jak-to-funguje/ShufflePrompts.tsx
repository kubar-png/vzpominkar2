"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "Jaký byl tvůj nejoblíbenější pokoj v domě, kde jsi vyrůstal/a?",
  "Jakou nejranější vzpomínku z dětství máš?",
  "Co bylo nejtěžší, co jsi musel/a v dětství překonat?",
  "Kdy ses cítil/a poprvé jako dospělý člověk?",
  "Která vůně tě vrací domů?",
  "Jaký den byste teď chtěl/a prožít znovu?",
  "Jaká rada ti zůstala od tvojí mámy?",
  "Co bylo úplně první auto, kterým jsi řídil/a?",
  "Kdy ses naposledy hlasitě smál/a?",
  "Jaké jméno jste si pro mě s tátou původně chtěli dát?",
  "Co tě ve tvém řemesle naučil čas?",
  "Která píseň tě vždycky vrátí do mládí?",
];

/**
 * Pick 4 random distinct prompts.
 * Uses Fisher-Yates with a seed = current selection so successive shuffles
 * always produce a noticeably different set (no repeats of the same 4).
 */
function pickFour(exclude: string[] = []): string[] {
  const pool = PROMPTS.filter((p) => !exclude.includes(p));
  const out: string[] = [];
  const copy = [...pool];
  while (out.length < 4 && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    const picked = copy[idx];
    if (picked) out.push(picked);
    copy.splice(idx, 1);
  }
  while (out.length < 4) {
    const fill = PROMPTS[out.length] ?? PROMPTS[0];
    if (fill) out.push(fill);
    else break;
  }
  return out;
}

export function ShufflePrompts({ initial }: { initial?: string[] }) {
  const [items, setItems] = useState<string[]>(() => initial ?? PROMPTS.slice(0, 4));
  const [pulse, setPulse] = useState(0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((p, i) => (
          <article
            key={`${pulse}-${i}`}
            style={{ animationDelay: `${i * 60}ms` }}
            className={cn(
              "shuffle-card group relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-sm transition-transform",
              "hover:-translate-y-1 hover:shadow-md",
            )}
          >
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
              <span className="font-[family-name:var(--font-display)] text-base font-bold leading-none tracking-normal text-[var(--color-gold-500)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="h-px w-6 bg-[var(--color-border-strong)]" />
              <span>Otázka</span>
            </div>
            <p
              className="mt-5 font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--color-ink-900)] sm:text-2xl"
              style={{ textWrap: "balance" }}
            >
              {p}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => {
            setItems((prev) => pickFour(prev));
            setPulse((n) => n + 1);
          }}
          className="group inline-flex min-h-[52px] items-center gap-3 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-navy-900)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
            className="transition-transform duration-500 group-hover:rotate-180"
          >
            <path
              d="M3 3l3 3M3 3l3-3M3 3v12c0 1.1.9 2 2 2h3M15 15l-3-3M15 15l-3 3M15 15V3c0-1.1-.9-2-2-2h-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Zamíchat otázky
        </button>
      </div>

      <style jsx>{`
        .shuffle-card {
          animation: shuffle-in 360ms cubic-bezier(0.25, 1, 0.5, 1) both;
        }
        @keyframes shuffle-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

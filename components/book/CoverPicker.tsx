"use client";

import { Check } from "lucide-react";
import {
  COVER_BG,
  COVER_TEXT,
  defaultTextFor,
  isLegibleCover,
  type CoverBg,
  type CoverText,
} from "@/lib/book/cover";

interface CoverPickerProps {
  bg: CoverBg;
  text: CoverText;
  onChangeBg: (v: CoverBg) => void;
  onChangeText: (v: CoverText) => void;
}

/**
 * Cover picker — background colour and foil/ink colour chosen independently
 * (shared options come from lib/book/cover.ts). Two groups: a row of colour
 * swatches for the binding, a row of pills for the stamping. The legibility
 * guard disables illegal combos (e.g. black ink on the dark navy binding); if
 * the chosen background makes the current ink illegal, the ink auto-corrects to
 * a guaranteed-legible default. Switching is instant; FlipBook remounts on
 * change since react-pageflip won't re-render its children otherwise.
 */
export function CoverPicker({ bg, text, onChangeBg, onChangeText }: CoverPickerProps) {
  function chooseBg(next: CoverBg) {
    onChangeBg(next);
    if (!isLegibleCover(next, text)) onChangeText(defaultTextFor(next));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Background swatches ── */}
      <div>
        <p
          className="mb-3 text-[11px] font-medium uppercase"
          style={{ letterSpacing: "0.16em", color: "var(--color-text-muted)" }}
        >
          Barva přebalu
        </p>
        <div role="radiogroup" aria-label="Vyberte barvu přebalu" className="flex flex-wrap gap-3">
          {COVER_BG.map((o) => {
            const active = o.value === bg;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={o.label}
                title={o.label}
                onClick={() => chooseBg(o.value)}
                className="group relative flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2"
                style={{
                  background: o.hex,
                  boxShadow: active
                    ? "inset 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 2px var(--color-navy-900)"
                    : "inset 0 0 0 1px rgba(0,0,0,0.12)",
                }}
              >
                {active ? (
                  <Check
                    size={14}
                    className="text-white"
                    strokeWidth={3}
                    style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))" }}
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Text / foil pills ── */}
      <div>
        <p
          className="mb-3 text-[11px] font-medium uppercase"
          style={{ letterSpacing: "0.16em", color: "var(--color-text-muted)" }}
        >
          Barva textu
        </p>
        <div role="radiogroup" aria-label="Vyberte barvu textu" className="flex flex-wrap gap-3">
          {COVER_TEXT.map((o) => {
            const active = o.value === text;
            const ok = isLegibleCover(bg, o.value);
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!ok}
                title={ok ? o.label : `${o.label} — nečitelné na této barvě`}
                onClick={() => onChangeText(o.value)}
                className="flex items-center gap-2 rounded-full border bg-white pl-1.5 pr-3 py-1 transition-colors hover:border-[var(--color-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--color-border)]"
                style={{
                  borderColor: active ? "var(--color-navy-900)" : "var(--color-border)",
                }}
              >
                <span
                  aria-hidden
                  className="h-5 w-5 rounded-full"
                  style={{ background: o.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }}
                />
                <span
                  className="text-[13px] font-medium"
                  style={{
                    color: active ? "var(--color-navy-900)" : "var(--color-text-muted)",
                  }}
                >
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

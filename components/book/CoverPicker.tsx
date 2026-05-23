"use client";

import { Check } from "lucide-react";
import { COVER_VARIANTS, type CoverVariant } from "./BookCover";

interface CoverPickerProps {
  value: CoverVariant;
  onChange: (v: CoverVariant) => void;
}

/**
 * Cover-variant picker — four pill swatches, the selected one carries a
 * subtle check mark + navy ring. Switching is instant; FlipBook remounts on
 * variant change since react-pageflip won't re-render children otherwise.
 */
export function CoverPicker({ value, onChange }: CoverPickerProps) {
  return (
    <div>
      <p
        className="mb-3 text-[11px] font-medium uppercase"
        style={{ letterSpacing: "0.16em", color: "var(--color-text-muted)" }}
      >
        Vzhled přebalu
      </p>
      <div role="radiogroup" aria-label="Vyberte vzhled přebalu" className="flex flex-wrap gap-3">
        {COVER_VARIANTS.map((v) => {
          const active = v.value === value;
          return (
            <button
              key={v.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v.value)}
              className="group flex items-center gap-2 rounded-full border bg-white pl-1 pr-3 py-1 transition-colors hover:border-[var(--color-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2"
              style={{
                borderColor: active ? "var(--color-navy-900)" : "var(--color-border)",
              }}
            >
              <span
                aria-hidden
                className="relative flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: v.swatch,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                }}
              >
                {active ? (
                  <Check
                    size={12}
                    className="text-white"
                    strokeWidth={3}
                    style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))" }}
                    aria-hidden
                  />
                ) : null}
              </span>
              <span
                className="text-[13px] font-medium"
                style={{
                  color: active ? "var(--color-navy-900)" : "var(--color-text-muted)",
                }}
              >
                {v.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

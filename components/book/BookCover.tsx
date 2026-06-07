"use client";

import { forwardRef } from "react";
import {
  COVER_BG_HEX,
  COVER_TEXT_HEX,
  type CoverBg,
  type CoverText,
} from "@/lib/book/cover";

interface BookCoverProps {
  /** Surface colour — drives the cover material. */
  bg: CoverBg;
  /** Foil / ink colour for the stamped type + frame. */
  text: CoverText;
  /** Owner-set family name shown on the spine + front. */
  familyName: string;
  /** Year stamped at the bottom of the cover. */
  year: number;
  /** Render the back cover (colophon side). When false, renders the front. */
  back?: boolean;
  /** Optional className passthrough for react-pageflip's page sizing. */
  className?: string;
}

/**
 * Bound-book cover. Background colour and foil/ink colour are chosen
 * independently (shared with the gift configurator + exported PDF cover via
 * lib/book/cover.ts, so the options never drift). The surface comes from
 * COVER_BG_HEX, the stamped type + hairline frame from COVER_TEXT_HEX; the
 * material texture + radial sheen are layered on top per background so the
 * cover still reads as a physical object rather than a flat swatch.
 */
export const BookCover = forwardRef<HTMLDivElement, BookCoverProps>(function BookCover(
  { bg, text, familyName, year, back = false, className },
  ref,
) {
  // Read the live colours from CSS variables set on a stable ancestor (the
  // FlipBook container), falling back to the prop-derived hex. react-pageflip
  // never re-renders its children once mounted, so a colour change can't flow
  // through props — it cascades through these vars into the frozen cover DOM,
  // recolouring it instantly with no remount. Derived tints use color-mix so
  // the muted ink + hairline frame track the live --cover-ink too.
  const base = `var(--cover-bg, ${COVER_BG_HEX[bg]})`;
  const ink = `var(--cover-ink, ${COVER_TEXT_HEX[text]})`;
  const inkMute = `color-mix(in srgb, ${ink} 55%, transparent)`;
  const frame = `color-mix(in srgb, ${ink} 35%, transparent)`;
  const texture = bgTexture[bg];

  return (
    <div ref={ref} className={`h-full w-full ${className ?? ""}`} data-density="hard">
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          // Radial sheen over the flat brand colour so the surface reads as a
          // bound material, not a swatch. Lightens toward the top-left.
          background: `radial-gradient(120% 90% at 20% 0%, ${withAlpha("#ffffff", 0.14)} 0%, transparent 55%), ${base}`,
          color: ink,
        }}
      >
        {/* Material texture overlay — subtle noise + grain via repeating gradients */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[var(--cover-grain-opacity,0.18)] mix-blend-overlay"
          style={{ background: texture, ["--cover-grain-opacity" as string]: "0.45" }}
        />

        {/* Inner foil/blind hairline frame, inset from cover edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            inset: "5%",
            border: `1px solid ${frame}`,
            borderRadius: 2,
          }}
        />

        {back ? (
          // ── Back cover ──────────────────────────────────────────────────
          <div className="relative flex h-full w-full flex-col items-center justify-end gap-3 px-[10%] pb-[10%]">
            <p
              className="text-[10px] font-medium uppercase"
              style={{ letterSpacing: "0.32em", color: inkMute }}
            >
              Vzpomínkář · MMXXVI
            </p>
            <p
              className="text-[10px]"
              style={{ letterSpacing: "0.2em", color: inkMute, opacity: 0.7 }}
            >
              Praha · vázáno ručně
            </p>
          </div>
        ) : (
          // ── Front cover ─────────────────────────────────────────────────
          <div className="relative flex h-full w-full flex-col items-center justify-between px-[12%] py-[14%]">
            {/* Top mark — small printer's emblem */}
            <div className="flex flex-col items-center gap-2">
              <div
                aria-hidden
                className="h-3 w-3 rotate-45 border"
                style={{ borderColor: inkMute, opacity: 0.7 }}
              />
              <p
                className="text-[9px] font-medium uppercase"
                style={{ letterSpacing: "0.42em", color: inkMute }}
              >
                Vzpomínkář
              </p>
            </div>

            {/* Center title block */}
            <div className="flex flex-col items-center gap-4 text-center">
              <p
                className="text-[10px] font-medium uppercase"
                style={{ letterSpacing: "0.36em", color: inkMute }}
              >
                Kniha rodinné paměti
              </p>
              <h1
                className="font-[family-name:var(--font-display)] leading-[1.05] tracking-[-0.01em]"
                style={{
                  fontSize: "clamp(28px, 4.5vw, 44px)",
                  color: ink,
                  fontWeight: 500,
                  textWrap: "balance",
                }}
              >
                {familyName}
              </h1>
              <div aria-hidden className="h-px w-12" style={{ background: inkMute }} />
              <p
                className="font-[family-name:var(--font-display)] tabular-nums"
                style={{
                  fontSize: "clamp(18px, 2.4vw, 24px)",
                  color: ink,
                  fontWeight: 500,
                }}
              >
                {year}
              </p>
            </div>

            {/* Bottom — quiet colophon */}
            <p
              className="text-[9px] font-medium uppercase"
              style={{ letterSpacing: "0.42em", color: inkMute }}
            >
              Svazek I.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Material texture overlays keyed by background. Each pushes through at
 * mix-blend-overlay so it works over any base colour: leather grain for the
 * warm browns/reds, fine cloth weave for navy, a tighter weave for gold.
 */
const bgTexture: Record<CoverBg, string> = {
  navy: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 4px)",
  brown:
    "repeating-radial-gradient(circle at 20% 30%, rgba(255,200,120,0.08) 0 1px, transparent 1px 8px), repeating-radial-gradient(circle at 70% 70%, rgba(0,0,0,0.1) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 3px)",
  red: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 5px), repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 5px)",
  gold: "repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 3px)",
};

/** Composite a #rrggbb hex over a given alpha → an rgba() string. */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

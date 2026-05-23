"use client";

import { forwardRef } from "react";

export type CoverVariant = "navy" | "brown" | "oxblood" | "linen";

export const COVER_VARIANTS: { value: CoverVariant; label: string; swatch: string }[] = [
  { value: "navy", label: "Modrá vazba", swatch: "linear-gradient(135deg, #11406b, #0a2a48)" },
  { value: "brown", label: "Hnědá kůže", swatch: "linear-gradient(135deg, #5a3920, #2f1d10)" },
  { value: "oxblood", label: "Červená vazba", swatch: "linear-gradient(135deg, #6b1814, #3a0e0a)" },
  { value: "linen", label: "Krémové plátno", swatch: "linear-gradient(135deg, #efe6cf, #d8caa1)" },
];

interface BookCoverProps {
  variant: CoverVariant;
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
 * Bound-book cover — four design variants. Visual hierarchy:
 *   1. Material (cloth / leather grain / linen weave) via layered CSS gradients
 *   2. Gold-stamped title block — Pangaia "Vzpomínkář" + family + year
 *   3. Corner brackets / hairline frame appropriate to the variant
 *
 * Variants intentionally vary their stamping treatment so the user can pick
 * a personality, not just a color. Navy = classical archive. Brown = warm
 * heirloom. Oxblood = formal. Linen = modern editorial.
 */
export const BookCover = forwardRef<HTMLDivElement, BookCoverProps>(function BookCover(
  { variant, familyName, year, back = false, className },
  ref,
) {
  const config = variantConfig[variant];

  return (
    <div ref={ref} className={className} data-density="hard">
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          background: config.surface,
          color: config.foil,
        }}
      >
        {/* Material texture overlay — subtle noise + grain via repeating gradients */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[var(--cover-grain-opacity,0.18)] mix-blend-overlay"
          style={{ background: config.texture, ["--cover-grain-opacity" as string]: config.grainOpacity }}
        />

        {/* Inner gold/blind hairline frame, inset from cover edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            inset: "5%",
            border: `1px solid ${config.frameColor}`,
            borderRadius: 2,
          }}
        />

        {back ? (
          // ── Back cover ──────────────────────────────────────────────────
          <div className="relative flex h-full w-full flex-col items-center justify-end gap-3 px-[10%] pb-[10%]">
            <p
              className="text-[10px] font-medium uppercase"
              style={{ letterSpacing: "0.32em", color: config.foilMute }}
            >
              Vzpomínkář · MMXXVI
            </p>
            <p
              className="text-[10px]"
              style={{ letterSpacing: "0.2em", color: config.foilMute, opacity: 0.7 }}
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
                style={{ borderColor: config.foilMute, opacity: 0.7 }}
              />
              <p
                className="text-[9px] font-medium uppercase"
                style={{ letterSpacing: "0.42em", color: config.foilMute }}
              >
                Vzpomínkář
              </p>
            </div>

            {/* Center title block */}
            <div className="flex flex-col items-center gap-4 text-center">
              <p
                className="text-[10px] font-medium uppercase"
                style={{ letterSpacing: "0.36em", color: config.foilMute }}
              >
                Kniha rodinné paměti
              </p>
              <h1
                className="font-[family-name:var(--font-display)] leading-[1.05] tracking-[-0.01em]"
                style={{
                  fontSize: "clamp(28px, 4.5vw, 44px)",
                  color: config.foil,
                  fontWeight: 500,
                  textWrap: "balance",
                }}
              >
                {familyName}
              </h1>
              <div aria-hidden className="h-px w-12" style={{ background: config.foilMute }} />
              <p
                className="font-[family-name:var(--font-display)] tabular-nums"
                style={{
                  fontSize: "clamp(18px, 2.4vw, 24px)",
                  color: config.foil,
                  fontWeight: 500,
                }}
              >
                {year}
              </p>
            </div>

            {/* Bottom — quiet colophon */}
            <p
              className="text-[9px] font-medium uppercase"
              style={{ letterSpacing: "0.42em", color: config.foilMute }}
            >
              Svazek I.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

interface VariantConfig {
  /** Base surface — usually a gradient that reads as the material. */
  surface: string;
  /** Foil color used for stamped type. */
  foil: string;
  /** Foil at lower opacity for de-emphasized marks. */
  foilMute: string;
  /** Frame hairline color. */
  frameColor: string;
  /** Texture overlay (repeating gradients, dot grids) layered on top. */
  texture: string;
  /** How much the texture pushes through. 0.05–0.30 typical. */
  grainOpacity: string;
}

const variantConfig: Record<CoverVariant, VariantConfig> = {
  navy: {
    surface:
      "radial-gradient(120% 90% at 20% 0%, #1b507f 0%, #11406b 35%, #082a48 80%, #061f37 100%)",
    foil: "#e8c66a",
    foilMute: "rgba(232, 198, 106, 0.55)",
    frameColor: "rgba(232, 198, 106, 0.35)",
    texture:
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 4px)",
    grainOpacity: "0.4",
  },
  brown: {
    surface:
      "radial-gradient(110% 85% at 25% 5%, #6b4628 0%, #4a2e18 45%, #2c1a0c 85%, #1a0e06 100%)",
    foil: "#e0c067",
    foilMute: "rgba(224, 192, 103, 0.5)",
    frameColor: "rgba(224, 192, 103, 0.3)",
    texture:
      "repeating-radial-gradient(circle at 20% 30%, rgba(255,200,120,0.08) 0 1px, transparent 1px 8px), repeating-radial-gradient(circle at 70% 70%, rgba(0,0,0,0.1) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 3px)",
    grainOpacity: "0.5",
  },
  oxblood: {
    surface:
      "radial-gradient(110% 85% at 20% 5%, #821e19 0%, #5a1814 40%, #36100d 85%, #220806 100%)",
    foil: "#e8c66a",
    foilMute: "rgba(232, 198, 106, 0.5)",
    frameColor: "rgba(232, 198, 106, 0.35)",
    texture:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 5px), repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 5px)",
    grainOpacity: "0.5",
  },
  linen: {
    surface:
      "linear-gradient(135deg, #f4ebd0 0%, #e8dbb4 50%, #d4c193 100%)",
    foil: "#0e3b64",
    foilMute: "rgba(14, 59, 100, 0.55)",
    frameColor: "rgba(14, 59, 100, 0.3)",
    texture:
      "repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 3px)",
    grainOpacity: "0.7",
  },
};

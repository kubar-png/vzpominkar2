/**
 * Cover ("přebal") customization for the print book — shared by the gift
 * configurator preview, the dashboard cover picker, and the exported PDF cover
 * (BookDocument), so the options + hex values never drift.
 *
 * Background and text color are chosen independently. Hex values come from the
 * brand palette (app/globals.css / DESIGN.md); silver has no brand token so a
 * neutral metallic is used.
 */

export type CoverBg = "brown" | "navy" | "red" | "gold";
export type CoverText = "black" | "gold" | "silver";

export const COVER_BG: { value: CoverBg; label: string; hex: string }[] = [
  { value: "brown", label: "Hnědá", hex: "#2d2620" },
  { value: "navy", label: "Modrá", hex: "#0e3b64" },
  { value: "red", label: "Červená", hex: "#a8231f" },
  { value: "gold", label: "Zlatá", hex: "#d4a017" },
];

export const COVER_TEXT: { value: CoverText; label: string; hex: string }[] = [
  { value: "black", label: "Černá", hex: "#1a1714" },
  { value: "gold", label: "Zlatá", hex: "#e8c66a" },
  { value: "silver", label: "Stříbrná", hex: "#c9cdd2" },
];

export const COVER_BG_HEX = Object.fromEntries(COVER_BG.map((o) => [o.value, o.hex])) as Record<CoverBg, string>;
export const COVER_TEXT_HEX = Object.fromEntries(COVER_TEXT.map((o) => [o.value, o.hex])) as Record<CoverText, string>;

// The included (free) cover is brown + gold; any other colour is a paid upgrade.
export const DEFAULT_COVER_BG: CoverBg = "brown";
export const DEFAULT_COVER_TEXT: CoverText = "gold";

/**
 * Any background colour other than the included brown is a paid premium upgrade
 * (pure margin — same binding, different stamping). The server is authoritative
 * on the surcharge via priceForProductCzk("book_cover_premium"); COVER_PREMIUM_CZK
 * mirrors it for client-side display (keep the two in sync).
 */
export function isPremiumCover(bg: CoverBg): boolean {
  return bg !== DEFAULT_COVER_BG;
}

export const COVER_PREMIUM_CZK = 99;

/**
 * Legibility guard: dark backgrounds (brown/navy/red) need light text
 * (gold/silver); the light gold background needs black text.
 */
export function isLegibleCover(bg: CoverBg, text: CoverText): boolean {
  return bg === "gold" ? text === "black" : text !== "black";
}

/** A guaranteed-legible default text color for a given background. */
export function defaultTextFor(bg: CoverBg): CoverText {
  return bg === "gold" ? "black" : "gold";
}

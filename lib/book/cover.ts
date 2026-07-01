/**
 * Cover ("přebal") customization for the print book — shared by the gift
 * configurator preview, the dashboard cover picker, and the exported PDF cover
 * (BookDocument), so the options + hex values never drift.
 *
 * Background and text color are chosen independently. Hex values come from the
 * brand palette (docs/brand / app/globals.css): navy #1B2E4D, raspberry #C33D50,
 * off-white #FEF7D7. Option keys are preserved for stored orders/back-compat, so
 * "brown" now renders the default dark navy and "gold" the light off-white; the
 * foil/off-white stamping is #FEF7D7. Silver has no brand token so a neutral
 * metallic is kept.
 */

export type CoverBg = "brown" | "navy" | "red" | "gold";
export type CoverText = "black" | "gold" | "silver";

export const COVER_BG: { value: CoverBg; label: string; hex: string }[] = [
  { value: "brown", label: "Tmavě modrá", hex: "#1B2E4D" },
  { value: "navy", label: "Modrá", hex: "#3B5C86" },
  { value: "red", label: "Malinová", hex: "#C33D50" },
  { value: "gold", label: "Světlá", hex: "#FEF7D7" },
];

export const COVER_TEXT: { value: CoverText; label: string; hex: string }[] = [
  { value: "black", label: "Tmavá", hex: "#1B2E4D" },
  { value: "gold", label: "Světlá", hex: "#FEF7D7" },
  { value: "silver", label: "Stříbrná", hex: "#c9cdd2" },
];

export const COVER_BG_HEX = Object.fromEntries(COVER_BG.map((o) => [o.value, o.hex])) as Record<CoverBg, string>;
export const COVER_TEXT_HEX = Object.fromEntries(COVER_TEXT.map((o) => [o.value, o.hex])) as Record<CoverText, string>;

// The included (free) cover is the "brown" key (now brand navy) + "gold" foil
// (now off-white); any other background colour is a paid upgrade.
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
 * Legibility guard: dark backgrounds (brown/navy/red) need light foil
 * (gold/silver); the light "gold" background (off-white) needs dark text.
 */
export function isLegibleCover(bg: CoverBg, text: CoverText): boolean {
  return bg === "gold" ? text === "black" : text !== "black";
}

/** A guaranteed-legible default text color for a given background. */
export function defaultTextFor(bg: CoverBg): CoverText {
  return bg === "gold" ? "black" : "gold";
}

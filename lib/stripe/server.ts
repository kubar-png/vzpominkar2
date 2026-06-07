import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazy-init the Stripe SDK so we never throw at module load when the key
 * is missing. The 0-CZK skip path in createCheckout never touches this.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Either configure Stripe or keep PRICE_*_CZK at 0 in .env.local.",
    );
  }
  _stripe = new Stripe(key, {
    // Pin to a specific API version so updates to the SDK don't surprise us.
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return _stripe;
}

/**
 * One-time products (no subscriptions):
 *  - book_base          first book in a family   (e.g. 2 890 Kč; INCLUDES the 1st print)
 *  - book_addon         every further book — a new senior OR another volume
 *                       ("díl") of an existing senior            (e.g. 1 790 Kč)
 *  - book_print         physical print of a finished book — the FIRST copy is
 *                       included in book_base, so this stays 0 (kept for completeness)
 *  - book_print_extra   each ADDITIONAL printed copy (e.g. for a sibling). Owner sets
 *                       the price once the printer quote is known; a launch-only
 *                       discount (EXTRA_COPY_LAUNCH_DISCOUNT_PCT) applies at purchase.
 *  - book_cover_premium surcharge for a non-default cover colour — pure margin (≈99 Kč)
 *  - book_giftwrap      gift wrapping + embossed dedication               (≈290 Kč)
 *  - shop_book_standard guest GIFT book with our curated questions (/kniha/sestavit) (599 Kč)
 *  - shop_book_custom   guest GIFT book once the buyer adds their OWN questions (899 Kč).
 *                       The configurator switches the tier on whether the selection
 *                       contains a custom question (see lib/shop/order-actions.ts).
 */
export const SUPPORTED_PRODUCTS = [
  "book_base",
  "book_addon",
  "book_print",
  "book_print_extra",
  "book_cover_premium",
  "book_giftwrap",
  "shop_book_standard",
  "shop_book_custom",
] as const;
export type ProductType = (typeof SUPPORTED_PRODUCTS)[number];

/** Per-product default price (CZK). Used when the env var is unset. */
const DEFAULT_PRICE_CZK: Record<ProductType, number> = {
  book_base: 0,
  book_addon: 0,
  book_print: 0,
  // Owner fills the real price once the printer quote is known (env override).
  book_print_extra: 0,
  // Pure-margin add-ons. Code defaults stand in until the owner sets env values.
  book_cover_premium: 99,
  book_giftwrap: 290,
  // Tiered guest gift book: curated questions vs the buyer's own questions.
  // Set PRICE_SHOP_BOOK_*_CZK=0 in .env.local for local dev to take the free
  // path (no Stripe key needed).
  shop_book_standard: 599,
  shop_book_custom: 899,
};

/** Env var that overrides each product's price (CZK integer). */
const PRICE_ENV: Record<ProductType, string> = {
  book_base: "PRICE_BOOK_BASE_CZK",
  book_addon: "PRICE_BOOK_ADDON_CZK",
  book_print: "PRICE_BOOK_PRINT_CZK",
  book_print_extra: "PRICE_BOOK_PRINT_EXTRA_CZK",
  book_cover_premium: "PRICE_BOOK_COVER_PREMIUM_CZK",
  book_giftwrap: "PRICE_BOOK_GIFTWRAP_CZK",
  shop_book_standard: "PRICE_SHOP_BOOK_STANDARD_CZK",
  shop_book_custom: "PRICE_SHOP_BOOK_CUSTOM_CZK",
};

/**
 * Read price for a product from env (CZK integer). 0 → skip Stripe (free path).
 * Falls back to the product's DEFAULT_PRICE_CZK when the env var is absent.
 */
export function priceForProductCzk(product: ProductType): number {
  const raw = process.env[PRICE_ENV[product]];
  const n = Number(raw ?? DEFAULT_PRICE_CZK[product]);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/**
 * Honesty guard: the DISPLAY/trust price shown on a purchase screen must never
 * be non-zero while the CHARGED price is 0 — otherwise we'd show e.g. "2 890 Kč"
 * next to a free-path CTA, breaking the brand rule that the price shown equals
 * the price charged. A misconfigured env (display price set, charged price
 * resolving to 0) must fail loudly, not silently mislead the buyer.
 *
 * Dev: throw (catch it in CI / local before it ships).
 * Prod: console.error (never hard-crash a live checkout) and let the caller
 * decide what to render — callers should fall back to the charged (0) price.
 *
 * Call this wherever BOTH the charged price and the display price are known.
 */
export function assertDisplayPriceMatchesCharged(
  displayCzk: number,
  chargedCzk: number,
  context: string,
): void {
  if (chargedCzk === 0 && displayCzk > 0) {
    const msg =
      `[price-trap] ${context}: charged price is 0 (free path) but display price ` +
      `is ${displayCzk} Kč. A free CTA must never sit next to a non-zero price. ` +
      `Set the PRICE_*_CZK env (charged) to match, or drop the trust price.`;
    if (process.env.NODE_ENV !== "production") {
      throw new Error(msg);
    }
    console.error(msg);
  }
}

/**
 * Launch-only discount on an EXTRA printed copy bought at the moment of purchase
 * (the in-app paywall / gift checkout), to capture the buying-mood impulse.
 */
export const EXTRA_COPY_LAUNCH_DISCOUNT_PCT = 30;

/** Price of one extra printed copy after the launch discount (CZK, floored). */
export function discountedExtraCopyCzk(): number {
  const base = priceForProductCzk("book_print_extra");
  return Math.floor((base * (100 - EXTRA_COPY_LAUNCH_DISCOUNT_PCT)) / 100);
}

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
 *  - book_base         first book in a family         (e.g. 2 890 Kč)
 *  - book_addon        every further book — a new senior OR another volume
 *                      ("díl") of an existing senior    (e.g. 1 790 Kč)
 *  - book_print        physical print of a finished book
 *  - shop_book_custom  guest GIFT book from the configurator (/kniha/sestavit),
 *                      bought without an account            (1 099 Kč)
 */
export const SUPPORTED_PRODUCTS = [
  "book_base",
  "book_addon",
  "book_print",
  "shop_book_custom",
] as const;
export type ProductType = (typeof SUPPORTED_PRODUCTS)[number];

/** Per-product default price (CZK). Used when the env var is unset. */
const DEFAULT_PRICE_CZK: Record<ProductType, number> = {
  book_base: 0,
  book_addon: 0,
  book_print: 0,
  // Production price for the guest gift book. Set PRICE_SHOP_BOOK_CUSTOM_CZK=0
  // in .env.local for local dev to take the free path (no Stripe key needed).
  shop_book_custom: 1099,
};

/**
 * Read price for a product from env (CZK integer). 0 → skip Stripe (free path).
 * Falls back to the product's DEFAULT_PRICE_CZK when the env var is absent.
 */
export function priceForProductCzk(product: ProductType): number {
  const raw =
    product === "book_base"
      ? process.env.PRICE_BOOK_BASE_CZK
      : product === "book_addon"
        ? process.env.PRICE_BOOK_ADDON_CZK
        : product === "book_print"
          ? process.env.PRICE_BOOK_PRINT_CZK
          : process.env.PRICE_SHOP_BOOK_CUSTOM_CZK;
  const n = Number(raw ?? DEFAULT_PRICE_CZK[product]);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

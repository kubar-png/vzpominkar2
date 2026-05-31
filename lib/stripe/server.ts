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
 *  - book_base   first book in a family               (e.g. 2 890 Kč)
 *  - book_addon  every further book — a new senior OR another volume
 *                ("díl") of an existing senior          (e.g. 1 790 Kč)
 *  - book_print  physical print of a finished book
 */
export const SUPPORTED_PRODUCTS = ["book_base", "book_addon", "book_print"] as const;
export type ProductType = (typeof SUPPORTED_PRODUCTS)[number];

/** Read price for a product from env (CZK integer). 0 → skip Stripe (free path). */
export function priceForProductCzk(product: ProductType): number {
  const raw =
    product === "book_base"
      ? process.env.PRICE_BOOK_BASE_CZK
      : product === "book_addon"
        ? process.env.PRICE_BOOK_ADDON_CZK
        : process.env.PRICE_BOOK_PRINT_CZK;
  const n = Number(raw ?? "0");
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

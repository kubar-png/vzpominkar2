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

export const SUPPORTED_PRODUCTS = ["yearly_access", "book_print"] as const;
export type ProductType = (typeof SUPPORTED_PRODUCTS)[number];

/** Read price for a product from env (CZK integer). 0 → skip Stripe. */
export function priceForProductCzk(product: ProductType): number {
  const raw =
    product === "yearly_access"
      ? process.env.PRICE_YEARLY_ACCESS_CZK
      : process.env.PRICE_BOOK_PRINT_CZK;
  const n = Number(raw ?? "0");
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

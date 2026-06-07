import "server-only";
import { cookies } from "next/headers";

/**
 * Gift-flow marker cookie — the thread that carries the APP gift path
 * (/darovat → /signup?gift=1 → onboarding → /onboarding/platba → book_base
 * payment) end to end without a schema change.
 *
 * Two states live in ONE short-lived cookie:
 *   - "1"               → "this signup/onboarding is a gift" (set at signup when
 *                          gift=1). Tells /onboarding/platba to render the voucher
 *                          configurator inside the paywall form.
 *   - "<64-hex token>"  → the created voucher's token (set once the buyer submits
 *                          the paywall: startBaseCheckout creates the voucher and
 *                          stows its token here, so the webhook/free path can mark
 *                          it paid and the confirmation screen can offer the PDF).
 *
 * Cleared once the voucher has been threaded into the order (so a later,
 * non-gift purchase by the same account never re-attaches a stale voucher).
 *
 * HttpOnly + lax: it never needs to be read by client JS, and it must survive
 * the Stripe redirect round-trip (lax allows the top-level GET return).
 */

export const GIFT_COOKIE = "vzp-gift";

/** Marker value meaning "gift flow, no voucher created yet". */
const GIFT_PENDING = "1";

const MAX_AGE_SECONDS = 60 * 60 * 6; // 6h — long enough for signup → pay, no longer.

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function commonOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

/** Mark the current session as a gift flow (set at signup when gift=1). */
export async function markGiftPending(store?: CookieStore): Promise<void> {
  const cookieStore = store ?? (await cookies());
  cookieStore.set(GIFT_COOKIE, GIFT_PENDING, { ...commonOptions(), maxAge: MAX_AGE_SECONDS });
}

/** Store the created voucher's token so the order path can thread + pay it. */
export async function setGiftVoucherToken(token: string, store?: CookieStore): Promise<void> {
  const cookieStore = store ?? (await cookies());
  cookieStore.set(GIFT_COOKIE, token, { ...commonOptions(), maxAge: MAX_AGE_SECONDS });
}

/** Clear the marker once the voucher is attached to an order (or on abandon). */
export async function clearGiftCookie(store?: CookieStore): Promise<void> {
  const cookieStore = store ?? (await cookies());
  cookieStore.delete(GIFT_COOKIE);
}

export interface GiftState {
  /** True when the current flow is a gift (pending OR with a created voucher). */
  isGift: boolean;
  /** The created voucher token, when one has been minted (else null). */
  voucherToken: string | null;
}

/** Read the gift state from the request cookies. */
export async function readGiftState(store?: CookieStore): Promise<GiftState> {
  const cookieStore = store ?? (await cookies());
  const raw = cookieStore.get(GIFT_COOKIE)?.value?.trim() ?? "";
  if (!raw) return { isGift: false, voucherToken: null };
  if (raw === GIFT_PENDING) return { isGift: true, voucherToken: null };
  // A 64-hex voucher token; anything else is treated as a bare pending marker.
  const isToken = /^[a-f0-9]{64}$/i.test(raw);
  return { isGift: true, voucherToken: isToken ? raw : null };
}

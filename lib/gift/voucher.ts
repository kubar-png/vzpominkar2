import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { CoverBg } from "@/lib/book/cover";

/**
 * Gift-voucher data layer (service-role only).
 *
 * The gift flow (/darovat) lets a buyer personalize a printable A5-landscape
 * voucher — a brand-coloured card with the fixed message "Zajímá mě tvůj
 * příběh. / Proto jsem ti koupil{a} Vzpomínkář." The voucher PDF is rendered by
 * the same headless-Chromium pipeline as the print book and is only
 * downloadable AFTER payment (no free vouchers), so each row tracks `paid`.
 *
 * `gift_vouchers` has RLS on with NO policies (like `leads`/`coupons`): every
 * access here goes through the admin client. The unguessable high-entropy
 * `token` is the only capability that names a row — it's also what gets signed
 * into the HMAC print token (lib/print/token.ts) for the render route.
 */

type Admin = ReturnType<typeof createAdminClient>;
type VoucherRow = Database["public"]["Tables"]["gift_vouchers"]["Row"];

/** Gift-flow products a voucher can accompany (a subset of ProductType). */
export type GiftProductType = "book_base" | "shop_book_standard" | "shop_book_custom";

export interface CreateVoucherInput {
  productType: GiftProductType;
  /** Brand cover colour for the card; defaults to navy. */
  color?: CoverBg;
  /** Optional recipient oslovení (e.g. "Milá babičko"). */
  recipient?: string | null;
  /** Optional personal message line under the fixed two-line message. */
  message?: string | null;
  /** Optional buyer signature (e.g. "Tvůj vnuk Honza"). */
  signedBy?: string | null;
}

/**
 * High-entropy hex handle for a voucher — 32 random bytes → 64 hex chars, the
 * same shape as profiles.magic_token (encode(gen_random_bytes(32),'hex')). We
 * mint it in Node and insert it explicitly so createVoucher can return the
 * token without a follow-up read race.
 */
function newVoucherToken(): string {
  return randomBytes(32).toString("hex");
}

/** Trim a free-form field to null when empty, so blank inputs don't store "". */
function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Create a voucher row (unpaid) and return its id + token. Insert via the admin
 * client; the token is the public handle used on the confirmation page and in
 * the print token.
 */
export async function createVoucher(
  input: CreateVoucherInput,
): Promise<{ id: string; token: string }> {
  const token = newVoucherToken();
  const admin: Admin = createAdminClient();

  const { data, error } = await admin
    .from("gift_vouchers")
    .insert({
      token,
      product_type: input.productType,
      color: input.color ?? "navy",
      recipient: clean(input.recipient),
      message: clean(input.message),
      signed_by: clean(input.signedBy),
    })
    .select("id, token")
    .single<Pick<VoucherRow, "id" | "token">>();

  if (error || !data) {
    throw new Error(`Failed to create gift voucher: ${error?.message ?? "no row returned"}`);
  }
  return { id: data.id, token: data.token };
}

/** Fetch a voucher by its public token, or null if none matches. */
export async function getVoucherByToken(token: string): Promise<VoucherRow | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const admin: Admin = createAdminClient();
  const { data, error } = await admin
    .from("gift_vouchers")
    .select("*")
    .eq("token", trimmed)
    .maybeSingle<VoucherRow>();

  if (error) {
    console.error("[gift/voucher] lookup failed", { error });
    return null;
  }
  return data ?? null;
}

/**
 * Mark a voucher paid and link it to its order. Called from the purchase
 * confirmation path once payment is settled, gating the PDF download.
 */
export async function markVoucherPaid(token: string, orderRef: string): Promise<void> {
  const trimmed = token.trim();
  if (!trimmed) throw new Error("markVoucherPaid: empty token");

  const admin: Admin = createAdminClient();
  const { error } = await admin
    .from("gift_vouchers")
    .update({ paid: true, order_ref: orderRef })
    .eq("token", trimmed);

  if (error) {
    throw new Error(`Failed to mark voucher paid: ${error.message}`);
  }
}

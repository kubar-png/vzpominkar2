"use server";

import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createPrintCheckout, createExtraCopiesCheckout } from "@/lib/stripe/checkout";

// A book can only be ordered once it holds at least this many published
// memories. The dashboard/book page gates the button on the same number
// (BOOK_MIN); this is the authoritative server-side check.
const ORDER_MIN_MEMORIES = 30;

const addressSchema = z.object({
  fullName: z.string().min(2).max(120),
  street: z.string().min(2).max(160),
  city: z.string().min(2).max(80),
  zip: z.string().min(3).max(20),
  country: z.string().min(2).max(60).default("Česká republika"),
  phone: z.string().min(6).max(40).optional().or(z.literal("")),
});

export async function placeBookOrder(
  _prev: { ok: false; error: string } | null,
  formData: FormData,
): Promise<{ ok: false; error: string } | never> {
  const familyId = String(formData.get("familyId") ?? "");
  await requireOwnerOfFamily(familyId);

  const parsed = addressSchema.safeParse({
    fullName: formData.get("fullName"),
    street: formData.get("street"),
    city: formData.get("city"),
    zip: formData.get("zip"),
    country: formData.get("country") || "Česká republika",
    phone: formData.get("phone") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatná adresa." };
  }

  // Server-side minimum: the book must hold at least ORDER_MIN_MEMORIES
  // published memories before it can be ordered. Until now only the UI hid the
  // form; this rejects a forged/early submit without writing an order. Counted
  // with the admin client so RLS can't undercount (ownership is already
  // verified above).
  const admin = createAdminClient();
  const { count: publishedCount } = await admin
    .from("memories")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId)
    .eq("status", "published");

  if ((publishedCount ?? 0) < ORDER_MIN_MEMORIES) {
    return {
      ok: false,
      error: `Knihu lze objednat až po dosažení ${ORDER_MIN_MEMORIES} vzpomínek.`,
    };
  }

  const supabase = await createClient();

  // Link the print order to the family's most recent book (the volume being
  // printed). Best-effort — book_id is nullable.
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  const { data: order, error } = await supabase
    .from("book_orders")
    .insert({
      family_id: familyId,
      book_id: book?.id ?? null,
      status: "draft",
      shipping_address: parsed.data,
      amount_czk: 0,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !order) {
    return { ok: false, error: "Objednávku se nepodařilo vytvořit." };
  }

  // Hands off to Stripe (or skip if 0 CZK) - both branches redirect.
  await createPrintCheckout({
    familyId,
    bookOrderId: order.id,
    shippingAddress: parsed.data,
  });

  // createPrintCheckout always redirects, but TS needs a return.
  return { ok: false, error: "Neočekávaný stav." };
}

/**
 * Order N ADDITIONAL printed copies of the family's book (the Kniha-page
 * upsell — e.g. a copy for a sister). Mirrors placeBookOrder: validate the
 * shipping address, require the book to be order-ready, record a draft
 * book_orders row (copies = N), then hand off to the extra-copy checkout. The
 * price is recomputed server-side per copy — never trusted from the client.
 */
export async function placeExtraCopiesOrder(
  _prev: { ok: false; error: string } | null,
  formData: FormData,
): Promise<{ ok: false; error: string } | never> {
  const familyId = String(formData.get("familyId") ?? "");
  await requireOwnerOfFamily(familyId);

  // Quantity of ADDITIONAL copies. Clamp to the offered 1–5 range; the checkout
  // re-clamps too (defence in depth against a forged submit).
  const copiesRaw = Number(formData.get("copies") ?? 1);
  const copies = Number.isFinite(copiesRaw)
    ? Math.min(5, Math.max(1, Math.floor(copiesRaw)))
    : 1;

  const parsed = addressSchema.safeParse({
    fullName: formData.get("fullName"),
    street: formData.get("street"),
    city: formData.get("city"),
    zip: formData.get("zip"),
    country: formData.get("country") || "Česká republika",
    phone: formData.get("phone") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatná adresa." };
  }

  // Same readiness gate as the first order: the book must hold the minimum
  // published memories before any copy can be printed.
  const admin = createAdminClient();
  const { count: publishedCount } = await admin
    .from("memories")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId)
    .eq("status", "published");

  if ((publishedCount ?? 0) < ORDER_MIN_MEMORIES) {
    return {
      ok: false,
      error: `Knihu lze objednat až po dosažení ${ORDER_MIN_MEMORIES} vzpomínek.`,
    };
  }

  const supabase = await createClient();

  // Tie the extra copies to the family's most recent book (the printed volume).
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  const { data: order, error } = await supabase
    .from("book_orders")
    .insert({
      family_id: familyId,
      book_id: book?.id ?? null,
      status: "draft",
      copies,
      shipping_address: parsed.data,
      amount_czk: 0,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !order) {
    return { ok: false, error: "Objednávku se nepodařilo vytvořit." };
  }

  await createExtraCopiesCheckout({
    familyId,
    bookOrderId: order.id,
    copies,
    shippingAddress: parsed.data,
  });

  return { ok: false, error: "Neočekávaný stav." };
}

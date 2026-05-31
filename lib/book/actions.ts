"use server";

import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createPrintCheckout } from "@/lib/stripe/checkout";

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

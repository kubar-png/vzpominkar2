"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/permissions";

export type ProfileResult = { ok: true; message?: string } | { ok: false; error: string };

const displayNameSchema = z
  .string()
  .min(2, "Jméno je krátké.")
  .max(80, "Jméno je dlouhé.");

const passwordSchema = z
  .string()
  .min(10, "Heslo musí mít aspoň 10 znaků.")
  .max(128, "Heslo je dlouhé.");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Zadejte platnou e-mailovou adresu.");

export async function updateDisplayName(
  _prev: ProfileResult | null,
  formData: FormData,
): Promise<ProfileResult> {
  const user = await requireAuth();
  const parsed = displayNameSchema.safeParse(String(formData.get("displayName") ?? "").trim());
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatné jméno." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Změnu se nepodařilo uložit." };

  revalidatePath("/settings");
  return { ok: true, message: "Jméno uloženo." };
}

export async function updateOwnerPassword(
  _prev: ProfileResult | null,
  formData: FormData,
): Promise<ProfileResult> {
  await requireAuth();
  const parsed = passwordSchema.safeParse(String(formData.get("password") ?? ""));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatné heslo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false, error: "Heslo se nepodařilo změnit." };

  return { ok: true, message: "Nové heslo uloženo." };
}

export async function updateOwnerEmail(
  _prev: ProfileResult | null,
  formData: FormData,
): Promise<ProfileResult> {
  const user = await requireAuth();
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? ""));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatná adresa." };
  }
  if (parsed.data === user.email?.toLowerCase()) {
    return { ok: false, error: "Toto je vaše stávající adresa." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: parsed.data });
  if (error) return { ok: false, error: "Změnu e-mailu se nepodařilo zahájit." };

  // Supabase sends a confirmation link to the new address; profiles.email
  // is mirrored on the auth callback once the user confirms.
  return {
    ok: true,
    message: "Na novou adresu jsme poslali ověřovací odkaz. Klikněte na něj pro dokončení.",
  };
}

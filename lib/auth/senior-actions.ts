"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { SENIOR_ROLE_OPTIONS } from "@/lib/validations/auth";

const ROLE_VALUES: string[] = SENIOR_ROLE_OPTIONS.map((r) => r.value);

const updateSchema = z.object({
  displayName: z.string().min(1, "Zadejte jméno.").max(80),
  seniorRole: z.string().refine((v) => !v || ROLE_VALUES.includes(v), "Neplatná role.").optional().nullable(),
  contactChannel: z.enum(["email", "whatsapp"]).optional().nullable(),
  contactAddress: z.string().max(200).optional().nullable(),
  promptFrequency: z.union([z.literal(1), z.literal(2)]).default(1),
  isSenior: z.boolean().optional(),
});

const deliverySchema = z.object({
  contactChannel: z.enum(["email", "whatsapp"]).optional().nullable(),
  contactAddress: z.string().max(200).optional().nullable(),
  promptFrequency: z.union([z.literal(1), z.literal(2)]).default(1),
});

export type SeniorActionResult = { ok: true } | { ok: false; error: string };

export async function updateSeniorProfile(
  familyId: string,
  seniorId: string,
  formData: {
    displayName: string;
    seniorRole: string | null;
    contactChannel?: string | null;
    contactAddress?: string | null;
    promptFrequency?: number;
    isSenior?: boolean;
  },
): Promise<SeniorActionResult> {
  await requireOwnerOfFamily(familyId);

  const parsed = updateSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const admin = createAdminClient();

  const update: {
    display_name: string;
    senior_role: string | null;
    contact_channel: "email" | "whatsapp" | null;
    contact_address: string | null;
    prompt_frequency: number;
    is_senior?: boolean;
  } = {
    display_name: parsed.data.displayName,
    senior_role: parsed.data.seniorRole ?? null,
    contact_channel: parsed.data.contactChannel ?? null,
    contact_address: parsed.data.contactAddress?.trim() || null,
    prompt_frequency: parsed.data.promptFrequency,
  };
  if (typeof parsed.data.isSenior === "boolean") {
    update.is_senior = parsed.data.isSenior;
  }

  const { error } = await admin
    .from("profiles")
    .update(update)
    .eq("id", seniorId)
    .eq("family_id", familyId)
    .eq("role", "senior");

  if (error) return { ok: false, error: "Uložení se nepodařilo." };

  revalidatePath(`/family/${familyId}/rodina`);
  return { ok: true };
}

export async function updateDeliverySettings(
  familyId: string,
  seniorId: string,
  formData: { contactChannel?: string | null; contactAddress?: string | null; promptFrequency?: number },
): Promise<SeniorActionResult> {
  await requireOwnerOfFamily(familyId);

  const parsed = deliverySchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({
      contact_channel: parsed.data.contactChannel ?? null,
      contact_address: parsed.data.contactAddress?.trim() || null,
      prompt_frequency: parsed.data.promptFrequency,
    })
    .eq("id", seniorId)
    .eq("family_id", familyId)
    .eq("role", "senior");

  if (error) return { ok: false, error: "Uložení se nepodařilo." };

  revalidatePath("/settings/otazky");
  revalidatePath(`/family/${familyId}/rodina`);
  return { ok: true };
}

export async function deleteSeniorAccount(
  familyId: string,
  seniorId: string,
): Promise<SeniorActionResult> {
  await requireOwnerOfFamily(familyId);

  const admin = createAdminClient();

  // Verify the senior actually belongs to this family before deleting.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", seniorId)
    .eq("family_id", familyId)
    .eq("role", "senior")
    .maybeSingle<{ id: string }>();

  if (!profile) return { ok: false, error: "Senior nebyl nalezen." };

  // Deleting the auth user cascades to the profiles row.
  const { error } = await admin.auth.admin.deleteUser(seniorId);
  if (error) return { ok: false, error: "Smazání se nepodařilo." };

  revalidatePath(`/family/${familyId}/rodina`);
  return { ok: true };
}

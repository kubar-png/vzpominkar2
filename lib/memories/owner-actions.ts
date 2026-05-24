"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { invalidateFamilyStats } from "@/lib/family/stats";

export type OwnerMemoryResult = { ok: true } | { ok: false; error: string };

export async function updateMemoryText(
  familyId: string,
  memoryId: string,
  text: string,
): Promise<OwnerMemoryResult> {
  await requireOwnerOfFamily(familyId);

  const trimmed = text.trim();
  if (trimmed.length > 50_000) {
    return { ok: false, error: "Text je příliš dlouhý." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("memories")
    .update({ text_content: trimmed || null })
    .eq("id", memoryId)
    .eq("family_id", familyId);
  if (error) return { ok: false, error: "Změnu se nepodařilo uložit." };

  revalidatePath(`/family/${familyId}/memories/${memoryId}`);
  revalidatePath(`/family/${familyId}/memories`);
  revalidatePath("/dashboard");
  invalidateFamilyStats(familyId);
  return { ok: true };
}

export async function toggleMemoryFavorite(
  familyId: string,
  memoryId: string,
  next: boolean,
): Promise<OwnerMemoryResult> {
  await requireOwnerOfFamily(familyId);

  const admin = createAdminClient();
  const { error } = await admin
    .from("memories")
    .update({ is_favorite: next })
    .eq("id", memoryId)
    .eq("family_id", familyId);
  if (error) return { ok: false, error: "Změnu se nepodařilo uložit." };

  revalidatePath("/dashboard");
  revalidatePath(`/family/${familyId}/memories/${memoryId}`);
  return { ok: true };
}

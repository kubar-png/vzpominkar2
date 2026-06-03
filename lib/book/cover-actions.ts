"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COVER_BG,
  COVER_TEXT,
  isLegibleCover,
  type CoverBg,
  type CoverText,
} from "@/lib/book/cover";

const BG_VALUES = new Set<string>(COVER_BG.map((o) => o.value));
const TEXT_VALUES = new Set<string>(COVER_TEXT.map((o) => o.value));

export type CoverActionResult = { ok: true } | { ok: false; error: string };

/**
 * Persist the chosen cover (background + foil/ink) for a family's book(s).
 *
 * The dashboard preview is family-scoped (it composes the whole family into a
 * single book), so the cover applies to every volume in the family. `books` is
 * RLS-locked to owners; we go through the service-role client after an explicit
 * ownership check — mirrors lib/auth/senior-actions.ts.
 */
export async function updateBookCover(
  familyId: string,
  cover: { bg: CoverBg; text: CoverText },
): Promise<CoverActionResult> {
  await requireOwnerOfFamily(familyId);

  // Validate against the shared option sets + legibility guard so an illegal
  // combo can never reach the DB check constraint.
  if (!BG_VALUES.has(cover.bg) || !TEXT_VALUES.has(cover.text)) {
    return { ok: false, error: "Neplatná barva přebalu." };
  }
  if (!isLegibleCover(cover.bg, cover.text)) {
    return { ok: false, error: "Tato kombinace barev je nečitelná." };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("books")
    .update({ cover_bg: cover.bg, cover_text: cover.text })
    .eq("family_id", familyId);

  if (error) return { ok: false, error: "Uložení se nepodařilo." };

  revalidatePath(`/family/${familyId}/book/preview`);
  return { ok: true };
}

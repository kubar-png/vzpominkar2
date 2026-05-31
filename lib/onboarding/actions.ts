"use server";

import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/auth/permissions";
import { onboardingStartSchema } from "@/lib/validations/onboarding";
import { REFERRAL_VALUES } from "./referral";

export type ActionState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

/**
 * Step 1 of onboarding (family + senior name + prompt picks).
 *
 * Atomic-ish: family creation, profile.family_id update, and initial prompt
 * scheduling all happen via the admin client. RLS would block the owner from
 * creating a family that doesn't yet reference them (chicken/egg with
 * profiles.family_id), so we bypass it here and rely on the requireOwner gate.
 *
 * Hard paywall — the family is created with the default 'trial' status (no
 * access). The owner pays on /predplatne before the app shell unlocks; there
 * is no free year.
 */
export async function startOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const owner = await requireOwner();

  // If the owner already finished step 1 (has a family), bounce them forward.
  if (owner.familyId) {
    redirect("/onboarding/credentials");
  }

  const parsed = onboardingStartSchema.safeParse({
    familyName: formData.get("familyName"),
    seniorDisplayName: formData.get("seniorDisplayName"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const admin = createAdminClient();

  // 1) Create the family. No subscription grant — it starts as 'trial' (the
  // column default = no access) and the owner must pay on /predplatne.
  const { data: family, error: famErr } = await admin
    .from("families")
    .insert({
      name: parsed.data.familyName.trim(),
      senior_display_name: parsed.data.seniorDisplayName.trim(),
      created_by: owner.id,
    })
    .select("id")
    .single();

  if (famErr || !family) {
    return { ok: false, error: "Rodinu se nepodařilo založit. Zkuste to znovu." };
  }

  // 2) Link owner profile to the new family
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ family_id: family.id })
    .eq("id", owner.id);

  if (profileErr) {
    return { ok: false, error: "Profil se nepodařilo propojit s rodinou." };
  }

  // 2b) Create the first book (Díl 1) — unpaid. It's the paid unit and the
  // 52-prompt collection target; the owner pays for it on /predplatne.
  const { data: book, error: bookErr } = await admin
    .from("books")
    .insert({
      family_id: family.id,
      senior_display_name: parsed.data.seniorDisplayName.trim(),
      sequence_no: 1,
      title: "Díl 1",
    })
    .select("id")
    .single<{ id: string }>();

  if (bookErr || !book) {
    return { ok: false, error: "Knihu se nepodařilo připravit." };
  }

  // 3) Audit log. Questions are no longer picked during onboarding — the owner
  // schedules them later from the in-app Otázky section, once they've had a
  // chance to look around.
  await admin.from("activity_log").insert({
    family_id: family.id,
    actor_id: owner.id,
    action: "onboarding.started",
    metadata: {},
  });

  revalidatePath("/onboarding", "layout");
  redirect("/onboarding/credentials");
}

/**
 * Save the owner's acquisition attribution ("How did you hear about us?"),
 * asked once right after the first purchase. Form action → redirects to the
 * dashboard. Unknown/empty source is treated as a skip (no write).
 */
export async function saveReferralSource(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const source = String(formData.get("source") ?? "");
  if (owner.familyId && REFERRAL_VALUES.includes(source)) {
    const admin = createAdminClient();
    await admin
      .from("families")
      .update({ referral_source: source })
      .eq("id", owner.familyId);
  }
  redirect("/dashboard");
}

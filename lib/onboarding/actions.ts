"use server";

import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/auth/permissions";
import { onboardingStartSchema } from "@/lib/validations/onboarding";

export type ActionState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

const TRIAL_DAYS = 365;

/**
 * Step 1 of onboarding (family + senior name + prompt picks).
 *
 * Atomic-ish: family creation, profile.family_id update, trial activation,
 * and initial prompt scheduling all happen via the admin client. RLS would
 * block the owner from creating a family that doesn't yet reference them
 * (chicken/egg with profiles.family_id), so we bypass it here and rely on
 * the requireOwner gate above.
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

  const promptIds = formData.getAll("promptIds").map(String);

  const parsed = onboardingStartSchema.safeParse({
    familyName: formData.get("familyName"),
    seniorDisplayName: formData.get("seniorDisplayName"),
    promptIds,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatné údaje." };
  }

  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  // 1) Create the family
  const { data: family, error: famErr } = await admin
    .from("families")
    .insert({
      name: parsed.data.familyName.trim(),
      senior_display_name: parsed.data.seniorDisplayName.trim(),
      created_by: owner.id,
      subscription_status: "active",
      subscription_expires_at: expiresAt.toISOString(),
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

  // 3) Schedule initial prompt_assignments - one per week starting next Monday.
  const startMonday = nextMonday(new Date());
  const assignments = parsed.data.promptIds.map((promptId, i) => ({
    family_id: family.id,
    prompt_id: promptId,
    scheduled_for: addDays(startMonday, i * 7).toISOString().slice(0, 10),
  }));

  if (assignments.length > 0) {
    const { error: assignErr } = await admin.from("prompt_assignments").insert(assignments);
    if (assignErr) {
      return { ok: false, error: "Otázky se nepodařilo naplánovat." };
    }
  }

  // 4) Audit log
  // Do not put PII or secrets in metadata — visible to every family member via RLS.
  await admin.from("activity_log").insert({
    family_id: family.id,
    actor_id: owner.id,
    action: "onboarding.started",
    metadata: { promptCount: assignments.length },
  });

  revalidatePath("/onboarding", "layout");
  redirect("/onboarding/credentials");
}

function nextMonday(d: Date): Date {
  const out = new Date(d);
  const day = out.getUTCDay(); // 0 = Sun
  const offset = day === 1 ? 7 : (8 - day) % 7;
  out.setUTCDate(out.getUTCDate() + offset);
  out.setUTCHours(10, 0, 0, 0); // Aligned with Vercel Cron Mon 10:00 in M9
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

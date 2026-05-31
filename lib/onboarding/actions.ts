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

  // 3) Schedule initial prompt_assignments - one per week starting next Monday.
  //
  // Only system prompts (family_id IS NULL) may be scheduled here: the family
  // was just created so it owns no custom prompts yet. Filtering the
  // client-posted ids against the active system library stops a caller from
  // smuggling an arbitrary prompt UUID into their own family.
  let validPromptIds = parsed.data.promptIds;
  if (validPromptIds.length > 0) {
    const { data: allowed } = await admin
      .from("prompts")
      .select("id")
      .is("family_id", null)
      .eq("is_active", true)
      .in("id", validPromptIds)
      .returns<{ id: string }[]>();
    const allowedIds = new Set((allowed ?? []).map((p) => p.id));
    validPromptIds = validPromptIds.filter((id) => allowedIds.has(id));
  }

  // Cap the initial schedule at the book's 52-prompt limit.
  const startMonday = nextMonday(new Date());
  const assignments = validPromptIds.slice(0, 52).map((promptId, i) => ({
    family_id: family.id,
    book_id: book.id,
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

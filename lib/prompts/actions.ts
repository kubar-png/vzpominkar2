"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { currentBookForSenior } from "@/lib/books/server";
import { nextMondayUtc, addDays } from "@/lib/prompts/schedule";

export type PromptResult = { ok: true } | { ok: false; error: string };

const customPromptSchema = z.object({
  familyId: z.string().uuid(),
  question: z.string().min(8, "Otázka je krátká.").max(280, "Otázka je dlouhá."),
  category: z.string().min(1).max(40).optional().nullable(),
});

/**
 * Schedule a library prompt at the next available Monday slot for each selected senior.
 * Each senior gets their own slot computed from their last assignment.
 */
export async function scheduleNextMonday(
  familyId: string,
  promptId: string,
  seniorIds: string[],
): Promise<PromptResult> {
  if (seniorIds.length === 0) return { ok: false, error: "Vyberte alespoň jednoho blízkého." };
  await requireOwnerOfFamily(familyId);
  const supabase = createAdminClient();

  const rows = await Promise.all(
    seniorIds.map(async (seniorId) => {
      const { data: existing } = await supabase
        .from("prompt_assignments")
        .select("scheduled_for")
        .eq("family_id", familyId)
        .eq("senior_id", seniorId)
        .order("scheduled_for", { ascending: false })
        .limit(1)
        .returns<{ scheduled_for: string }[]>();

      const today = new Date();
      let nextDate = nextMondayUtc(today);
      const last = existing?.[0]?.scheduled_for;
      if (last) {
        const lastD = new Date(last + "T10:00:00Z");
        const candidate = addDays(lastD, 7);
        if (candidate.getTime() > nextDate.getTime()) nextDate = candidate;
      }
      return {
        family_id: familyId,
        prompt_id: promptId,
        senior_id: seniorId,
        book_id: (await currentBookForSenior(supabase, familyId, seniorId))?.id ?? null,
        scheduled_for: nextDate.toISOString().slice(0, 10),
      };
    }),
  );

  const { error } = await supabase.from("prompt_assignments").insert(rows);
  if (error) return { ok: false, error: "Nepodařilo se naplánovat." };

  revalidatePath(`/family/${familyId}/prompts`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeAssignment(
  familyId: string,
  assignmentId: string,
): Promise<PromptResult> {
  await requireOwnerOfFamily(familyId);
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("prompt_assignments")
    .select("id, answered_memory_id, family_id")
    .eq("id", assignmentId)
    .maybeSingle<{ id: string; answered_memory_id: string | null; family_id: string }>();

  if (!row || row.family_id !== familyId) {
    return { ok: false, error: "Tento záznam nelze odebrat." };
  }
  if (row.answered_memory_id) {
    return {
      ok: false,
      error: "Na tuto otázku už byla nahrána vzpomínka - odebrat ji nelze.",
    };
  }

  const { error } = await supabase
    .from("prompt_assignments")
    .delete()
    .eq("id", assignmentId);
  if (error) return { ok: false, error: "Smazání selhalo." };

  revalidatePath(`/family/${familyId}/prompts`);
  return { ok: true };
}

/** Schedule a prompt for today for each selected senior. */
export async function scheduleToday(
  familyId: string,
  promptId: string,
  seniorIds: string[],
): Promise<PromptResult> {
  if (seniorIds.length === 0) return { ok: false, error: "Vyberte alespoň jednoho blízkého." };
  await requireOwnerOfFamily(familyId);
  const supabase = createAdminClient();

  const scheduledFor = new Date().toISOString().slice(0, 10);
  const rows = await Promise.all(
    seniorIds.map(async (seniorId) => ({
      family_id: familyId,
      prompt_id: promptId,
      senior_id: seniorId,
      book_id: (await currentBookForSenior(supabase, familyId, seniorId))?.id ?? null,
      scheduled_for: scheduledFor,
    })),
  );

  const { error } = await supabase.from("prompt_assignments").insert(rows);
  if (error) return { ok: false, error: "Nepodařilo se naplánovat." };

  revalidatePath(`/family/${familyId}/prompts`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Create a custom prompt and immediately schedule it for each selected senior. */
export async function addCustomPromptAndSchedule(
  familyId: string,
  question: string,
  scheduleType: "queue" | "now",
  seniorIds: string[],
): Promise<PromptResult> {
  if (seniorIds.length === 0) return { ok: false, error: "Vyberte alespoň jednoho blízkého." };
  await requireOwnerOfFamily(familyId);

  const parsed = customPromptSchema.safeParse({
    familyId,
    question: question.trim(),
    category: "vlastni",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neplatná otázka." };
  }

  const admin = createAdminClient();

  const { data: prompt, error: insertErr } = await admin
    .from("prompts")
    .insert({
      family_id: parsed.data.familyId,
      question: parsed.data.question,
      category: "vlastni",
      is_active: true,
    })
    .select("id")
    .single();
  if (insertErr || !prompt) return { ok: false, error: "Otázku se nepodařilo uložit." };

  type AssignmentRow = {
    family_id: string;
    prompt_id: string;
    senior_id: string;
    book_id: string | null;
    scheduled_for: string;
  };

  let rows: AssignmentRow[];

  if (scheduleType === "now") {
    const scheduledFor = new Date().toISOString().slice(0, 10);
    rows = await Promise.all(
      seniorIds.map(async (seniorId) => ({
        family_id: familyId,
        prompt_id: prompt.id,
        senior_id: seniorId,
        book_id: (await currentBookForSenior(admin, familyId, seniorId))?.id ?? null,
        scheduled_for: scheduledFor,
      })),
    );
  } else {
    rows = await Promise.all(
      seniorIds.map(async (seniorId) => {
        const { data: existing } = await admin
          .from("prompt_assignments")
          .select("scheduled_for")
          .eq("family_id", familyId)
          .eq("senior_id", seniorId)
          .order("scheduled_for", { ascending: false })
          .limit(1)
          .returns<{ scheduled_for: string }[]>();

        const today = new Date();
        let nextDate = nextMondayUtc(today);
        const last = existing?.[0]?.scheduled_for;
        if (last) {
          const lastD = new Date(last + "T10:00:00Z");
          const candidate = addDays(lastD, 7);
          if (candidate.getTime() > nextDate.getTime()) nextDate = candidate;
        }
        return {
          family_id: familyId,
          prompt_id: prompt.id,
          senior_id: seniorId,
          book_id: (await currentBookForSenior(admin, familyId, seniorId))?.id ?? null,
          scheduled_for: nextDate.toISOString().slice(0, 10),
        };
      }),
    );
  }

  const { error: schedErr } = await admin.from("prompt_assignments").insert(rows);
  if (schedErr) return { ok: false, error: "Nepodařilo se naplánovat." };

  revalidatePath(`/family/${familyId}/prompts`);
  revalidatePath("/dashboard");
  return { ok: true };
}

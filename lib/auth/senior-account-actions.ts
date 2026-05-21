"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSeniorEmail } from "@/lib/auth/senior-auth";

/**
 * Reset the senior's password to a freshly generated short string. The owner
 * sees the new password once and is told to write it down or print it.
 */
export async function resetSeniorPassword(
  familyId: string,
  seniorId: string,
): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  const owner = await requireOwner();
  if (owner.familyId !== familyId) {
    return { ok: false, error: "Tato rodina vám nepatří." };
  }

  const admin = createAdminClient();
  const { data: senior } = await admin
    .from("profiles")
    .select("id")
    .eq("family_id", familyId)
    .eq("role", "senior")
    .eq("id", seniorId)
    .maybeSingle<{ id: string }>();

  if (!senior) return { ok: false, error: "Účet blízkého neexistuje." };

  const password = generateMemorablePassword();

  // Also fix the synthetic email so it matches profile.id - corrects accounts
  // created before the pinnedUuid fix where email used a different seed UUID.
  const { error } = await admin.auth.admin.updateUserById(senior.id, {
    password,
    email: buildSeniorEmail(senior.id),
  });
  if (error) return { ok: false, error: "Heslo se nepodařilo nastavit." };

  await admin.from("activity_log").insert({
    family_id: familyId,
    actor_id: owner.id,
    action: "senior.password_reset",
    metadata: null,
  });

  revalidatePath(`/family/${familyId}/senior`);
  return { ok: true, password };
}

/**
 * Senior-friendly password: 3 short Czech-rooted ASCII syllables + 2 digits.
 * Example: "lipa-mira-hrasek-42". 18-22 chars total. ~60 bits of entropy is
 * enough for a low-stakes account that's typed once and then auto-filled.
 */
function generateMemorablePassword(): string {
  const w1 = sample(W1);
  const w2 = sample(W2);
  const w3 = sample(W3);
  const num = String(10 + Math.floor(Math.random() * 90));
  return `${w1}-${w2}-${w3}-${num}`;
}

function sample<T>(arr: T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx]!;
}

const W1 = [
  "lipa", "vrba", "buk", "habr", "modrin", "borovice", "dub", "javor",
];
const W2 = [
  "leto", "podzim", "zima", "jaro", "rano", "vecer", "noc", "den",
];
const W3 = [
  "mlyn", "kapraz", "studna", "potok", "rybnik", "bodlak", "konvalinka", "kost",
];

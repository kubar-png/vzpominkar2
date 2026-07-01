import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentUser } from "@/lib/auth/permissions";
import { SITE_URL } from "@/lib/site";
import { loadLibrary } from "@/lib/prompts/schedule";
import { scheduleToday } from "@/lib/prompts/actions";

/**
 * State machine for the private tester run (/testovani). The page walks a tester
 * (an owner account) through: sign up → add a blízký (senior) → send a question →
 * let the senior answer via the magic link → leave feedback. getTesterProgress
 * reports where they are; sendTestQuestionsNow pushes questions to TODAY so the
 * senior can answer immediately instead of waiting for the Monday cron.
 */

/** Coarse step the tester is on — drives which panel the /testovani page shows. */
export type TesterStep =
  | "login" // not signed in (or not an owner)
  | "create_senior" // signed in, no blízký yet
  | "send_question" // blízký exists, nothing scheduled yet
  | "await_answer" // question(s) sent, none answered yet
  | "feedback"; // at least one answer captured — ready to give feedback

export interface TesterProgress {
  loggedIn: boolean;
  hasSenior: boolean;
  seniorId: string | null;
  seniorName: string | null;
  /** Senior's no-password answering link, or null if we can't build one. */
  magicLink: string | null;
  /** How many questions the family's blízký has been sent. */
  questionsSent: number;
  /** How many answers (memories) the blízký has recorded. */
  answersCount: number;
  nextStep: TesterStep;
}

/** Look up the (single, first) blízký/senior for an owner's family. */
async function findSenior(
  admin: ReturnType<typeof createAdminClient>,
  familyId: string,
): Promise<{ id: string; display_name: string | null; magic_token: string | null } | null> {
  const { data } = await admin
    .from("profiles")
    .select("id, display_name, magic_token")
    .eq("family_id", familyId)
    .eq("role", "senior")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string; display_name: string | null; magic_token: string | null }>();
  return data ?? null;
}

function magicLinkFor(token: string | null): string | null {
  return token ? `${SITE_URL}/q/${token}` : null;
}

/**
 * Snapshot of how far the current owner/tester has progressed. Safe to call from
 * a Server Component. Returns the "not logged in" shape for anonymous visitors or
 * senior accounts (only owners drive the tester flow).
 */
export async function getTesterProgress(): Promise<TesterProgress> {
  const user = await currentUser();

  if (!user || user.role !== "owner" || !user.familyId) {
    return {
      loggedIn: Boolean(user),
      hasSenior: false,
      seniorId: null,
      seniorName: null,
      magicLink: null,
      questionsSent: 0,
      answersCount: 0,
      nextStep: "login",
    };
  }

  const admin = createAdminClient();
  const senior = await findSenior(admin, user.familyId);

  if (!senior) {
    return {
      loggedIn: true,
      hasSenior: false,
      seniorId: null,
      seniorName: null,
      magicLink: null,
      questionsSent: 0,
      answersCount: 0,
      nextStep: "create_senior",
    };
  }

  const [{ count: sentCount }, { count: answerCount }] = await Promise.all([
    admin
      .from("prompt_assignments")
      .select("id", { count: "exact", head: true })
      .eq("family_id", user.familyId)
      .eq("senior_id", senior.id),
    admin
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("family_id", user.familyId)
      .eq("author_id", senior.id),
  ]);

  const questionsSent = sentCount ?? 0;
  const answersCount = answerCount ?? 0;

  let nextStep: TesterStep;
  if (answersCount > 0) nextStep = "feedback";
  else if (questionsSent > 0) nextStep = "await_answer";
  else nextStep = "send_question";

  return {
    loggedIn: true,
    hasSenior: true,
    seniorId: senior.id,
    seniorName: senior.display_name,
    magicLink: magicLinkFor(senior.magic_token),
    questionsSent,
    answersCount,
    nextStep,
  };
}

export interface SendTestQuestionsResult {
  ok: boolean;
  error?: string;
  magicLink: string | null;
  /** How many new questions were actually scheduled for today. */
  scheduled: number;
}

/**
 * Schedule up to `count` unanswered library questions for TODAY for the current
 * owner's blízký, so the tester can immediately click through the senior's magic
 * link and answer — no waiting for the weekly Monday cron. Reuses scheduleToday
 * so all existing prompt/scheduling semantics (book attribution, revalidation)
 * stay intact. Picks the next library questions the senior hasn't been assigned
 * yet; a no-op (scheduled:0) once the library is exhausted for them.
 */
export async function sendTestQuestionsNow(count = 2): Promise<SendTestQuestionsResult> {
  "use server";

  const user = await currentUser();
  if (!user || user.role !== "owner" || !user.familyId) {
    return { ok: false, error: "Nejste přihlášeni jako pořizovatel.", magicLink: null, scheduled: 0 };
  }

  const admin = createAdminClient();
  const senior = await findSenior(admin, user.familyId);
  if (!senior) {
    return { ok: false, error: "Nejdřív přidejte blízkého.", magicLink: null, scheduled: 0 };
  }

  const magicLink = magicLinkFor(senior.magic_token);

  // Library questions this senior has already been assigned — skip them so we
  // always hand out fresh ones.
  const { data: assigned } = await admin
    .from("prompt_assignments")
    .select("prompt_id")
    .eq("family_id", user.familyId)
    .eq("senior_id", senior.id)
    .returns<{ prompt_id: string }[]>();
  const used = new Set((assigned ?? []).map((r) => r.prompt_id));

  const library = await loadLibrary(admin);
  const wanted = Math.max(1, Math.min(count, 10));
  const picks: string[] = [];
  for (const p of library) {
    if (picks.length >= wanted) break;
    if (!used.has(p.id)) picks.push(p.id);
  }

  if (picks.length === 0) {
    return { ok: true, magicLink, scheduled: 0 };
  }

  let scheduled = 0;
  for (const promptId of picks) {
    const res = await scheduleToday(user.familyId, promptId, [senior.id]);
    if (res.ok) scheduled += 1;
  }

  if (scheduled === 0) {
    return { ok: false, error: "Otázky se nepodařilo naplánovat.", magicLink, scheduled: 0 };
  }

  return { ok: true, magicLink, scheduled };
}

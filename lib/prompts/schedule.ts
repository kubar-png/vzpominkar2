import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { currentBookForSenior } from "@/lib/books/server";

type Admin = ReturnType<typeof createAdminClient>;

/** Monday 10:00 UTC strictly AFTER `d` — never returns the same day. */
export function nextMondayUtc(d: Date): Date {
  const out = new Date(d);
  const day = out.getUTCDay();
  const offset = day === 1 ? 7 : (8 - day) % 7;
  out.setUTCDate(out.getUTCDate() + offset);
  out.setUTCHours(10, 0, 0, 0);
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

/** Life-phase order so the auto-picked questions tell a coherent arc. */
const PHASE_ORDER = ["detstvi", "skola", "mladi", "laska", "rodina", "prace", "zajmy", "moudro"];
function phaseRank(category: string | null): number {
  const i = PHASE_ORDER.indexOf(category ?? "");
  return i === -1 ? PHASE_ORDER.length : i;
}

type LibPrompt = { id: string; category: string | null; order_index: number };

/** Load the system question library (family_id IS NULL), sorted by life phase. */
export async function loadLibrary(admin: Admin): Promise<LibPrompt[]> {
  const { data } = await admin
    .from("prompts")
    .select("id, category, order_index")
    .is("family_id", null)
    .eq("is_active", true)
    .returns<LibPrompt[]>();
  const list = data ?? [];
  list.sort(
    (a, b) =>
      phaseRank(a.category) - phaseRank(b.category) ||
      a.order_index - b.order_index ||
      a.id.localeCompare(b.id),
  );
  return list;
}

/** First library prompt not yet used for this senior (null = library exhausted). */
export function nextUnusedPromptId(library: LibPrompt[], usedPromptIds: Set<string>): string | null {
  for (const p of library) if (!usedPromptIds.has(p.id)) return p.id;
  return null;
}

/**
 * Weekly auto-planner. For every "started" senior (the owner already scheduled
 * ≥1 question, so the family is engaged) who has NO unanswered question pending
 * and still has a collecting paid book, enqueue the next unused library question
 * for TODAY — the cron's run day is the send day, so the same reminder run
 * delivers it. Keeps exactly one question in flight: a senior who's slow to
 * answer gets reminders, not a growing pile. Stops at a full/unpaid book or an
 * exhausted library.
 *
 * Idempotent: the "no pending" guard means a re-run on the same day won't double
 * up (the freshly inserted row is itself an unanswered pending question).
 */
export async function planWeeklyQueue(admin: Admin): Promise<{ planned: number; skipped: number }> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: rows } = await admin
    .from("prompt_assignments")
    .select("senior_id, family_id, prompt_id, answered_memory_id")
    .not("senior_id", "is", null)
    .returns<
      { senior_id: string; family_id: string; prompt_id: string; answered_memory_id: string | null }[]
    >();

  const started = new Map<string, string>(); // senior_id → family_id (owner has scheduled ≥1)
  const pending = new Set<string>(); // senior_id with an unanswered assignment
  const used = new Map<string, Set<string>>(); // senior_id → used prompt_ids
  for (const r of rows ?? []) {
    started.set(r.senior_id, r.family_id);
    if (!r.answered_memory_id) pending.add(r.senior_id);
    let set = used.get(r.senior_id);
    if (!set) {
      set = new Set();
      used.set(r.senior_id, set);
    }
    set.add(r.prompt_id);
  }

  const library = await loadLibrary(admin);
  let planned = 0;
  let skipped = 0;
  const inserts: {
    family_id: string;
    prompt_id: string;
    senior_id: string;
    book_id: string | null;
    scheduled_for: string;
  }[] = [];

  for (const [seniorId, familyId] of started) {
    if (pending.has(seniorId)) {
      skipped++; // still has an open question — remind, don't pile up
      continue;
    }
    const book = await currentBookForSenior(admin, familyId, seniorId);
    if (!book) {
      skipped++; // no paid collecting book (unpaid, or full → needs another díl)
      continue;
    }
    const promptId = nextUnusedPromptId(library, used.get(seniorId) ?? new Set());
    if (!promptId) {
      skipped++; // library exhausted for this senior
      continue;
    }
    inserts.push({
      family_id: familyId,
      prompt_id: promptId,
      senior_id: seniorId,
      book_id: book.id,
      scheduled_for: today,
    });
    planned++;
  }

  if (inserts.length) {
    const { error } = await admin.from("prompt_assignments").insert(inserts);
    if (error) {
      console.error("[planner] insert failed", error);
      return { planned: 0, skipped };
    }
  }
  return { planned, skipped };
}

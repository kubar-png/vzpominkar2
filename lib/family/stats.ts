import "server-only";
import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Family-level statistics surfaced in the right-side stats card.
 *
 * Two-tier caching:
 *   1. unstable_cache (Next data cache) — tagged "family-stats:<id>",
 *      survives across requests until a mutation calls invalidateFamilyStats.
 *      A cold first nav still hits the DB; subsequent navs read from cache.
 *   2. cache() (React per-request) — dedupes within a single render so
 *      StatsSidebarAsync + BookProgressBarAsync only resolve once.
 */

/** Tag used to invalidate a single family's stats cache. */
export function familyStatsTag(familyId: string): string {
  return `family-stats:${familyId}`;
}

/** Call after any write that changes a family's stats (memory published,
 * deleted, transcript updated, audio duration filled in, year extracted). */
export function invalidateFamilyStats(familyId: string | null | undefined): void {
  if (!familyId) return;
  revalidateTag(familyStatsTag(familyId));
}

export interface FamilyStats {
  memoryCount: number;
  audioSecondsTotal: number;
  wordsTotal: number;
  approxBookPages: number;
  weeksSinceStart: number;
  weekStreak: number;
  yearSpan: { min: number; max: number; span: number } | null;
  oldestStoryLabel: string | null;
  startedAt: string | null;
}

const EMPTY: FamilyStats = {
  memoryCount: 0,
  audioSecondsTotal: 0,
  wordsTotal: 0,
  approxBookPages: 0,
  weeksSinceStart: 0,
  weekStreak: 0,
  yearSpan: null,
  oldestStoryLabel: null,
  startedAt: null,
};

const WORDS_PER_BOOK_PAGE = 280;
const AUDIO_WORDS_PER_MINUTE = 145; // average Czech storytelling pace

async function computeFamilyStats(familyId: string): Promise<FamilyStats> {
  const admin = createAdminClient();

  const [{ data: family }, { data: memories }] = await Promise.all([
    admin
      .from("families")
      .select("created_at")
      .eq("id", familyId)
      .maybeSingle<{ created_at: string }>(),
    admin
      .from("memories")
      .select(
        "id, text_content, audio_transcript, audio_duration_seconds, created_at, extracted_year, extracted_year_label, extracted_year_confidence",
      )
      .eq("family_id", familyId)
      .eq("status", "published")
      .returns<{
        id: string;
        text_content: string | null;
        audio_transcript: string | null;
        audio_duration_seconds: number | null;
        created_at: string;
        extracted_year: number | null;
        extracted_year_label: string | null;
        extracted_year_confidence: string | null;
      }[]>(),
  ]);

  if (!memories || memories.length === 0) {
    return {
      ...EMPTY,
      startedAt: family?.created_at ?? null,
      weeksSinceStart: family?.created_at ? weeksBetween(new Date(family.created_at), new Date()) : 0,
    };
  }

  // Audio total
  const audioSecondsTotal = memories.reduce(
    (acc, m) => acc + (m.audio_duration_seconds ?? 0),
    0,
  );

  // Word count: text content first, fall back to transcript; for audio with
  // no transcript yet, approximate from duration (145 wpm).
  let wordsTotal = 0;
  for (const m of memories) {
    const body = (m.text_content ?? m.audio_transcript ?? "").trim();
    if (body.length > 0) {
      wordsTotal += countWords(body);
    } else if (m.audio_duration_seconds) {
      wordsTotal += Math.round((m.audio_duration_seconds / 60) * AUDIO_WORDS_PER_MINUTE);
    }
  }

  const approxBookPages = Math.max(1, Math.round(wordsTotal / WORDS_PER_BOOK_PAGE));

  // Year span — only consider memories with high or medium confidence so
  // a hallucinated "1958" from a low-confidence extraction doesn't skew
  // the visible range.
  const reliableYears = memories
    .map((m) =>
      m.extracted_year_confidence === "high" || m.extracted_year_confidence === "medium"
        ? m.extracted_year
        : null,
    )
    .filter((y): y is number => typeof y === "number");

  let yearSpan: FamilyStats["yearSpan"] = null;
  let oldestStoryLabel: string | null = null;
  if (reliableYears.length > 0) {
    const min = Math.min(...reliableYears);
    const max = Math.max(...reliableYears);
    yearSpan = { min, max, span: max - min + 1 };
    const oldest = memories
      .filter((m) => m.extracted_year === min)
      .find((m) => m.extracted_year_label != null);
    oldestStoryLabel = oldest?.extracted_year_label ?? null;
  }

  // Weeks since family started
  const startedAt = family?.created_at ?? memories[memories.length - 1]?.created_at ?? null;
  const weeksSinceStart = startedAt ? weeksBetween(new Date(startedAt), new Date()) : 0;

  // Streak: consecutive weeks (ending this week or last) that have ≥1 memory
  const weekStreak = computeWeekStreak(memories.map((m) => m.created_at));

  return {
    memoryCount: memories.length,
    audioSecondsTotal,
    wordsTotal,
    approxBookPages,
    weeksSinceStart,
    weekStreak,
    yearSpan,
    oldestStoryLabel,
    startedAt,
  };
}

export const getFamilyStats = cache(async (familyId: string | null): Promise<FamilyStats> => {
  if (!familyId) return EMPTY;
  // Tagged data cache: served across requests until invalidateFamilyStats
  // is called from a mutation. weeksSinceStart drifts by ≤1 day during a
  // 24h window, which is acceptable for a stats card; revalidate window
  // ensures it self-heals even without a write event.
  const cached = unstable_cache(
    () => computeFamilyStats(familyId),
    ["family-stats", familyId],
    { tags: [familyStatsTag(familyId)], revalidate: 60 * 60 * 6 },
  );
  return cached();
});

function countWords(s: string): number {
  return s.split(/\s+/).filter((w) => w.length > 0).length;
}

function weeksBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.max(1, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
}

function isoWeekKey(d: Date): string {
  // ISO week key (e.g. "2026-W18"). Two memories in the same ISO week count
  // as one streak step.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function computeWeekStreak(timestamps: string[]): number {
  const weeks = new Set(timestamps.map((t) => isoWeekKey(new Date(t))));
  let streak = 0;
  const cursor = new Date();
  // Allow the streak to "start" either this week or last week (gives the
  // owner all of Monday morning to record before "losing" their streak).
  let allowGap = true;
  for (let i = 0; i < 520; i++) {
    const key = isoWeekKey(cursor);
    if (weeks.has(key)) {
      streak++;
      allowGap = false;
    } else if (allowGap) {
      allowGap = false; // consume the grace week
    } else {
      break;
    }
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return streak;
}

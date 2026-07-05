"use server";

import { sendTestQuestionsNow, type SendTestQuestionsResult } from "@/lib/testing/state";

/**
 * Tester Hub action — schedule the next couple of library questions for TODAY for
 * the signed-in tester's blízký, so the senior can answer immediately via their
 * magic link (no waiting for the Monday cron). A thin server-action wrapper so the
 * client Hub can drive the server-only tester state machine (lib/testing/state.ts).
 */
export async function sendTesterQuestions(): Promise<SendTestQuestionsResult> {
  return sendTestQuestionsNow(2);
}

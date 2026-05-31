import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { weeklyReminderEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Constant-time equality so a brute-force can't extract the secret byte-by-byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Weekly reminder cron - scheduled in vercel.json for Mondays 10:00 (Europe/Prague).
 * Sends one email per family for the prompt scheduled in the current week
 * that hasn't been answered yet AND hasn't been reminded yet.
 *
 * Idempotent: setting prompt_assignments.reminded_at means the row won't
 * be picked up again in the next run.
 */
export async function GET(req: NextRequest) {
  // Vercel Cron sends "Authorization: Bearer ${CRON_SECRET}". Constant-time
  // compare to avoid leaking the secret via timing differences.
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected || !safeEqual(auth, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const isoWeekEnd = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Pull due, unanswered, un-reminded assignments for the current week.
  const { data: rows, error } = await admin
    .from("prompt_assignments")
    .select("id, family_id, scheduled_for, prompts(question), families(senior_display_name), books(status)")
    .lte("scheduled_for", isoWeekEnd)
    .gte("scheduled_for", isoToday)
    .is("answered_memory_id", null)
    .is("reminded_at", null)
    .returns<
      {
        id: string;
        family_id: string;
        scheduled_for: string;
        prompts: { question: string } | null;
        families: { senior_display_name: string | null } | null;
        books: { status: string } | null;
      }[]
    >();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vzpominkar.cz";
  let sent = 0;
  let skipped = 0;

  for (const row of rows ?? []) {
    if (!row.prompts) {
      skipped++;
      continue;
    }

    // Don't remind for prompts in a full/printed book (past the 52 cap) — only
    // the current collecting volume is processed. Null book = legacy, allow.
    if (row.books && row.books.status !== "collecting") {
      skipped++;
      continue;
    }

    // Senior + owner profiles - fetch in tandem.
    const [{ data: senior }, { data: owner }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, email, display_name, contact_channel, contact_address")
        .eq("family_id", row.family_id)
        .eq("role", "senior")
        .maybeSingle<{
          id: string;
          email: string | null;
          display_name: string | null;
          contact_channel: string | null;
          contact_address: string | null;
        }>(),
      admin
        .from("profiles")
        .select("id, email, display_name")
        .eq("family_id", row.family_id)
        .eq("role", "owner")
        .maybeSingle<{ id: string; email: string | null; display_name: string | null }>(),
    ]);

    // Delivery priority:
    // 1. contact_address when channel is email (owner-configured real address)
    // 2. senior.email if it's a real inbox (not the synthetic @vzpominkar.internal)
    // 3. Fall back to owner-only notification
    const seniorEmail =
      (senior?.contact_channel === "email" && senior?.contact_address)
        ? senior.contact_address
        : (senior?.email && !senior.email.endsWith("@vzpominkar.internal") ? senior.email : null);
    const ownerEmail = owner?.email ?? null;

    const seniorName =
      senior?.display_name ?? row.families?.senior_display_name ?? "Vzpomínkář";

    const tpl = weeklyReminderEmail({
      seniorDisplayName: seniorName,
      question: row.prompts.question,
      appUrl,
    });

    if (seniorEmail) {
      await sendEmail({
        to: seniorEmail,
        bcc: ownerEmail ? [ownerEmail] : undefined,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tag: "weekly_reminder",
      });
    } else if (ownerEmail) {
      // No senior email - still notify the owner so they can prompt verbally.
      await sendEmail({
        to: ownerEmail,
        subject: `Připomínka pro ${seniorName}`,
        html: tpl.html,
        text: tpl.text,
        tag: "weekly_reminder_owner_fallback",
      });
    } else {
      skipped++;
      continue;
    }

    await admin
      .from("prompt_assignments")
      .update({ reminded_at: new Date().toISOString() })
      .eq("id", row.id);

    sent++;
  }

  return NextResponse.json({ ok: true, sent, skipped, total: rows?.length ?? 0 });
}

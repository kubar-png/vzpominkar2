import { NextResponse, type NextRequest } from "next/server";
import { verifyCronAuth } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { planWeeklyQueue } from "@/lib/prompts/schedule";
import { sendEmail } from "@/lib/email/send";
import { weeklyReminderEmail, bookFullEmail } from "@/lib/email/templates";
import { resolveGender } from "@/lib/gender";
import { SITE_URL } from "@/lib/site";
import { priceForProductCzk } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Weekly batch can touch many families — take the full Vercel ceiling.
export const maxDuration = 300;

/**
 * Weekly reminder cron - scheduled in vercel.json for Mondays 10:00 (Europe/Prague).
 * Sends one email per family for the prompt scheduled in the current week
 * that hasn't been answered yet AND hasn't been reminded yet.
 *
 * Idempotent: setting prompt_assignments.reminded_at means the row won't
 * be picked up again in the next run.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // ── Auto-plan pass (runs BEFORE the send pass) ──────────────────────────────
  // Top up each active senior's queue with the next library question (scheduled
  // for today = the send day), so the same run delivers it. Keeps the weekly
  // loop self-sustaining once the owner has scheduled the first question. A
  // failure here must never block the reminder pass below.
  let planned = 0;
  try {
    const res = await planWeeklyQueue(admin);
    planned = res.planned;
  } catch (err) {
    console.error("[weekly-reminder] auto-plan pass failed", err);
  }

  const today = new Date();
  const isoWeekEnd = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Pull due, unanswered, un-reminded assignments through the end of this week.
  // No lower bound on scheduled_for: a question that slipped past its date with
  // no answer still deserves a nudge (it was previously skipped — a silent
  // drop-off). `reminded_at` guarantees we only nudge each one once.
  const { data: rows, error } = await admin
    .from("prompt_assignments")
    .select("id, family_id, scheduled_for, prompts(question), families(senior_display_name), books(status)")
    .lte("scheduled_for", isoWeekEnd)
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

  // Batch-fetch every senior + owner profile for the due families in ONE
  // query (was 2 queries PER ROW → N+1 that melts at 10k families). Group
  // by family_id so the loop is pure in-memory lookups.
  type Prof = {
    family_id: string;
    role: string;
    email: string | null;
    display_name: string | null;
    contact_channel: string | null;
    contact_address: string | null;
    gender: string | null;
    magic_token: string | null;
  };
  const familyIds = [...new Set((rows ?? []).map((r) => r.family_id))];
  const seniorByFamily = new Map<string, Prof>();
  const ownerByFamily = new Map<string, Prof>();
  if (familyIds.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("family_id, role, email, display_name, contact_channel, contact_address, gender, magic_token")
      .in("family_id", familyIds)
      .in("role", ["senior", "owner"])
      .returns<Prof[]>();
    for (const p of profs ?? []) {
      (p.role === "senior" ? seniorByFamily : ownerByFamily).set(p.family_id, p);
    }
  }

  const appUrl = SITE_URL;
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

    // Profiles already loaded in the single batch query above.
    const senior = seniorByFamily.get(row.family_id) ?? null;
    const owner = ownerByFamily.get(row.family_id) ?? null;

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

    const question = resolveGender(
      row.prompts.question,
      (senior?.gender as "male" | "female" | null) ?? null,
    );

    if (seniorEmail) {
      // Magic link: one click signs the senior in (no password) and lands them
      // on this week's question. Falls back to /senior-login if the token is
      // somehow missing. Goes ONLY to the senior's own inbox.
      const actionUrl = senior?.magic_token
        ? `${appUrl}/q/${senior.magic_token}`
        : `${appUrl}/senior-login`;
      const tpl = weeklyReminderEmail({ seniorDisplayName: seniorName, question, appUrl, actionUrl });
      await sendEmail({
        to: seniorEmail,
        bcc: ownerEmail ? [ownerEmail] : undefined,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tag: "weekly_reminder",
      });
    } else if (ownerEmail) {
      // No senior email — notify the owner so they can prompt verbally. The owner
      // copy must NOT carry the senior's personal magic link, so it points at the
      // generic /senior-login instead.
      const tpl = weeklyReminderEmail({ seniorDisplayName: seniorName, question, appUrl });
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

  // ---------------------------------------------------------------------------
  // Milestone: a book just reached 52/52 → invite the owner to order the next
  // díl. Best-effort and idempotent: we never send twice for the same book, and
  // a failure here must not affect the reminder result above.
  //
  // refreshBookFullness() (called when a memory is answered) flips a book to
  // 'full' once it hits its prompt_cap, so "full" books are exactly the ones
  // that hit the milestone. The activity_log 'book.full_notified' marker is the
  // correctness boundary — we look full books up against it and only email +
  // mark the ones not yet notified. The 30-day updated_at window just keeps the
  // weekly scan bounded; the marker prevents any duplicate even outside it.
  // ---------------------------------------------------------------------------
  let milestoneSent = 0;
  try {
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: fullBooks } = await admin
      .from("books")
      .select("id, family_id, senior_id, sequence_no, senior_display_name")
      .eq("status", "full")
      .eq("paid", true)
      .gte("updated_at", thirtyDaysAgo)
      .returns<
        {
          id: string;
          family_id: string;
          senior_id: string | null;
          sequence_no: number;
          senior_display_name: string | null;
        }[]
      >();

    for (const book of fullBooks ?? []) {
      // Idempotency guard — skip if we've already notified for this book.
      const { count: alreadyNotified } = await admin
        .from("activity_log")
        .select("id", { count: "exact", head: true })
        .eq("family_id", book.family_id)
        .eq("action", "book.full_notified")
        .contains("metadata", { bookId: book.id });
      if ((alreadyNotified ?? 0) > 0) continue;

      // Owner inbox for this family.
      const { data: ownerProf } = await admin
        .from("profiles")
        .select("email, display_name")
        .eq("family_id", book.family_id)
        .eq("role", "owner")
        .limit(1)
        .maybeSingle<{ email: string | null; display_name: string | null }>();

      const ownerEmail = ownerProf?.email ?? null;
      if (!ownerEmail) continue;

      // Senior display name: prefer the book's snapshot, fall back to the
      // senior profile, then a gentle default.
      let seniorName = book.senior_display_name ?? null;
      if (!seniorName && book.senior_id) {
        const { data: seniorProf } = await admin
          .from("profiles")
          .select("display_name")
          .eq("id", book.senior_id)
          .maybeSingle<{ display_name: string | null }>();
        seniorName = seniorProf?.display_name ?? null;
      }

      const tpl = bookFullEmail({
        ownerDisplayName: ownerProf?.display_name ?? "",
        seniorDisplayName: seniorName ?? "váš blízký",
        volumeNo: book.sequence_no,
        // Server-priced — never trust a client. The next díl is a book_addon SKU.
        nextVolumeCzk: priceForProductCzk("book_addon"),
        appUrl,
        familyId: book.family_id,
      });

      const res = await sendEmail({
        to: ownerEmail,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tag: "book_full_milestone",
      });

      // Only stamp the idempotency marker once delivery was accepted, so a
      // transient send failure is retried next week instead of silently lost.
      if (res) {
        await admin.from("activity_log").insert({
          family_id: book.family_id,
          actor_id: null,
          action: "book.full_notified",
          metadata: { bookId: book.id },
        });
        milestoneSent++;
      }
    }
  } catch (err) {
    // A milestone failure must never fail the weekly reminder cron.
    console.error("[weekly-reminder] milestone pass failed", err);
  }

  return NextResponse.json({
    ok: true,
    planned,
    sent,
    skipped,
    milestoneSent,
    total: rows?.length ?? 0,
  });
}

import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { SeniorCard } from "./senior-card";
import { AddSeniorPanel } from "./add-senior-panel";

export const metadata: Metadata = { title: "Rodina" };

export default async function RodinaPage({
  params,
  searchParams,
}: {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ add?: string }>;
}) {
  const { familyId } = await params;
  const { add } = await searchParams;
  await requireOwnerOfFamily(familyId);

  const admin = createAdminClient();

  const { data: seniors } = await admin
    .from("profiles")
    .select("id, display_name, username, senior_role, gender, contact_channel, contact_address, prompt_frequency, is_senior, created_at")
    .eq("family_id", familyId)
    .eq("role", "senior")
    .order("created_at")
    .returns<{ id: string; display_name: string | null; username: string | null; senior_role: string | null; gender: string | null; contact_channel: string | null; contact_address: string | null; prompt_frequency: number; is_senior: boolean; created_at: string }[]>();

  const seniorList = seniors ?? [];

  // Per-senior memory counts via head-count queries (no row transfer). Seniors
  // per family is tiny, so this is a couple of cheap COUNT queries.
  const countById = new Map<string, number>();
  await Promise.all(
    seniorList.map(async (s) => {
      const { count } = await admin
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("author_id", s.id)
        .eq("family_id", familyId);
      countById.set(s.id, count ?? 0);
    }),
  );

  // Per-senior book status drives the activate / next-volume CTA. Fetch the
  // family's paid books + answered counts, then resolve each senior's current
  // volume. The base book may have a null senior_id (created at onboarding
  // before the senior profile existed) — attribute it to the first senior.
  const { data: books } = await admin
    .from("books")
    .select("id, senior_id, sequence_no, status, prompt_cap")
    .eq("family_id", familyId)
    .eq("paid", true)
    .order("sequence_no", { ascending: false })
    .returns<
      { id: string; senior_id: string | null; sequence_no: number; status: string; prompt_cap: number }[]
    >();
  const paidBooks = books ?? [];

  const answeredByBook = new Map<string, number>();
  if (paidBooks.length) {
    const { data: answered } = await admin
      .from("prompt_assignments")
      .select("book_id")
      .in("book_id", paidBooks.map((b) => b.id))
      .not("answered_memory_id", "is", null)
      .returns<{ book_id: string }[]>();
    for (const a of answered ?? []) {
      answeredByBook.set(a.book_id, (answeredByBook.get(a.book_id) ?? 0) + 1);
    }
  }

  const firstSeniorId = seniorList[0]?.id ?? null;
  function bookStatusFor(seniorId: string): {
    kind: "none" | "collecting" | "finished";
    answered: number;
    cap: number;
    sequenceNo: number;
  } {
    const owned = paidBooks.filter(
      (b) => b.senior_id === seniorId || (b.senior_id === null && seniorId === firstSeniorId),
    );
    if (owned.length === 0) return { kind: "none", answered: 0, cap: 52, sequenceNo: 0 };
    const collecting = owned.find((b) => b.status === "collecting");
    const book = collecting ?? owned[0]!;
    return {
      kind: collecting ? "collecting" : "finished",
      answered: answeredByBook.get(book.id) ?? 0,
      cap: book.prompt_cap,
      sequenceNo: book.sequence_no,
    };
  }

  return (
    <div className="space-y-8">
      <AppPageHeader
        title="Rodina"
        description="Vaši blízcí a jak jim otázky doručujeme."
      />

      {seniorList.length === 0 ? (
        <EmptyState
          icon={<UserPlus size={18} aria-hidden />}
          title="Zatím žádný blízký"
          description="Přidejte prvního blízkého níže — poté mu pošlete úvodní otázku."
        />
      ) : (
        <div className="space-y-3">
          {seniorList.map((senior) => (
            <SeniorCard
              key={senior.id}
              familyId={familyId}
              senior={{
                id: senior.id,
                display_name: senior.display_name,
                username: senior.username,
                senior_role: senior.senior_role,
                gender: senior.gender,
                contact_channel: senior.contact_channel,
                contact_address: senior.contact_address,
                prompt_frequency: senior.prompt_frequency,
                is_senior: senior.is_senior ?? true,
                memoryCount: countById.get(senior.id) ?? 0,
                book: bookStatusFor(senior.id),
              }}
              manageHref={`/family/${familyId}/senior?seniorId=${senior.id}`}
            />
          ))}
        </div>
      )}

      <AddSeniorPanel familyId={familyId} autoOpen={add === "1"} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOwnerOfFamily } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchSignUrls } from "@/lib/family/server";
import { BookPreviewClient } from "./book-preview-client";

export const metadata: Metadata = { title: "Náhled knihy" };

type Spread = {
  id: string;
  title: string | null;
  text: string | null;
  question: string | null;
  authorName: string | null;
  authorRole: string | null;
  date: string;
  imageUrls: string[];
  audioTranscript: string | null;
};

export default async function BookPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { familyId } = await params;
  const sp = await searchParams;
  const sort: "chronological" | "favorites" = sp.sort === "favorites" ? "favorites" : "chronological";
  await requireOwnerOfFamily(familyId);

  const admin = createAdminClient();

  let memoriesQuery = admin
    .from("memories")
    .select(
      `id, title, text_content, audio_transcript, audio_path, status, is_favorite, created_at, memory_date,
       prompts(question),
       profiles!memories_author_id_fkey(display_name, senior_role)`,
    )
    .eq("family_id", familyId)
    .eq("status", "published");

  if (sort === "favorites") {
    memoriesQuery = memoriesQuery
      .order("is_favorite", { ascending: false })
      .order("memory_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
  } else {
    memoriesQuery = memoriesQuery
      .order("memory_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
  }

  const [{ data: family }, { data: rawMemories }] = await Promise.all([
    admin
      .from("families")
      .select("display_name, senior_display_name")
      .eq("id", familyId)
      .maybeSingle<{ display_name: string | null; senior_display_name: string | null }>(),
    memoriesQuery.returns<
        {
          id: string;
          title: string | null;
          text_content: string | null;
          audio_transcript: string | null;
          audio_path: string | null;
          status: string;
          is_favorite: boolean;
          created_at: string;
          memory_date: string | null;
          prompts: { question: string } | null;
          profiles: { display_name: string | null; senior_role: string | null } | null;
        }[]
      >(),
  ]);


  const list = rawMemories ?? [];
  const ids = list.map((m) => m.id);

  const { data: rawAttachments } = ids.length
    ? await admin
        .from("memory_attachments")
        .select("memory_id, storage_path, mime_type")
        .in("memory_id", ids)
        .returns<{ memory_id: string; storage_path: string; mime_type: string }[]>()
    : { data: [] };

  const attachPaths = (rawAttachments ?? [])
    .filter((a) => a.mime_type.startsWith("image/"))
    .map((a) => a.storage_path);
  const signed = await batchSignUrls("memory-attachments", attachPaths);

  const imagesByMemory = new Map<string, string[]>();
  for (const a of rawAttachments ?? []) {
    if (!a.mime_type.startsWith("image/")) continue;
    const url = signed.get(a.storage_path);
    if (!url) continue;
    const arr = imagesByMemory.get(a.memory_id) ?? [];
    arr.push(url);
    imagesByMemory.set(a.memory_id, arr);
  }

  const spreads: Spread[] = list.map((m) => ({
    id: m.id,
    title: m.title,
    text: m.text_content || m.audio_transcript,
    question: m.prompts?.question ?? null,
    authorName: m.profiles?.display_name ?? null,
    authorRole: m.profiles?.senior_role ?? null,
    date: formatDate(m.memory_date ?? m.created_at),
    imageUrls: imagesByMemory.get(m.id) ?? [],
    audioTranscript: m.audio_transcript,
  }));

  const familyName = family?.display_name ?? family?.senior_display_name ?? "Vzpomínky";

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Toolbar - hidden when printing */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={`/family/${familyId}/book`}
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-navy-700)]"
        >
          <ArrowLeft size={14} aria-hidden />
          Zpět na knihu
        </Link>
        <div className="flex items-center gap-3">
          {/* Sort toggle */}
          <div
            role="tablist"
            aria-label="Pořadí kapitol"
            className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-paper-50)] p-0.5 text-xs"
          >
            <Link
              href={`/family/${familyId}/book/preview`}
              role="tab"
              aria-selected={sort === "chronological"}
              className={`rounded-full px-3 py-1 transition-colors ${
                sort === "chronological"
                  ? "bg-[var(--color-navy-900)] text-[var(--color-paper-50)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-navy-700)]"
              }`}
            >
              Chronologicky
            </Link>
            <Link
              href={`/family/${familyId}/book/preview?sort=favorites`}
              role="tab"
              aria-selected={sort === "favorites"}
              className={`rounded-full px-3 py-1 transition-colors ${
                sort === "favorites"
                  ? "bg-[var(--color-navy-900)] text-[var(--color-paper-50)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-navy-700)]"
              }`}
            >
              Oblíbené první
            </Link>
          </div>
          <BookPreviewClient />
        </div>
      </div>

      {/* Print-friendly book pages - paper background, serif body */}
      <div className="mx-auto max-w-[var(--book-width,720px)] space-y-12 rounded-[var(--radius-xl)] bg-[var(--color-paper-50)] p-8 shadow-[var(--shadow-md)] print:p-0 print:shadow-none print:max-w-none print:bg-white">
        {/* Title page */}
        <section className="page-break-after flex min-h-[60vh] flex-col items-center justify-center gap-6 border-b border-[var(--color-paper-300)] pb-12 text-center print:min-h-screen print:border-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-[var(--color-gold-600)]">
            Vzpomínky
          </p>
          <div aria-hidden className="h-px w-16 bg-[var(--color-gold-400)]" />
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.05] tracking-tight text-[var(--color-navy-900)] md:text-6xl">
            {familyName}
          </h1>
          <p className="text-sm tabular-nums text-[var(--color-text-muted)]">
            {spreads.length} vzpomínek · {new Date().toLocaleDateString("cs-CZ", { month: "long", year: "numeric" })}
          </p>
        </section>

        {/* Memory pages */}
        {spreads.length === 0 ? (
          <p className="py-12 text-center text-[var(--color-text-muted)]">
            Zatím není co zobrazit. Až bude alespoň jedna vzpomínka, objeví se tady.
          </p>
        ) : (
          spreads.map((s, i) => (
            <article
              key={s.id}
              className="page-break-inside space-y-5 border-t border-[var(--color-paper-300)] pt-8 first:border-0 first:pt-0"
            >
              <header className="space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-[family-name:var(--font-display)] text-xs font-medium text-[var(--color-gold-600)]">
                    {romanNumeral(i + 1)}.
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
                    {s.date}
                  </p>
                </div>
                {s.question ? (
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium leading-[1.2] text-[var(--color-navy-900)] md:text-3xl">
                    &bdquo;{s.question}&ldquo;
                  </h2>
                ) : null}
                {s.title && s.title !== s.question ? (
                  <p className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--color-text-muted)]">
                    {s.title}
                  </p>
                ) : null}
              </header>

              {s.imageUrls.length > 0 && (
                <div className={s.imageUrls.length === 1 ? "" : "grid grid-cols-2 gap-3"}>
                  {s.imageUrls.slice(0, 4).map((url, j) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={j}
                      src={url}
                      alt=""
                      className="w-full rounded-[var(--radius-md)] object-cover shadow-[var(--shadow-sm)]"
                    />
                  ))}
                </div>
              )}

              {s.text ? (
                <p className="font-[family-name:var(--font-display)] whitespace-pre-line text-[1.0625rem] leading-[1.7] text-[var(--color-ink-900)]">
                  {s.text}
                </p>
              ) : null}

              <footer className="flex items-baseline justify-end gap-3 pt-2">
                <span aria-hidden className="h-px w-8 bg-[var(--color-gold-400)]" />
                <p className="font-[family-name:var(--font-display)] text-[var(--color-navy-700)]">
                  — {s.authorName ?? "Blízký"}
                  {s.authorRole ? `, ${s.authorRole}` : ""}
                </p>
              </footer>
            </article>
          ))
        )}
      </div>

      {/* Print rules */}
      <style>{`
        @media print {
          @page { margin: 18mm 16mm; }
          .page-break-after { page-break-after: always; }
          .page-break-inside { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function romanNumeral(n: number): string {
  const roman: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of roman) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

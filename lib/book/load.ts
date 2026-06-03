import "server-only";
import QRCode from "qrcode";
import type { BookDocumentProps, BookEntry, BookSection } from "@/components/book-pdf/BookDocument";
import { createAdminClient } from "@/lib/supabase/admin";
import { batchSignUrls } from "@/lib/family/server";
import { genderFromSeniorRole, type Gender } from "@/lib/gender";
import { SITE_URL } from "@/lib/site";
import { buildSampleBook } from "@/lib/book/sample";

/**
 * Resolve a print job's `id` into the props BookDocument needs.
 *
 *   - "sample" → the shared dev-preview content (testable before order-wiring).
 *   - a bookId → real data via the service-role client (the print page runs
 *     WITHOUT an auth cookie; the HMAC token already authorized the request).
 *
 * Real books are assembled from the family's published `memories` linked to the
 * book (`book_id`), grouped into chapters by the originating prompt's category.
 * Each answered entry gets a per-memory QR (→ /v/{public_token}) so a reader can
 * scan it to hear the original recording. Returns null if the book is unknown.
 */
export async function loadPrintBook(id: string): Promise<BookDocumentProps | null> {
  if (id === "sample") return buildSampleBook();
  return loadRealBook(id);
}

// Human chapter titles for the prompt categories used in the live library
// (supabase/seed.sql). Unknown categories fall back to a title-cased key.
const CATEGORY_TITLES: Record<string, string> = {
  detstvi: "Dětství",
  skola: "Školní léta",
  mladi: "Mladí",
  dospivani: "Dospívání",
  laska: "Láska",
  rodina: "Rodina",
  prace: "Kariéra",
  kariera: "Kariéra",
  zajmy: "Zájmy",
  "zraly-vek": "Zralý věk",
};

// Stable chapter order independent of when memories were created.
const CATEGORY_ORDER = [
  "detstvi",
  "skola",
  "mladi",
  "dospivani",
  "laska",
  "rodina",
  "prace",
  "kariera",
  "zajmy",
  "zraly-vek",
];

function chapterTitle(category: string | null): string {
  if (!category) return "Vzpomínky";
  return CATEGORY_TITLES[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

type MemoryRow = {
  id: string;
  text_content: string | null;
  audio_transcript: string | null;
  audio_transcript_polished: string | null;
  public_token: string | null;
  created_at: string;
  prompts: { question: string | null; category: string | null; order_index: number | null } | null;
};

async function loadRealBook(bookId: string): Promise<BookDocumentProps | null> {
  const admin = createAdminClient();

  const { data: book } = await admin
    .from("books")
    .select("id, title, family_id, senior_id, senior_display_name")
    .eq("id", bookId)
    .maybeSingle<{
      id: string;
      title: string | null;
      family_id: string;
      senior_id: string | null;
      senior_display_name: string | null;
    }>();

  if (!book) return null;

  // Recipient gender → resolves "{masc|fem}" tokens in question text.
  let gender: Gender | null = null;
  if (book.senior_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("gender, senior_role")
      .eq("id", book.senior_id)
      .maybeSingle<{ gender: string | null; senior_role: string | null }>();
    gender =
      profile?.gender === "male" || profile?.gender === "female"
        ? profile.gender
        : genderFromSeniorRole(profile?.senior_role);
  }

  const { data: rawMemories } = await admin
    .from("memories")
    .select(
      `id, text_content, audio_transcript, audio_transcript_polished, public_token, created_at,
       prompts(question, category, order_index)`,
    )
    .eq("book_id", bookId)
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .returns<MemoryRow[]>();

  const memories = rawMemories ?? [];

  // Sign every attachment image in one round-trip per bucket.
  const memoryIds = memories.map((m) => m.id);
  const { data: rawAttachments } = memoryIds.length
    ? await admin
        .from("memory_attachments")
        .select("memory_id, storage_path, mime_type")
        .in("memory_id", memoryIds)
        .returns<{ memory_id: string; storage_path: string; mime_type: string }[]>()
    : { data: [] as { memory_id: string; storage_path: string; mime_type: string }[] };

  const attachments = (rawAttachments ?? []).filter((a) => a.mime_type.startsWith("image/"));
  const signed = await batchSignUrls(
    "memory-attachments",
    attachments.map((a) => a.storage_path),
  );
  const imagesByMemory = new Map<string, string[]>();
  for (const a of attachments) {
    const url = signed.get(a.storage_path);
    if (!url) continue;
    const list = imagesByMemory.get(a.memory_id) ?? [];
    list.push(url);
    imagesByMemory.set(a.memory_id, list);
  }

  // Group memories into chapters by prompt category.
  const byCategory = new Map<string, { order: number; entries: { sort: number; entry: BookEntry }[] }>();
  for (const m of memories) {
    const category = m.prompts?.category ?? "ostatni";
    const question = m.prompts?.question ?? "Vzpomínka";
    const answer =
      m.audio_transcript_polished?.trim() ||
      m.audio_transcript?.trim() ||
      m.text_content?.trim() ||
      undefined;

    const qr = m.public_token
      ? await QRCode.toDataURL(`${SITE_URL}/v/${m.public_token}`, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 320,
        })
      : undefined;

    const entry: BookEntry = {
      question,
      answer,
      images: imagesByMemory.get(m.id),
      qr,
    };

    const bucket = byCategory.get(category) ?? {
      order: CATEGORY_ORDER.indexOf(category),
      entries: [],
    };
    bucket.entries.push({ sort: m.prompts?.order_index ?? Number.MAX_SAFE_INTEGER, entry });
    byCategory.set(category, bucket);
  }

  const sections: BookSection[] = [...byCategory.entries()]
    .sort((a, b) => {
      const oa = a[1].order === -1 ? Number.MAX_SAFE_INTEGER : a[1].order;
      const ob = b[1].order === -1 ? Number.MAX_SAFE_INTEGER : b[1].order;
      return oa - ob;
    })
    .map(([category, bucket]) => ({
      title: chapterTitle(category),
      entries: bucket.entries.sort((a, b) => a.sort - b.sort).map((e) => e.entry),
    }));

  return {
    title: book.title ?? "Kniha vzpomínek",
    dedication: book.senior_display_name ? `Pro ${book.senior_display_name}` : undefined,
    mode: "filled",
    sections,
    gender: gender ?? undefined,
  };
}

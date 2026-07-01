"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Pencil } from "lucide-react";
import { toast } from "sonner";
import { SENIOR_ROLE_OPTIONS } from "@/lib/validations/auth";
import { toggleMemoryFavorite, updateMemoryText } from "@/lib/memories/owner-actions";
import { TranscriptEditor } from "@/components/memories/TranscriptEditor";
import { WaveformPlayer } from "@/components/audio/WaveformPlayer";
import type { MemoryDetailData } from "./page";
import { resolveGender, genderFromSeniorRole } from "@/lib/gender";

// ── helpers ──────────────────────────────────────────────────────────────────

function roleLabel(role: string | null) {
  if (!role) return null;
  return SENIOR_ROLE_OPTIONS.find((r) => r.value === role)?.label ?? null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


// ── Photo / Video Gallery ─────────────────────────────────────────────────────

function MediaGallery({
  attachments,
}: {
  attachments: MemoryDetailData["attachments"];
}) {
  const images = attachments.filter((a) => a.mime_type.startsWith("image/"));
  const videos = attachments.filter((a) => a.mime_type.startsWith("video/"));

  if (images.length === 0 && videos.length === 0) return null;

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div
          className={[
            "grid gap-3",
            images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3",
          ].join(" ")}
        >
          {images.map((img, i) => (
            <a key={img.storage_path} href={img.signedUrl} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.signedUrl}
                alt={img.caption ?? `Fotografie ${i + 1}`}
                className="w-full rounded-[var(--radius-lg)] object-cover"
                style={{ aspectRatio: images.length === 1 ? "4/3" : "1/1" }}
              />
              {img.caption && (
                <p className="mt-1.5 text-center text-xs text-[var(--color-text-subtle)]">
                  {img.caption}
                </p>
              )}
            </a>
          ))}
        </div>
      )}

      {videos.map((v) => (
        <video
          key={v.storage_path}
          src={v.signedUrl}
          controls
          className="w-full rounded-[var(--radius-lg)]"
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
//
// Reading layout per DESIGN.md: narrow 720px column centered on the cream
// page, single Pangaia H1, meta row above title, single action row inline
// (favorite + share + edit + kebab). No corner ornaments, no dropcaps, no
// decorative gold dividers — those belong on the marketing surface and on
// the print preview page.

export function MemoryDetail({ memory: m }: { memory: MemoryDetailData }) {
  const [expanded, setExpanded] = useState(false);
  const [favorite, setFavorite] = useState(m.is_favorite);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(m.text_content ?? "");
  const [text, setText] = useState(m.text_content);
  const [editError, setEditError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const textLong = (text?.length ?? 0) > 600;
  const label = roleLabel(m.authorRole);
  // Gender for the {masc|fem} tokens in the question. profiles.gender isn't
  // loaded on this surface, so derive it from the family-relationship label
  // (senior_role); "jine"/unknown → null keeps the slash fallback.
  const authorGender = genderFromSeniorRole(m.authorRole);
  const memoryDate = m.memory_date ? formatDate(m.memory_date) : null;
  const recordedDate = formatDate(m.created_at);

  function onToggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleMemoryFavorite(m.familyId, m.id, next);
      if (result.ok === false) setFavorite(!next);
    });
  }

  function onSaveEdit() {
    setEditError(null);
    startTransition(async () => {
      const result = await updateMemoryText(m.familyId, m.id, draftText);
      if (result.ok) {
        setText(draftText.trim() || null);
        setEditing(false);
        toast.success("Vzpomínka uložena");
      } else {
        setEditError(result.error);
      }
    });
  }

  const titleText =
    m.title ??
    (memoryDate ? `Vzpomínka z ${memoryDate}` : "Vzpomínka");

  return (
    <article className="mx-auto max-w-[720px]">
      {/* Breadcrumb */}
      <div className="pb-6">
        <Link
          href={`/family/${m.familyId}/memories`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-navy-700)]"
        >
          <ArrowLeft size={14} aria-hidden />
          Vzpomínky
        </Link>
      </div>

      {/* Action row — single horizontal strip above the title */}
      <div className="flex items-center justify-end gap-1 pb-4">
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={favorite ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
          aria-pressed={favorite}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-paper-100)] hover:text-[var(--color-navy-900)]"
        >
          <Heart
            size={15}
            className={favorite ? "text-[var(--color-red-600)]" : ""}
            fill={favorite ? "currentColor" : "none"}
            aria-hidden
          />
          <span className="hidden sm:inline">{favorite ? "Oblíbené" : "Přidat do oblíbených"}</span>
        </button>
        {!editing && text ? (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setDraftText(text);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-paper-100)] hover:text-[var(--color-navy-900)]"
          >
            <Pencil size={14} aria-hidden />
            <span className="hidden sm:inline">Upravit text</span>
          </button>
        ) : null}
      </div>

      {/* Meta row */}
      <p className="text-[13px] tabular-nums text-[var(--color-text-muted)]">
        {recordedDate}
        {m.authorName ? (
          <>
            {" · "}
            <span className="text-[var(--color-text)]">{m.authorName}</span>
            {label ? (
              <span className="text-[var(--color-text-subtle)]">, {label}</span>
            ) : null}
          </>
        ) : null}
      </p>

      {/* Title — Pangaia 32-38px per DESIGN.md page-title */}
      <h1
        className={[
          "mt-2 font-[family-name:var(--font-display)] font-medium",
          "leading-[1.1] tracking-[-0.02em]",
          m.title
            ? "text-[var(--color-navy-900)]"
            : "text-[var(--color-text-muted)]",
          "text-[clamp(1.75rem,3.5vw,2.375rem)]",
        ].join(" ")}
      >
        {titleText}
      </h1>

      {memoryDate ? (
        <p className="mt-1.5 text-[13px] text-[var(--color-text-subtle)]">
          Období: <span className="text-[var(--color-text-muted)]">{memoryDate}</span>
        </p>
      ) : m.extracted_year ? (
        <p
          className="mt-1.5 text-[13px] text-[var(--color-text-subtle)]"
          title={
            m.extracted_year_confidence === "high"
              ? "Období jsme vytáhli z vyprávění."
              : "Přibližný odhad období z vyprávění."
          }
        >
          Období:{" "}
          <span className="text-[var(--color-text-muted)]">
            {m.extracted_year_confidence === "high" ? "" : "~"}
            {m.extracted_year}
          </span>
        </p>
      ) : null}

      {/* Question quote — small, calm, not gold */}
      {m.question ? (
        <blockquote className="mt-8 border-l-2 border-[var(--color-border-strong)] pl-4 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
          &bdquo;{m.question ? resolveGender(m.question, authorGender) : ""}&ldquo;
        </blockquote>
      ) : null}

      {/* Audio player */}
      {m.audioUrl ? (
        <div className="mt-10 space-y-3">
          <WaveformPlayer
            src={m.audioUrl}
            duration={m.audio_duration_seconds}
            memoryId={m.id}
            downloadName={`vzpominka-${m.id.slice(0, 8)}.m4a`}
          />
          {m.audio_transcript ? (
            <TranscriptEditor
              memoryId={m.id}
              rawTranscript={m.audio_transcript}
              polishedTranscript={m.audio_transcript_polished}
            />
          ) : null}
        </div>
      ) : null}

      {/* Public QR share — scan to play this memory anywhere, no login */}
      {m.publicUrl ? (
        <div className="mt-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-paper-50)] p-6">
          <p className="text-sm font-semibold text-[var(--color-navy-900)]">Veřejné přehrání (QR do knihy)</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            Tento QR i odkaz přehrají nahrávku komukoliv, kdo je načte — bez přihlášení. Stejný kód bude v tištěné knize.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {m.qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.qrDataUrl}
                alt="QR kód vzpomínky"
                width={116}
                height={116}
                className="rounded-md border border-[var(--color-border)] bg-white p-1"
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-2">
              <a
                href={m.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-mono text-xs text-[var(--color-navy-700)] underline-offset-2 hover:underline"
              >
                {m.publicUrl}
              </a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(m.publicUrl!);
                  toast.success("Odkaz zkopírován");
                }}
                className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-navy-700)] hover:bg-[var(--color-paper-100)]"
              >
                Kopírovat odkaz
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Text content (editable) */}
      <div className="mt-10">
        {editing ? (
          <div className="space-y-4">
            <textarea
              autoFocus
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-4 py-3 text-[15px] leading-relaxed text-[var(--color-text)] focus:border-[var(--color-navy-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              style={{ minHeight: 240 }}
              placeholder="Napište text vzpomínky…"
            />
            {editError ? (
              <p role="alert" className="text-sm text-[var(--color-red-700)]">
                {editError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraftText(text ?? "");
                  setEditError(null);
                }}
                className="inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-paper-100)]"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 text-sm font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Uložit úpravy
                <span aria-hidden>↗</span>
              </button>
            </div>
          </div>
        ) : text ? (
          <>
            <div
              className={[
                "leading-[1.7] text-[var(--color-text)]",
                !expanded && textLong ? "line-clamp-[10]" : "",
              ].filter(Boolean).join(" ")}
              style={{ fontSize: "1.0625rem", whiteSpace: "pre-line", maxWidth: "65ch" }}
            >
              {text}
            </div>
            {textLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 text-sm font-medium text-[var(--color-navy-700)] underline-offset-2 hover:underline"
              >
                {expanded ? "Méně" : "Číst celý text"}
              </button>
            )}
          </>
        ) : !m.audioUrl ? (
          /* No text and no audio - offer to add */
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setDraftText("");
            }}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-4 py-3 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-navy-400)] hover:text-[var(--color-navy-700)]"
          >
            <Pencil size={14} aria-hidden />
            Přidat text k vzpomínce
          </button>
        ) : null}
      </div>

      {/* Media */}
      {m.attachments.length > 0 ? (
        <div className="mt-10">
          <MediaGallery attachments={m.attachments} />
        </div>
      ) : null}
    </article>
  );
}

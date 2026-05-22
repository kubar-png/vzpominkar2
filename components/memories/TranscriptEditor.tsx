"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  aiPolishMemoryTranscript,
  revertTranscript,
  saveEditedTranscript,
  type TranscriptActionState,
} from "@/lib/memories/transcript-actions";

interface TranscriptEditorProps {
  memoryId: string;
  rawTranscript: string;
  polishedTranscript: string | null;
}

/**
 * Editable transcript section on the memory detail page.
 *
 * State machine:
 * - View: shows polished if present, otherwise raw, with three buttons:
 *   "Upravit text" (manual edit), "Odstranit výplně" (AI light), "Vylepšit text" (AI full)
 * - Edit: textarea + Save / Zrušit
 * - Polishing: spinner, both AI buttons disabled
 * - If polishedTranscript exists: also shows "Vrátit původní" link
 */
export function TranscriptEditor({
  memoryId,
  rawTranscript,
  polishedTranscript,
}: TranscriptEditorProps) {
  const initial = polishedTranscript ?? rawTranscript;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [view, setView] = useState(initial);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraft(initial);
    setView(initial);
  }, [initial]);

  const [polishState, polishAction] = useActionState<TranscriptActionState, FormData>(
    aiPolishMemoryTranscript,
    null,
  );
  const [saveState, saveAction] = useActionState<TranscriptActionState, FormData>(
    saveEditedTranscript,
    null,
  );
  const [revertState, revertAction] = useActionState<TranscriptActionState, FormData>(
    revertTranscript,
    null,
  );

  // Whenever any action succeeds, sync the visible text
  useEffect(() => {
    if (polishState?.ok) {
      setView(polishState.text);
      setDraft(polishState.text);
    }
  }, [polishState]);
  useEffect(() => {
    if (saveState?.ok) {
      setView(saveState.text);
      setDraft(saveState.text);
      setEditing(false);
    }
  }, [saveState]);
  useEffect(() => {
    if (revertState?.ok) {
      setView(rawTranscript);
      setDraft(rawTranscript);
    }
  }, [revertState, rawTranscript]);

  const hasPolish = polishedTranscript != null;
  const lastError =
    (polishState && !polishState.ok && polishState.error) ||
    (saveState && !saveState.ok && saveState.error) ||
    (revertState && !revertState.ok && revertState.error) ||
    null;

  function runPolish(level: "light" | "full") {
    const fd = new FormData();
    fd.set("memoryId", memoryId);
    fd.set("level", level);
    startTransition(() => polishAction(fd));
  }

  function runRevert() {
    const fd = new FormData();
    fd.set("memoryId", memoryId);
    startTransition(() => revertAction(fd));
  }

  function runSave() {
    const fd = new FormData();
    fd.set("memoryId", memoryId);
    fd.set("text", draft);
    startTransition(() => saveAction(fd));
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-navy-700)]"
      >
        <span>
          {open ? "Skrýt přepis" : "Zobrazit přepis nahrávky"}
          {hasPolish ? " · upraveno" : ""}
        </span>
        <span aria-hidden className="text-base">
          {open ? "–" : "+"}
        </span>
      </button>
      {open ? (
        <div className="border-t border-[var(--color-border)] px-4 py-4">
          {editing ? (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={Math.max(6, Math.min(20, draft.split("\n").length + 2))}
                className="w-full resize-y rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-white p-3 text-sm leading-relaxed text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-400)]"
                disabled={isPending}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={runSave}
                  disabled={isPending || draft.trim() === view.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold-500)] px-5 py-2 text-sm font-medium text-[var(--color-navy-900)] transition-colors hover:bg-[var(--color-gold-400)] disabled:opacity-50"
                >
                  Uložit úpravy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(view);
                    setEditing(false);
                  }}
                  disabled={isPending}
                  className="rounded-full border border-[var(--color-border-strong)] px-5 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-navy-700)] disabled:opacity-50"
                >
                  Zrušit
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text)]">
                {view}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  disabled={isPending}
                  className="rounded-full border border-[var(--color-border-strong)] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-navy-700)] hover:text-[var(--color-navy-700)] disabled:opacity-50"
                >
                  Upravit text
                </button>
                <button
                  type="button"
                  onClick={() => runPolish("light")}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold-500)] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-navy-900)] transition-colors hover:bg-[var(--color-gold-400)] disabled:opacity-50"
                >
                  {isPending ? "AI pracuje…" : "AI · odstranit výplně"}
                </button>
                <button
                  type="button"
                  onClick={() => runPolish("full")}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold-500)] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-navy-900)] transition-colors hover:bg-[var(--color-gold-400)] disabled:opacity-50"
                >
                  {isPending ? "AI pracuje…" : "AI · vylepšit text"}
                </button>
                {hasPolish ? (
                  <button
                    type="button"
                    onClick={runRevert}
                    disabled={isPending}
                    className="ml-auto text-xs text-[var(--color-text-subtle)] underline-offset-2 hover:text-[var(--color-navy-700)] hover:underline disabled:opacity-50"
                  >
                    Vrátit původní přepis
                  </button>
                ) : null}
              </div>
              {lastError ? (
                <p className="mt-3 text-xs text-[var(--color-red-700)]">{lastError}</p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

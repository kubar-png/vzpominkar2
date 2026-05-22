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
    <div className="te-card">
      {/* Expand toggle — small gold circle with rotating + icon */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="te-toggle"
      >
        <span className="te-toggle-label">
          {open ? "Skrýt přepis" : "Zobrazit přepis nahrávky"}
          {hasPolish ? <span className="te-edited">· upraveno</span> : null}
        </span>
        <span className={`te-toggle-icon${open ? " is-open" : ""}`} aria-hidden>
          +
        </span>
      </button>
      {open ? (
        <div className="te-body">
          {editing ? (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={Math.max(6, Math.min(20, draft.split("\n").length + 2))}
                className="te-textarea"
                disabled={isPending}
              />
              <div className="te-actions">
                <button
                  type="button"
                  onClick={runSave}
                  disabled={isPending || draft.trim() === view.trim()}
                  className="te-btn te-btn-gold"
                >
                  Uložit úpravy <span className="te-btn-circle" aria-hidden>↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(view);
                    setEditing(false);
                  }}
                  disabled={isPending}
                  className="te-btn te-btn-outline"
                >
                  Zrušit
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="te-text">{view}</p>
              <div className="te-actions">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  disabled={isPending}
                  className="te-btn te-btn-outline"
                >
                  Upravit text
                </button>
                <button
                  type="button"
                  onClick={() => runPolish("light")}
                  disabled={isPending}
                  className="te-btn te-btn-gold"
                >
                  {isPending ? "AI pracuje…" : "Odstranit výplně"}
                  <span className="te-btn-circle" aria-hidden>✦</span>
                </button>
                <button
                  type="button"
                  onClick={() => runPolish("full")}
                  disabled={isPending}
                  className="te-btn te-btn-gold"
                >
                  {isPending ? "AI pracuje…" : "Vylepšit text"}
                  <span className="te-btn-circle" aria-hidden>✦</span>
                </button>
                {hasPolish ? (
                  <button
                    type="button"
                    onClick={runRevert}
                    disabled={isPending}
                    className="te-revert"
                  >
                    Vrátit původní přepis
                  </button>
                ) : null}
              </div>
              {lastError ? <p className="te-error">{lastError}</p> : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

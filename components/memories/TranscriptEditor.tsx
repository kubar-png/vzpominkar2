"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
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
 * The transcript is already auto-improved on save (context-corrected + smoothed
 * into readable prose), so the polished text is what we show by default. No
 * manual "improve" buttons — just:
 *  - "Upravit text": manual edit + save
 *  - "Zobrazit původní přepis": a non-destructive toggle to see the raw
 *    word-for-word recording, and back.
 */
export function TranscriptEditor({
  memoryId,
  rawTranscript,
  polishedTranscript,
}: TranscriptEditorProps) {
  const improved = polishedTranscript ?? rawTranscript;
  const hasPolish = polishedTranscript != null && polishedTranscript !== rawTranscript;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [current, setCurrent] = useState(improved); // improved/edited text
  const [draft, setDraft] = useState(improved);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCurrent(improved);
    setDraft(improved);
  }, [improved]);

  const [saveState, saveAction] = useActionState<TranscriptActionState, FormData>(
    saveEditedTranscript,
    null,
  );

  useEffect(() => {
    if (saveState?.ok) {
      setCurrent(saveState.text);
      setDraft(saveState.text);
      setEditing(false);
    }
  }, [saveState]);

  const lastError = (saveState && !saveState.ok && saveState.error) || null;
  const display = showOriginal ? rawTranscript : current;

  function runSave() {
    const fd = new FormData();
    fd.set("memoryId", memoryId);
    fd.set("text", draft);
    startTransition(() => saveAction(fd));
  }

  return (
    <div className="te-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="te-toggle"
      >
        <span className="te-toggle-label">
          {open ? "Skrýt přepis" : "Zobrazit přepis nahrávky"}
          {hasPolish && !showOriginal ? <span className="te-edited">· upraveno</span> : null}
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
                  disabled={isPending || draft.trim() === current.trim()}
                  className="te-btn te-btn-gold"
                >
                  Uložit úpravy <span className="te-btn-circle" aria-hidden>↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(current);
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
              <p className="te-text">{display}</p>
              <div className="te-actions">
                {!showOriginal ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="te-btn te-btn-outline"
                  >
                    Upravit text
                  </button>
                ) : null}
                {hasPolish ? (
                  <button
                    type="button"
                    onClick={() => setShowOriginal((v) => !v)}
                    className="te-revert"
                  >
                    {showOriginal ? "Zobrazit vylepšený text" : "Zobrazit původní přepis"}
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

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTextMemory } from "@/lib/memories/actions";

const AUTOSAVE_INTERVAL_MS = 5_000;

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

/**
 * Text memory form — editorial reskin.
 *
 * Behaviour is unchanged: every 5s, if the draft has at least 5 trimmed
 * chars, we POST to saveTextMemory with finalize=0. "Hotovo, uložit"
 * triggers finalize=1 and redirects to /my-memories?saved=1.
 */
export function TextMemoryForm({
  assignmentId,
  draft,
}: {
  assignmentId: string | null;
  draft?: { id: string; text: string } | null;
}) {
  const [text, setText] = useState(draft?.text ?? "");
  const [memoryId, setMemoryId] = useState<string | null>(draft?.id ?? null);
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });
  const [validationError, setValidationError] = useState(false);
  const [pending, startTransition] = useTransition();
  const lastSaved = useRef("");
  const router = useRouter();

  useEffect(() => {
    const tick = setInterval(async () => {
      if (text.trim().length < 5) return;
      if (text === lastSaved.current) return;
      setStatus({ kind: "saving" });
      const fd = new FormData();
      fd.set("memoryId", memoryId ?? "");
      fd.set("text", text);
      fd.set("assignmentId", assignmentId ?? "");
      fd.set("finalize", "0");
      const result = await saveTextMemory(null, fd);
      if (result?.ok) {
        lastSaved.current = text;
        if (result.memoryId) setMemoryId(result.memoryId);
        setStatus({ kind: "saved", at: new Date() });
      } else if (result?.ok === false) {
        setStatus({ kind: "error", message: result.error });
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(tick);
  }, [text, memoryId, assignmentId]);

  function onFinalize() {
    if (text.trim().length < 5) {
      setValidationError(true);
      setStatus({ kind: "error", message: "Napište prosím alespoň pár vět." });
      return;
    }
    setValidationError(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("memoryId", memoryId ?? "");
      fd.set("text", text);
      fd.set("assignmentId", assignmentId ?? "");
      fd.set("finalize", "1");
      const result = await saveTextMemory(null, fd);
      if (result?.ok === false) {
        setStatus({ kind: "error", message: result.error });
      } else {
        router.push("/my-memories?saved=1");
      }
    });
  }

  return (
    <div className="es-card">
      <label className="es-label" htmlFor="memory-text">
        Vaše odpověď
      </label>
      <textarea
        id="memory-text"
        autoFocus
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (validationError && e.target.value.trim().length >= 5) {
            setValidationError(false);
          }
        }}
        placeholder="Začněte psát svou vzpomínku — nemusíte spěchat, ukládá se průběžně…"
        aria-invalid={validationError}
        className={["es-textarea", validationError ? "invalid" : ""].join(" ")}
      />

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p
          aria-live="polite"
          className={
            status.kind === "error"
              ? "es-status es-status-error"
              : "es-status"
          }
        >
          {renderStatus(status)}
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={onFinalize}
          className="es-btn es-btn-gold"
        >
          {pending ? "Ukládám…" : "Hotovo, uložit"}
          {!pending && <span className="arrow" aria-hidden>↗</span>}
        </button>
      </div>
    </div>
  );
}

function renderStatus(s: SaveStatus): string {
  switch (s.kind) {
    case "idle":
      return "Připraveno k psaní";
    case "saving":
      return "Ukládám…";
    case "saved":
      return `Uloženo v ${formatTime(s.at)}`;
    case "error":
      return s.message;
  }
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

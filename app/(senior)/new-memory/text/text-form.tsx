"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTextMemory } from "@/lib/memories/actions";
import { SeniorButton } from "@/components/senior/SeniorButton";

const AUTOSAVE_INTERVAL_MS = 5_000;

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

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
    /* flex-1 so this fills the remaining height left by the question strip */
    <div className="flex flex-col flex-1 min-h-0">
      {/* Textarea stretches to fill all available space */}
      <div className="flex-1 min-h-0 px-6 pt-5">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (validationError && e.target.value.trim().length >= 5) {
              setValidationError(false);
            }
          }}
          placeholder="Začněte psát…"
          className={[
            "h-full w-full resize-none",
            "px-5 py-4",
            "rounded-[var(--radius-senior-input)]",
            "bg-white border-2",
            validationError ? "border-red-400" : "border-paper-300",
            "text-[length:var(--text-senior-lg)] leading-relaxed text-ink-900",
            "placeholder:text-paper-400",
            "focus-visible:border-navy-500 focus-visible:outline-none",
            "transition-colors duration-[var(--duration-senior)]",
          ].join(" ")}
          aria-invalid={validationError}
        />
      </div>

      {/* Bottom bar - status hint + save button, always visible */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-2 border-t border-paper-200 bg-paper-50">
        <p
          aria-live="polite"
          className={[
            "text-sm truncate",
            status.kind === "error" ? "text-red-700 font-medium" : "text-paper-500",
          ].join(" ")}
        >
          {renderStatus(status)}
        </p>
        <SeniorButton
          variant="primary"
          size="md"
          disabled={pending}
          onClick={onFinalize}
        >
          {pending ? "Ukládám…" : "Hotovo, uložit"}
        </SeniorButton>
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
      return `Uloženo ${formatTime(s.at)}`;
    case "error":
      return s.message;
  }
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

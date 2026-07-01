"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import {
  FEEDBACK_QUESTIONS,
  type FeedbackQuestion,
} from "@/lib/feedback/questions";
import { submitFeedback } from "@/lib/feedback/actions";

/* ─────────────────────────────────────────────────────────────────────────
 * Typeform-style tester feedback flow.
 *
 * One question per screen, slim raspberry progress bar, big touch targets,
 * keyboard support (Enter advances; number keys pick nps/scale). Answers live
 * in a single record keyed by question id so nothing is ever lost — not on
 * back-navigation, not on a failed submit. The contact e-mail question is
 * threaded out into submitFeedback's dedicated `contactEmail` argument.
 *
 * Brand: navy ink, raspberry CTA, off-white canvas, Bree Serif headings,
 * Host Grotesk body. No eyebrows, no italics. On-accent text is off-white.
 * ─────────────────────────────────────────────────────────────────────── */

type Answers = Record<string, unknown>;
type Status = "idle" | "submitting" | "error" | "done";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DISPLAY: CSSProperties = { fontFamily: "var(--font-display)" };
const BODY: CSSProperties = { fontFamily: "var(--font-sans)" };

/** True when a question has a real, submittable value. */
function hasValue(q: FeedbackQuestion, v: unknown): boolean {
  if (q.kind === "text" || q.kind === "email" || q.kind === "choice") {
    return typeof v === "string" && v.trim().length > 0;
  }
  // nps + scale
  return typeof v === "number" && Number.isFinite(v);
}

export function FeedbackFlow() {
  const questions = FEEDBACK_QUESTIONS;
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  // For choice questions with allowOther: which question is in free-text mode.
  const [otherMode, setOtherMode] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // index is always clamped to [0, total-1] and FEEDBACK_QUESTIONS is non-empty,
  // so the current question is always defined.
  const q = questions[index]!;
  const isLast = index === total - 1;
  const value = answers[q.id];

  const timerRef = useRef<number | undefined>(undefined);
  const otherInputRef = useRef<HTMLInputElement | null>(null);
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  // ── validity ──────────────────────────────────────────────────────────
  const canAdvance = useMemo(() => {
    if (q.kind === "email") {
      const s = typeof value === "string" ? value.trim() : "";
      if (s === "") return Boolean(q.optional);
      return EMAIL_RE.test(s);
    }
    if (q.optional) return true;
    return hasValue(q, value);
  }, [q, value]);

  // ── submit ────────────────────────────────────────────────────────────
  const finish = useCallback(async () => {
    // Thread the e-mail out; keep everything else as the answers blob.
    const { contact_email, ...rest } = answers;
    const email =
      typeof contact_email === "string" && EMAIL_RE.test(contact_email.trim())
        ? contact_email.trim()
        : undefined;

    setStatus("submitting");
    setErrorMsg("");
    const res = await submitFeedback(rest, email);
    if (res.ok) {
      setStatus("done");
    } else {
      setStatus("error");
      setErrorMsg(res.error);
    }
  }, [answers]);

  // ── navigation ────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    clearTimer();
    if (status === "submitting") return;
    if (isLast) {
      void finish();
      return;
    }
    setStatus("idle");
    setErrorMsg("");
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [clearTimer, status, isLast, finish, total]);

  const goBack = useCallback(() => {
    clearTimer();
    if (status === "submitting") return;
    setStatus("idle");
    setErrorMsg("");
    setIndex((i) => Math.max(i - 1, 0));
  }, [clearTimer, status]);

  const skip = useCallback(() => {
    clearTimer();
    setAnswers((a) => {
      const next = { ...a };
      delete next[q.id];
      return next;
    });
    setOtherMode((m) => ({ ...m, [q.id]: false }));
    // Advance manually (goNext reads answers via finish only on last step).
    if (isLast) {
      // Skipping the last (optional e-mail) question still submits.
      setStatus("submitting");
      setErrorMsg("");
      const { contact_email, ...rest } = answers;
      void (async () => {
        const res = await submitFeedback(rest, undefined);
        if (res.ok) setStatus("done");
        else {
          setStatus("error");
          setErrorMsg(res.error);
        }
      })();
      return;
    }
    setStatus("idle");
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [clearTimer, q.id, isLast, answers, total]);

  // Auto-advance for single-select kinds (Typeform feel).
  const scheduleAdvance = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(() => goNext(), 320);
  }, [clearTimer, goNext]);

  // ── answer setters ────────────────────────────────────────────────────
  const setValue = useCallback((id: string, v: unknown) => {
    setAnswers((a) => ({ ...a, [id]: v }));
  }, []);

  const selectNumber = useCallback(
    (n: number) => {
      setValue(q.id, n);
      scheduleAdvance();
    },
    [q.id, setValue, scheduleAdvance],
  );

  const selectChoice = useCallback(
    (optValue: string) => {
      setOtherMode((m) => ({ ...m, [q.id]: false }));
      setValue(q.id, optValue);
      scheduleAdvance();
    },
    [q.id, setValue, scheduleAdvance],
  );

  const selectOther = useCallback(() => {
    clearTimer();
    setOtherMode((m) => ({ ...m, [q.id]: true }));
    setValue(q.id, typeof value === "string" ? value : "");
    window.setTimeout(() => otherInputRef.current?.focus(), 0);
  }, [clearTimer, q.id, setValue, value]);

  // ── keyboard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (status === "submitting" || status === "done") return;
      const target = e.target as HTMLElement | null;
      const inTextarea = target?.tagName === "TEXTAREA";

      // Number keys pick nps / scale values.
      if (
        (q.kind === "nps" || q.kind === "scale") &&
        !inTextarea &&
        /^[0-9]$/.test(e.key)
      ) {
        const n = Number(e.key);
        const min = q.min ?? 0;
        const max = q.max ?? 10;
        if (n >= min && n <= max) {
          e.preventDefault();
          selectNumber(n);
          return;
        }
      }

      if (e.key === "Enter") {
        // Enter in a textarea inserts a newline unless a modifier is held.
        if (inTextarea && !(e.metaKey || e.ctrlKey)) return;
        e.preventDefault();
        if (canAdvance) goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, status, canAdvance, goNext, selectNumber]);

  // Clean up any pending auto-advance timer on unmount / question change.
  useEffect(() => () => clearTimer(), [clearTimer]);

  const progress = status === "done" ? 100 : ((index + 1) / total) * 100;

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]"
      style={BODY}
    >
      <style>{FLOW_CSS}</style>

      {/* Top chrome: minimal logo + slim progress bar */}
      <header className="sticky top-0 z-10 bg-[var(--color-bg)]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" aria-label="Vzpomínkář — domů">
            <Logo tone="raspberry" height={26} />
          </Link>
          {status !== "done" && (
            <span className="text-[13px] text-[var(--color-text-subtle)]">
              {index + 1} / {total}
            </span>
          )}
        </div>
        <div
          className="h-[3px] w-full bg-[var(--color-surface-2)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Průběh dotazníku"
        >
          <div
            className="h-full bg-[var(--color-accent)] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 py-10 sm:items-center sm:px-6 sm:py-14">
        <div className="w-full max-w-[640px]">
          {status === "done" ? (
            <ThankYou />
          ) : (
            <div key={index} className="fb-enter">
              <QuestionScreen
                q={q}
                value={value}
                index={index}
                otherActive={Boolean(otherMode[q.id])}
                otherInputRef={otherInputRef}
                onSelectNumber={selectNumber}
                onSelectChoice={selectChoice}
                onSelectOther={selectOther}
                onSetText={(v) => setValue(q.id, v)}
              />

              {/* Controls */}
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={status === "submitting"}
                    className="text-[15px] text-[var(--color-text-subtle)] underline-offset-4 transition hover:text-[var(--color-text)] hover:underline disabled:opacity-50"
                  >
                    Zpět
                  </button>
                )}

                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvance || status === "submitting"}
                  className="fb-cta inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-7 py-3 text-[15px] font-medium text-[#FEF7D7] shadow-[0_10px_24px_-12px_rgba(207,54,76,0.5)] transition hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {status === "submitting"
                    ? "Odesílám…"
                    : isLast
                      ? "Odeslat"
                      : "Pokračovat"}
                  {status !== "submitting" && (
                    <span aria-hidden="true" className="text-[#FEF7D7]">
                      →
                    </span>
                  )}
                </button>

                {q.optional && (
                  <button
                    type="button"
                    onClick={skip}
                    disabled={status === "submitting"}
                    className="text-[15px] text-[var(--color-text-subtle)] underline-offset-4 transition hover:text-[var(--color-text)] hover:underline disabled:opacity-50"
                  >
                    Přeskočit
                  </button>
                )}

                {!isLast && canAdvance && status !== "submitting" && (
                  <span className="hidden text-[13px] text-[var(--color-text-subtle)] sm:inline">
                    stiskněte Enter ↵
                  </span>
                )}
              </div>

              {status === "error" && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-[15px] text-[var(--color-danger)]"
                >
                  {errorMsg || "Odeslání se nezdařilo. Zkuste to prosím znovu."}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Per-question renderer ─────────────────────────────────────────────── */

function QuestionScreen({
  q,
  value,
  index,
  otherActive,
  otherInputRef,
  onSelectNumber,
  onSelectChoice,
  onSelectOther,
  onSetText,
}: {
  q: FeedbackQuestion;
  value: unknown;
  index: number;
  otherActive: boolean;
  otherInputRef: RefObject<HTMLInputElement | null>;
  onSelectNumber: (n: number) => void;
  onSelectChoice: (v: string) => void;
  onSelectOther: () => void;
  onSetText: (v: string) => void;
}) {
  return (
    <div>
      <h1
        className="text-balance text-[26px] leading-tight text-[var(--color-text-heading)] sm:text-[32px]"
        style={DISPLAY}
      >
        {q.prompt}
      </h1>
      {q.optional && (
        <p className="mt-2 text-[14px] text-[var(--color-text-subtle)]">
          Nepovinné
        </p>
      )}

      <div className="mt-7">
        {q.kind === "nps" && (
          <NpsField value={value} q={q} onSelect={onSelectNumber} />
        )}
        {q.kind === "scale" && (
          <ScaleField value={value} q={q} onSelect={onSelectNumber} />
        )}
        {q.kind === "choice" && (
          <ChoiceField
            q={q}
            value={value}
            otherActive={otherActive}
            otherInputRef={otherInputRef}
            onSelectChoice={onSelectChoice}
            onSelectOther={onSelectOther}
            onSetText={onSetText}
          />
        )}
        {q.kind === "text" && (
          <TextField key={index} value={value} onSetText={onSetText} />
        )}
        {q.kind === "email" && (
          <EmailField key={index} value={value} onSetText={onSetText} />
        )}
      </div>
    </div>
  );
}

/* ── nps: 0–10 pills ───────────────────────────────────────────────────── */

function NpsField({
  value,
  q,
  onSelect,
}: {
  value: unknown;
  q: FeedbackQuestion;
  onSelect: (n: number) => void;
}) {
  const min = q.min ?? 0;
  const max = q.max ?? 10;
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {nums.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(n)}
              className={`h-12 w-12 rounded-xl border text-[16px] font-medium transition sm:h-[52px] sm:w-[52px] ${
                selected
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[#FEF7D7]"
                  : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:-translate-y-0.5"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-[13px] text-[var(--color-text-subtle)]">
        <span>Vůbec bych nedoporučil/a</span>
        <span>Určitě doporučil/a</span>
      </div>
    </div>
  );
}

/* ── scale: 1–5 with end labels ────────────────────────────────────────── */

function ScaleField({
  value,
  q,
  onSelect,
}: {
  value: unknown;
  q: FeedbackQuestion;
  onSelect: (n: number) => void;
}) {
  const min = q.min ?? 1;
  const max = q.max ?? 5;
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div>
      <div className="flex gap-2 sm:gap-3">
        {nums.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(n)}
              className={`h-16 flex-1 rounded-2xl border text-[20px] font-medium transition ${
                selected
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[#FEF7D7]"
                  : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:-translate-y-0.5"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-[13px] text-[var(--color-text-subtle)]">
        <span>{q.minLabel}</span>
        <span>{q.maxLabel}</span>
      </div>
    </div>
  );
}

/* ── choice: large radio cards (+ optional 'Jiné') ─────────────────────── */

function ChoiceField({
  q,
  value,
  otherActive,
  otherInputRef,
  onSelectChoice,
  onSelectOther,
  onSetText,
}: {
  q: FeedbackQuestion;
  value: unknown;
  otherActive: boolean;
  otherInputRef: RefObject<HTMLInputElement | null>;
  onSelectChoice: (v: string) => void;
  onSelectOther: () => void;
  onSetText: (v: string) => void;
}) {
  const options = q.options ?? [];
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const selected = !otherActive && value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelectChoice(opt.value)}
            className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left text-[16px] transition ${
              selected
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[#FEF7D7]"
                : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:-translate-y-0.5"
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                selected ? "border-[#FEF7D7]" : "border-[var(--color-border-strong)]"
              }`}
            >
              {selected && (
                <span className="h-2 w-2 rounded-full bg-[#FEF7D7]" />
              )}
            </span>
            {opt.label}
          </button>
        );
      })}

      {q.allowOther && (
        <div
          className={`rounded-2xl border transition ${
            otherActive
              ? "border-[var(--color-accent)] bg-[var(--color-surface)]"
              : "border-[var(--color-border-strong)] bg-[var(--color-surface)]"
          }`}
        >
          <button
            type="button"
            aria-pressed={otherActive}
            onClick={onSelectOther}
            className="flex w-full items-center gap-3 px-5 py-4 text-left text-[16px] text-[var(--color-text)]"
          >
            <span
              aria-hidden="true"
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                otherActive
                  ? "border-[var(--color-accent)]"
                  : "border-[var(--color-border-strong)]"
              }`}
            >
              {otherActive && (
                <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              )}
            </span>
            Jiné
          </button>
          {otherActive && (
            <div className="px-5 pb-4">
              <input
                ref={otherInputRef}
                type="text"
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onSetText(e.target.value)}
                placeholder="Napište vlastní odpověď…"
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── text: textarea ────────────────────────────────────────────────────── */

function TextField({
  value,
  onSetText,
}: {
  value: unknown;
  onSetText: (v: string) => void;
}) {
  const onKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    // Let plain Enter add a newline; the global handler advances on ⌘/Ctrl+Enter.
    if (e.key === "Enter" && !(e.metaKey || e.ctrlKey)) e.stopPropagation();
  };
  return (
    <textarea
      autoFocus
      rows={4}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onSetText(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Sem můžete psát…"
      className="w-full resize-none rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-4 text-[17px] leading-relaxed text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
    />
  );
}

/* ── email: input ──────────────────────────────────────────────────────── */

function EmailField({
  value,
  onSetText,
}: {
  value: unknown;
  onSetText: (v: string) => void;
}) {
  return (
    <input
      autoFocus
      type="email"
      inputMode="email"
      autoComplete="email"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onSetText(e.target.value)}
      placeholder="vas@email.cz"
      className="w-full rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-4 text-[17px] text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
    />
  );
}

/* ── thank-you ─────────────────────────────────────────────────────────── */

function ThankYou() {
  return (
    <div className="fb-enter text-center">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[var(--color-accent)] text-[28px] text-[#FEF7D7]">
        ♥
      </div>
      <h1
        className="text-balance text-[30px] leading-tight text-[var(--color-text-heading)] sm:text-[38px]"
        style={DISPLAY}
      >
        Děkujeme vám.
      </h1>
      <p className="mx-auto mt-4 max-w-[440px] text-[17px] leading-relaxed text-[var(--color-text-muted)]">
        Vaše odpovědi jsme uložili. Každá poznámka nám pomáhá dotáhnout
        Vzpomínkáře tak, aby dával smysl vám i vašim blízkým.
      </p>
      <Link
        href="/"
        className="fb-cta mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-7 py-3 text-[15px] font-medium text-[#FEF7D7] shadow-[0_10px_24px_-12px_rgba(207,54,76,0.5)] transition hover:bg-[var(--color-accent-hover)]"
      >
        Zpět na Vzpomínkář
        <span aria-hidden="true" className="text-[#FEF7D7]">
          →
        </span>
      </Link>
    </div>
  );
}

/* Self-contained entrance animation (respects reduced motion). */
const FLOW_CSS = `
@keyframes fbEnter {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fb-enter { animation: fbEnter 420ms cubic-bezier(0.16, 1, 0.3, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .fb-enter { animation: none; }
  .fb-cta { transition: none; }
}
`;

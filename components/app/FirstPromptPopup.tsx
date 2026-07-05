"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveGender, type Gender } from "@/lib/gender";
import { scheduleNextMonday, addCustomPromptAndSchedule } from "@/lib/prompts/actions";

interface Starter {
  id: string;
  question: string;
}

interface Props {
  familyId: string;
  seniorId: string;
  seniorName: string;
  seniorGender: Gender | null;
  starters: Starter[];
}

const TOUR_KEY = "vzp:dashboard-tour:v1";

/**
 * First-question nudge. Shown on the dashboard once the family has a senior but
 * no scheduled question yet. The owner picks a ready-made opener (or writes their
 * own); from then on the weekly cron keeps the queue moving. Appears AFTER the
 * dashboard tour (waits for its finish event) so the two don't overlap. DB-driven
 * (no scheduled question) — a gentle nudge that returns until they schedule one.
 */
export function FirstPromptPopup({ familyId, seniorId, seniorName, seniorGender, starters }: Props) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"pick" | "custom">("pick");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reveal after the tour finishes (or right away if it's already been seen).
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const reveal = () => {
      if (!cancelled) setShow(true);
    };
    let tourDone = false;
    try {
      tourDone = window.localStorage.getItem(TOUR_KEY) === "done";
    } catch {
      tourDone = true;
    }
    if (tourDone) {
      timer = window.setTimeout(reveal, 500);
      return () => {
        cancelled = true;
        if (timer) window.clearTimeout(timer);
      };
    }
    const onFinished = () => {
      timer = window.setTimeout(reveal, 450);
    };
    window.addEventListener("vzp:tour-finished", onFinished);
    // Safety net: if the tour overlay never appears, show anyway.
    const fallback = window.setTimeout(() => {
      if (!document.querySelector(".vzp-tour")) reveal();
    }, 2600);
    return () => {
      cancelled = true;
      window.removeEventListener("vzp:tour-finished", onFinished);
      if (timer) window.clearTimeout(timer);
      window.clearTimeout(fallback);
    };
  }, []);

  // A11y: move focus into the dialog on open, Escape to dismiss, and a simple
  // Tab focus trap (mirrors the dashboard tour's Escape handling).
  useEffect(() => {
    if (!show) return;
    const getFocusable = () => {
      const dialog = dialogRef.current;
      if (!dialog) return [] as HTMLElement[];
      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, a[href], textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
    };
    getFocusable()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShow(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  async function submit() {
    if (submitting) return;
    setError(null);
    let res;
    if (mode === "custom") {
      if (customText.trim().length < 8) {
        setError("Napište prosím otázku (alespoň pár slov).");
        return;
      }
      setSubmitting(true);
      res = await addCustomPromptAndSchedule(familyId, customText.trim(), "queue", [seniorId]);
    } else {
      if (!selectedId) {
        setError("Vyberte otázku, nebo si napište vlastní.");
        return;
      }
      setSubmitting(true);
      res = await scheduleNextMonday(familyId, selectedId, [seniorId]);
    }
    if (res.ok) {
      setShow(false);
      router.refresh();
    } else {
      setError(res.error);
      setSubmitting(false);
    }
  }

  if (!show) return null;

  return (
    <div
      className="vzp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vzp-first-prompt-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShow(false);
      }}
    >
      <div className="vzp-modal" ref={dialogRef}>
        <button type="button" className="vzp-modal-x" onClick={() => setShow(false)} aria-label="Zavřít">
          <X size={16} />
        </button>
        <h2 id="vzp-first-prompt-title" className="vzp-modal-title">Co se {seniorName} zeptáme jako první?</h2>
        <p className="vzp-modal-lede">
          Vyberte jednu otázku — odejde {seniorName} v pondělí ráno. Další už pak
          chodí samy, vždy jednu týdně. Měnit a přidávat je můžete kdykoliv.
        </p>

        {mode === "pick" ? (
          <div className="vzp-modal-list">
            {starters.map((s) => {
              const on = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`vzp-modal-opt${on ? " is-on" : ""}`}
                  onClick={() => setSelectedId(s.id)}
                  aria-pressed={on}
                >
                  <span className="vzp-modal-radio" aria-hidden>
                    {on ? <Check size={12} /> : null}
                  </span>
                  <span>{resolveGender(s.question, seniorGender)}</span>
                </button>
              );
            })}
            <button type="button" className="vzp-modal-custom-link" onClick={() => setMode("custom")}>
              <Pencil size={14} aria-hidden /> Raději napsat vlastní otázku
            </button>
          </div>
        ) : (
          <div className="vzp-modal-list">
            <textarea
              className="vzp-modal-textarea"
              rows={3}
              maxLength={280}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Např. Jak ses seznámil s babičkou? Vzpomínáš si na první setkání?"
              autoFocus
            />
            <button type="button" className="vzp-modal-custom-link" onClick={() => setMode("pick")}>
              ← Zpět na připravené otázky
            </button>
          </div>
        )}

        {error ? (
          <p className="vzp-modal-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="vzp-modal-foot">
          <button type="button" className="vzp-modal-skip" onClick={() => setShow(false)}>
            Teď ne
          </button>
          <div className="vzp-modal-actions">
            <Link href={`/family/${familyId}/prompts`} className="vzp-modal-all">
              Celá knihovna →
            </Link>
            <Button variant="primary" size="sm" onClick={submit} disabled={submitting}>
              {submitting ? "Plánuji…" : "Naplánovat otázku"}
              <span aria-hidden>↗</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

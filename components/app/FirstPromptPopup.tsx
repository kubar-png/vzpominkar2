"use client";

import { useEffect, useState } from "react";
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
    <div className="vzp-modal-overlay" role="dialog" aria-modal="true" aria-label="Naplánujte první otázku">
      <div className="vzp-modal">
        <button type="button" className="vzp-modal-x" onClick={() => setShow(false)} aria-label="Zavřít">
          <X size={16} />
        </button>
        <span className="vzp-modal-eyebrow">První otázka</span>
        <h2 className="vzp-modal-title">Co se {seniorName} zeptáme jako první?</h2>
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

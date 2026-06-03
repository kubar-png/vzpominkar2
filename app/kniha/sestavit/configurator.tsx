"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BOOK_PHASES } from "@/lib/book-shop/phases";

interface Q {
  id: string;
  text: string;
  custom?: boolean;
}
type Selection = Record<string, Q[]>;

const STORAGE_KEY = "kniha-config-v1";
const PRICE_CUSTOM = "1 099 Kč";
const PHASE_COUNT = BOOK_PHASES.length;

function buildDefault(): Selection {
  const out: Selection = {};
  for (const p of BOOK_PHASES) out[p.key] = p.questions.map((q) => ({ id: q.id, text: q.text }));
  return out;
}

let customCounter = 0;

export function Configurator() {
  const [selection, setSelection] = useState<Selection>(buildDefault);
  const [step, setStep] = useState(0); // 0..PHASE_COUNT-1 = phases · PHASE_COUNT = recap
  const [hydrated, setHydrated] = useState(false);
  const [ordered, setOrdered] = useState(false);

  // Restore a saved draft (guest — no account).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Selection>;
        const base = buildDefault();
        for (const key of Object.keys(base)) {
          const saved = parsed?.[key];
          if (Array.isArray(saved)) base[key] = saved;
        }
        setSelection(base);
      }
    } catch {
      /* corrupt draft — fall back to defaults */
    }
    setHydrated(true);
  }, []);

  // Persist so a refresh mid-build doesn't lose work.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch {
      /* ignore quota/availability errors */
    }
  }, [selection, hydrated]);

  const total = useMemo(
    () => Object.values(selection).reduce((n, qs) => n + qs.length, 0),
    [selection],
  );

  const isRecap = step >= PHASE_COUNT;
  const phase = BOOK_PHASES[Math.min(step, PHASE_COUNT - 1)]!;
  const current = selection[phase.key] ?? [];

  const editQuestion = (key: string, id: string, text: string) =>
    setSelection((p) => ({ ...p, [key]: (p[key] ?? []).map((q) => (q.id === id ? { ...q, text } : q)) }));
  const removeQuestion = (key: string, id: string) =>
    setSelection((p) => ({ ...p, [key]: (p[key] ?? []).filter((q) => q.id !== id) }));
  const addQuestion = (key: string) => {
    customCounter += 1;
    const id = `c-${key}-${customCounter}`;
    setSelection((p) => ({ ...p, [key]: [...(p[key] ?? []), { id, text: "", custom: true }] }));
  };
  const restorePhase = (key: string) => {
    const def = BOOK_PHASES.find((b) => b.key === key);
    if (def) setSelection((p) => ({ ...p, [key]: def.questions.map((q) => ({ id: q.id, text: q.text })) }));
  };
  const clearPhase = (key: string) =>
    setSelection((p) => ({ ...p, [key]: [] }));

  if (ordered) {
    return (
      <section className="hero">
        <div className="container" style={{ maxWidth: 640 }}>
          <span className="eyebrow">Hotovo</span>
          <h1 style={{ margin: "0 auto 20px" }}>Skvělé — kniha je sestavená.</h1>
          <p className="lede">
            Vybrali jste <strong>{total}</strong>{" "}
            {total === 1 ? "otázku" : total >= 2 && total <= 4 ? "otázky" : "otázek"} napříč
            šesti životními obdobími. Platební brána se dokončuje — tady se brzy přesměrujete
            na zaplacení (1 099 Kč, poštovné zdarma) a my knihu vysázíme a vytiskneme.
          </p>
          <Link href="/kniha" className="btn btn-outline" style={{ marginTop: 8 }}>
            Zpět na knihu <span className="arrow">↗</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="kc container">
      <header className="kc-head">
        <span className="eyebrow">Sestavte si knihu</span>
        <h1>Vyberte otázky do své knihy</h1>
        <p className="lede">
          Doporučené otázky jsou předvyplněné — můžete je upravit, přidat vlastní nebo odebrat.
          Spěcháte? Klikněte na <strong>Pokračovat k objednávce</strong> kdykoliv.
        </p>
      </header>

      {/* Always-visible order bar — never blocks the path to payment */}
      <div className="kc-bar">
        <span className="kc-bar-count">
          {total} {total === 1 ? "otázka" : total >= 2 && total <= 4 ? "otázky" : "otázek"} ·
          vlastní kniha {PRICE_CUSTOM}
        </span>
        {isRecap ? (
          <button type="button" className="btn btn-outline" onClick={() => setStep(0)}>
            Upravit otázky
          </button>
        ) : (
          <button type="button" className="btn btn-gold" onClick={() => setStep(PHASE_COUNT)}>
            Pokračovat k objednávce <span className="arrow">↗</span>
          </button>
        )}
      </div>

      {/* Progress dots */}
      <ol className="kc-steps" aria-hidden>
        {BOOK_PHASES.map((p, i) => (
          <li
            key={p.key}
            className={i === step ? "is-current" : i < step ? "is-done" : ""}
          >
            {p.title}
          </li>
        ))}
        <li className={isRecap ? "is-current" : ""}>Souhrn</li>
      </ol>

      {isRecap ? (
        <section className="kc-recap">
          <h2>Souhrn vaší knihy</h2>
          <ul className="kc-recap-list">
            {BOOK_PHASES.map((p) => (
              <li key={p.key}>
                <span>{p.title}</span>
                <span className="kc-recap-num">{(selection[p.key] ?? []).length} otázek</span>
              </li>
            ))}
          </ul>
          <div className="kc-recap-total">
            <span>Celkem {total} otázek · vlastní kniha</span>
            <strong>{PRICE_CUSTOM}</strong>
          </div>
          <button
            type="button"
            className="btn btn-gold btn-gold-full"
            onClick={() => setOrdered(true)}
            disabled={total === 0}
          >
            Objednat a zaplatit <span className="arrow">↗</span>
          </button>
          {total === 0 ? (
            <p className="kc-hint">Vyberte aspoň jednu otázku.</p>
          ) : null}
        </section>
      ) : (
        <section className="kc-phase">
          <div className="kc-phase-head">
            <span className="eyebrow">
              Fáze {step + 1}/{PHASE_COUNT}
            </span>
            <h2>{phase.title}</h2>
          </div>

          <div className="kc-questions">
            {current.length === 0 ? (
              <p className="kc-hint">
                V této fázi nemáte žádné otázky.{" "}
                <button type="button" className="kc-link" onClick={() => restorePhase(phase.key)}>
                  Obnovit doporučené
                </button>
              </p>
            ) : (
              current.map((q, i) => (
                <div key={q.id} className="kc-q">
                  <span className="kc-q-num">{String(i + 1).padStart(2, "0")}</span>
                  <textarea
                    className="kc-q-text"
                    rows={2}
                    value={q.text}
                    placeholder="Napište vlastní otázku…"
                    onChange={(e) => editQuestion(phase.key, q.id, e.target.value)}
                  />
                  <button
                    type="button"
                    className="kc-q-remove"
                    aria-label="Odebrat otázku"
                    onClick={() => removeQuestion(phase.key, q.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="kc-phase-actions">
            <button type="button" className="kc-link" onClick={() => addQuestion(phase.key)}>
              + Přidat vlastní otázku
            </button>
            {current.length > 0 ? (
              <button type="button" className="kc-link kc-link-muted" onClick={() => clearPhase(phase.key)}>
                Vymazat fázi
              </button>
            ) : null}
          </div>

          <nav className="kc-nav">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              ← Zpět
            </button>
            {step < PHASE_COUNT - 1 ? (
              <button type="button" className="btn btn-gold" onClick={() => setStep((s) => s + 1)}>
                Další fáze <span className="arrow">↗</span>
              </button>
            ) : (
              <button type="button" className="btn btn-gold" onClick={() => setStep(PHASE_COUNT)}>
                Na souhrn <span className="arrow">↗</span>
              </button>
            )}
          </nav>
        </section>
      )}
    </div>
  );
}

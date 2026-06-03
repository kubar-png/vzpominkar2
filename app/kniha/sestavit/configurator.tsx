"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BOOK_PHASES, type BookQuestion } from "@/lib/book-shop/phases";

interface Q {
  id: string;
  text: string;
  custom?: boolean;
}
type Selection = Record<string, Q[]>;

const STORAGE_KEY = "kniha-config-v1";
const PRICE_CUSTOM = "1 099 Kč";
const PHASE_COUNT = BOOK_PHASES.length;

function pluralQ(n: number): string {
  if (n === 1) return "otázka";
  if (n >= 2 && n <= 4) return "otázky";
  return "otázek";
}

function buildDefault(): Selection {
  const out: Selection = {};
  for (const p of BOOK_PHASES) {
    out[p.key] = p.questions.filter((q) => q.recommended).map((q) => ({ id: q.id, text: q.text }));
  }
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

  // Persist on every change so rapid clicking never loses work.
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
  const inBook = selection[phase.key] ?? [];
  const inBookIds = new Set(inBook.map((q) => q.id));
  const pool = phase.questions.filter((q) => !inBookIds.has(q.id));

  const addSuggestion = (q: BookQuestion) =>
    setSelection((p) => ({ ...p, [phase.key]: [...(p[phase.key] ?? []), { id: q.id, text: q.text }] }));
  const removeFromBook = (id: string) =>
    setSelection((p) => ({ ...p, [phase.key]: (p[phase.key] ?? []).filter((q) => q.id !== id) }));
  const editInBook = (id: string, text: string) =>
    setSelection((p) => ({
      ...p,
      [phase.key]: (p[phase.key] ?? []).map((q) => (q.id === id ? { ...q, text } : q)),
    }));
  const addCustom = () => {
    customCounter += 1;
    const id = `c-${phase.key}-${customCounter}`;
    setSelection((p) => ({ ...p, [phase.key]: [...(p[phase.key] ?? []), { id, text: "", custom: true }] }));
  };

  if (ordered) {
    return (
      <section className="hero">
        <div className="container" style={{ maxWidth: 640 }}>
          <span className="eyebrow">Hotovo</span>
          <h1 style={{ margin: "0 auto 20px" }}>Skvělé — kniha je sestavená.</h1>
          <p className="lede">
            Vybrali jste <strong>{total}</strong> {pluralQ(total)} napříč šesti životními
            obdobími. Platební brána se dokončuje — tady se brzy přesměrujete na zaplacení
            (1 099 Kč, poštovné zdarma) a my knihu vysázíme a vytiskneme.
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
          Doporučené otázky už ve své knize máte. Klikněte na návrh vlevo a přesune se do
          knihy, nebo si vytvořte vlastní. Spěcháte? Klikněte na <strong>Pokračovat
          k objednávce</strong> kdykoliv.
        </p>
      </header>

      {/* Always-visible order bar — never blocks the path to payment */}
      <div className="kc-bar">
        <span className="kc-bar-count">
          {total} {pluralQ(total)} v knize · vlastní kniha {PRICE_CUSTOM}
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

      {/* Clickable phase pills — jump straight to any phase */}
      <ol className="kc-steps">
        {BOOK_PHASES.map((p, i) => {
          const count = (selection[p.key] ?? []).length;
          return (
            <li key={p.key}>
              <button
                type="button"
                className={i === step && !isRecap ? "is-current" : ""}
                onClick={() => setStep(i)}
              >
                {p.title} <span className="kc-step-num">{count}</span>
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className={isRecap ? "is-current" : ""}
            onClick={() => setStep(PHASE_COUNT)}
          >
            Souhrn
          </button>
        </li>
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
          {total === 0 ? <p className="kc-hint">Vyberte aspoň jednu otázku.</p> : null}
        </section>
      ) : (
        <section className="kc-phase">
          <div className="kc-phase-head">
            <span className="eyebrow">
              Fáze {step + 1}/{PHASE_COUNT}
            </span>
            <h2>{phase.title}</h2>
          </div>

          <div className="kc-cols">
            {/* LEFT — suggestions; click to add to the book */}
            <div className="kc-pool">
              <h3 className="kc-col-title">Navrhované otázky</h3>
              {pool.length === 0 ? (
                <p className="kc-hint">Všechny návrhy už máte v knize. Můžete si přidat vlastní →</p>
              ) : (
                <ul className="kc-pool-list">
                  {pool.map((q) => (
                    <li key={q.id}>
                      <button type="button" className="kc-pool-item" onClick={() => addSuggestion(q)}>
                        <span className="kc-pool-plus" aria-hidden>
                          +
                        </span>
                        <span>{q.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* RIGHT — the book (dark panel); these get printed */}
            <div className="kc-book">
              <h3 className="kc-col-title kc-col-title-light">
                Ve vaší knize <span className="kc-book-count">{inBook.length}</span>
              </h3>
              {inBook.length === 0 ? (
                <p className="kc-book-empty">
                  Zatím prázdné. Klikněte na otázku vlevo, nebo si vytvořte vlastní.
                </p>
              ) : (
                <ul className="kc-book-list">
                  {inBook.map((q, i) => (
                    <li key={q.id} className="kc-book-item">
                      <span className="kc-book-num">{String(i + 1).padStart(2, "0")}</span>
                      <textarea
                        className="kc-book-text"
                        rows={2}
                        value={q.text}
                        placeholder="Napište vlastní otázku…"
                        onChange={(e) => editInBook(q.id, e.target.value)}
                      />
                      <button
                        type="button"
                        className="kc-book-remove"
                        aria-label="Odebrat z knihy"
                        onClick={() => removeFromBook(q.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="kc-book-add" onClick={addCustom}>
                + Vytvořit vlastní otázku
              </button>
            </div>
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

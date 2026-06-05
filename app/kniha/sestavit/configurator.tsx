"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BOOK_PHASES, type BookQuestion } from "@/lib/book-shop/phases";
import { resolveGender, type Gender } from "@/lib/gender";
import { OrderForm } from "./order-form";
import {
  COVER_BG,
  COVER_TEXT,
  COVER_BG_HEX,
  COVER_TEXT_HEX,
  COVER_PREMIUM_CZK,
  DEFAULT_COVER_BG,
  DEFAULT_COVER_TEXT,
  isLegibleCover,
  isPremiumCover,
  defaultTextFor,
  type CoverBg,
  type CoverText,
} from "@/lib/book/cover";

interface Q {
  id: string;
  text: string;
  custom?: boolean;
}
type Selection = Record<string, Q[]>;

const STORAGE_KEY = "kniha-config-v1";
const META_KEY = "kniha-config-meta-v1";
// The configurator ALWAYS builds the custom book (the buyer reorders / adds /
// removes / writes their own questions), so it's always the custom price. The
// cheaper standard book (curated questions, no editing) is bought via its own
// simple checkout at /kniha/objednat. Mirrors priceForProductCzk("shop_book_custom")
// on the server, which stays authoritative. Cover/packaging surcharges add on top.
const PRICE_BASE_CZK = 899;
const PHASE_COUNT = BOOK_PHASES.length;

function pluralQ(n: number): string {
  if (n === 1) return "otázka";
  if (n >= 2 && n <= 4) return "otázky";
  return "otázek";
}

/** Czech price formatting: thin-space thousands + " Kč" (e.g. 1 198 Kč). */
function formatCzk(n: number): string {
  return `${n.toLocaleString("cs-CZ")} Kč`;
}

function buildDefault(): Selection {
  const out: Selection = {};
  for (const p of BOOK_PHASES) {
    out[p.key] = p.questions
      .filter((q) => q.recommended)
      .map((q) => ({ id: q.id, text: q.text }));
  }
  return out;
}

let customCounter = 0;

export function Configurator() {
  const [selection, setSelection] = useState<Selection>(buildDefault);
  const [step, setStep] = useState(0); // 0..PHASE_COUNT-1 = phases · PHASE_COUNT = recap
  const [hydrated, setHydrated] = useState(false);
  // Recap → order form (guest checkout). The confirmation lives on /kniha/hotovo.
  const [showOrder, setShowOrder] = useState(false);
  // Recipient gender drives how the questions address them; cover bg/text are
  // the buyer's cover design. Persisted with the draft (carried to the order).
  const [gender, setGender] = useState<Gender | null>(null);
  const [coverBg, setCoverBg] = useState<CoverBg>(DEFAULT_COVER_BG);
  const [coverText, setCoverText] = useState<CoverText>(DEFAULT_COVER_TEXT);
  // Book-card UX: internal scroll + scroll-to-top button, and drag-to-reorder.
  const bookScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [armedId, setArmedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; below: boolean } | null>(null);

  function chooseCoverBg(bg: CoverBg) {
    setCoverBg(bg);
    setCoverText((t) => (isLegibleCover(bg, t) ? t : defaultTextFor(bg)));
  }

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
    try {
      const meta = localStorage.getItem(META_KEY);
      if (meta) {
        const m = JSON.parse(meta) as { gender?: Gender | null; coverBg?: CoverBg; coverText?: CoverText };
        if (m?.gender === "male" || m?.gender === "female") setGender(m.gender);
        if (m?.coverBg && COVER_BG_HEX[m.coverBg]) setCoverBg(m.coverBg);
        if (m?.coverText && COVER_TEXT_HEX[m.coverText]) setCoverText(m.coverText);
      }
    } catch {
      /* ignore */
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

  // Persist recipient gender + cover design.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(META_KEY, JSON.stringify({ gender, coverBg, coverText }));
    } catch {
      /* ignore */
    }
  }, [gender, coverBg, coverText, hydrated]);

  const total = useMemo(
    () => Object.values(selection).reduce((n, qs) => n + qs.length, 0),
    [selection],
  );

  // Display price = base (always the custom book) + premium-cover surcharge.
  // Gift wrapping (+290) is chosen in the order form, so it's added to the total
  // there; here we show the book + cover. The server recomposes the authoritative
  // amount at checkout.
  const basePriceCzk = PRICE_BASE_CZK;
  const coverSurcharge = isPremiumCover(coverBg) ? COVER_PREMIUM_CZK : 0;
  const priceLabel = formatCzk(basePriceCzk + coverSurcharge);

  const isRecap = step >= PHASE_COUNT;
  const phase = BOOK_PHASES[Math.min(step, PHASE_COUNT - 1)]!;
  const inBook = selection[phase.key] ?? [];
  const inBookIds = new Set(inBook.map((q) => q.id));
  const pool = phase.questions.filter((q) => !inBookIds.has(q.id));

  const scrollBookTop = () => bookScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  // New questions go to the TOP of the book (newest first, in view).
  const addSuggestion = (q: BookQuestion) => {
    setSelection((p) => ({
      ...p,
      [phase.key]: [{ id: q.id, text: q.text }, ...(p[phase.key] ?? [])],
    }));
    scrollBookTop();
  };
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
    setSelection((p) => ({ ...p, [phase.key]: [{ id, text: "", custom: true }, ...(p[phase.key] ?? [])] }));
    scrollBookTop();
  };
  // Drag-to-reorder within the current phase (handle-armed; see kc-book-grip).
  function reorder(fromId: string, toId: string, below: boolean) {
    if (fromId === toId) return;
    setSelection((p) => {
      const arr = [...(p[phase.key] ?? [])];
      const from = arr.findIndex((q) => q.id === fromId);
      const toIdx = arr.findIndex((q) => q.id === toId);
      if (from < 0 || toIdx < 0) return p;
      let target = below ? toIdx + 1 : toIdx;
      const moved = arr.splice(from, 1)[0];
      if (!moved) return p;
      if (from < target) target -= 1; // removal shifted indices after `from`
      arr.splice(target, 0, moved);
      return { ...p, [phase.key]: arr };
    });
  }

  // All navigation goes through here so leaving the order step always clears it
  // (otherwise returning to "Souhrn" would re-open the form).
  function goToStep(s: number) {
    setShowOrder(false);
    setStep(s);
  }

  return (
    <div className="kc-shell">
      {/* ── Slim top bar ── */}
      <header className="kc-top">
        <div className="kc-top-l">
          <Link href="/kniha" className="kc-top-back">
            ← Kniha
          </Link>
          <span className="kc-top-title">Sestavte si knihu</span>
        </div>

        <div className="kc-top-gender">
          <span className="kc-top-gender-label">Pro koho:</span>
          {([["female", "Ženu"], ["male", "Muže"]] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`kc-gender-btn${gender === val ? " is-on" : ""}`}
              onClick={() => setGender(val)}
              aria-pressed={gender === val}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="kc-top-r">
          <div className="kc-top-price">
            <span className="kc-top-price-count">{total} {pluralQ(total)}</span>
            <span className="kc-top-price-amount">{priceLabel}</span>
          </div>
          {isRecap ? (
            <button type="button" className="btn btn-outline kc-top-cta" onClick={() => goToStep(0)}>
              Upravit otázky <span className="arrow">↗</span>
            </button>
          ) : (
            <button type="button" className="btn btn-gold kc-top-cta" onClick={() => goToStep(PHASE_COUNT)}>
              K objednávce <span className="arrow">↗</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Phase pills ── */}
      <nav className="kc-steps" aria-label="Životní fáze">
        <ol>
          {BOOK_PHASES.map((p, i) => (
            <li key={p.key}>
              <button
                type="button"
                className={i === step && !isRecap ? "is-current" : ""}
                onClick={() => goToStep(i)}
              >
                {/* Sequential life-phase number (the badge is the order, not a count). */}
                <span className="kc-step-num">{i + 1}</span> {p.title}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={isRecap ? "is-current" : ""}
              onClick={() => goToStep(PHASE_COUNT)}
            >
              Souhrn
            </button>
          </li>
        </ol>
      </nav>

      {/* ── Main (fills remaining height) ── */}
      <main className="kc-main">
        {isRecap && showOrder ? (
          <OrderForm
            total={total}
            pluralQ={pluralQ}
            basePriceCzk={basePriceCzk}
            coverSurchargeCzk={coverSurcharge}
            formatCzk={formatCzk}
            onBack={() => setShowOrder(false)}
          />
        ) : isRecap ? (
          <section className="kc-recap">
            <div className="kc-recap-card">
              {/* Cover — live preview (the visual) with the design controls beneath */}
              <div className="kc-recap-cover">
                <div
                  aria-hidden
                  className="kc-cover-preview"
                  style={{ background: COVER_BG_HEX[coverBg] }}
                >
                  <div
                    className="kc-cover-frame"
                    style={{ borderColor: COVER_TEXT_HEX[coverText], color: COVER_TEXT_HEX[coverText] }}
                  >
                    <span className="kc-cover-eyebrow">Kniha vzpomínek</span>
                    <span className="kc-cover-title">Zajímá mě tvůj příběh.</span>
                  </div>
                </div>
                <div className="kc-cover-controls">
                  <p className="kc-cover-label">Barva přebalu</p>
                  <div className="kc-swatches">
                    {COVER_BG.map((o) => {
                      const premium = isPremiumCover(o.value);
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => chooseCoverBg(o.value)}
                          aria-pressed={coverBg === o.value}
                          title={premium ? `${o.label} — příplatek ${COVER_PREMIUM_CZK} Kč` : `${o.label} — v ceně`}
                          className={`kc-swatch${coverBg === o.value ? " is-on" : ""}`}
                          style={{ background: o.hex }}
                        >
                          {premium ? (
                            <span className="kc-swatch-price">+{COVER_PREMIUM_CZK} Kč</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <p className="kc-cover-label">Barva textu</p>
                  <div className="kc-text-opts">
                    {COVER_TEXT.map((o) => {
                      const ok = isLegibleCover(coverBg, o.value);
                      return (
                        <button
                          key={o.value}
                          type="button"
                          disabled={!ok}
                          onClick={() => setCoverText(o.value)}
                          aria-pressed={coverText === o.value}
                          title={ok ? o.label : `${o.label} — nečitelné na této barvě`}
                          className={`kc-text-opt${coverText === o.value ? " is-on" : ""}`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Summary + price + order */}
              <div className="kc-recap-summary">
                <h2>Souhrn vaší knihy</h2>
                <ul className="kc-recap-list">
                  {BOOK_PHASES.map((p) => (
                    <li key={p.key}>
                      <span>{p.title}</span>
                      <span className="kc-recap-num">
                        {(selection[p.key] ?? []).length} {pluralQ((selection[p.key] ?? []).length)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="kc-recap-prices">
                  <div className="kc-recap-priceline">
                    <span>Kniha na míru</span>
                    <span>{formatCzk(basePriceCzk)}</span>
                  </div>
                  {/* Always rendered so picking a colour fills the value in
                      place instead of inserting a row and shifting the layout. */}
                  <div className="kc-recap-priceline">
                    <span>Barevný přebal</span>
                    <span className={coverSurcharge > 0 ? undefined : "kc-recap-muted"}>
                      {coverSurcharge > 0 ? `+${formatCzk(coverSurcharge)}` : "v ceně"}
                    </span>
                  </div>
                </div>
                <div className="kc-recap-total">
                  <span>Celkem {total} {pluralQ(total)}</span>
                  <strong>{priceLabel}</strong>
                </div>
                <button
                  type="button"
                  className="btn btn-gold btn-gold-full"
                  onClick={() => setShowOrder(true)}
                  disabled={total === 0}
                >
                  Pokračovat k objednávce <span className="arrow">↗</span>
                </button>
                {total === 0 ? <p className="kc-hint">Vyberte aspoň jednu otázku.</p> : null}
              </div>
            </div>
          </section>
        ) : (
          <div className="kc-cols">
            {/* LEFT — suggestions; click to add to the book */}
            <div className="kc-pool">
              <h3 className="kc-col-title">Navrhované otázky</h3>
              <div className="kc-pool-scroll">
                {pool.length === 0 ? (
                  <p className="kc-hint">Všechny návrhy už máte v knize. Můžete si přidat vlastní →</p>
                ) : (
                  <ul className="kc-pool-list">
                    {pool.map((q) => (
                      <li key={q.id}>
                        <button type="button" className="kc-pool-item" onClick={() => addSuggestion(q)}>
                          <span className="kc-pool-text">{resolveGender(q.text, gender)}</span>
                          <span className="kc-pool-plus" aria-hidden>
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M8 2.6V13.4M2.6 8H13.4"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* RIGHT — the book (dark panel); these get printed */}
            <div className="kc-book">
              <h3 className="kc-col-title kc-col-title-light">
                Ve vaší knize <span className="kc-book-count">{inBook.length}</span>
              </h3>
              <div
                className="kc-book-scroll"
                ref={bookScrollRef}
                onScroll={(e) => setShowScrollTop(e.currentTarget.scrollTop > 140)}
              >
                {inBook.length === 0 ? (
                  <p className="kc-book-empty">
                    Zatím prázdné. Klikněte na otázku vlevo, nebo si vytvořte vlastní.
                  </p>
                ) : (
                  <ul className="kc-book-list">
                    {inBook.map((q, i) => (
                      <li
                        key={q.id}
                        className={`kc-book-item${dragId === q.id ? " is-dragging" : ""}${
                          dropTarget && dropTarget.id === q.id && dragId !== q.id
                            ? dropTarget.below
                              ? " kc-drop-below"
                              : " kc-drop-above"
                            : ""
                        }`}
                        draggable={armedId === q.id}
                        onDragStart={(e) => {
                          setDragId(q.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (!dragId || dragId === q.id) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const below = e.clientY > rect.top + rect.height / 2;
                          setDropTarget((d) =>
                            d && d.id === q.id && d.below === below ? d : { id: q.id, below },
                          );
                        }}
                        onDrop={() => {
                          if (dragId) reorder(dragId, q.id, dropTarget?.below ?? false);
                          setDropTarget(null);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setArmedId(null);
                          setDropTarget(null);
                        }}
                      >
                        <span
                          className="kc-book-grip"
                          title="Přetažením změníte pořadí"
                          aria-label="Přesunout otázku"
                          onMouseDown={() => setArmedId(q.id)}
                          onMouseUp={() => setArmedId(null)}
                        >
                          <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden>
                            <g fill="currentColor">
                              <circle cx="2.5" cy="3" r="1.3" />
                              <circle cx="7.5" cy="3" r="1.3" />
                              <circle cx="2.5" cy="8" r="1.3" />
                              <circle cx="7.5" cy="8" r="1.3" />
                              <circle cx="2.5" cy="13" r="1.3" />
                              <circle cx="7.5" cy="13" r="1.3" />
                            </g>
                          </svg>
                        </span>
                        <span className="kc-book-num">{String(i + 1).padStart(2, "0")}</span>
                        <textarea
                          className="kc-book-text"
                          rows={2}
                          value={resolveGender(q.text, gender)}
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
              </div>
              {showScrollTop ? (
                <button type="button" className="kc-book-totop" onClick={scrollBookTop} aria-label="Nahoru">
                  ↑
                </button>
              ) : null}
              <button type="button" className="kc-book-add" onClick={addCustom}>
                + Vytvořit vlastní otázku
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Slim bottom nav (phase steps only) ── */}
      {!isRecap ? (
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
      ) : null}
    </div>
  );
}

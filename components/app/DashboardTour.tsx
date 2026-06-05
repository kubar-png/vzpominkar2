"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * First-run guided tour for the owner dashboard. A few coachmark steps that
 * spotlight a real element (dim everything else) with an editorial popover, plus
 * centered intro/outro cards. Always skippable (X, "Přeskočit", Esc). Shows once
 * — completion is remembered in localStorage; `?tour=1` replays it (for testing
 * and a future "spustit prohlídku" link). Built on-brand, no tour library.
 */

const STORAGE_KEY = "vzp:dashboard-tour:v1";
const POPOVER_W = 344;

interface TourStep {
  /** Target element(s) — first visible one wins. Omit for a centered card. */
  selector?: string[];
  eyebrow: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    eyebrow: "Vítejte",
    title: "Tady vznikne kniha vzpomínek.",
    body: "Za chvilku vám ukážeme, kde co najdete. Je to na pár vteřin a kdykoliv můžete prohlídku zavřít.",
  },
  {
    selector: ['[data-tour="add-storyteller"]'],
    eyebrow: "Krok 1",
    title: "Začněte vypravěčem.",
    body: "Přidáte blízkého a vytvoříte mu jednoduchý přístup — jméno a heslo, žádný e-mail. Pak už mu chodí otázky a stačí, aby vyprávěl.",
  },
  {
    selector: ['[data-tour="nav"]', '[data-tour="mobile-menu"]'],
    eyebrow: "Krok 2",
    title: "Vaše rozcestí.",
    body: "Odsud se dostanete k rodině, otázkám i ke knize, která postupně vzniká z odpovědí. Nic složitého — jen to, co je zrovna potřeba.",
  },
  {
    eyebrow: "A to je vše",
    title: "Zbytek se stane skoro sám.",
    body: "Jakmile začne vyprávění, objeví se na Domů a samo se skládá do knihy. Přejeme hezké vzpomínky.",
  },
];

function firstVisible(selectors: string[] | undefined): HTMLElement | null {
  if (!selectors) return null;
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function DashboardTour() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const popRef = useRef<HTMLDivElement>(null);

  // Decide whether to show after mount (avoids SSR/localStorage mismatch).
  useEffect(() => {
    setMounted(true);
    let forced = false;
    try {
      forced = new URLSearchParams(window.location.search).get("tour") === "1";
    } catch {
      /* ignore */
    }
    let seen = false;
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) === "done";
    } catch {
      /* ignore — show by default if storage is unavailable */
    }
    if (forced || !seen) {
      // Let the dashboard (and its Suspense islands) paint first.
      const t = window.setTimeout(() => setActive(true), 650);
      return () => window.clearTimeout(t);
    }
  }, []);

  const finish = useCallback(() => {
    setActive(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "done");
    } catch {
      /* ignore */
    }
    // Let a follow-up (the first-prompt popup) chain in after the tour closes.
    try {
      window.dispatchEvent(new CustomEvent("vzp:tour-finished"));
    } catch {
      /* ignore */
    }
  }, []);

  // Measure the current step's target + position the popover.
  const measure = useCallback(() => {
    const step = STEPS[index];
    const el = firstVisible(step?.selector);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect(r);
  }, [index]);

  // On step change: scroll target into view, then measure.
  useEffect(() => {
    if (!active) return;
    const step = STEPS[index];
    const el = firstVisible(step?.selector);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = window.setTimeout(measure, el ? 320 : 0);
    return () => window.clearTimeout(t);
  }, [active, index, measure]);

  // Reposition on resize/scroll.
  useEffect(() => {
    if (!active) return;
    const onMove = () => measure();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [active, measure]);

  // Esc to skip.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index]);

  // Compute popover position from the target rect + the popover's own size.
  useLayoutEffect(() => {
    if (!active) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popH = popRef.current?.offsetHeight ?? 200;
    const w = Math.min(POPOVER_W, vw - 32);
    const m = 16;

    if (!rect) {
      setPos({ top: Math.max(m, (vh - popH) / 2), left: (vw - w) / 2 });
      return;
    }
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = vw - rect.right;
    const spaceLeft = rect.left;

    let top: number;
    let left: number;
    if (spaceBelow >= popH + m) {
      top = rect.bottom + m;
      left = clamp(rect.left + rect.width / 2 - w / 2, m, vw - w - m);
    } else if (spaceRight >= w + m) {
      left = rect.right + m;
      top = clamp(rect.top + rect.height / 2 - popH / 2, m, vh - popH - m);
    } else if (spaceAbove >= popH + m) {
      top = rect.top - popH - m;
      left = clamp(rect.left + rect.width / 2 - w / 2, m, vw - w - m);
    } else if (spaceLeft >= w + m) {
      left = rect.left - w - m;
      top = clamp(rect.top + rect.height / 2 - popH / 2, m, vh - popH - m);
    } else {
      top = Math.max(m, (vh - popH) / 2);
      left = (vw - w) / 2;
    }
    setPos({ top, left });
  }, [active, rect, index]);

  function next() {
    setIndex((i) => {
      if (i >= STEPS.length - 1) {
        finish();
        return i;
      }
      return i + 1;
    });
  }
  function back() {
    setIndex((i) => Math.max(0, i - 1));
  }

  if (!mounted || !active) return null;
  const step = STEPS[index];
  if (!step) return null;

  const w = Math.min(POPOVER_W, window.innerWidth - 32);
  const isLast = index === STEPS.length - 1;
  const ring = 6;

  return (
    <div className="vzp-tour" role="dialog" aria-modal="true" aria-label="Prohlídka aplikace">
      {/* Dimmer + spotlight. With a target: a transparent box whose huge
          box-shadow dims everything around it. Without: a flat dim. */}
      {rect ? (
        <div
          className="vzp-tour-spot"
          style={{
            top: rect.top - ring,
            left: rect.left - ring,
            width: rect.width + ring * 2,
            height: rect.height + ring * 2,
          }}
        />
      ) : (
        <div className="vzp-tour-dim" />
      )}

      {/* Click-catcher — blocks interaction with the app underneath. */}
      <div className="vzp-tour-catch" onClick={() => {}} />

      {/* Popover */}
      <div
        ref={popRef}
        className="vzp-tour-pop"
        style={{ top: pos.top, left: pos.left, width: w }}
      >
        <button type="button" className="vzp-tour-x" onClick={finish} aria-label="Zavřít prohlídku">
          <X size={16} />
        </button>
        <span className="vzp-tour-eyebrow">{step.eyebrow}</span>
        <h3 className="vzp-tour-title">{step.title}</h3>
        <p className="vzp-tour-body">{step.body}</p>

        <div className="vzp-tour-foot">
          <button type="button" className="vzp-tour-skip" onClick={finish}>
            Přeskočit
          </button>
          <div className="vzp-tour-dots" aria-hidden>
            {STEPS.map((_, i) => (
              <span key={i} className={i === index ? "is-on" : ""} />
            ))}
          </div>
          <div className="vzp-tour-nav">
            {index > 0 ? (
              <Button variant="ghost" size="sm" onClick={back}>
                Zpět
              </Button>
            ) : null}
            <Button variant="primary" size="sm" onClick={next}>
              {isLast ? "Hotovo" : "Další"}
              <span aria-hidden>{isLast ? "" : "↗"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

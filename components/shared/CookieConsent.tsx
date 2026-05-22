"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "vzp-cookie-consent";
type Choice = "essential" | "all";

/**
 * Cookie consent bar — GDPR / ePrivacy notice.
 * Bottom-sticky, editorial cream, two buttons (Pouze nezbytné / Souhlasím)
 * + link to /cookies for the full policy. Persists choice in localStorage.
 * If the user revisits, the bar stays hidden unless they reset.
 *
 * No tracking SDKs are wired up yet, so the bar is mostly preventive
 * compliance. Once analytics arrives, gate them behind the 'all' choice.
 */
export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setOpen(true);
    } catch {
      // If localStorage is blocked we still show the banner once per session
      setOpen(true);
    }
  }, []);

  function decide(choice: Choice) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: new Date().toISOString() }),
      );
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!mounted || !open) return null;

  return (
    <div className="cookie-bar" role="dialog" aria-label="Souhlas s cookies" aria-live="polite">
      <div className="cookie-bar-inner">
        <div className="cookie-bar-copy">
          <p className="cookie-bar-title">Pár drobečků v paměti</p>
          <p className="cookie-bar-body">
            Používáme jen technické cookies, které drží přihlášení a hladký
            chod aplikace. Pokud chcete, můžete povolit i ty, které nám
            pomáhají vylepšovat web. Více najdete v{" "}
            <Link href="/cookies" className="cookie-bar-link">zásadách cookies</Link>.
          </p>
        </div>
        <div className="cookie-bar-actions">
          <button
            type="button"
            onClick={() => decide("essential")}
            className="cookie-bar-btn cookie-bar-btn-outline"
          >
            Pouze nezbytné
          </button>
          <button
            type="button"
            onClick={() => decide("all")}
            className="cookie-bar-btn cookie-bar-btn-gold"
          >
            Souhlasím se vším <span className="cookie-bar-arrow" aria-hidden>↗</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PrimaryCta } from "./PrimaryCta";
import { MARKETING_NAV } from "./nav";

export function HomeMobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Otevřít menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="mobile-menu-trigger"
      >
        <span className="mobile-menu-bars" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <span>Menu</span>
      </button>

      {open && mounted && createPortal(
        <div className="editorial">
          <div
            className="mobile-menu-backdrop"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="mobile-menu-overlay" role="dialog" aria-modal="true">
          <div className="mobile-menu-head">
            <Link
              href="/"
              className="logo"
              aria-label="Vzpomínkář — domů"
              onClick={() => setOpen(false)}
            >
              <span className="logo-mark" aria-hidden="true" />
            </Link>
            <button
              type="button"
              aria-label="Zavřít menu"
              onClick={() => setOpen(false)}
              className="mobile-menu-close"
            >
              ✕
            </button>
          </div>

          <span className="mobile-menu-eyebrow">Navigace</span>
          <nav className="mobile-menu-links" aria-label="Hlavní navigace">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-menu-actions">
            <span className="mobile-menu-eyebrow">Začněte zde</span>
            <Link
              href="/login"
              className="btn btn-outline"
              onClick={() => setOpen(false)}
            >
              Přihlášení <span className="arrow">↗</span>
            </Link>
            <PrimaryCta onClick={() => setOpen(false)} />
          </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

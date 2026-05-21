"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

const NAV: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Jak to funguje", href: "/jak-to-funguje" },
  { label: "Ceník", href: "/cenik" },
  { label: "Jako dárek", href: "/darek" },
  { label: "FAQ", href: "/faq" },
] as const;

export function MarketingMobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  /* Close on route change */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Burger trigger - set in the display serif so it matches the heading
       * face rather than a generic hamburger glyph. */}
      <button
        type="button"
        aria-label="Otevřít menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="group md:hidden inline-flex h-11 items-center gap-2.5 rounded-full px-3 text-[var(--color-navy-900)] transition-colors hover:bg-[var(--color-paper-200)]"
      >
        <span aria-hidden className="flex flex-col items-end gap-[5px]">
          <span className="block h-px w-6 bg-current transition-all group-hover:w-5" />
          <span className="block h-px w-4 bg-current transition-all group-hover:w-6" />
        </span>
        <span className="font-[family-name:var(--font-display)] text-base">
          Menu
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Hlavní menu"
        >
          {/* Backdrop - fades in over the left 20% area. Tap to close. */}
          <button
            type="button"
            aria-label="Zavřít menu"
            onClick={() => setOpen(false)}
            className="mmm-backdrop absolute inset-0 bg-[var(--color-navy-950)]/55"
          />

          {/* Drawer - slides in from the right at 80% width. Navy canvas with
           * cream/gold accents to feel like the inside cover of a book. */}
          <div
            className="mmm-panel absolute right-0 top-0 flex h-[100dvh] w-[82%] max-w-[420px] flex-col overflow-hidden bg-[var(--color-navy-900)] text-[var(--color-paper-100)] shadow-2xl"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {/* Atmospheric layers - radial glow + paper-grain over the navy
             * so it doesn't read as a flat slab. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 50% at 90% -10%, rgba(201, 169, 73, 0.20), transparent 55%), radial-gradient(80% 40% at 10% 110%, rgba(208, 0, 0, 0.10), transparent 65%)",
              }}
            />

            {/* Top chrome - logo (inverted) + close */}
            <div className="relative flex items-center justify-between px-6 pt-4">
              <Logo variant="wordmark" href="/" size={26} invert />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Zavřít menu"
                className="group inline-flex h-11 items-center gap-2 rounded-full px-3 text-[var(--color-paper-100)] transition-colors hover:bg-[var(--color-navy-800)]"
              >
                <span className="font-[family-name:var(--font-display)] text-base">
                  Zavřít
                </span>
                <X size={18} className="transition-transform group-hover:rotate-90" />
              </button>
            </div>

            {/* Nav list - clean column on dark canvas */}
            <nav className="relative flex-1 overflow-y-auto px-6 pt-8">
              <ul className="flex flex-col">
                {NAV.map((item, i) => (
                  <li
                    key={item.href}
                    className="mmm-item border-b border-[var(--color-navy-700)] last:border-b-0"
                    style={{ animationDelay: `${120 + i * 70}ms` }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="group relative flex items-center justify-between py-5"
                    >
                      <span className="font-[family-name:var(--font-display)] text-[1.75rem] font-medium leading-[1.1] text-[var(--color-paper-50)] transition-colors group-hover:text-[var(--color-gold-300)]">
                        {item.label}
                      </span>
                      <span
                        aria-hidden
                        className="text-[var(--color-paper-400)] transition-all group-hover:translate-x-1 group-hover:text-[var(--color-paper-50)]"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Foot - primary conversion CTA pinned to the bottom in oxblood
             * so it's the unambiguous focal point of the menu. */}
            <div
              className="mmm-item relative border-t border-[var(--color-navy-700)] px-6 pb-6 pt-6"
              style={{ animationDelay: `${120 + (NAV.length + 2) * 70}ms` }}
            >
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold-400)]/60 to-transparent"
              />
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="group relative flex items-center justify-between overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--color-heritage-red)] px-6 py-5 text-[var(--color-paper-50)] shadow-md transition-transform hover:-translate-y-0.5"
              >
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.32em] text-[var(--color-gold-200)]">
                    Začít psát knihu
                  </span>
                  <span className="mt-1 block font-[family-name:var(--font-display)] text-xl font-medium">
                    Začít zdarma
                  </span>
                </span>
                <span
                  aria-hidden
                  className="text-2xl transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-4 block text-center font-[family-name:var(--font-display)] text-base text-[var(--color-paper-200)] underline-offset-[6px] hover:underline"
              >
                Přihlášení do účtu
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .mmm-backdrop {
          animation: mmm-fade 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mmm-panel {
          animation: mmm-slide-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mmm-item {
          animation: mmm-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
          opacity: 0;
        }
        @keyframes mmm-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes mmm-slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes mmm-rise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mmm-backdrop,
          .mmm-panel,
          .mmm-item {
            animation-duration: 1ms !important;
            animation-delay: 0ms !important;
          }
        }
      `}</style>
    </>
  );
}

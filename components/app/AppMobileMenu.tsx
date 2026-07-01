"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Users, MessageSquare, BookOpen, Settings, LogOut, Archive } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

interface AppMobileMenuProps {
  familyId: string | null;
  displayName: string | null;
  email: string | null;
}

interface NavItem {
  numeral: string;
  href: string;
  label: string;
  icon: React.ElementType;
  requiresFamily?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { numeral: "I",   href: "/dashboard",        label: "Domů",       icon: Home },
  { numeral: "II",  href: "FAMILY/memories",   label: "Vzpomínky",  icon: Archive,       requiresFamily: true },
  { numeral: "III", href: "FAMILY/rodina",     label: "Rodina",     icon: Users,         requiresFamily: true },
  { numeral: "IV",  href: "FAMILY/prompts",    label: "Otázky",     icon: MessageSquare, requiresFamily: true },
  { numeral: "V",   href: "FAMILY/book",       label: "Kniha",      icon: BookOpen,      requiresFamily: true },
  { numeral: "VI",  href: "/settings",         label: "Nastavení",  icon: Settings },
];

export function AppMobileMenu({ familyId, displayName, email }: AppMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // While open: lock body scroll (preserving any prior overflow value so we
  // don't clobber styles set by other code) and close on Escape so the drawer
  // behaves as an accessible modal dialog.
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

  function resolveHref(item: NavItem): string {
    if (!item.requiresFamily || !familyId) return item.href;
    return `/family/${familyId}/${item.href.replace("FAMILY/", "")}`;
  }

  function isActive(item: NavItem): boolean {
    const href = resolveHref(item);
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Top header bar - mobile only */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[#16263f] bg-[#1B2E4D]/95 px-5 backdrop-blur-sm md:hidden">
        <Link
          href="/dashboard"
          aria-label="Vzpomínkář — domovská stránka"
          className="inline-flex"
        >
          <Logo variant="full" tone="offwhite" height={24} />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-tour="mobile-menu"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-paper-100)] transition-colors hover:bg-[#16263f]"
          aria-label="Otevřít menu"
          aria-expanded={open}
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Drawer + backdrop — rendered only while open (and after mount) so the
          menu is not in the DOM, and therefore not tab-focusable, when closed.
          Portaled to <body> and marked as a modal dialog for assistive tech. */}
      {open && mounted && createPortal(
        <div className="md:hidden">
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
      />

      {/* Drawer - slides from right. Navy matches desktop sidebar. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigace"
        className="fixed inset-y-0 right-0 z-50 flex w-[280px] flex-col bg-[#1B2E4D]"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <Logo variant="full" tone="offwhite" height={20} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-paper-300)] transition-colors hover:bg-[#16263f] hover:text-[var(--color-paper-50)]"
            aria-label="Zavřít menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Decorative rule */}
        <div className="mx-5 mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--color-paper-200)]/15" />
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden fill="none">
            <path d="M4 0.5 L7.5 4 L4 7.5 L0.5 4 Z" stroke="var(--color-gold-400)" strokeWidth="1" />
          </svg>
          <span className="h-px flex-1 bg-[var(--color-paper-200)]/15" />
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-1">
          {NAV_ITEMS.map((item) => {
            const href = resolveHref(item);
            const disabled = item.requiresFamily && !familyId;
            const active = isActive(item);
            const Icon = item.icon;

            const classes = cn(
              "group relative mx-3 flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 transition-colors",
              active
                ? "bg-[#16263f] text-[var(--color-paper-50)]"
                : disabled
                  ? "cursor-default text-[var(--color-paper-300)] opacity-40"
                  : "text-[var(--color-paper-200)] hover:bg-[#16263f] hover:text-[var(--color-paper-50)]",
            );

            const content = (
              <>
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#CF364C]"
                  />
                )}
                <span
                  className={cn(
                    "w-7 shrink-0 font-[family-name:var(--font-display)] text-[10px]",
                    active
                      ? "text-[#CF364C]"
                      : "text-[var(--color-paper-400)] group-hover:text-[#CF364C]",
                  )}
                >
                  {item.numeral}.
                </span>
                <Icon size={16} aria-hidden className={active ? "text-[var(--color-paper-100)]" : ""} />
                <span className="text-sm font-medium">{item.label}</span>
              </>
            );

            return disabled ? (
              <span
                key={item.numeral}
                className={classes}
                title="Nejprve dokončete nastavení rodiny"
                aria-disabled="true"
              >
                {content}
              </span>
            ) : (
              <Link
                key={item.numeral}
                href={href}
                className={classes}
                aria-current={active ? "page" : undefined}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        {/* User strip */}
        <div className="border-t border-[var(--color-paper-200)]/12 px-6 py-5">
          <Link
            href="/settings"
            className="font-[family-name:var(--font-display)] text-[15px] text-[var(--color-paper-200)] transition-colors hover:text-[var(--color-gold-400)]"
          >
            {displayName ?? email ?? ""}
          </Link>
          <form action={signOut} className="mt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs text-[var(--color-paper-300)] transition-colors hover:text-[var(--color-gold-400)]"
            >
              <LogOut size={12} aria-hidden />
              Odhlásit se
            </button>
          </form>
        </div>
      </div>
        </div>,
        document.body,
      )}
    </>
  );
}

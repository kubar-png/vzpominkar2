"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Users, MessageSquare, BookOpen, Settings, LogOut, Archive } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { signOut } from "@/lib/auth/actions";
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
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when open - preserve any prior overflow value
  // so we don't clobber styles set by other code.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
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
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-5 backdrop-blur-sm md:hidden">
        <Logo variant="wordmark" href="/dashboard" size={18} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-navy-900)] transition-colors hover:bg-[var(--color-paper-200)]"
          aria-label="Otevřít menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Backdrop */}
      <div
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-[var(--color-navy-950)]/50 backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(false)}
      />

      {/* Drawer - slides from right */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[280px] flex-col bg-[var(--color-navy-950)] transition-transform duration-300 ease-[var(--ease-out-quart)] md:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <div className="flex items-center gap-2 opacity-60">
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden fill="none">
              <path d="M4 0.5 L7.5 4 L4 7.5 L0.5 4 Z" stroke="var(--color-gold-400)" strokeWidth="1" />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-paper-500)]">
              Vzpomínkář
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-paper-600)] transition-colors hover:bg-[var(--color-navy-800)] hover:text-[var(--color-paper-200)]"
            aria-label="Zavřít menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Decorative rule */}
        <div className="mx-5 mb-4 flex items-center gap-3 opacity-40">
          <span className="h-px flex-1 bg-[var(--color-navy-700)]" />
          <svg width="6" height="6" viewBox="0 0 8 8" aria-hidden fill="none">
            <path d="M4 0.5 L7.5 4 L4 7.5 L0.5 4 Z" stroke="var(--color-gold-400)" strokeWidth="1" />
          </svg>
          <span className="h-px flex-1 bg-[var(--color-navy-700)]" />
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-1">
          {NAV_ITEMS.map((item) => {
            const href = resolveHref(item);
            const disabled = item.requiresFamily && !familyId;
            const active = isActive(item);
            const Icon = item.icon;

            const classes = cn(
              "relative mx-3 flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 transition-colors",
              active
                ? "bg-[var(--color-navy-800)] text-[var(--color-paper-50)]"
                : disabled
                  ? "cursor-default text-[var(--color-navy-700)] opacity-40"
                  : "text-[var(--color-paper-500)] hover:bg-[var(--color-navy-800)] hover:text-[var(--color-paper-100)]",
            );

            const content = (
              <>
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--color-gold-400)]"
                  />
                )}
                <span
                  className={cn(
                    "w-7 shrink-0 font-[family-name:var(--font-display)] text-[10px]",
                    active
                      ? "text-[var(--color-gold-300)]"
                      : "text-[var(--color-navy-600)]",
                  )}
                >
                  {item.numeral}.
                </span>
                <Icon size={15} aria-hidden className={active ? "text-[var(--color-paper-200)]" : ""} />
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
              <Link key={item.numeral} href={href} className={classes}>{content}</Link>
            );
          })}
        </nav>

        {/* User strip */}
        <div className="border-t border-[var(--color-navy-800)] px-5 py-5">
          <p className="font-[family-name:var(--font-display)] text-sm text-[var(--color-paper-400)]">
            {displayName ?? email ?? ""}
          </p>
          <form action={signOut} className="mt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs text-[var(--color-navy-600)] transition-colors hover:text-[var(--color-paper-400)]"
            >
              <LogOut size={10} aria-hidden />
              Odhlásit se
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

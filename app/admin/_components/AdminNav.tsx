"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Activity,
  Magnet,
  LogOut,
} from "lucide-react";
import { logoutAdmin } from "@/lib/admin/actions";

/**
 * Admin navigation — a dark, monochrome left column on desktop and a sticky top
 * bar on mobile. Section links preserve the current `?period=` so the chosen
 * window carries across sections. Logout posts the `logoutAdmin` server action.
 */
type NavItem = { href: string; label: string; icon: ElementType; exact?: boolean };

const NAV: NavItem[] = [
  { href: "/admin", label: "Přehled", icon: LayoutDashboard, exact: true },
  { href: "/admin/obchod", label: "Obchod", icon: ShoppingBag },
  { href: "/admin/uzivatele", label: "Uživatelé", icon: Users },
  { href: "/admin/aktivita", label: "Aktivita", icon: Activity },
  { href: "/admin/leady", label: "Leady", icon: Magnet },
];

function useActive() {
  const pathname = usePathname();
  const params = useSearchParams();
  const period = params.get("period");
  const suffix = period ? `?period=${period}` : "";
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return { suffix, isActive };
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold text-white">
        Vzpomínkář
      </span>
      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
        Admin
      </span>
    </div>
  );
}

function LogoutButton({ subtle }: { subtle?: boolean }) {
  return (
    <form action={logoutAdmin}>
      <button
        type="submit"
        className={
          subtle
            ? "flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            : "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        }
      >
        <LogOut size={16} aria-hidden />
        Odhlásit se
      </button>
    </form>
  );
}

export function AdminNav() {
  const { suffix, isActive } = useActive();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-zinc-950 px-3 py-5 md:flex">
        <div className="px-3 pb-6">
          <Wordmark />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={`${href}${suffix}`}
                aria-current={active ? "page" : undefined}
                className={
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white")
                }
              >
                <Icon size={17} aria-hidden className="shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 pt-3">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Wordmark />
          <LogoutButton subtle />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={`${href}${suffix}`}
                aria-current={active ? "page" : undefined}
                className={
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                  (active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white")
                }
              >
                <Icon size={15} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}

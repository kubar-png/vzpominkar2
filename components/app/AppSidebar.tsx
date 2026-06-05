"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare, BookOpen, Settings, LogOut, Archive } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
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
  { numeral: "I",   href: "/dashboard",        label: "Domů",            icon: Home },
  { numeral: "II",  href: "FAMILY/memories",   label: "Vzpomínky",       icon: Archive,       requiresFamily: true },
  { numeral: "III", href: "FAMILY/rodina",     label: "Rodina",          icon: Users,         requiresFamily: true },
  { numeral: "IV",  href: "FAMILY/prompts",    label: "Otázky",          icon: MessageSquare, requiresFamily: true },
  { numeral: "V",   href: "FAMILY/book",       label: "Kniha",           icon: BookOpen,      requiresFamily: true },
];

const SETTINGS_ITEM: NavItem = { numeral: "VI", href: "/settings", label: "Nastavení", icon: Settings };

export function AppSidebar({ familyId, displayName, email }: AppSidebarProps) {
  const pathname = usePathname();

  function resolveHref(item: NavItem): string {
    if (!item.requiresFamily) return item.href;
    return `/family/${familyId}/${item.href.replace("FAMILY/", "")}`;
  }

  function isActive(item: NavItem): boolean {
    const href = resolveHref(item);
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function NavLink({ item }: { item: NavItem }) {
    const href = resolveHref(item);
    const disabled = item.requiresFamily && !familyId;
    const active = isActive(item);
    const Icon = item.icon;

    const classes = cn(
      "group relative mx-3 flex items-center gap-4 rounded-[var(--radius-md)] px-4 py-3.5 transition-colors",
      active
        ? "bg-[#2d2620] text-[var(--color-paper-50)]"
        : disabled
          ? "cursor-default text-[var(--color-paper-300)] opacity-40"
          : "text-[var(--color-paper-200)] hover:bg-[#2d2620] hover:text-[var(--color-paper-50)]",
    );

    const content = (
      <>
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-gold-400)]"
          />
        )}
        {/* Roman numeral */}
        <span
          className={cn(
            "w-7 shrink-0 font-[family-name:var(--font-display)] text-xs",
            active
              ? "text-[var(--color-gold-400)]"
              : disabled
                ? "text-[var(--color-paper-400)]"
                : "text-[var(--color-paper-400)] group-hover:text-[var(--color-gold-400)]",
          )}
        >
          {item.numeral}.
        </span>
        <Icon
          size={18}
          aria-hidden
          className={active ? "text-[var(--color-paper-100)]" : ""}
        />
        <span className="text-base font-medium">{item.label}</span>
      </>
    );

    if (disabled) {
      return (
        <span
          className={classes}
          title="Nejprve dokončete nastavení rodiny"
          aria-disabled="true"
        >
          {content}
        </span>
      );
    }
    return <Link href={href} className={classes}>{content}</Link>;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[280px] flex-col bg-[#1c1814] md:flex">
      {/* Logo — gold wordmark via CSS mask, matches homepage */}
      <div className="px-6 pb-6 pt-8">
        <Link
          href="/dashboard"
          aria-label="Vzpomínkář — domovská stránka"
          className="inline-flex"
        >
          <span
            aria-hidden
            className="block"
            style={{
              width: 132,
              aspectRatio: "1892 / 390",
              backgroundColor: "var(--gold)",
              WebkitMask: "url('/brand/logo-mask.png') no-repeat left center / contain",
              mask: "url('/brand/logo-mask.png') no-repeat left center / contain",
            }}
          />
        </Link>
      </div>

      {/* Decorative rule with diamond */}
      <div className="mx-5 mb-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--color-paper-200)]/15" />
        <svg width="10" height="10" viewBox="0 0 8 8" aria-hidden fill="none">
          <path d="M4 0.5 L7.5 4 L4 7.5 L0.5 4 Z" stroke="var(--color-gold-400)" strokeWidth="1" />
        </svg>
        <span className="h-px flex-1 bg-[var(--color-paper-200)]/15" />
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-1" data-tour="nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.numeral} item={item} />
        ))}

        <div className="mx-5 my-4 h-px bg-[var(--color-paper-200)]/12" />

        <NavLink item={SETTINGS_ITEM} />
      </nav>

      {/* User strip */}
      <div className="border-t border-[var(--color-paper-200)]/12 px-6 py-6">
        <p className="font-[family-name:var(--font-display)] text-base text-[var(--color-paper-200)]">
          {displayName ?? email ?? ""}
        </p>
        <form action={signOut} className="mt-2.5">
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-[var(--color-paper-300)] transition-colors hover:text-[var(--color-gold-400)]"
          >
            <LogOut size={14} aria-hidden />
            Odhlásit se
          </button>
        </form>
      </div>
    </aside>
  );
}

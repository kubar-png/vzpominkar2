"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Optional leading icon (e.g. a lucide-react glyph). Adds a small gap. */
  icon?: ReactNode;
}

/**
 * Rounded chip used to filter or pick across the owner area —
 * dashboard memory feed, memories archive, prompts library tabs,
 * and senior selection in the prompt picker.
 */
export function FilterPill({ active, onClick, children, icon }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors",
        icon && "gap-1.5",
        active
          ? "border-[var(--color-navy-900)] bg-[var(--color-navy-900)] text-[var(--color-paper-50)]"
          : "border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-paper-300)] hover:text-[var(--color-navy-700)]",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

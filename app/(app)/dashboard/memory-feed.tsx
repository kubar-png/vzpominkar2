"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MemoryCard } from "./memory-card";
import type { MemoryItem, SeniorOption } from "./page";

interface MemoryFeedProps {
  memories: MemoryItem[];
  seniors: SeniorOption[];
  familyId: string;
}

export function MemoryFeed({ memories, seniors, familyId }: MemoryFeedProps) {
  const [filterSeniorId, setFilterSeniorId] = useState<string | null>(null);

  // Drafts are an internal autosave concept; surface only finished memories
  // in the owner UI. The senior's text autosave still happens server-side so
  // they don't lose work mid-typing.
  const visible = (
    filterSeniorId
      ? memories.filter((m) => m.authorId === filterSeniorId)
      : memories
  ).filter((m) => m.status === "published");

  if (memories.filter((m) => m.status === "published").length === 0) {
    return (
      <Card>
        <CardContent className="space-y-4 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-navy-900)]">
            Zatím žádné vzpomínky
          </p>
          <p className="text-[var(--color-text-muted)]">
            Váš blízký ještě neodpověděl na žádnou otázku.
          </p>
          <Link
            href={`/family/${familyId}/prompts`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-2")}
          >
            Naplánovat první otázku
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Senior filter - only when multiple close ones */}
      {seniors.length > 1 && (
        <div className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <FilterPill active={filterSeniorId === null} onClick={() => setFilterSeniorId(null)}>
            Všichni
          </FilterPill>
          {seniors.map((s) => (
            <FilterPill
              key={s.id}
              active={filterSeniorId === s.id}
              onClick={() => setFilterSeniorId(s.id)}
            >
              {s.displayName}
            </FilterPill>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-[var(--color-text-subtle)]">
          Žádné dokončené vzpomínky.
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((m) => (
            <MemoryCard key={m.id} memory={m} familyId={familyId} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-2.5 text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-navy-900)] text-[var(--color-paper-50)]"
          : "bg-[var(--color-paper-200)] text-[var(--color-text-muted)] hover:bg-[var(--color-paper-300)]",
      )}
    >
      {children}
    </button>
  );
}

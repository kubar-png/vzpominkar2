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

  const visible = filterSeniorId
    ? memories.filter((m) => m.authorId === filterSeniorId)
    : memories;

  const drafts = visible.filter((m) => m.status === "draft");
  const published = visible.filter((m) => m.status === "published");

  if (memories.length === 0) {
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 items-start gap-x-10 gap-y-10 md:grid-cols-2">
        {/* Left - Koncepty */}
        <div>
          <ColumnLabel label="Koncepty" count={drafts.length} />
          {drafts.length === 0 ? (
            <p className="text-sm text-[var(--color-text-subtle)]">Žádné rozpracované vzpomínky.</p>
          ) : (
            <div className="space-y-4">
              {drafts.map((m) => (
                <MemoryCard key={m.id} memory={m} familyId={familyId} />
              ))}
            </div>
          )}
        </div>

        {/* Right - Hotové */}
        <div>
          <ColumnLabel label="Hotové" count={published.length} />
          {published.length === 0 ? (
            <p className="text-sm text-[var(--color-text-subtle)]">Žádné dokončené vzpomínky.</p>
          ) : (
            <div className="space-y-4">
              {published.map((m) => (
                <MemoryCard key={m.id} memory={m} familyId={familyId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ColumnLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <p className="shrink-0 font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-navy-900)]">
        {label}
      </p>
      {count > 0 && (
        <span className="rounded-full bg-[var(--color-gold-100)] px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--color-navy-900)]">
          {count}
        </span>
      )}
      <span className="h-px flex-1 bg-[var(--color-border-strong)]" aria-hidden />
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
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-navy-900)] text-[var(--color-paper-50)]"
          : "bg-[var(--color-paper-200)] text-[var(--color-text-muted)] hover:bg-[var(--color-paper-300)]",
      )}
    >
      {children}
    </button>
  );
}

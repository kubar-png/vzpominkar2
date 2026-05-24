"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { FilterPill } from "@/components/app/FilterPill";
import { cn } from "@/lib/utils";
import { MemoryCard } from "./memory-card";
import type { MemoryItem, SeniorOption } from "./types";

interface MemoryFeedProps {
  memories: MemoryItem[];
  seniors: SeniorOption[];
  familyId: string;
}

export function MemoryFeed({ memories, seniors, familyId }: MemoryFeedProps) {
  const [filterSeniorId, setFilterSeniorId] = useState<string | null>(null);

  // Drafts are an internal autosave concept; the owner UI shows only
  // finished memories. The senior's text autosave still happens server-side.
  const published = memories.filter((m) => m.status === "published");
  const visible = filterSeniorId
    ? published.filter((m) => m.authorId === filterSeniorId)
    : published;

  if (published.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare size={18} aria-hidden />}
        title="Zatím žádné vzpomínky"
        description="Váš blízký ještě neodpověděl na žádnou otázku."
        action={
          <Link
            href={`/family/${familyId}/prompts`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            Naplánovat první otázku
          </Link>
        }
      />
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


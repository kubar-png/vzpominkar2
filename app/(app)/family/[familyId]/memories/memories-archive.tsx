"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { InlineAudioPlayer } from "@/components/audio/InlineAudioPlayer";
import { cn } from "@/lib/utils";

export type ArchiveSenior = { id: string; displayName: string };

export type ArchiveMemory = {
  id: string;
  title: string | null;
  text: string | null;
  audioUrl: string | null;
  audioDurationSeconds: number | null;
  status: string;
  isFavorite: boolean;
  createdAt: string;
  question: string | null;
  authorId: string | null;
  authorName: string | null;
  images: { storage_path: string; signedUrl: string; caption: string | null }[];
};

type StatusFilter = "all" | "published" | "draft";
type SortOrder = "newest" | "oldest" | "favorite";

interface Props {
  memories: ArchiveMemory[];
  seniors: ArchiveSenior[];
  familyId: string;
}

export function MemoriesArchive({ memories, seniors, familyId }: Props) {
  const [seniorId, setSeniorId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortOrder>("newest");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    let list = memories;
    if (seniorId) list = list.filter((m) => m.authorId === seniorId);
    if (status !== "all") list = list.filter((m) => m.status === status);
    if (favoritesOnly) list = list.filter((m) => m.isFavorite);
    if (query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      list = list.filter((m) =>
        (m.title ?? "").toLowerCase().includes(q) ||
        (m.text ?? "").toLowerCase().includes(q) ||
        (m.question ?? "").toLowerCase().includes(q),
      );
    }
    if (sort === "oldest") {
      list = [...list].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    } else if (sort === "favorite") {
      list = [...list].sort(
        (a, b) =>
          Number(b.isFavorite) - Number(a.isFavorite) ||
          +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    }
    return list;
  }, [memories, seniorId, status, favoritesOnly, query, sort]);

  const empty = memories.length === 0;
  const filteredEmpty = !empty && visible.length === 0;

  if (empty) {
    return (
      <Card>
        <CardContent className="space-y-3 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-navy-900)]">
            Zatím žádné vzpomínky
          </p>
          <p className="text-[var(--color-text-muted)]">
            Až váš blízký nahraje první vzpomínku, ukáže se tady.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter / search bar */}
      <div className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-paper-50)] p-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat ve vzpomínkách…"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white py-2 pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Vyčistit hledání"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-text-subtle)] hover:bg-[var(--color-paper-200)] hover:text-[var(--color-text)]"
            >
              <X size={12} />
            </button>
          ) : null}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {seniors.length > 1 && (
            <>
              <FilterPill active={seniorId === null} onClick={() => setSeniorId(null)}>
                Všichni
              </FilterPill>
              {seniors.map((s) => (
                <FilterPill
                  key={s.id}
                  active={seniorId === s.id}
                  onClick={() => setSeniorId(s.id)}
                >
                  {s.displayName}
                </FilterPill>
              ))}
              <span className="mx-1 h-5 w-px bg-[var(--color-border-strong)]" aria-hidden />
            </>
          )}

          <FilterPill active={status === "all"} onClick={() => setStatus("all")}>
            Všechny
          </FilterPill>
          <FilterPill active={status === "published"} onClick={() => setStatus("published")}>
            Hotové
          </FilterPill>
          <FilterPill active={status === "draft"} onClick={() => setStatus("draft")}>
            Koncepty
          </FilterPill>

          <span className="mx-1 h-5 w-px bg-[var(--color-border-strong)]" aria-hidden />

          <FilterPill
            active={favoritesOnly}
            onClick={() => setFavoritesOnly((v) => !v)}
            icon={<Heart size={11} className={favoritesOnly ? "fill-current" : ""} />}
          >
            Oblíbené
          </FilterPill>

          {/* Sort - pushed to right */}
          <div className="ml-auto flex items-center gap-2 text-xs text-[var(--color-text-subtle)]">
            <label htmlFor="memarch-sort">Seřadit:</label>
            <Select
              id="memarch-sort"
              selectSize="sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
              className="w-auto min-w-[160px]"
            >
              <option value="newest">Nejnovější</option>
              <option value="oldest">Nejstarší</option>
              <option value="favorite">Oblíbené první</option>
            </Select>
          </div>
        </div>
      </div>

      {filteredEmpty ? (
        <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          Žádná vzpomínka neodpovídá zvoleným filtrům.
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((m) => (
            <li key={m.id}>
              <ArchiveCard m={m} familyId={familyId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ArchiveCard({ m, familyId }: { m: ArchiveMemory; familyId: string }) {
  const date = new Date(m.createdAt).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const visibleImages = m.images.slice(0, 3);
  const extra = m.images.length - 3;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--color-navy-900)]">
              {date}
              {m.authorName ? (
                <span className="font-normal text-[var(--color-text-muted)]"> · {m.authorName}</span>
              ) : null}
            </p>
            {m.question ? (
              <p className="text-sm italic text-[var(--color-text-muted)]">&bdquo;{m.question}&ldquo;</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {m.isFavorite ? (
              <Heart size={14} className="text-[var(--color-red-600)]" fill="currentColor" />
            ) : null}
            <Badge tone={m.status === "published" ? "navy" : "neutral"}>
              {m.status === "published" ? "Hotovo" : "Koncept"}
            </Badge>
          </div>
        </div>

        {m.title ? (
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight tracking-[-0.02em] text-[var(--color-navy-900)]">
            {m.title}
          </h3>
        ) : null}

        {m.audioUrl ? (
          <InlineAudioPlayer src={m.audioUrl} duration={m.audioDurationSeconds} />
        ) : null}

        {m.text ? (
          <p className="line-clamp-3 whitespace-pre-line leading-relaxed text-[var(--color-text)]">
            {m.text}
          </p>
        ) : null}

        {visibleImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {visibleImages.map((img, i) => (
              <div key={img.storage_path} className="relative overflow-hidden rounded-[var(--radius-md)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.signedUrl}
                  alt={img.caption ?? `Fotka ${i + 1}`}
                  className="aspect-square w-full object-cover"
                />
                {i === 2 && extra > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-navy-900)]/60">
                    <span className="text-sm font-medium text-white">+{extra}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <Link
          href={`/family/${familyId}/memories/${m.id}`}
          className="block text-sm text-[var(--color-navy-700)] underline-offset-2 hover:underline"
        >
          Celá vzpomínka →
        </Link>
      </CardContent>
    </Card>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-navy-900)] text-[var(--color-paper-50)]"
          : "bg-[var(--color-paper-200)] text-[var(--color-text-muted)] hover:bg-[var(--color-paper-300)]",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

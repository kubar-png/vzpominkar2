"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QA {
  q: string;
  a: string;
}

export interface Category {
  id: string;
  numeral: string;
  title: string;
  intro?: string;
  items: QA[];
}

interface FaqListProps {
  categories: Category[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function FaqList({ categories }: FaqListProps) {
  const [query, setQuery] = useState("");

  const filtered: Category[] = useMemo(() => {
    if (!query.trim()) return categories;
    const q = normalize(query.trim());
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (it) => normalize(it.q).includes(q) || normalize(it.a).includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, query]);

  const totalMatches = filtered.reduce((n, c) => n + c.items.length, 0);
  const isFiltering = query.trim().length > 0;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_2.4fr]">
      {/* Sticky TOC + search (desktop) */}
      <aside className="lg:sticky lg:top-32 lg:self-start" data-reveal>
        {/* Search */}
        <div className="mb-8">
          <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            Hledání
          </p>
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
              placeholder="Hledat v otázkách…"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2 pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
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
          {isFiltering ? (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {totalMatches === 0
                ? "Žádný výsledek."
                : `${totalMatches} ${totalMatches === 1 ? "odpověď" : totalMatches < 5 ? "odpovědi" : "odpovědí"}`}
            </p>
          ) : null}
        </div>

        {!isFiltering && (
          <>
            <p className="mb-6 text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
              Obsah
            </p>
            <ol className="space-y-3">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`#${cat.id}`}
                    className="group flex items-baseline gap-3 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-navy-900)]"
                  >
                    <span className="font-[family-name:var(--font-display)] text-lg font-normal text-[var(--color-red-700)]">
                      {cat.numeral}.
                    </span>
                    <span
                      className="font-[family-name:var(--font-display)] text-lg"
                      dangerouslySetInnerHTML={{ __html: cat.title }}
                    />
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-10 text-xs text-[var(--color-text-subtle)]">
              Nenašli jste odpověď?{" "}
              <Link href="/kontakt" className="underline-offset-4 hover:underline">
                Napište nám
              </Link>
              .
            </p>
          </>
        )}
      </aside>

      {/* Categories */}
      <div className="space-y-20">
        {filtered.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] py-12 text-center text-[var(--color-text-muted)]">
            Pro &bdquo;{query}&ldquo; jsme nic nenašli.
          </p>
        ) : (
          filtered.map((cat) => (
            <article key={cat.id} id={cat.id} className="scroll-mt-32">
              <div className="mb-8 flex items-center gap-5" data-reveal>
                <span className="font-[family-name:var(--font-display)] text-3xl font-normal uppercase leading-none tracking-tight text-[var(--color-red-700)]">
                  {cat.numeral}
                </span>
                <span
                  className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-ink-900)] sm:text-3xl"
                  dangerouslySetInnerHTML={{ __html: cat.title }}
                />
                <span className="ml-2 h-px flex-1 bg-[var(--color-border-strong)]" />
              </div>
              {cat.intro && !isFiltering ? (
                <p
                  className="mb-8 max-w-prose font-[family-name:var(--font-display)] text-lg text-[var(--color-text-muted)]"
                  data-reveal
                >
                  {cat.intro}
                </p>
              ) : null}
              <ul className="space-y-2 border-t border-[var(--color-border-strong)]">
                {cat.items.map((qa, i) => (
                  <li key={qa.q} className="border-b border-[var(--color-border-strong)]">
                    <details
                      open={isFiltering}
                      className="group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 text-left">
                        <span className="font-[family-name:var(--font-display)] text-lg font-normal text-[var(--color-ink-900)] sm:text-xl">
                          <span className="tnum-old mr-4 inline-block w-8 text-sm text-[var(--color-text-subtle)]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {qa.q}
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            "mt-1 shrink-0 text-2xl text-[var(--color-text-muted)]",
                            "transition-transform duration-[var(--duration-normal)] group-open:rotate-45",
                          )}
                        >
                          +
                        </span>
                      </summary>
                      <p className="max-w-prose pb-6 pl-12 text-base leading-relaxed text-[var(--color-text-muted)]">
                        {qa.a}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

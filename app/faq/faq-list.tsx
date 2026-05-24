"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { plural } from "@/lib/format/czech-plural";

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

/* ─────────────────────────────────────────────────────────────────────────
 * FaqList — editorial-scope rewrite
 *
 * Search bar + grouped accordion. Uses the homepage `.faq-item` toggle
 * (gold-circle ↗) so it reads as a continuation of the homepage FAQ,
 * not a separate widget. Search filters across all categories; when
 * filtering, matching items auto-open.
 * ─────────────────────────────────────────────────────────────────────── */
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
    <div className="faq-page-grid">
      {/* Sticky TOC + search (desktop) — collapses above the list on mobile */}
      <aside className="faq-aside" data-reveal>
        <div className="faq-search">
          <label className="faq-search-label" htmlFor="faq-search-input">
            Hledání
          </label>
          <input
            id="faq-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat v otázkách…"
            className="faq-search-input"
          />
          {isFiltering ? (
            <p className="faq-search-status">
              {totalMatches === 0
                ? "Žádný výsledek."
                : `${totalMatches} ${plural(totalMatches, ["odpověď", "odpovědi", "odpovědí"])}`}
            </p>
          ) : null}
        </div>

        {!isFiltering ? (
          <>
            <p className="faq-toc-label">Obsah</p>
            <ol className="faq-toc">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a href={`#${cat.id}`}>
                    <span className="faq-toc-numeral">{cat.numeral}.</span>
                    <span dangerouslySetInnerHTML={{ __html: cat.title }} />
                  </a>
                </li>
              ))}
            </ol>
            <p className="faq-toc-foot">
              Nenašli jste odpověď?{" "}
              <Link href="/kontakt">Napište nám</Link>.
            </p>
          </>
        ) : null}
      </aside>

      {/* Categories */}
      <div className="faq-cats">
        {filtered.length === 0 ? (
          <p className="faq-empty">
            Pro „{query}“ jsme nic nenašli.
          </p>
        ) : (
          filtered.map((cat) => (
            <article key={cat.id} id={cat.id} className="faq-cat">
              <div className="faq-cat-head" data-reveal>
                <span className="faq-cat-numeral">{cat.numeral}</span>
                <span
                  className="faq-cat-title"
                  dangerouslySetInnerHTML={{ __html: cat.title }}
                />
                <span className="faq-cat-rule" aria-hidden />
              </div>
              {cat.intro && !isFiltering ? (
                <p className="faq-cat-intro" data-reveal>
                  {cat.intro}
                </p>
              ) : null}
              <div className="faq-list">
                {cat.items.map((qa, i) => (
                  <details
                    key={qa.q}
                    className="faq-item"
                    open={isFiltering || (i === 0 && cat.id === categories[0]?.id)}
                  >
                    <summary>{qa.q}</summary>
                    <div className="faq-body">{qa.a}</div>
                  </details>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

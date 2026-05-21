"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export interface Story {
  name: string;
  role: string;
  quote: string;
  img: string;
}

interface Props {
  stories: Story[];
}

/**
 * Horizontal scrolling testimonial gallery - Remento "Tears of joy" style.
 *
 * Layout: a scroll-snap row of 9:16 portrait cards. Arrow buttons scroll the
 * track by one card width on click. Scrollbar is hidden visually; native
 * touch scrolling still works on mobile.
 */
export function StoryGallery({ stories }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /* Update arrow disabled states based on scroll position. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      setAtStart(el.scrollLeft <= 4);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    /* Scroll by one card's width (the first child's offsetWidth + gap). */
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.6;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Track bleeds to the viewport edges on both sides. Negative margins
       * cancel the Section's px-4/8/14 padding without re-adding any inset,
       * so the first card sits flush with the left viewport edge and the
       * last card scrolls flush to the right. */}
      <div
        ref={trackRef}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 sm:-mx-8 sm:gap-8 lg:-mx-14"
        style={{ scrollbarWidth: "none" }}
      >
        {stories.map((s) => (
          <article
            key={s.name}
            data-card
            className="group relative shrink-0 snap-start overflow-hidden rounded-[var(--radius-xl)] shadow-md"
            style={{ width: "min(78vw, 280px)", aspectRatio: "9 / 16" }}
          >
            <Image
              src={s.img}
              alt={s.name}
              fill
              sizes="(min-width: 1024px) 280px, 78vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />

            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
            />

            <span className="absolute left-3 top-3 rounded-md bg-[var(--color-ink-900)]/85 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white backdrop-blur">
              {s.role}
            </span>

            <button
              type="button"
              aria-label={`Přehrát příběh: ${s.name}`}
              className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[var(--color-ink-900)] shadow-md transition-transform group-hover:scale-110"
            >
              <svg width="12" height="12" viewBox="0 0 22 22" fill="currentColor" aria-hidden>
                <path d="M7 5.2v11.6c0 .9 1 1.4 1.7.9l8.5-5.8a1.1 1.1 0 0 0 0-1.8L8.7 4.3A1.1 1.1 0 0 0 7 5.2z" />
              </svg>
            </button>

            <div className="absolute inset-x-3 bottom-3 pl-12 text-left">
              <p
                className="font-[family-name:var(--font-display)] text-sm leading-snug text-white sm:text-base"
                style={{ textWrap: "balance" }}
              >
                „{s.quote}&ldquo;
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/80">
                {s.name}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination arrows - disabled at row ends. */}
      <div className="mt-8 flex justify-end gap-2">
        <button
          type="button"
          aria-label="Předchozí"
          onClick={() => scrollByCard(-1)}
          disabled={atStart}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white text-[var(--color-ink-900)] transition-colors hover:bg-[var(--color-paper-200)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Další"
          onClick={() => scrollByCard(1)}
          disabled={atEnd}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white text-[var(--color-ink-900)] transition-colors hover:bg-[var(--color-paper-200)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

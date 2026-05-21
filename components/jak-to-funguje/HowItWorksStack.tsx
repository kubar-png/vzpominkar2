"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface StackStep {
  roman: string;
  title: string;
  body: string;
  caption?: string;
  src?: string;
  alt?: string;
  isVideo?: boolean;
  link?: { href: string; label: string };
}

interface Props {
  steps: StackStep[];
}

/**
 * Vertical scroll-progress timeline (Remento mechanic).
 *
 * Geometry:
 *   - A single track line spans the full height of the steps list.
 *   - A gold "fill" line grows top-down as the reader scrolls. Its head
 *     tracks ~40% from the viewport top so it visually trails the reading
 *     line; dots are "passed" one at a time as that head moves down.
 *   - Each step's dot is anchored at the top of that step's content - so
 *     you always see exactly which step you've reached.
 *
 * No card chrome around the text - just typography on the page background
 * and a single rounded media tile per step.
 */
export function HowItWorksStack({ steps }: Props) {
  const listRef = useRef<HTMLOListElement>(null);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const [active, setActive] = useState(0);
  const [fillPx, setFillPx] = useState(0);
  const [listPx, setListPx] = useState(0);

  /* Active step → IntersectionObserver. Tighter band so the active dot
   * matches the step the reader is actually reading. */
  useEffect(() => {
    const observers = stepRefs.current.map((node, i) => {
      if (!node) return null;
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            setActive(i);
          }
        },
        {
          rootMargin: "-22% 0px -60% 0px",
          threshold: 0,
        },
      );
      io.observe(node);
      return io;
    });
    return () => {
      observers.forEach((o) => o?.disconnect());
    };
  }, []);

  /* Compute fill height. We position the fill's HEAD ~40% down the viewport
   * relative to the start of the list. rAF batches the work. */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = listRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height;
      const passed = Math.max(0, -rect.top);
      const head = Math.min(passed + window.innerHeight * 0.4, total);
      setFillPx(head);
      setListPx(total);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section
      className="relative"
      aria-label="Jak to funguje krok za krokem"
    >
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-8">
        {/* Outer list is the rail's reference: track + fill span its full
         * height; each step's dot sits at the top of its content. */}
        <ol
          ref={listRef}
          className="relative list-none"
        >
          {/* Track - full height of the list */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-[10px] w-px bg-[var(--color-border-strong)] lg:left-[12px]"
          />
          {/* Active fill - grows top-down based on scroll progress */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 left-[10px] w-px bg-[var(--color-gold-500)] lg:left-[12px]"
            style={{
              height: `${Math.min(fillPx, listPx)}px`,
              transition: "height 120ms linear",
            }}
          />

          {steps.map((step, i) => (
            <li
              key={step.roman}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              data-step={i + 1}
              className={cn(
                "relative pl-[42px] lg:pl-[56px]",
                i === 0 ? "pt-3 sm:pt-6" : "pt-16 sm:pt-24",
                i === steps.length - 1 ? "pb-8 sm:pb-16" : "pb-0",
              )}
            >
              {/* Dot - sits on the track at this step's top */}
              <span
                aria-hidden
                data-active={active === i ? "true" : "false"}
                className={cn(
                  "absolute z-10 flex items-center justify-center rounded-full border bg-[var(--jtf-bg,var(--color-bg))] font-[family-name:var(--font-display)] font-medium transition-all",
                  "h-[21px] w-[21px] text-[10px] lg:h-[25px] lg:w-[25px] lg:text-[11px]",
                  "left-0 lg:left-0",
                  active === i
                    ? "scale-110 border-[var(--color-gold-500)] bg-[var(--color-gold-500)] text-[var(--color-paper-50)] shadow-md"
                    : i < active
                      ? "border-[var(--color-gold-500)] text-[var(--color-gold-700)]"
                      : "border-[var(--color-border-strong)] text-[var(--color-text-subtle)]",
                )}
                style={{
                  /* Vertical: align with the eyebrow line of the step. */
                  top: i === 0 ? "0.75rem" : "calc(4rem - 2px)",
                }}
              >
                {i + 1}
              </span>

              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
                Krok {i + 1}
              </p>

              <h3
                className="mt-5 font-[family-name:var(--font-display)] text-2xl font-normal leading-[1.15] tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
                style={{ textWrap: "balance" }}
              >
                {step.title}
              </h3>

              <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
                {step.body}
              </p>

              {step.link ? (
                <a
                  href={step.link.href}
                  className="group mt-7 inline-flex min-h-[44px] items-center gap-2 py-2 text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
                >
                  <span className="font-[family-name:var(--font-display)] text-lg">
                    {step.link.label}
                  </span>
                  <span
                    aria-hidden
                    className="translate-y-[1px] transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out-quart)] group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
              ) : null}

              {/* Media tile */}
              <div className="relative mt-10 overflow-hidden rounded-[var(--radius-3xl)] bg-[var(--color-paper-200)] shadow-md">
                <div className="relative aspect-[16/10] sm:aspect-[16/9]">
                  {step.src ? (
                    <Image
                      src={step.src}
                      alt={step.alt ?? ""}
                      fill
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-navy-100)] via-[var(--color-paper-200)] to-[var(--color-gold-100)]" />
                  )}

                  {step.isVideo ? (
                    <button
                      type="button"
                      aria-label="Přehrát ukázku"
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-navy-900)] shadow-lg backdrop-blur transition-transform hover:scale-105">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 22 22"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M7 5.2v11.6c0 .9 1 1.4 1.7.9l8.5-5.8a1.1 1.1 0 0 0 0-1.8L8.7 4.3A1.1 1.1 0 0 0 7 5.2z" />
                        </svg>
                      </span>
                    </button>
                  ) : null}

                  {step.caption ? (
                    <span className="absolute bottom-4 left-4 rounded-full bg-[var(--color-navy-900)]/90 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[var(--color-paper-50)] backdrop-blur">
                      {step.caption}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

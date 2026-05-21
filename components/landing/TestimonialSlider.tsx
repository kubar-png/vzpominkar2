"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SliderTestimonial {
  name: string;
  role: string;
  quote: string;
}

interface Props {
  testimonials: SliderTestimonial[];
  interval?: number;
}

export function TestimonialSlider({ testimonials, interval = 5000 }: Props) {
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) {
        setIndex((prev) => (prev + 1) % testimonials.length);
      }
    }, interval);
    return () => clearInterval(id);
  }, [testimonials.length, interval]);

  const goTo = (i: number) => setIndex(i);

  return (
    <div
      className="mt-10 sm:mt-14"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Cross-fade testimonial display */}
      <div className="relative min-h-[8rem]">
        {testimonials.map((t, i) => {
          const letter = t.name.trim().charAt(0).toUpperCase() || "?";
          return (
            <figure
              key={t.name}
              aria-hidden={i !== index}
              className={cn(
                "transition-opacity duration-700 ease-in-out",
                i === index
                  ? "relative opacity-100"
                  : "pointer-events-none absolute inset-0 opacity-0",
              )}
            >
              <blockquote className="font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--color-ink-900)] sm:text-2xl">
                {`„${t.quote}"`}
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4">
                <div
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-paper-300)] font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-ink-900)]"
                >
                  {letter}
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-text)]">
                    {t.name}
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-text-subtle)]">
                    {t.role}
                  </div>
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Segment progress dots */}
      <div className="mt-10 flex items-center gap-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Svědectví ${i + 1}`}
            className={cn(
              "h-[3px] rounded-full transition-all duration-[280ms] ease-[cubic-bezier(0.165,0.84,0.44,1)]",
              i === index
                ? "w-8 bg-[var(--color-red-700)]"
                : "w-3 bg-[var(--color-paper-400)]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

interface Testimonial {
  readonly title: string;
  readonly quote: string;
  readonly author: string;
}

interface TestimonialCarouselProps {
  readonly items: ReadonlyArray<Testimonial>;
}

/**
 * Testimonial grid on desktop, horizontal scroll-snap carousel on mobile.
 *
 * CSS does the layout switch via `.testimonial-grid` rules in globals.css.
 * This component layers an auto-advance behavior on top of the native
 * scroll-snap container: every 5 s the next card scrolls into view. As soon
 * as the user touches or scrolls the carousel manually, auto-advance stops
 * for the rest of the page life so we don't fight their input.
 *
 * Auto-advance only runs when the container actually overflows (i.e. on
 * mobile where flex-direction is row + overflow-x scroll). On desktop the
 * grid has no overflow, so the scroll calls are no-ops.
 */
const TICK_MS = 5000;

export function TestimonialCarousel({ items }: TestimonialCarouselProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (items.length <= 1) return;

    let paused = false;
    let activeIndex = 0;

    function pause() {
      paused = true;
      el?.removeEventListener("touchstart", pause);
      el?.removeEventListener("wheel", pause);
      el?.removeEventListener("scroll", onScroll);
    }

    // If the user scrolls manually, treat that as a pause too. Distinguish
    // user scroll from our own programmatic scroll by checking a flag.
    let programmatic = false;
    function onScroll() {
      if (programmatic) return;
      pause();
    }

    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("wheel", pause, { passive: true });
    el.addEventListener("scroll", onScroll, { passive: true });

    const id = window.setInterval(() => {
      if (paused || !el) return;
      // Desktop grid has no overflow → scrollLeft stays 0 and our scrollTo
      // calls have no visible effect, so skip work.
      if (el.scrollWidth <= el.clientWidth + 4) return;
      activeIndex = (activeIndex + 1) % items.length;
      const cards = el.querySelectorAll<HTMLElement>(".testimonial");
      const target = cards[activeIndex];
      if (!target) return;
      programmatic = true;
      el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: "smooth" });
      // Release the programmatic flag once the smooth-scroll settles.
      window.setTimeout(() => { programmatic = false; }, 700);
    }, TICK_MS);

    return () => {
      window.clearInterval(id);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("wheel", pause);
      el.removeEventListener("scroll", onScroll);
    };
  }, [items.length]);

  return (
    <div className="testimonial-grid" ref={ref}>
      {items.map((t) => (
        <article className="testimonial" key={t.author}>
          <div className="stars">★★★★★</div>
          <h4>{t.title}</h4>
          <blockquote>{t.quote}</blockquote>
          <cite>{t.author}</cite>
        </article>
      ))}
    </div>
  );
}

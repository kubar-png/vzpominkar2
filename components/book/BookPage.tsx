"use client";

import { forwardRef, type ReactNode } from "react";

interface BookPageProps {
  /** Logical page number stamped at the bottom of the page. */
  pageNumber?: number;
  /** Side of the spread — affects how the spine shadow is rendered. */
  side?: "left" | "right";
  /** Body content of the page. */
  children: ReactNode;
  /** Extra className for the inner content frame. */
  className?: string;
}

/**
 * Inner book page — cream paper with a soft inner shadow toward the spine,
 * tabular-num footer for the page number. Wraps content in editorial-comfortable
 * margins. Forwarded ref is required by react-pageflip so it can measure pages.
 */
export const BookPage = forwardRef<HTMLDivElement, BookPageProps>(function BookPage(
  { pageNumber, side = "right", children, className = "" },
  ref,
) {
  const spineShadow =
    side === "left"
      ? "inset -16px 0 28px -16px rgba(50, 30, 10, 0.25)"
      : "inset 16px 0 28px -16px rgba(50, 30, 10, 0.25)";

  return (
    <div ref={ref} className="book-page-leaf" data-density="soft">
      <div
        className="relative flex h-full w-full flex-col bg-[#fbf5e3] text-[#1a1714]"
        style={{ boxShadow: spineShadow }}
      >
        {/* Subtle paper grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.25] mix-blend-multiply"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(120, 90, 50, 0.04) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(120, 90, 50, 0.03) 0 1px, transparent 1px 4px)",
          }}
        />

        {/* Content */}
        <div
          className={`relative flex h-full w-full flex-col ${className}`}
          style={{ padding: "clamp(20px, 5%, 56px)" }}
        >
          {children}
        </div>

        {/* Page footer with number */}
        {pageNumber ? (
          <div
            className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center"
            style={{ color: "rgba(120, 90, 50, 0.6)" }}
          >
            <span className="font-[family-name:var(--font-display)] text-[10px] tabular-nums tracking-[0.32em]">
              {pageNumber}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
});

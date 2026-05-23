"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookCover, type CoverVariant } from "./BookCover";
import { BookPage } from "./BookPage";

// react-pageflip touches `window` at construction time → must be client-only.
// Render a same-size placeholder during hydration so the page doesn't reflow.
const HTMLFlipBook = dynamic(
  () => import("react-pageflip").then((m) => m.default),
  { ssr: false },
);

export interface FlipBookMemory {
  id: string;
  title: string | null;
  text: string | null;
  question: string | null;
  authorName: string | null;
  date: string;
  imageUrls: string[];
}

interface FlipBookProps {
  familyName: string;
  year: number;
  variant: CoverVariant;
  memories: FlipBookMemory[];
}

/**
 * Real flipping book — front cover + title spread + TOC + per-memory spreads
 * + back cover. Page size is the design-spec spread proportion (~1.4 H/W);
 * on screens narrower than 760px we collapse to portrait single-page mode.
 *
 * react-pageflip handles the actual flip choreography (mouse drag, click on
 * corner, swipe). We provide the page DOM and pages are mounted once; the
 * library never re-renders children, so changing the cover variant remounts
 * the whole book — that's acceptable since variant-switch is a deliberate
 * user action, not animation-critical.
 */
export function FlipBook({ familyName, year, variant, memories }: FlipBookProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 480, h: 660 });
  const [portrait, setPortrait] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function measure() {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth;
      const isPortrait = cw < 760;
      setPortrait(isPortrait);
      // Spread aspect: each page is ~1.4× as tall as it is wide. Two-page mode
      // uses half the container width per page. Cap so big monitors don't get
      // a giant flipping book that loses intimacy.
      const pageWidth = isPortrait
        ? Math.min(cw, 420)
        : Math.min(Math.floor(cw / 2), 460);
      const pageHeight = Math.round(pageWidth * 1.38);
      setSize({ w: pageWidth, h: pageHeight });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Build the page list. Order: front cover, title, TOC, then 1 page per
  // memory, then back cover. Hard pages get density="hard" via BookCover.
  const pages = useMemo(() => {
    const list: { key: string; node: React.ReactElement }[] = [];

    list.push({
      key: "front",
      node: (
        <BookCover
          variant={variant}
          familyName={familyName}
          year={year}
        />
      ),
    });

    list.push({
      key: "title",
      node: (
        <BookPage side="right">
          <div className="m-auto flex flex-col items-center gap-6 text-center">
            <p
              className="text-[10px] font-medium uppercase"
              style={{ letterSpacing: "0.42em", color: "rgba(120, 90, 50, 0.7)" }}
            >
              Vzpomínkář
            </p>
            <div aria-hidden className="h-px w-12 bg-[rgba(120,90,50,0.4)]" />
            <h2
              className="font-[family-name:var(--font-display)] leading-[1.1] tracking-[-0.01em]"
              style={{ fontSize: "clamp(28px, 5vw, 40px)", color: "#0e3b64", fontWeight: 500 }}
            >
              {familyName}
            </h2>
            <p
              className="text-xs tabular-nums"
              style={{ letterSpacing: "0.2em", color: "rgba(120, 90, 50, 0.7)" }}
            >
              ROK {year}
            </p>
          </div>
        </BookPage>
      ),
    });

    list.push({
      key: "toc",
      node: (
        <BookPage side="left" pageNumber={1}>
          <p
            className="mb-6 text-[10px] font-medium uppercase"
            style={{ letterSpacing: "0.32em", color: "rgba(120, 90, 50, 0.7)" }}
          >
            Obsah
          </p>
          <ol className="flex-1 space-y-2 overflow-hidden font-[family-name:var(--font-display)] text-[13px] leading-[1.4]">
            {memories.length === 0 ? (
              <li className="text-[rgba(60,40,20,0.6)]">
                Zde se objeví seznam kapitol, jakmile přidáte první vzpomínky.
              </li>
            ) : (
              memories.slice(0, 18).map((m, i) => (
                <li
                  key={m.id}
                  className="flex items-baseline justify-between gap-3"
                  style={{ color: "#1a1714" }}
                >
                  <span className="flex-1 truncate">
                    {romanNumeral(i + 1)}. {m.title ?? m.question ?? m.date}
                  </span>
                  <span
                    className="flex-shrink-0 tabular-nums"
                    style={{ color: "rgba(120, 90, 50, 0.6)" }}
                  >
                    {i + 2}
                  </span>
                </li>
              ))
            )}
            {memories.length > 18 && (
              <li className="pt-2 text-[rgba(120,90,50,0.6)]">
                … a dalších {memories.length - 18}
              </li>
            )}
          </ol>
        </BookPage>
      ),
    });

    if (memories.length === 0) {
      list.push({
        key: "empty",
        node: (
          <BookPage side="right" pageNumber={2}>
            <div className="m-auto flex flex-col items-center gap-4 text-center">
              <p
                className="text-[10px] font-medium uppercase"
                style={{ letterSpacing: "0.32em", color: "rgba(120, 90, 50, 0.7)" }}
              >
                Začátek
              </p>
              <p
                className="font-[family-name:var(--font-display)] text-[18px] leading-[1.5]"
                style={{ color: "#1a1714", maxWidth: "28ch" }}
              >
                Až váš blízký odpoví na první otázku, objeví se zde první kapitola.
              </p>
            </div>
          </BookPage>
        ),
      });
    } else {
      memories.forEach((m, i) => {
        list.push({
          key: m.id,
          node: (
            <BookPage side={i % 2 === 0 ? "right" : "left"} pageNumber={i + 2}>
              <header className="mb-5 flex items-baseline justify-between gap-3">
                <span
                  className="font-[family-name:var(--font-display)] text-[11px]"
                  style={{ color: "rgba(120, 90, 50, 0.7)", letterSpacing: "0.16em" }}
                >
                  {romanNumeral(i + 1)}
                </span>
                <span
                  className="text-[9px] font-medium uppercase"
                  style={{ letterSpacing: "0.32em", color: "rgba(120, 90, 50, 0.6)" }}
                >
                  {m.date}
                </span>
              </header>
              {m.question ? (
                <h3
                  className="mb-4 font-[family-name:var(--font-display)] leading-[1.2]"
                  style={{
                    fontSize: "clamp(15px, 1.6vw, 19px)",
                    color: "#0e3b64",
                    fontWeight: 500,
                  }}
                >
                  &bdquo;{m.question}&ldquo;
                </h3>
              ) : null}
              {m.imageUrls[0] && (
                <div className="mb-4 overflow-hidden rounded-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.imageUrls[0]}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                    style={{ filter: "sepia(0.05) saturate(0.95)" }}
                  />
                </div>
              )}
              {m.text ? (
                <p
                  className="font-[family-name:var(--font-display)] leading-[1.55] line-clamp-[12]"
                  style={{
                    fontSize: "clamp(11px, 1.05vw, 13px)",
                    color: "#1a1714",
                  }}
                >
                  {m.text}
                </p>
              ) : null}
              <footer
                className="mt-auto flex items-baseline justify-end gap-2 pt-3"
                style={{ color: "rgba(60, 40, 20, 0.8)" }}
              >
                <span
                  aria-hidden
                  className="h-px w-6"
                  style={{ background: "rgba(120, 90, 50, 0.5)" }}
                />
                <span
                  className="font-[family-name:var(--font-display)]"
                  style={{ fontSize: "11px" }}
                >
                  — {m.authorName ?? "Blízký"}
                </span>
              </footer>
            </BookPage>
          ),
        });
      });
    }

    list.push({
      key: "back",
      node: <BookCover variant={variant} familyName={familyName} year={year} back />,
    });

    return list;
  }, [memories, variant, familyName, year]);

  return (
    <div ref={containerRef} className="w-full">
      {mounted ? (
        <div className="flex justify-center">
          <HTMLFlipBook
            key={`${variant}-${size.w}-${portrait}`}
            width={size.w}
            height={size.h}
            size="fixed"
            minWidth={280}
            maxWidth={520}
            minHeight={400}
            maxHeight={720}
            usePortrait={portrait}
            showCover
            drawShadow
            maxShadowOpacity={0.4}
            flippingTime={650}
            mobileScrollSupport
            useMouseEvents
            showPageCorners
            disableFlipByClick={false}
            startPage={0}
            startZIndex={1}
            autoSize={false}
            clickEventForward
            swipeDistance={30}
            className="vzp-flipbook"
            style={{}}
          >
            {pages.map((p) => (
              <div key={p.key} className="vzp-flipbook-page">
                {p.node}
              </div>
            ))}
          </HTMLFlipBook>
        </div>
      ) : (
        <div
          className="mx-auto flex items-center justify-center rounded-sm bg-[var(--color-paper-200)]"
          style={{ width: size.w * 2, height: size.h, maxWidth: "100%" }}
          aria-hidden
        />
      )}
    </div>
  );
}

function romanNumeral(n: number): string {
  const r: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of r) while (n >= v) (out += s, n -= v);
  return out;
}

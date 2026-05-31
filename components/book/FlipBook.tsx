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

/** One physical leaf of a memory's content after pagination. */
interface MemoryLeaf {
  memoryIndex: number;
  /** Body-text slice for this leaf (may be empty if furniture fills the page). */
  text: string;
  /** First leaf of the memory — carries the header, question and photo. */
  isFirst: boolean;
  /** Last leaf of the memory — carries the author footer. */
  isLast: boolean;
  /** Logical, printed page number. */
  pageNumber: number;
}

interface Metrics {
  pad: number;
  contentW: number;
  contentH: number;
  bodyFont: number;
  qFont: number;
}

/**
 * Page geometry derived from the fixed page size. Fonts are deterministic px
 * (not vw) so the offscreen paginator measures exactly what gets rendered.
 * Mirrors BookPage's padding: clamp(20px, 5%, 56px) of the leaf width.
 */
function deriveMetrics(w: number, h: number): Metrics {
  const pad = Math.max(20, Math.min(56, Math.round(w * 0.05)));
  return {
    pad,
    contentW: w - pad * 2,
    contentH: h - pad * 2,
    bodyFont: Math.max(11, Math.min(13, Math.round(w / 33))),
    qFont: Math.max(15, Math.min(19, Math.round(w / 26))),
  };
}

/**
 * Lay every memory's text out across fixed-size pages, measuring against
 * detached, identically-styled probe elements. Returns one MemoryLeaf per
 * physical page. Runs in the browser only (uses `document`); pure w.r.t.
 * React state, so it can be called once per measured size with no races.
 */
function buildLeaves(memories: FlipBookMemory[], m: Metrics): MemoryLeaf[] {
  if (memories.length === 0) return [];
  const { contentW, contentH, bodyFont, qFont } = m;

  // Body-text probe — identical font metrics to the rendered <p>.
  const probe = document.createElement("div");
  probe.style.cssText =
    `position:absolute;left:-99999px;top:0;visibility:hidden;` +
    `width:${contentW}px;font-family:var(--font-display);` +
    `font-size:${bodyFont}px;line-height:1.55;` +
    `white-space:pre-wrap;word-break:break-word;`;
  document.body.appendChild(probe);
  const textFits = (s: string, avail: number) => {
    probe.textContent = s;
    return probe.scrollHeight <= avail;
  };

  // Header + question + photo block above the text on a memory's first leaf.
  const measureFurniture = (mem: FlipBookMemory): number => {
    const box = document.createElement("div");
    box.style.cssText = `position:absolute;left:-99999px;top:0;visibility:hidden;width:${contentW}px;`;
    const header = document.createElement("div");
    header.style.cssText = "margin-bottom:20px;font-size:11px;line-height:1.4;";
    header.textContent = mem.date || "—";
    box.appendChild(header);
    if (mem.question) {
      const h3 = document.createElement("div");
      h3.style.cssText = `font-family:var(--font-display);font-size:${qFont}px;line-height:1.2;font-weight:500;margin-bottom:16px;`;
      h3.textContent = `„${mem.question}“`;
      box.appendChild(h3);
    }
    if (mem.imageUrls[0]) {
      const img = document.createElement("div");
      img.style.cssText = `margin-bottom:16px;height:${Math.round((contentW * 3) / 4)}px;`;
      box.appendChild(img);
    }
    document.body.appendChild(box);
    const h = box.offsetHeight;
    document.body.removeChild(box);
    return h;
  };

  // Author footer height (constant across memories).
  const footerProbe = document.createElement("div");
  footerProbe.style.cssText = `position:absolute;left:-99999px;top:0;visibility:hidden;width:${contentW}px;padding-top:12px;font-family:var(--font-display);font-size:11px;line-height:1.4;`;
  footerProbe.textContent = "— Blízký";
  document.body.appendChild(footerProbe);
  const footerH = footerProbe.offsetHeight;
  document.body.removeChild(footerProbe);

  const oneLine = Math.ceil(bodyFont * 1.55);

  // Greedily slice `text` into chunks that each fit `avail` px of height,
  // splitting only at whitespace. The first leaf gets less room (furniture).
  const sliceText = (
    text: string,
    firstAvail: number,
    contAvail: number,
  ): string[] => {
    const tokens = text.split(/(\s+)/).filter((t) => t.length > 0);
    const chunks: string[] = [];
    let start = 0;
    let avail = firstAvail;
    while (start < tokens.length) {
      while (start < tokens.length && /^\s+$/.test(tokens[start]!)) start++;
      if (start >= tokens.length) break;
      if (textFits(tokens.slice(start).join(""), avail)) {
        chunks.push(tokens.slice(start).join("").trimEnd());
        break;
      }
      let lo = start + 1;
      let hi = tokens.length;
      let fit = start + 1; // always make progress, even on one long word
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (textFits(tokens.slice(start, mid).join(""), avail)) {
          fit = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      chunks.push(tokens.slice(start, fit).join("").trimEnd());
      start = fit;
      avail = contAvail;
    }
    return chunks.length > 0 ? chunks : [""];
  };

  const result: MemoryLeaf[] = [];
  let pageNo = 2; // front (no num), title (no num), toc = 1, content starts at 2

  memories.forEach((mem, mi) => {
    const furnitureH = measureFurniture(mem);
    const text = mem.text?.trim() ?? "";
    const contAvail = Math.max(oneLine, contentH - footerH);
    const firstAvail = contentH - furnitureH - footerH;

    let chunks: string[];
    if (!text) {
      chunks = [""]; // furniture-only page
    } else if (firstAvail < oneLine) {
      // Furniture fills the first page — start the text on the next leaf.
      chunks = ["", ...sliceText(text, contAvail, contAvail)];
    } else {
      chunks = sliceText(text, firstAvail, contAvail);
    }

    chunks.forEach((chunk, ci) => {
      result.push({
        memoryIndex: mi,
        text: chunk,
        isFirst: ci === 0,
        isLast: ci === chunks.length - 1,
        pageNumber: pageNo,
      });
      pageNo++;
    });
  });

  document.body.removeChild(probe);
  return result;
}

/**
 * Real flipping book — front cover + title spread + TOC + per-memory spreads
 * + back cover. The page size is a FIXED design-spec proportion (~1.38 H/W);
 * each memory's text flows across as many of those fixed pages as it needs —
 * a long story runs onto a second or third page rather than being cropped,
 * and a short one simply leaves the rest of its page blank. On screens
 * narrower than 760px we collapse to portrait single-page mode.
 *
 * react-pageflip handles the actual flip choreography (mouse drag, click on
 * corner, swipe). We provide the page DOM and pages are mounted once; the
 * library never re-renders children, so changing the cover variant or the
 * page count remounts the whole book — acceptable since those are deliberate
 * actions (variant switch, resize), not animation-critical.
 */
export function FlipBook({ familyName, year, variant, memories }: FlipBookProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Mobile-first default so the pre-measure placeholder never paints
  // wider than a phone viewport. measure() upgrades to spread on >=760px.
  const [size, setSize] = useState({ w: 320, h: 442 });
  const [portrait, setPortrait] = useState(true);
  // null until the offscreen paginator has run for the current size.
  const [leaves, setLeaves] = useState<MemoryLeaf[] | null>(null);

  // Measure the container and paginate in a SINGLE pass, then commit size,
  // orientation and pages together. Doing it in one shot (rather than a
  // mobile-default → measured-size two-phase) means react-pageflip mounts
  // exactly once with a stable page set — no remount race that could drop or
  // truncate pages. Re-runs on resize (page capacity depends on width).
  useEffect(() => {
    if (typeof document === "undefined") return;
    function recompute() {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth;
      const isPortrait = cw < 760;
      // Spread aspect: each page is ~1.38× as tall as it is wide. Two-page
      // mode uses half the container width per page. Cap so big monitors
      // don't get a giant flipping book that loses intimacy.
      const pageWidth = isPortrait
        ? Math.min(cw, 420)
        : Math.min(Math.floor(cw / 2), 460);
      const pageHeight = Math.round(pageWidth * 1.38);
      setPortrait(isPortrait);
      setSize({ w: pageWidth, h: pageHeight });
      setLeaves(buildLeaves(memories, deriveMetrics(pageWidth, pageHeight)));
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [memories]);

  const metrics = useMemo(() => deriveMetrics(size.w, size.h), [size.w, size.h]);

  // Build the full page list once pagination is known. Order: front cover,
  // title, TOC, then the paginated memory leaves, then back cover.
  const pages = useMemo(() => {
    if (leaves === null) return null;
    const list: { key: string; node: React.ReactElement }[] = [];

    list.push({
      key: "front",
      node: <BookCover variant={variant} familyName={familyName} year={year} />,
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

    // Map each memory to the printed page number of its first leaf.
    const startPage = new Map<number, number>();
    leaves.forEach((l) => {
      if (l.isFirst) startPage.set(l.memoryIndex, l.pageNumber);
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
                    {startPage.get(i) ?? i + 2}
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
      leaves.forEach((leaf, idx) => {
        const m = memories[leaf.memoryIndex]!;
        list.push({
          key: `${m.id}-${idx}`,
          node: (
            <BookPage
              side={idx % 2 === 0 ? "right" : "left"}
              pageNumber={leaf.pageNumber}
            >
              {leaf.isFirst ? (
                <>
                  <header className="mb-5 flex items-baseline justify-between gap-3">
                    <span
                      className="font-[family-name:var(--font-display)] text-[11px]"
                      style={{ color: "rgba(120, 90, 50, 0.7)", letterSpacing: "0.16em" }}
                    >
                      {romanNumeral(leaf.memoryIndex + 1)}
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
                      style={{ fontSize: metrics.qFont, color: "#0e3b64", fontWeight: 500 }}
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
                </>
              ) : (
                <span
                  className="mb-3 block font-[family-name:var(--font-display)] text-[9px] font-medium uppercase"
                  style={{ letterSpacing: "0.32em", color: "rgba(120, 90, 50, 0.55)" }}
                >
                  {romanNumeral(leaf.memoryIndex + 1)} — pokračování
                </span>
              )}
              {leaf.text ? (
                <p
                  className="flex-1 overflow-hidden font-[family-name:var(--font-display)]"
                  style={{
                    fontSize: metrics.bodyFont,
                    lineHeight: 1.55,
                    color: "#1a1714",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {leaf.text}
                </p>
              ) : (
                <div className="flex-1" />
              )}
              {leaf.isLast ? (
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
              ) : null}
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
  }, [leaves, memories, variant, familyName, year, metrics.bodyFont, metrics.qFont]);

  return (
    <div ref={containerRef} className="w-full">
      {pages !== null ? (
        <div className="flex justify-center">
          <HTMLFlipBook
            key={`${variant}-${size.w}-${portrait}-${pages.length}`}
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

"use client";

import { useState } from "react";
import { BookDocument, type BookSection } from "@/components/book-pdf/BookDocument";
import { BOOK_PHASES } from "@/lib/book-shop/phases";
import styles from "@/components/book-pdf/book-document.module.css";

/**
 * Dev-only live preview of the B5 book template (gated out of production by
 * app/dev/layout.tsx). Run `pnpm dev` → open /dev/book-preview, toggle between
 * the hand-written (blank lines) and app-generated (answers + photos) modes,
 * and Ctrl+P → "Save as PDF" to get the whole book as one file while we iterate.
 */

const SAMPLE_ANSWER =
  "Narodila jsem se v zimě roku 1948 v malém domku na kraji vesnice. Pamatuju si vůni " +
  "chleba, který maminka pekla každou sobotu, a jak jsme s bratrem běhali bosi po louce za " +
  "stodolou. Tatínek pracoval na pile a večer nám u kamen vyprávěl pohádky.";

export default function BookPreviewPage() {
  const [mode, setMode] = useState<"blank" | "filled">("blank");

  const sections: BookSection[] = BOOK_PHASES.map((p) => ({
    title: p.title,
    entries: p.questions
      .filter((q) => q.recommended)
      .map((q, i) => ({
        question: q.text,
        answer: mode === "filled" ? SAMPLE_ANSWER : undefined,
        images: mode === "filled" && i === 0 ? ["", ""] : undefined,
      })),
  }));

  return (
    <>
      <div className={styles.noPrint}>
        <button type="button" data-active={mode === "blank"} onClick={() => setMode("blank")}>
          Ruční (linky)
        </button>
        <button type="button" data-active={mode === "filled"} onClick={() => setMode("filled")}>
          Z aplikace (odpovědi + fotky)
        </button>
      </div>
      <BookDocument
        title="Zajímá mě tvůj příběh."
        dedication="Pro tebe, babičko"
        mode={mode}
        sections={sections}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { BookDocument, type BookSection } from "@/components/book-pdf/BookDocument";
import { BOOK_PHASES } from "@/lib/book-shop/phases";
import { type Gender } from "@/lib/gender";
import styles from "@/components/book-pdf/book-document.module.css";

/**
 * Dev-only live preview of the B5 book template (gated out of production by
 * app/dev/layout.tsx). Run `pnpm dev` → open /dev/book-preview, toggle between
 * the hand-written (blank lines) and app-generated (answers + photos) modes,
 * and Ctrl+P → "Save as PDF" to get the whole book as one file while we iterate.
 *
 * The first chapter's first two answers are long (≈ one page, then 2+ pages)
 * to show how a story wraps across B5 pages.
 */

const PARA =
  "Když na to dnes vzpomínám, vybaví se mi především ta vůně — vůně chleba, který maminka " +
  "pekla každou sobotu, vůně dřeva z tatínkovy pily a vůně sena z louky za stodolou, kde jsme " +
  "s bratrem trávili celá léta. Byli jsme chudí, ale nikdy nám nic nechybělo. Maminka uměla " +
  "z mála udělat hostinu a tatínek nás večer u kamen učil písničky, které si dodnes broukám. " +
  "Svět byl tehdy menší a pomalejší, a možná právě proto v něm bylo víc času na to, co bylo " +
  "doopravdy důležité — na rodinu, na sousedy a na obyčejné radosti všedního dne.";

const SAMPLE_ANSWER = PARA;
const LONG_ANSWER = Array(5).fill(PARA).join("\n\n"); // ≈ jedna stránka
const VERY_LONG_ANSWER = Array(11).fill(PARA).join("\n\n"); // ≈ 2+ stránky

export default function BookPreviewPage() {
  const [mode, setMode] = useState<"blank" | "filled">("filled");
  const [gender, setGender] = useState<Gender | null>("female");

  const sections: BookSection[] = BOOK_PHASES.map((p, si) => ({
    title: p.title,
    entries: p.questions
      .filter((q) => q.recommended)
      .map((q, i) => {
        let answer: string | undefined;
        let images: string[] | undefined;
        if (mode === "filled") {
          if (si === 0 && i === 0) {
            answer = LONG_ANSWER;
            images = ["", ""];
          } else if (si === 0 && i === 1) {
            answer = VERY_LONG_ANSWER;
          } else {
            answer = SAMPLE_ANSWER;
          }
        }
        return { question: q.text, answer, images };
      }),
  }));

  return (
    <>
      <div className={styles.noPrint}>
        <button type="button" data-active={mode === "filled"} onClick={() => setMode("filled")}>
          Z aplikace (odpovědi + fotky)
        </button>
        <button type="button" data-active={mode === "blank"} onClick={() => setMode("blank")}>
          Ruční (linky)
        </button>
        <span aria-hidden style={{ width: 1, alignSelf: "stretch", background: "#d8cdb0" }} />
        <button type="button" data-active={gender === "female"} onClick={() => setGender("female")}>
          Žena
        </button>
        <button type="button" data-active={gender === "male"} onClick={() => setGender("male")}>
          Muž
        </button>
        <button type="button" data-active={gender === null} onClick={() => setGender(null)}>
          Neuvedeno
        </button>
      </div>
      <BookDocument
        title="Zajímá mě tvůj příběh."
        dedication="Pro tebe, babičko"
        mode={mode}
        sections={sections}
        gender={gender ?? undefined}
      />
    </>
  );
}

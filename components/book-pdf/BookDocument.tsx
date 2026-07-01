import { Fragment } from "react";
import { resolveGender, type Gender } from "@/lib/gender";
import {
  COVER_BG_HEX,
  COVER_TEXT_HEX,
  DEFAULT_COVER_BG,
  DEFAULT_COVER_TEXT,
  type CoverBg,
  type CoverText,
} from "@/lib/book/cover";
import styles from "./book-document.module.css";

/**
 * Reusable book interior — one continuous, paginated B5 document (cover →
 * chapters → one question per page). Renders the WHOLE book so it exports as a
 * single PDF (browser Ctrl+P now; headless-Chromium render at fulfilment).
 *
 * Two modes from the SAME template:
 *   - "blank"  — physical hand-written book: question + ruled writing lines.
 *   - "filled" — book generated from the app: question + the digital answer
 *                (+ photos). Falls back to ruled lines for unanswered entries.
 *
 * B5 = 176 × 250 mm portrait.
 */

export interface BookEntry {
  question: string;
  answer?: string;
  /** Image URLs (Supabase signed URLs in the app book). Empty string → slot placeholder. */
  images?: string[];
  /**
   * Per-memory QR as a data-URI (→ /v/{token}); rendered at the top of the
   * answer so a reader can scan it to hear the original recording. Absent for
   * the hand-written (blank) book and for entries without a public link.
   */
  qr?: string;
}
export interface BookSection {
  title: string;
  entries: BookEntry[];
}
export type BookMode = "blank" | "filled";
export interface BookDocumentProps {
  title: string;
  dedication?: string;
  mode?: BookMode;
  sections: BookSection[];
  /**
   * QR shown in the on-screen preview footer (a placeholder box if absent).
   * Print uses per-entry `BookEntry.qr` and Puppeteer's footerTemplate instead —
   * the preview footer is hidden when printing.
   */
  qr?: string;
  /** Grammatical gender of the recipient; resolves "{masc|fem}" question tokens. Omitted → slash fallback. */
  gender?: Gender;
  /** Cover background colour (shared options, lib/book/cover.ts). Defaults to the included brown. */
  coverBg?: CoverBg;
  /** Cover foil/ink colour. Defaults to gold. */
  coverText?: CoverText;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function BookDocument({
  title,
  dedication,
  mode = "blank",
  sections,
  qr,
  gender,
  coverBg,
  coverText,
}: BookDocumentProps) {
  return (
    <div className={styles.doc}>
      {/* ── Cover ── */}
      <article
        className={`${styles.page} ${styles.cover}`}
        style={{
          ["--cover-bg" as string]: COVER_BG_HEX[coverBg ?? DEFAULT_COVER_BG],
          ["--cover-ink" as string]: COVER_TEXT_HEX[coverText ?? DEFAULT_COVER_TEXT],
        }}
      >
        <div className={styles.coverInner}>
          <h1 className={styles.coverTitle}>{title}</h1>
          {dedication ? <p className={styles.coverDedication}>{dedication}</p> : null}
        </div>
      </article>

      {sections.map((section, si) => (
        <Fragment key={`${section.title}-${si}`}>
          {/* ── Chapter divider ── */}
          <article className={`${styles.page} ${styles.chapter}`}>
            <span className={styles.chapterNum}>{ROMAN[si] ?? String(si + 1)}</span>
            <h2 className={styles.chapterTitle}>{section.title}</h2>
          </article>

          {/* ── One page per question ── */}
          {section.entries.map((entry, qi) => (
            <article key={qi} className={`${styles.page} ${styles.qpage}`}>
              <h3 className={styles.qtext}>{resolveGender(entry.question, gender ?? null)}</h3>
              {mode === "filled" && entry.answer ? (
                <div className={styles.answerWrap}>
                  {entry.qr ? (
                    <figure className={styles.qrFigure}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={entry.qr} alt="" className={styles.qrEntry} />
                      <figcaption className={styles.qrCaption}>Naskenujte a poslechněte si vyprávění</figcaption>
                    </figure>
                  ) : null}
                  <p className={styles.answer}>{entry.answer}</p>
                  {entry.images && entry.images.length > 0 ? (
                    <div className={styles.photos}>
                      {entry.images.map((src, ii) =>
                        src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={ii} src={src} alt="" className={styles.photo} />
                        ) : (
                          <div key={ii} className={styles.photo} aria-hidden />
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className={styles.lines} aria-hidden />
              )}
              <footer className={styles.pagefoot}>
                <span className={styles.pagenum} />
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="" className={styles.qr} />
                ) : null}
              </footer>
            </article>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

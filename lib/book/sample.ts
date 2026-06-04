import "server-only";
import QRCode from "qrcode";
import type { BookDocumentProps, BookSection } from "@/components/book-pdf/BookDocument";
import { BOOK_PHASES } from "@/lib/book-shop/phases";
import { SITE_URL } from "@/lib/site";

/**
 * The same sample book content the dev preview uses (app/dev/book-preview),
 * but server-rendered so the print pipeline (Puppeteer → /print/book/sample)
 * is testable end-to-end before real order-wiring exists.
 *
 * The first chapter's first two answers are long (≈ one page, then 2+ pages) to
 * exercise how a story wraps across B5 pages. A per-memory QR is attached to the
 * first answered entry so the QR render path is covered too.
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

/** Build the sample "filled" book (answers + photos), with one QR for testing. */
export async function buildSampleBook(): Promise<BookDocumentProps> {
  // A representative QR so the per-memory QR render path is exercised. Points at
  // the public playback root; in a real book each entry links to /v/{token}.
  const sampleQr = await QRCode.toDataURL(`${SITE_URL}/v/sample`, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });

  const sections: BookSection[] = BOOK_PHASES.map((p, si) => ({
    title: p.title,
    entries: p.questions
      .filter((q) => q.recommended)
      .map((q, i) => {
        if (si === 0 && i === 0) {
          return { question: q.text, answer: LONG_ANSWER, images: ["", ""], qr: sampleQr };
        }
        if (si === 0 && i === 1) {
          return { question: q.text, answer: VERY_LONG_ANSWER };
        }
        return { question: q.text, answer: SAMPLE_ANSWER };
      }),
  }));

  return {
    title: "Zajímá mě tvůj příběh.",
    dedication: "Pro tebe, babičko",
    mode: "filled",
    sections,
    gender: "female",
  };
}

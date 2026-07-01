import { notFound } from "next/navigation";
import { BookDocument } from "@/components/book-pdf/BookDocument";
import { verifyPrintToken } from "@/lib/print/token";
import { loadPrintBook } from "@/lib/book/load";

/**
 * Internal print page for the headless-Chromium render (POST /api/print/book →
 * Puppeteer page.goto here → page.pdf). Renders the WHOLE book as one
 * continuous B5 document so it exports as a single PDF.
 *
 * NOT a user-facing route: it's reachable WITHOUT a Supabase cookie (so the
 * render function — which has no session — can fetch it), and is gated by a
 * short-lived HMAC token instead (lib/print/token.ts). The token names the book
 * id; "sample" renders the shared dev-preview content so the pipeline is
 * testable before order-wiring exists.
 *
 * Always dynamic + never cached: the token is per-request and the data is live.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { token: string };

export default async function PrintBookPage({ params }: { params: Promise<Params> }) {
  const { token } = await params;

  const id = verifyPrintToken(decodeURIComponent(token));
  if (!id) notFound();

  const book = await loadPrintBook(id);
  if (!book) notFound();

  return (
    <>
      {/* Strip the marketing chrome that the root layout always renders, so it
          never leaks into the PDF (the cookie bar would otherwise overlay the
          first page in a cookie-less headless session). */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".cookie-bar{display:none!important}body{margin:0;background:#1B2E4D}",
        }}
      />
      <BookDocument
        title={book.title}
        dedication={book.dedication}
        mode={book.mode}
        sections={book.sections}
        gender={book.gender}
        qr={book.qr}
      />
    </>
  );
}

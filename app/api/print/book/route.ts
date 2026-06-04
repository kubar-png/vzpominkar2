import { NextResponse, type NextRequest } from "next/server";
import type { Browser } from "puppeteer-core";
import { createPrintToken } from "@/lib/print/token";
import { SITE_URL } from "@/lib/site";

/**
 * Render the whole B5 book into ONE print-ready PDF via headless Chromium.
 *
 * POST { bookId?: string }  — bookId defaults to "sample" (the dev-preview book,
 * so the pipeline is testable before order-wiring exists). The body's id is
 * signed into a short-lived HMAC token, Puppeteer is pointed at the internal
 * print page (/print/book/[token] — reachable without an auth cookie), and the
 * resulting PDF is streamed straight back.
 *
 * Engine: puppeteer-core + @sparticuz/chromium on Vercel; the full `puppeteer`
 * (optionalDependency) with its bundled Chromium when running locally. Node 22.17+
 * / 24 is required by @sparticuz/chromium@149 — set the Vercel project to Node 24.
 *
 * NOT wired to Stripe/fulfilment — this is the render primitive only.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Body = { bookId?: string };

/**
 * Base origin Puppeteer should fetch the print page from. On Vercel the function
 * must call back into the *same* deployment (so the preview/branch URL renders
 * its own code), which the request's forwarded host gives us; locally and as a
 * fallback we use SITE_URL.
 */
function resolveOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return SITE_URL;
}

async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    // Serverless: puppeteer-core driving @sparticuz/chromium's bundled binary.
    const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
      import("@sparticuz/chromium"),
      import("puppeteer-core"),
    ]);
    // No WebGL/graphics stack needed for a text+image PDF; keeps cold start lean
    // and avoids extracting the swiftshader archive.
    chromium.setGraphicsMode = false;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  // Local dev: the full `puppeteer` package ships its own Chromium. Imported
  // dynamically + ignored by the bundler so a missing optionalDependency in a
  // production build never breaks the route.
  const mod: string = "puppeteer";
  const { default: puppeteer } = (await import(/* webpackIgnore: true */ mod)) as {
    default: { launch: (opts?: Record<string, unknown>) => Promise<Browser> };
  };
  return puppeteer.launch({ headless: true });
}

export async function POST(req: NextRequest) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    // Empty/invalid body → default to the sample book.
  }
  const bookId = body.bookId?.trim() || "sample";

  // Fail fast with a clear message if the signing secret is missing, rather
  // than letting the print page 404 mysteriously.
  let token: string;
  try {
    token = createPrintToken(bookId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Print signing not configured.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const printUrl = `${resolveOrigin(req)}/print/book/${encodeURIComponent(token)}`;

  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 120_000 });
    // Block on web fonts (PP Pangaia via next/font) so headings aren't rendered
    // in the fallback serif.
    await page.evaluateHandle("document.fonts.ready");

    const pdf = await page.pdf({
      preferCSSPageSize: true, // honour the @page { size: 176mm 250mm } B5 rule
      printBackground: true,
      displayHeaderFooter: true,
      // Empty header; footer is a centred running page number.
      headerTemplate: "<span></span>",
      footerTemplate:
        '<div style="width:100%;font-family:Arial,Helvetica,sans-serif;font-size:8pt;color:#5b6b7c;text-align:center;">' +
        '<span class="pageNumber"></span>' +
        "</div>",
      margin: { top: "14mm", bottom: "16mm", left: "16mm", right: "16mm" },
    });

    const filename = `kniha-vzpominek-${bookId}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[print/book] render failed", { bookId, err });
    const message = err instanceof Error ? err.message : "Render failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}

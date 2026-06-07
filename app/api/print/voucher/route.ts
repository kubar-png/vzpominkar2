import { NextResponse, type NextRequest } from "next/server";
import type { Browser } from "puppeteer-core";
import { createPrintToken } from "@/lib/print/token";
import { SITE_URL } from "@/lib/site";
import { checkRateLimitWithHeaders } from "@/lib/rate-limit";
import { getVoucherByToken } from "@/lib/gift/voucher";

/**
 * Render a personalized gift voucher (dárkový poukaz) into an A5-LANDSCAPE
 * print-ready PDF via headless Chromium, mirroring POST /api/print/book.
 *
 * POST { token: string } — the voucher's high-entropy public token (the
 * capability). The flow:
 *   - Look up the voucher by token (service-role); a miss is 404.
 *   - GATE: the voucher must be PAID. The PDF is a purchased artifact — minting
 *     a download for an unpaid voucher would hand out free vouchers, so an
 *     unpaid (or unknown) voucher is rejected.
 *   - Sign the voucher token into a short-lived HMAC print token, point
 *     Puppeteer at /print/voucher/[token] (reachable without an auth cookie),
 *     and stream the resulting A5-landscape PDF back.
 *
 * No owner login is required (the book guest-checkout products have no account)
 * — the unguessable voucher token plus the paid gate are the authorization.
 * Rate-limited per IP (cold-starting Chromium is expensive); fail-open so a KV
 * outage can't block a paying buyer from printing their voucher.
 *
 * Engine: puppeteer-core + @sparticuz/chromium on Vercel; the full `puppeteer`
 * (optionalDependency) with its bundled Chromium when running locally.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Body = { token?: string };

/**
 * Base origin Puppeteer should fetch the print page from — the *same*
 * deployment (so a preview/branch URL renders its own code), from the request's
 * forwarded host; SITE_URL is the local/fallback.
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
    // No WebGL/graphics stack needed for a text PDF; keeps cold start lean.
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
  // 1) Rate-limit per IP. Render is a cold Chromium boot (tens of seconds,
  // 300s budget) — a tight cap stops a script from pinning the function.
  // Fail-open: a KV outage must never block a paying buyer.
  const rl = await checkRateLimitWithHeaders("print", req.headers);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Příliš mnoho žádostí o tisk. Zkuste to prosím za chvíli." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    // Empty/invalid body → no token → handled below.
  }
  const voucherToken = body.token?.trim() || "";
  if (!voucherToken) {
    return NextResponse.json({ error: "Chybí poukaz." }, { status: 400 });
  }

  // 2) Authorization: the voucher must exist AND be paid. The PDF is a
  // purchased artifact — no free vouchers. A miss and an unpaid voucher return
  // the same 404 so we don't leak which tokens exist.
  const voucher = await getVoucherByToken(voucherToken);
  if (!voucher || !voucher.paid) {
    return NextResponse.json({ error: "Poukaz nenalezen." }, { status: 404 });
  }

  // Fail fast with a clear message if the signing secret is missing, rather
  // than letting the print page 404 mysteriously.
  let token: string;
  try {
    token = createPrintToken(voucher.token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Print signing not configured.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const printUrl = `${resolveOrigin(req)}/print/voucher/${encodeURIComponent(token)}`;

  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 120_000 });
    // Block on web fonts (PP Pangaia via next/font) so the message isn't
    // rendered in the fallback serif.
    await page.evaluateHandle("document.fonts.ready");

    const pdf = await page.pdf({
      preferCSSPageSize: true, // honour the @page { size: A5 landscape } rule
      printBackground: true, // the brand colour panel must print
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="darkovy-poukaz-vzpominkar.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[print/voucher] render failed", { err });
    const message = err instanceof Error ? err.message : "Render failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}

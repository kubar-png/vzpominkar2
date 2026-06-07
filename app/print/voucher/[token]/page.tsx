import { notFound } from "next/navigation";
import { verifyPrintToken } from "@/lib/print/token";
import { getVoucherByToken } from "@/lib/gift/voucher";
import { resolveGender, type Gender } from "@/lib/gender";
import { COVER_BG_HEX, type CoverBg } from "@/lib/book/cover";

/**
 * Internal print page for the gift voucher (dárkový poukaz) — the A5-LANDSCAPE
 * card a buyer hands to the recipient. Rendered by the headless-Chromium
 * pipeline (POST /api/print/voucher → Puppeteer page.goto here → page.pdf),
 * mirroring /print/book/[token].
 *
 * NOT a user-facing route: reachable WITHOUT a Supabase cookie (the render
 * function has no session), gated by a short-lived HMAC token (lib/print/token)
 * that names the voucher's high-entropy public token. The token is verified
 * server-side, then the voucher row is loaded (service-role) to render the
 * buyer's colour + personalization.
 *
 * Always dynamic + never cached: the token is per-request and the data is live.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { token: string };

// The fixed two-line gift message. "koupil{a}" is gender-aware via lib/gender;
// the voucher stores no buyer gender, so it renders the slash form ("koupil/a")
// by default — honest and unambiguous on a printed card.
const MESSAGE_LINE_1 = "Zajímá mě tvůj příběh.";
const MESSAGE_LINE_2 = "Proto jsem ti {koupil|koupila} Vzpomínkář.";

export default async function PrintVoucherPage({ params }: { params: Promise<Params> }) {
  const { token } = await params;

  const voucherToken = verifyPrintToken(decodeURIComponent(token));
  if (!voucherToken) notFound();

  const voucher = await getVoucherByToken(voucherToken);
  if (!voucher) notFound();

  const bg = COVER_BG_HEX[voucher.color as CoverBg] ?? COVER_BG_HEX.navy;
  // Voucher carries no buyer gender → slash fallback ("koupil/a").
  const gender: Gender | null = null;
  const line2 = resolveGender(MESSAGE_LINE_2, gender);

  const recipient = voucher.recipient?.trim() || null;
  const message = voucher.message?.trim() || null;
  const signedBy = voucher.signed_by?.trim() || null;

  return (
    <>
      {/* A5 landscape, full-bleed brand colour card with a gold frame. The
          marketing chrome from the root layout is stripped so it never leaks
          into the PDF (a cookie bar would overlay the card in the cookie-less
          headless session). Display headings use PP Pangaia
          (--font-display-loaded, set on <html> by next/font in the root
          layout). */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: A5 landscape; margin: 0; }
            .cookie-bar { display: none !important; }
            html, body { margin: 0; padding: 0; }
            .voucher-sheet {
              width: 210mm;
              height: 148mm;
              box-sizing: border-box;
              background: ${bg};
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 10mm;
            }
            .voucher-frame {
              width: 100%;
              height: 100%;
              box-sizing: border-box;
              border: 1.4mm solid #d4a017;
              border-radius: 2mm;
              padding: 12mm 14mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              color: #f4ecd8;
            }
            .voucher-eyebrow {
              font-family: var(--font-display-loaded), "PP Pangaia", "Palatino Linotype", Georgia, serif;
              font-size: 11pt;
              letter-spacing: 0.32em;
              text-transform: uppercase;
              color: #d4a017;
              margin: 0 0 8mm;
            }
            .voucher-recipient {
              font-family: var(--font-display-loaded), "PP Pangaia", "Palatino Linotype", Georgia, serif;
              font-style: italic;
              font-size: 16pt;
              color: #f4ecd8;
              margin: 0 0 6mm;
            }
            .voucher-message {
              font-family: var(--font-display-loaded), "PP Pangaia", "Palatino Linotype", Georgia, serif;
              font-size: 26pt;
              line-height: 1.3;
              margin: 0;
              color: #fbf6ea;
            }
            .voucher-message span { display: block; }
            .voucher-personal {
              font-family: Georgia, "Times New Roman", serif;
              font-style: italic;
              font-size: 13pt;
              line-height: 1.5;
              color: #e7dcc4;
              margin: 8mm 0 0;
              max-width: 150mm;
            }
            .voucher-rule {
              width: 26mm;
              height: 0.5mm;
              background: #d4a017;
              margin: 9mm 0 6mm;
              border: 0;
            }
            .voucher-signed {
              font-family: Georgia, "Times New Roman", serif;
              font-size: 12pt;
              color: #e7dcc4;
              margin: 0;
            }
            .voucher-brand {
              font-family: var(--font-display-loaded), "PP Pangaia", "Palatino Linotype", Georgia, serif;
              font-size: 10pt;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: #d4a017;
              margin: 10mm 0 0;
            }
          `,
        }}
      />
      <div className="voucher-sheet">
        <div className="voucher-frame">
          <p className="voucher-eyebrow">Dárkový poukaz</p>

          {recipient ? <p className="voucher-recipient">{recipient}</p> : null}

          <p className="voucher-message">
            <span>{MESSAGE_LINE_1}</span>
            <span>{line2}</span>
          </p>

          {message ? <p className="voucher-personal">{message}</p> : null}

          {signedBy ? (
            <>
              <hr className="voucher-rule" />
              <p className="voucher-signed">{signedBy}</p>
            </>
          ) : null}

          <p className="voucher-brand">Vzpomínkář</p>
        </div>
      </div>
    </>
  );
}

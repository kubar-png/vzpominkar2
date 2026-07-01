import { ImageResponse } from "next/og";

/* ─────────────────────────────────────────────────────────────────────────
 * app/opengraph-image.tsx — default Open Graph / Twitter card (link preview
 * shown when the site is shared by e-mail, SMS, or social).
 *
 * File-based convention: Next.js serves this as the OG image for every route
 * that doesn't define its own. 1200×630. Brand palette (docs/brand):
 *   · navy ground     #1B2E4D
 *   · off-white type   #FEF7D7
 *   · raspberry accent #CF364C  (frame + rule)
 * The brand symbol is embedded (off-white variant) at the top. Headline is set
 * in a serif face — Bree Serif isn't available as a bundled file, so we fall
 * back to the bundled PPPangaia serif, which keeps the editorial voice.
 * ───────────────────────────────────────────────────────────────────────── */

export const runtime = "edge";

export const alt = "Vzpomínkář — Než zapomenete, jak zněli.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#1B2E4D";
const OFFWHITE = "#FEF7D7";
const RASPBERRY = "#CF364C";

export default async function OpenGraphImage() {
  // Serif fallback (Bree Serif isn't bundled). fetch(new URL(...)) lets Next
  // bundle the local OTF as an edge asset.
  const serif = await fetch(
    new URL("../public/fonts/PPPangaia-Medium.otf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  // Embed the brand symbol (off-white on navy). Fetch as text and inline as a
  // URL-encoded SVG data URI so Satori can render it without a binary decode.
  const symbolSvg = await fetch(
    new URL("../public/brand/symbol-offwhite.svg", import.meta.url),
  ).then((res) => res.text());
  const symbolSrc = `data:image/svg+xml,${encodeURIComponent(symbolSvg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: NAVY,
          padding: "64px",
          fontFamily: "Pangaia",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            border: `2px solid ${RASPBERRY}`,
            borderRadius: "18px",
            padding: "56px 64px",
          }}
        >
          <img
            src={symbolSrc}
            alt=""
            width={128}
            height={112}
            style={{ display: "block" }}
          />
          {/* Thin raspberry rule between the symbol and the line. */}
          <div
            style={{
              width: "72px",
              height: "2px",
              backgroundColor: RASPBERRY,
              margin: "34px 0",
            }}
          />
          <div
            style={{
              fontSize: 94,
              lineHeight: 1.06,
              color: OFFWHITE,
              textAlign: "center",
              maxWidth: "920px",
            }}
          >
            Než zapomenete, jak zněli.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pangaia", data: serif, style: "normal", weight: 500 }],
    },
  );
}

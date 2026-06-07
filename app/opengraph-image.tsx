import { ImageResponse } from "next/og";

/* ─────────────────────────────────────────────────────────────────────────
 * app/opengraph-image.tsx — default Open Graph / Twitter card (link preview
 * shown when the site is shared by e-mail, SMS, or social).
 *
 * File-based convention: Next.js serves this as the OG image for every route
 * that doesn't define its own. 1200×630. Brand palette: deep navy ground with
 * a soft top-down gradient for depth (#15487e → #0e3b64 → #0a2f51), gold accent
 * (#d4a017), cream type (#f6efe2). The wordmark + headline are set in the brand
 * display serif PP Pangaia (loaded from /public/fonts), so the preview matches
 * the site's editorial voice instead of a generic system font.
 * ───────────────────────────────────────────────────────────────────────── */

export const runtime = "edge";

export const alt = "Vzpomínkář — Než zapomenete, jak zněli.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  // Load the brand display serif (PP Pangaia) so Satori renders the type in the
  // real face. fetch(new URL(...)) lets Next bundle the local OTF as an asset.
  const pangaia = await fetch(
    new URL("../public/fonts/PPPangaia-Medium.otf", import.meta.url),
  ).then((res) => res.arrayBuffer());

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
          // Navy ground + soft diagonal gradient = depth.
          backgroundColor: "#0e3b64",
          backgroundImage:
            "linear-gradient(155deg, #16497f 0%, #0e3b64 52%, #0a2f51 100%)",
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
            border: "2px solid #d4a017",
            borderRadius: "18px",
            padding: "64px",
          }}
        >
          <div
            style={{
              fontSize: 38,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#d4a017",
            }}
          >
            Vzpomínkář
          </div>
          {/* Thin gold rule between the wordmark and the line — quiet ornament. */}
          <div
            style={{
              width: "72px",
              height: "2px",
              backgroundColor: "#d4a017",
              opacity: 0.7,
              margin: "34px 0",
            }}
          />
          <div
            style={{
              fontSize: 94,
              lineHeight: 1.06,
              color: "#f6efe2",
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
      fonts: [{ name: "Pangaia", data: pangaia, style: "normal", weight: 500 }],
    },
  );
}

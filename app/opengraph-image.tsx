import { ImageResponse } from "next/og";

/* ─────────────────────────────────────────────────────────────────────────
 * app/opengraph-image.tsx — default Open Graph / Twitter card
 *
 * File-based convention: Next.js serves this as the OG image for every route
 * that doesn't define its own. 1200×630, brand palette only — cream paper
 * (#faf6ee), navy ink (#0e3b64), gold accent (#d4a017). No buzzwords, no
 * exclamation marks, vykání-neutral wordmark + the homepage subtitle.
 * ───────────────────────────────────────────────────────────────────────── */

export const runtime = "edge";

export const alt = "Vzpomínkář — Než zapomenete, jak zněli.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          backgroundColor: "#faf6ee",
          // Subtle inset gold frame, drawn with a border so no assets are needed.
          padding: "72px",
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
            borderRadius: "16px",
            padding: "64px",
          }}
        >
          <div
            style={{
              fontSize: 40,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#d4a017",
              marginBottom: "28px",
            }}
          >
            Vzpomínkář
          </div>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.05,
              color: "#0e3b64",
              textAlign: "center",
              maxWidth: "900px",
            }}
          >
            Než zapomenete, jak zněli.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

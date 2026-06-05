import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import localFont from "next/font/local";
import { Instrument_Sans, Caveat, Outfit } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { SmoothScroll } from "@/components/marketing/SmoothScroll";
import { RevealObserver } from "@/components/marketing/RevealObserver";

/* PP Pangaia — display serif. Licensed OTFs live in /public/fonts/.
 * The editorial display face on the marketing surface. */
const pangaia = localFont({
  src: [
    {
      path: "../public/fonts/PPPangaia-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/PPPangaia-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
  ],
  variable: "--font-display-loaded",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans-loaded",
  weight: ["400", "500", "600"],
});

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-outfit-loaded",
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-script-loaded",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // No global `alternates.canonical` here — a layout-level canonical would make
  // every marketing subpage canonicalise to "/", so Google would treat them as
  // duplicates of the homepage. Each page sets its own `canonical(...)` instead.
  title: {
    default: "Vzpomínkář — Než zapomenete, jak zněli",
    template: "%s · Vzpomínkář",
  },
  description:
    "Zaznamenejte vzpomínky rodičů a prarodičů hlasem nebo písmem a vytvořte z nich tištěnou knihu.",
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: "Vzpomínkář",
    // OG/Twitter images come from app/opengraph-image.tsx (file-based
    // convention) — the generated 1200×630 brand card, applied to all routes.
  },
  twitter: {
    card: "summary_large_image",
  },
  // Icons are auto-detected from app/icon.svg + app/apple-icon.svg (file-based
  // convention from Next.js App Router). Gold book on a warm brown gradient,
  // sized as a vector so all screens render crisp.
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="cs"
      className={`${instrumentSans.variable} ${pangaia.variable} ${outfit.variable} ${caveat.variable}`}
    >
      <body
        style={{
          fontFamily: "var(--font-sans-loaded), var(--font-sans)",
        }}
      >
        {children}
        <CookieConsent />
        <SmoothScroll />
        <RevealObserver />
      </body>
    </html>
  );
}

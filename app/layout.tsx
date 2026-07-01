import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { Bree_Serif, Host_Grotesk } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { SmoothScroll } from "@/components/marketing/SmoothScroll";
import { RevealObserver } from "@/components/marketing/RevealObserver";

/* Brand fonts (docs/brand): Bree Serif (display, 400 only) + Host Grotesk (UI/body). */
const breeSerif = Bree_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
  variable: "--font-display-loaded",
});

const hostGrotesk = Host_Grotesk({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans-loaded",
  weight: ["300", "400", "500", "600", "700"],
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
      className={`${hostGrotesk.variable} ${breeSerif.variable}`}
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

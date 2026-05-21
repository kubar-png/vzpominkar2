import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Sans, Caveat, Outfit, Vollkorn, Inter } from "next/font/google";
import "./globals.css";

/* PP Pangaia — display serif. Licensed OTFs live in /public/fonts/.
 * This is the new editorial display face that replaces Vollkorn on the
 * marketing surface. Vollkorn is still loaded as a fallback for the senior
 * surface (which is being reskinned separately by another agent). */
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

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter-loaded",
});

const vollkorn = Vollkorn({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-vollkorn-loaded",
  weight: "variable",
  style: ["normal", "italic"],
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://vzpominkar2.vercel.app"),
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
    images: ["/brand/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/logo.png"],
  },
  icons: {
    icon: [{ url: "/brand/symbol.png", type: "image/png" }],
    apple: [{ url: "/brand/symbol.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="cs"
      className={`${instrumentSans.variable} ${inter.variable} ${pangaia.variable} ${vollkorn.variable} ${outfit.variable} ${caveat.variable}`}
    >
      <body
        style={{
          fontFamily: "var(--font-sans-loaded), var(--font-sans)",
        }}
      >
        {children}
      </body>
    </html>
  );
}

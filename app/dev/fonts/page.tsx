import type { CSSProperties } from "react";
import Link from "next/link";
import {
  EB_Garamond,
  Playfair_Display,
  Cormorant_Garamond,
  Newsreader,
  Libre_Caslon_Display,
  Libre_Caslon_Text,
  Inter,
  Fraunces,
} from "next/font/google";

/* ---------------------------------------------------------------------------
 * Heading font candidates
 * ------------------------------------------------------------------------- */

const ebGaramond = EB_Garamond({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const libreCaslonDisplay = Libre_Caslon_Display({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400"],
});

const libreCaslonText = Libre_Caslon_Text({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/* ---------------------------------------------------------------------------
 * Each "pairing" reuses the same body font (Inter) and varies the display.
 * ------------------------------------------------------------------------- */

type Pairing = {
  id: string;
  name: string;
  blurb: string;
  vibe: string;
  displayFamily: string;
  bodyFamily: string;
  /** Some faces look better at slightly different weight/letter-spacing. */
  headingStyle?: CSSProperties;
  italicNote?: string;
};

const PAIRINGS: Pairing[] = [
  {
    id: "fraunces",
    name: "Fraunces  ·  Inter   (current)",
    blurb:
      "What the page uses today. Modern serif with optical sizing - warm, friendly, contemporary.",
    vibe: "Současný editoriál",
    displayFamily: fraunces.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 300, letterSpacing: "-0.02em" },
  },
  {
    id: "eb-garamond",
    name: "EB Garamond  ·  Inter",
    blurb:
      "True Garamond revival - the letterforms of 17th-19th-century book interiors.",
    vibe: "Starý hardback, knižní vazba",
    displayFamily: ebGaramond.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 500, letterSpacing: "-0.01em" },
  },
  {
    id: "playfair",
    name: "Playfair Display  ·  Inter",
    blurb:
      "High-contrast modern serif. Sharp thicks/thins. Magazine-cover energy.",
    vibe: "Premiový časopis, módní lifestyle",
    displayFamily: playfair.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 500, letterSpacing: "-0.015em" },
  },
  {
    id: "cormorant",
    name: "Cormorant Garamond  ·  Inter",
    blurb:
      "Ultra-thin Garamond derivative. Dramatic at large sizes, gorgeous italic.",
    vibe: "Galerie, koncertní program",
    displayFamily: cormorant.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "-0.01em" },
  },
  {
    id: "newsreader",
    name: "Newsreader  ·  Inter",
    blurb:
      "Editorial newspaper face with optical sizing - large sizes get more dramatic shapes automatically.",
    vibe: "Literární příloha, dlouhý článek",
    displayFamily: newsreader.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "-0.015em" },
  },
  {
    id: "libre-caslon",
    name: "Libre Caslon Display  ·  Libre Caslon Text",
    blurb:
      "Caslon - the typeface English book presses used for two centuries. Display + text variants together.",
    vibe: "Anglická tiskárna, Penguin Classics",
    displayFamily: libreCaslonDisplay.style.fontFamily,
    bodyFamily: libreCaslonText.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "0" },
  },
];

/* ---------------------------------------------------------------------------
 * Sample
 * ------------------------------------------------------------------------- */

function PairingCard({ p }: { p: Pairing }) {
  const heading: CSSProperties = {
    fontFamily: p.displayFamily,
    ...p.headingStyle,
  };
  const body: CSSProperties = { fontFamily: p.bodyFamily };
  const display: CSSProperties = { fontFamily: p.displayFamily };

  return (
    <article className="rounded-[var(--radius-2xl)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 shadow-[var(--shadow-sm)]">
      {/* Header strip */}
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            {p.vibe}
          </p>
          <h2
            className="mt-1 text-2xl text-[var(--color-navy-900)]"
            style={display}
          >
            {p.name}
          </h2>
        </div>
        <p
          className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]"
          style={body}
        >
          {p.blurb}
        </p>
      </header>

      {/* Section marker - like the real page */}
      <div className="mb-8 flex items-center gap-5">
        <span
          className="text-4xl font-bold uppercase leading-none tracking-tight text-[var(--color-red-500)]"
          style={display}
        >
          II
        </span>
        <span
          className="text-xs uppercase tracking-[0.32em] text-[var(--color-text-muted)]"
          style={body}
        >
          Jak to funguje
        </span>
        <span className="ml-2 h-px flex-1 bg-[var(--color-border-strong)]" />
      </div>

      {/* Hero headline */}
      <h1
        className="text-[clamp(2.5rem,5.4vw,5rem)] leading-[1.02] text-[var(--color-navy-900)]"
        style={{ ...heading, textWrap: "balance" }}
      >
        Vzpomínky, které{" "}
        <em className="italic">v&nbsp;rodině</em>
        <br />
        zůstanou.
      </h1>

      {/* Italic subhead */}
      <p
        className="mt-7 max-w-[46ch] text-xl italic leading-relaxed text-[var(--color-text-muted)]"
        style={display}
      >
        Každý týden jedna otázka pro maminku, tátu nebo prarodiče. Oni odpoví
        hlasem či&nbsp;textem - vy z toho na konci roku držíte v ruce
        knihu.
      </p>

      {/* Body paragraph */}
      <p
        className="mt-7 max-w-[60ch] text-base leading-[1.65] text-[var(--color-text)]"
        style={body}
      >
        Nahrávky převádíme do textu, čistíme přepisy a řadíme je do kapitol.
        Vy průběžně sledujete, jak se kniha tvoří - nebo počkáte, až
        bude celá hotová. Tvrdé desky, šitá vazba, papír v krémové barvě.
      </p>

      {/* Mini sample row - A-Z, 0-9, diakritika */}
      <div className="mt-10 grid gap-6 border-t border-[var(--color-border)] pt-6 sm:grid-cols-3">
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]"
            style={body}
          >
            Display · 72px
          </p>
          <p
            className="mt-2 text-[72px] leading-none text-[var(--color-navy-900)]"
            style={heading}
          >
            Aa
          </p>
        </div>
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]"
            style={body}
          >
            Italic · 32px
          </p>
          <p
            className="mt-2 text-[32px] italic leading-none text-[var(--color-navy-900)]"
            style={heading}
          >
            kniha
          </p>
        </div>
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]"
            style={body}
          >
            Diakritika
          </p>
          <p
            className="mt-2 text-2xl text-[var(--color-navy-900)]"
            style={heading}
          >
            ě š č ř ž ý á í é ů
          </p>
        </div>
      </div>

      {/* CTA + body for context */}
      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
        <a
          href={`#pick-${p.id}`}
          className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-base font-medium text-white transition-all hover:bg-[var(--color-primary-hover)]"
          style={body}
        >
          Začít zdarma
        </a>
        <span
          className="text-sm text-[var(--color-text-subtle)]"
          style={body}
        >
          Zdarma na rok. Knihu zaplatíte, až ji budete chtít vytisknout.
        </span>
      </div>

      {/* "Pick this" anchor */}
      <p
        id={`pick-${p.id}`}
        className="mt-8 text-xs text-[var(--color-text-subtle)]"
        style={body}
      >
        Reagovat zprávou: <code>&ldquo;Použij {(p.name.split("·")[0] ?? p.name).trim()}&rdquo;</code>
      </p>
    </article>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export default function FontComparisonPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div
        className="border-b border-[var(--color-border)] bg-[var(--color-paper-100)]/60"
        style={{ fontFamily: inter.style.fontFamily }}
      >
        <div className="mx-auto max-w-[var(--container-wide)] px-6 py-10">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            <Link href="/" className="underline-offset-4 hover:underline">
              ← Vzpomínkář
            </Link>
            <span className="mx-3">·</span>
            <span>Dev · Font Pairings</span>
          </p>
          <h1
            className="mt-3 text-4xl font-light tracking-tight text-[var(--color-navy-900)] sm:text-5xl"
            style={{ fontFamily: fraunces.style.fontFamily }}
          >
            Heading face - six options
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]"
          >
            Each card applies a different display face to the same hero copy in
            the brand palette (navy / red / cream). Body text is Inter
            throughout (except Caslon, which gets Caslon Text). Pick the one
            that feels right for the product - bookish &amp; oldschool, magazine
            &amp; premium, or editorial &amp; warm.
          </p>
        </div>
      </div>

      <main
        className="mx-auto max-w-[var(--container-wide)] space-y-10 px-6 py-14"
        style={{ fontFamily: inter.style.fontFamily }}
      >
        {PAIRINGS.map((p) => (
          <PairingCard key={p.id} p={p} />
        ))}
      </main>
    </div>
  );
}

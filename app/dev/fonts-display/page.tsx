import type { CSSProperties } from "react";
import Link from "next/link";
import {
  DM_Serif_Display,
  DM_Serif_Text,
  Bodoni_Moda,
  Playfair_Display,
  Fraunces,
  Newsreader,
  Inter,
  Bricolage_Grotesque,
  Unbounded,
  Big_Shoulders,
  Schibsted_Grotesk,
  Mona_Sans,
  Abril_Fatface,
  Yeseva_One,
  Marcellus,
  Cardo,
  Spectral,
  Della_Respira,
  IM_Fell_DW_Pica,
  Petrona,
  Vollkorn,
  Forum,
  Cormorant_Infant,
} from "next/font/google";

/* Display-font candidates for the Remento-style "more display, less weight" pass. */

const dmSerif = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
});

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: "variable",
});

const unbounded = Unbounded({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const bigShoulders = Big_Shoulders({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const schibsted = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: "variable",
  style: ["normal", "italic"],
});

const monaSans = Mona_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: "variable",
  style: ["normal", "italic"],
});

/* ──── New distinctive heritage / editorial candidates ──────────────────── */

const abril = Abril_Fatface({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400"],
});

const yeseva = Yeseva_One({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400"],
});

const marcellus = Marcellus({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400"],
});

const cardo = Cardo({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const spectral = Spectral({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

/* Della Respira: no latin-ext subset either. */
const dellaRespira = Della_Respira({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

/* IM Fell DW Pica has no latin-ext subset - Czech diacritics may fall back. */
const imFell = IM_Fell_DW_Pica({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

const petrona = Petrona({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: "variable",
  style: ["normal", "italic"],
});

const vollkorn = Vollkorn({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: "variable",
  style: ["normal", "italic"],
});

const forum = Forum({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400"],
});

const cormorantInfant = Cormorant_Infant({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmSerifText = DM_Serif_Text({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

type Pairing = {
  id: string;
  name: string;
  blurb: string;
  vibe: string;
  displayFamily: string;
  bodyFamily: string;
  headingStyle?: CSSProperties;
};

const PAIRINGS: Pairing[] = [
  {
    id: "newsreader",
    name: "Newsreader (current)",
    blurb:
      "Currently shipped. Variable, opsz axis. Editorial newspaper face - calm and readable but not very display.",
    vibe: "Současný",
    displayFamily: newsreader.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 500, letterSpacing: "-0.015em" },
  },
  {
    id: "dm-serif",
    name: "DM Serif Display 400",
    blurb:
      "High-contrast display serif, single weight (400). Made specifically for headlines. Sharp thicks/thins. Closest Google Fonts cousin of Remento’s Adonis vibe.",
    vibe: "Remento-blizký",
    displayFamily: dmSerif.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "-0.02em" },
  },
  {
    id: "bodoni-moda",
    name: "Bodoni Moda 500",
    blurb:
      "Classical Bodoni, variable. Regal feel, very high contrast. Works at large sizes but can read fragile small.",
    vibe: "Klasický Bodoni",
    displayFamily: bodoniModa.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 500, letterSpacing: "-0.02em" },
  },
  {
    id: "playfair",
    name: "Playfair Display 500",
    blurb:
      "The familiar Bodoni-like display serif. Less elegant than the Klim originals but reliable display energy.",
    vibe: "Magazine cover",
    displayFamily: playfair.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 500, letterSpacing: "-0.02em" },
  },
  {
    id: "fraunces-light",
    name: "Fraunces 400 (opsz + SOFT)",
    blurb:
      "Variable. Pulled to weight 400 with opsz maxed for display. Rounded terminals, friendlier than Bodoni but still distinctive.",
    vibe: "Moderní editorial",
    displayFamily: fraunces.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: {
      fontWeight: 400,
      letterSpacing: "-0.02em",
      fontVariationSettings: '"opsz" 144, "SOFT" 50',
    },
  },

  /* ─── Sans display candidates ──────────────────────────────────── */

  {
    id: "bricolage",
    name: "Bricolage Grotesque 600",
    blurb:
      "Modern variable grotesk by Mathieu Triay. Distinctive curves, slightly quirky. Big personality, very contemporary.",
    vibe: "Sans · Moderní studio",
    displayFamily: bricolage.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 600, letterSpacing: "-0.03em" },
  },
  {
    id: "schibsted",
    name: "Schibsted Grotesk 600",
    blurb:
      "Variable, designed for newspaper/editorial. Tighter than Inter, more character. Sober, professional, calm.",
    vibe: "Sans · Editoriál",
    displayFamily: schibsted.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 600, letterSpacing: "-0.025em" },
  },
  {
    id: "mona-sans",
    name: "Mona Sans 700",
    blurb:
      "GitHub's variable sans. Wide range of weights & widths, expressive. Reads modern-tech without being sterile.",
    vibe: "Sans · Tech moderní",
    displayFamily: monaSans.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 700, letterSpacing: "-0.025em" },
  },
  {
    id: "unbounded",
    name: "Unbounded 500",
    blurb:
      "Geometric display sans, distinctive open shapes. Highly recognizable - closer to a brand logo face than a heading font.",
    vibe: "Sans · Geometrický display",
    displayFamily: unbounded.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 500, letterSpacing: "-0.02em" },
  },
  {
    id: "big-shoulders",
    name: "Big Shoulders Display 600",
    blurb:
      "Bold condensed editorial sans. Lots of headline density per line - works when you have long Czech words.",
    vibe: "Sans · Kondenzovaný editoriál",
    displayFamily: bigShoulders.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 600, letterSpacing: "-0.01em" },
  },

  /* ─── Special-character heritage / editorial candidates ──────────── */

  {
    id: "abril",
    name: "Abril Fatface 400",
    blurb:
      "Bold display Bodoni. Magazine masthead energy - slab-ish at the thick, hairline thin contrast. Single weight.",
    vibe: "Časopis · masthead",
    displayFamily: abril.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "-0.025em" },
  },
  {
    id: "yeseva",
    name: "Yeseva One 400",
    blurb:
      "Russian-rooted display serif with arched, almost calligraphic strokes. Very distinctive lowercase, gorgeous diakritika.",
    vibe: "Soviet poster + 60s book cover",
    displayFamily: yeseva.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "-0.015em" },
  },
  {
    id: "marcellus",
    name: "Marcellus 400",
    blurb:
      "Roman-inscriptional letterforms (think Trajan's Column lowercase). Sober, lapidary, monumental. Pairs beautifully with anything.",
    vibe: "Římský nápis · monument",
    displayFamily: marcellus.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "0em" },
  },
  {
    id: "della-respira",
    name: "Della Respira 400",
    blurb:
      "Inspired by Della Robbia (an Arts-and-Crafts Roman). Hand-cut feel, gently irregular. Warm, crafty, very signature.",
    vibe: "Arts & Crafts · ručně",
    displayFamily: dellaRespira.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "0em" },
  },
  {
    id: "im-fell",
    name: "IM Fell DW Pica 400",
    blurb:
      "Revival of John Fell's 17th-century types. Inky, slightly irregular - Victorian print-shop quirky. Pozor: no latin-ext, may show ? for ě/š.",
    vibe: "Stará tiskárna · 17. století",
    displayFamily: imFell.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "0em" },
  },
  {
    id: "petrona",
    name: "Petrona 500",
    blurb:
      "Variable serif designed for digital reading. Distinctive lowercase a/g, slight humanist flair. Modern but warm.",
    vibe: "Digitální čtenář",
    displayFamily: petrona.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 500, letterSpacing: "-0.01em" },
  },
  {
    id: "vollkorn",
    name: "Vollkorn 600",
    blurb:
      "German-engineered book serif. Friendly, warm, never showy. Excellent diacritics - built for European text.",
    vibe: "Německá kniha · seriózní",
    displayFamily: vollkorn.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 600, letterSpacing: "-0.015em" },
  },
  {
    id: "forum",
    name: "Forum 400",
    blurb:
      "Roman lapidary, like Marcellus but with subtle flair on a few letters (g, Q). Single weight. Calm and confident.",
    vibe: "Římské fórum",
    displayFamily: forum.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "0em" },
  },
  {
    id: "cormorant-infant",
    name: "Cormorant Infant 500",
    blurb:
      "Cormorant variant with rounded terminals - softer than the Garamond cut. Beautiful at large sizes, delicate.",
    vibe: "Měkký Cormorant",
    displayFamily: cormorantInfant.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 500, letterSpacing: "-0.015em" },
  },
  {
    id: "dm-serif-text",
    name: "DM Serif Text 400",
    blurb:
      "Calmer sibling of DM Serif Display. Still high contrast but designed to work at body sizes too - could carry the whole page.",
    vibe: "DM Serif · klidnější",
    displayFamily: dmSerifText.style.fontFamily,
    bodyFamily: inter.style.fontFamily,
    headingStyle: { fontWeight: 400, letterSpacing: "-0.018em" },
  },
];

function PairingCard({ p }: { p: Pairing }) {
  const heading: CSSProperties = {
    fontFamily: p.displayFamily,
    ...p.headingStyle,
  };
  const body: CSSProperties = { fontFamily: p.bodyFamily };
  const display: CSSProperties = { fontFamily: p.displayFamily };

  return (
    <article className="rounded-[var(--radius-3xl)] bg-[var(--color-surface)] p-10 shadow-md">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            {p.vibe}
          </p>
          <h2 className="mt-1 text-2xl text-[var(--color-navy-900)]" style={display}>
            {p.name}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]" style={body}>
          {p.blurb}
        </p>
      </header>

      <p className="mb-3 text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]" style={body}>
        Jak to funguje
      </p>

      <h1
        className="text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[1.02] text-[var(--color-navy-900)]"
        style={{ ...heading, textWrap: "balance" }}
      >
        Vzpomínky, které{" "}
        <em className="italic">v&nbsp;rodině</em>
        <br />
        zůstanou.
      </h1>

      <p
        className="mt-7 max-w-[58ch] text-xl leading-relaxed text-[var(--color-text-muted)]"
        style={body}
      >
        Každý týden jedna otázka pro maminku, tátu nebo prarodiče. Oni odpoví
        hlasem či&nbsp;textem - vy z toho na konci roku držíte v ruce
        knihu.
      </p>

      <div className="mt-10 grid gap-6 border-t border-[var(--color-border)] pt-6 sm:grid-cols-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]" style={body}>
            Display · 96px
          </p>
          <p
            className="mt-2 text-[96px] leading-none text-[var(--color-navy-900)]"
            style={heading}
          >
            Aa
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]" style={body}>
            Italic · 40px
          </p>
          <p
            className="mt-2 text-[40px] italic leading-none text-[var(--color-navy-900)]"
            style={heading}
          >
            kniha
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]" style={body}>
            Diakritika
          </p>
          <p
            className="mt-2 text-[40px] leading-none text-[var(--color-navy-900)]"
            style={heading}
          >
            ščřžýáíé
          </p>
        </div>
      </div>
    </article>
  );
}

export default function FontsDisplayPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] py-16">
      <div className="mx-auto max-w-[var(--container-wide)] px-6">
        <header className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            Interní · srovnání display fontů
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-semibold text-[var(--color-navy-900)] sm:text-6xl">
            Display kandidáti
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Stejný hero, různé fonty. Cíl: Remento-style display feel, méně tělesné váhy, víc kontrastu.
            Klikni na <Link href="/dev/fonts" className="underline">/dev/fonts</Link> pro starší srovnání text fontů.
          </p>
        </header>

        <div className="grid gap-10">
          {PAIRINGS.map((p) => (
            <PairingCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </main>
  );
}

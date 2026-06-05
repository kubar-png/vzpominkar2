import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/site";
import { Shell } from "@/components/landing/Shell";
import { FinalCta } from "@/components/landing/FinalCta";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Napište nám e-mailem na ahoj@vzpominkar.cz. Odpovídá člověk, ne robot. Telefonní podporu připravujeme.",
  alternates: { canonical: canonical("/kontakt") },
};

/* ─────────────────────────────────────────────────────────────────────────
 * /kontakt — full editorial rebuild
 *
 * Small hero, four paper cards for contact channels, navy founder quote
 * belt, and a quick-links footnote. NO fake placeholders — channels that
 * aren't ready say "připravujeme" with an honest pointer to e-mail.
 * ─────────────────────────────────────────────────────────────────────── */

const CHANNELS = [
  {
    n: "I",
    eyebrow: "Nejrychlejší",
    label: "E-mail",
    value: "ahoj@vzpominkar.cz",
    href: "mailto:ahoj@vzpominkar.cz" as string | null,
    body: "Odpovídáme do jednoho pracovního dne, většinou do hodiny. Hodí se na konkrétní dotaz k účtu nebo objednávce.",
  },
  {
    n: "II",
    eyebrow: "Po telefonu",
    label: "Telefon",
    /* TODO: doplnit reálné telefonní číslo, jakmile bude linka spuštěna */
    value: "Telefonní podpora — připravujeme",
    href: null,
    body: "Telefonní linku spouštíme krátce po pilotu. Mezitím napište e-mailem — odpovídáme do hodiny v pracovní době.",
  },
  {
    n: "III",
    eyebrow: "Osobně",
    label: "Sídlo",
    /* TODO: doplnit reálnou adresu sídla před spuštěním placené verze */
    value: "Adresa — připravujeme",
    href: null,
    body: "Adresu redakce zveřejníme s ostrým spuštěním. Pokud nás potřebujete potkat dřív, napište a domluvíme se.",
  },
  {
    n: "IV",
    eyebrow: "Fakturace",
    label: "Firemní údaje",
    /* TODO: doplnit IČO, DIČ a fakturační adresu po zápisu s.r.o. */
    value: "IČO a DIČ — připravujeme",
    href: null,
    body: "Po dokončení zápisu do obchodního rejstříku tu najdete IČO, DIČ i fakturační adresu pro zaslání zásilek.",
  },
] as const;

export default function KontaktPage() {
  return (
    <Shell>
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Kontakt</span>
          <h1 style={{ maxWidth: "22ch", margin: "0 auto 24px" }}>
            Napište. Odpoví člověk.
          </h1>
          <p className="lede">
            Odpovídá vám člověk z malé pražské party, ne chatbot. A ano,
            čteme každou zprávu — i tu, která začíná „Vaše stránka se mi
            nelíbí, protože&hellip;“.
          </p>
          <a href="mailto:ahoj@vzpominkar.cz" className="btn btn-gold hero-cta">
            Napsat na ahoj@vzpominkar.cz <span className="arrow">↗</span>
          </a>
        </div>
      </section>

      {/* ═══════════ CHANNELS GRID — paper cards ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="kontakt-grid">
            {CHANNELS.map((c) => (
              <article key={c.label} className="kontakt-card" data-reveal>
                <div className="kontakt-card-head">
                  <span className="kontakt-card-numeral">{c.n}</span>
                  <span className="eyebrow">{c.eyebrow}</span>
                </div>
                <h3>{c.label}</h3>
                {c.href ? (
                  <a href={c.href} className="kontakt-card-value kontakt-card-value-link">
                    {c.value}
                  </a>
                ) : (
                  <p className="kontakt-card-value kontakt-card-value-pending">
                    {c.value}
                  </p>
                )}
                <p className="kontakt-card-body">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOUNDER PROMISE — warm dark ═══════════ */}
      <section className="feature-quote dark">
        <div className="container">
          <span className="eyebrow">Slibujeme jen tohle</span>
          <blockquote>
            „Když napíšete, odpovíme do druhého rána. Když pošlete dopis,
            přečteme ho a napíšeme zpátky — rukou, na kartě.&ldquo;
          </blockquote>
          <div className="feature-attr">— Jakub Š., zakladatel</div>
        </div>
      </section>

      {/* ═══════════ QUICK LINKS — než nám napíšete ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Než nám napíšete</span>
            <h2>Možná najdete odpověď rychleji sami.</h2>
          </div>
          <div className="kontakt-quicklinks">
            <Link href="/faq" className="arrow-link">
              Časté otázky
            </Link>
            <Link href="/jak-to-funguje" className="arrow-link">
              Jak to funguje
            </Link>
            <Link href="/cenik" className="arrow-link">
              Ceník
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <FinalCta
        eyebrow="Začít rovnou"
        heading="Pošlete jim první otázku v pondělí."
        lede="Registrace zabere pět minut. Jednorázově, přístup napořád — bez předplatného."
      />
    </Shell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";

export const metadata: Metadata = {
  title: "Dárkový certifikát",
  description:
    "Tištěný dárkový certifikát pro maminku, tatínka nebo prarodiče. Vyberete den, kdy odejde první otázka, a vzkaz na kartu.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * /darek/certifikat — full editorial rebuild
 *
 * Sub-page: smaller hero, a CSS-rendered certificate "preview" (mirrors
 * homepage leather-book treatment but flatter), 3-step "Jak na to",
 * fields-to-fill list, and a single CTA card.
 * ─────────────────────────────────────────────────────────────────────── */

const HOW = [
  {
    n: "I",
    h: "Koupíte certifikát",
    body: "Online za pár minut. Vyberete den, kdy má první otázka odejít, a co má v certifikátu být napsané.",
  },
  {
    n: "II",
    h: "Stáhnete PDF nebo necháme vytisknout",
    body: "PDF s krásnou sazbou na klasickém krémovém papíře — vytisknete doma a vložíte do dárkové obálky. Nebo vám tištěnou verzi pošleme.",
  },
  {
    n: "III",
    h: "Předáte při slavnostní chvíli",
    body: "Babička otevře obálku, přečte si vzkaz a uvidí, že její příběh stojí někomu za vydání. V den D odejde první otázka.",
  },
];

const FIELDS = [
  {
    n: "01",
    h: "Komu certifikát patří",
    body: "Jméno a křestní oslovení obdarovaného. To, jak ho oslovují vnoučata. „Babi Marie“, „dědo Karle“, „mami“ — jak je vám blízké.",
  },
  {
    n: "02",
    h: "Datum, kdy první otázka odejde",
    body: "Den, který chcete. Vánoce, narozeniny, výročí — nebo libovolná středa. První otázka odchází tu pondělí ráno v 10:00.",
  },
  {
    n: "03",
    h: "Krátký vzkaz",
    body: "Pár vět, které se otisknou do certifikátu pod obrázek. Větu z dětství, oblíbenou pasáž z písničky, vlastní slib.",
  },
  {
    n: "04",
    h: "Kdo dárek dává",
    body: "Vaše jméno (nebo „od celé rodiny“). Otiskne se rukou na certifikát — písmem, které vypadá jako pero, ne tisk.",
  },
];

export default function CertifikatPage() {
  return (
    <Shell>
      {/* ═══════════ HERO — small, sub-page scale ═══════════ */}
      <section className="hero" style={{ paddingTop: "clamp(36px, 6vw, 72px)" }}>
        <div className="container">
          <span className="eyebrow">Dárkový certifikát</span>
          <h1 style={{ maxWidth: "22ch", margin: "0 auto 24px" }}>
            Karta v obálce, která začíná celý rok vyprávění.
          </h1>
          <p className="lede">
            Vyberete den, kdy první otázka odejde. Napíšete vzkaz. Předáte
            při slavnostní chvíli. Zbytek roku už řešíme my.
          </p>
          <Link href="/signup?gift=1" className="btn btn-gold hero-cta">
            Objednat certifikát <span className="arrow">↗</span>
          </Link>
        </div>
      </section>

      {/* ═══════════ CERTIFICATE PREVIEW — CSS render ═══════════ */}
      <section className="section" style={{ paddingTop: "clamp(24px, 4vw, 48px)" }}>
        <div className="container">
          <div className="cert-preview-wrap" data-reveal>
            <div className="cert-preview" aria-label="Náhled dárkového certifikátu">
              <div className="cert-fleuron" aria-hidden>⁂</div>
              <p className="cert-eyebrow">Vzpomínkář — dárkový certifikát</p>
              <p className="cert-personal">Pro Marii</p>
              <p className="cert-title">Rok vyprávění,</p>
              <p className="cert-title-2">který se proměníš v knihu.</p>
              <p className="cert-message">
                „Mami, vyprávěj. A my si vzpomeneme.“
                <br />
                První otázka odejde 6. ledna ráno.
              </p>
              <div className="cert-sign">
                <span className="cert-sign-name">Od Kláry a Honzíka</span>
                <span className="cert-sign-date">Brno · prosinec 2026</span>
              </div>
              <div className="cert-corner cert-corner-tl" aria-hidden />
              <div className="cert-corner cert-corner-tr" aria-hidden />
              <div className="cert-corner cert-corner-bl" aria-hidden />
              <div className="cert-corner cert-corner-br" aria-hidden />
            </div>
            <p className="cert-preview-caption">
              Ukázka — vaše jméno, datum a vzkaz nahradíte při objednávce.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW TO — 3 steps ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Jak na to</span>
            <h2>
              Tři kroky.
              <br />
              Pět minut vašeho času.
            </h2>
          </div>
          <div className="darek-steps">
            {HOW.map((h) => (
              <div className="darek-step" key={h.n} data-reveal>
                <span className="darek-step-numeral">{h.n}</span>
                <h3>{h.h}</h3>
                <p>{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FIELDS YOU FILL IN ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Co po vás chceme</span>
            <h2>Čtyři pole. Žádný formulář na pět stránek.</h2>
          </div>
          <div className="cert-fields">
            {FIELDS.map((f) => (
              <div className="cert-field" key={f.n} data-reveal>
                <div className="cert-field-meta">
                  <span className="cert-field-numeral">{f.n}</span>
                  <h3>{f.h}</h3>
                </div>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ GUARANTEE / FINAL CTA ═══════════ */}
      <section className="signup">
        <div className="container">
          <div className="signup-card">
            <span className="eyebrow">Naše záruka</span>
            <h2>Pokud se obdarovaný nerozpovídá, vrátíme peníze do 30 dnů.</h2>
            <p className="lede">
              Vyzkoušejte první týdny v klidu. Pokud zjistíte, že to není
              pro vaši rodinu, napište nám — vrátíme peníze, žádné výmluvy.
            </p>
            <div style={{ display: "inline-flex", position: "relative" }}>
              <Link href="/signup?gift=1" className="btn btn-gold">
                Objednat certifikát <span className="arrow">↗</span>
              </Link>
            </div>
            <p className="signup-disclaimer" style={{ marginTop: 18 }}>
              Zpět na{" "}
              <Link
                href="/darek"
                style={{
                  color: "var(--gold-soft)",
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                }}
              >
                přehled dárků
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}

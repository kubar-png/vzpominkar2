import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { FinalCta, FinalCtaFooterLink } from "@/components/landing/FinalCta";

export const metadata: Metadata = {
  title: "Babybook — kniha prvních let",
  description:
    "Týdenní otázky pro rodiče malých dětí. Zapisujte první slova, krůčky a směšné věty. Kniha, kterou předáte dítěti, až bude dospělé.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * /babybook — full editorial rebuild
 *
 * Sibling product. Same editorial scope as homepage (cream paper, navy
 * ink, oxblood + gold) so it reads as a continuation, not a separate
 * brand. The book mock uses a softer pastel cover treatment to signal
 * "for the baby version" without breaking the palette.
 * ─────────────────────────────────────────────────────────────────────── */

const CHAPTERS = [
  {
    n: "I",
    eyebrow: "Měsíce 0–6",
    h: "První všechno",
    items: [
      "Co jste cítili, když jste ho/ji poprvé drželi v náručí?",
      "Jak vypadala vaše první noc bez spánku?",
      "Co vám táta nebo máma řekli, když se narodil/a?",
      "Jaký zvuk dělala, když chtěla pít?",
    ],
  },
  {
    n: "II",
    eyebrow: "Měsíce 6–18",
    h: "První slova a krůčky",
    items: [
      "Které bylo její první srozumitelné slovo?",
      "Kdy poprvé sama udělala krok?",
      "Co byla její nejoblíbenější písnička před spaním?",
      "Jakou věc nesla všude s sebou?",
    ],
  },
  {
    n: "III",
    eyebrow: "Roky 2–4",
    h: "Vlastní názor na svět",
    items: [
      "Co byla její první „vlastní“ věta, která vás dostala?",
      "Komu se nejvíc smála a proč?",
      "Co odmítala jíst, ať dělali rodiče cokoliv?",
      "Jaká byla její vysněná profese ve čtyřech?",
    ],
  },
  {
    n: "IV",
    eyebrow: "Roky 4+",
    h: "Vlastní příběhy",
    items: [
      "Co byla první samostatná noc bez rodičů?",
      "Kdo byl její první nejlepší kamarád/ka?",
      "Jakou historku v rodině vyprávíme dodnes?",
      "Co byste si přáli, aby si pamatovala z dětství?",
    ],
  },
];

const DIFFERENCES = [
  {
    n: "I",
    h: "Otázky pro vás, ne pro dítě",
    body: "Klasický Vzpomínkář se ptá maminky nebo dědy. Babybook se ptá vás, mladých rodičů. Dítě v knize bude — jako hrdina příběhu, ne jako autor.",
  },
  {
    n: "II",
    h: "Rychlejší tempo na začátku",
    body: "První rok přijdou otázky každé pondělí (děti rostou rychle a vzpomínky vyblednou ještě rychleji). Druhý rok přepneme na jednu otázku za dva týdny.",
  },
  {
    n: "III",
    h: "Místo na fotky a kresby",
    body: "Babybook má v sazbě širší prostor pro obrázky — fotky z porodnice, první kresba pastelkou, otisk dlaně. Dvojstrana pro jeden moment.",
  },
  {
    n: "IV",
    h: "Kniha předaná v dospělosti",
    body: "Knihu tisknete, až dítě dospívá (18, 25, ke svatbě, k narození vlastního dítěte). Dárek, který nikdo neumí koupit v obchodě.",
  },
];

const FAQ = [
  {
    q: "Pro jaké věkové rozmezí Babybook funguje?",
    a: "Od narození zhruba do šesti let. Po šesti se dítě začíná samo pamatovat — tehdy se přepneme na klasický Vzpomínkář (otázky pro něj, ne pro vás).",
  },
  {
    q: "Co když máme dvě nebo tři děti?",
    a: "Pro každé dítě jedna kniha. Otázky se neopakují mezi sourozenci — vzpomínky o každém z nich jsou jiné, kniha taky.",
  },
  {
    q: "Můžeme do Babybooku přidávat fotky a kresby?",
    a: "Ano. Každá otázka má slot pro fotku, naskenovanou kresbu nebo otisk. Sazba okolo se přizpůsobí — neořezává.",
  },
];

export default function BabybookPage() {
  return (
    <Shell>
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Babybook — kniha prvních let</span>
          <h1 style={{ maxWidth: "22ch", margin: "0 auto 24px" }}>
            Kniha prvních let, na kterou si vzpomenete za třicet.
          </h1>
          <p className="lede">
            Týdenní otázky pro rodiče malých dětí. Zapisujte první slova,
            krůčky, směšné věty — než vyblednou. Až bude dospělé, dáte mu
            knihu, kterou si nikdo nikdy nekoupí v obchodě.
          </p>
          <PrimaryCta href="/signup?product=babybook" variant="hero" />
        </div>

        {/* Soft baby-book mock — pastel sage cover with gold inner border */}
        <div className="book-stage" aria-label="Babybook — kniha prvních let">
          <div className="page-leaf leaf-photo leaf-L2" />
          <div className="page-leaf leaf-note leaf-L3" />

          <div className="book-cover babybook-cover">
            <div className="book-spine" aria-hidden="true" />
            <div className="babybook-eyebrow">Babybook</div>
            <div className="book-title">Pro Adélu</div>
            <div className="book-year">2026 — 2032</div>
          </div>

          <div className="page-leaf leaf-text leaf-R2" />
          <div className="page-leaf leaf-photo leaf-R3" />
        </div>
      </section>

      {/* ═══════════ SAMPLE QUESTIONS — four chapters ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }} id="ukazka">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Ukázka otázek</span>
            <h2>
              Čtyři kapitoly.
              <br />
              Roky 0 až 5.
            </h2>
            <p className="lede">
              Otázky se mění s tím, jak dítě roste. Z prvního „mám tě“
              k vlastním názorům na svět.
            </p>
          </div>
          <div className="babybook-chapters">
            {CHAPTERS.map((ch) => (
              <article key={ch.n} className="babybook-chapter" data-reveal>
                <div className="babybook-chapter-head">
                  <span className="babybook-chapter-numeral">{ch.n}</span>
                  <div>
                    <span className="eyebrow">{ch.eyebrow}</span>
                    <h3>{ch.h}</h3>
                  </div>
                </div>
                <ol className="babybook-chapter-list">
                  {ch.items.map((q, i) => (
                    <li key={q}>
                      <span className="babybook-q-num">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ DIFFERENCES — what makes Babybook different ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Čím se liší</span>
            <h2>
              Stejný formát,
              <br />
              úplně jiný účel.
            </h2>
            <p className="lede">
              Pokud chcete sbírat vzpomínky maminky nebo dědy, podívejte se
              na{" "}
              <Link
                href="/"
                style={{ textDecoration: "underline", textUnderlineOffset: 4 }}
              >
                klasický Vzpomínkář
              </Link>
              .
            </p>
          </div>
          <div className="onas-values">
            {DIFFERENCES.map((d) => (
              <div key={d.n} className="onas-value" data-reveal>
                <span className="onas-value-numeral">{d.n}</span>
                <h3>{d.h}</h3>
                <p>{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOUNDER NOTE — warm dark belt ═══════════ */}
      <section className="feature-quote dark">
        <div className="container">
          <span className="eyebrow">Proč jsme Babybook přidali</span>
          <blockquote>
            „Když se mi narodila dcera, řešili jsme, jak budeme zapisovat
            první rok. Druhý týden po porodu jsme měli sešit. Pátý týden už
            ne. Babybook je sešit, který si pamatuje sám.&ldquo;
          </blockquote>
          <div className="feature-attr">— Jakub Š., zakladatel</div>
        </div>
      </section>

      {/* ═══════════ MINI-FAQ ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="faq">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Než začnete</span>
            <h2>Tři otázky, které slyšíme nejčastěji.</h2>
          </div>
          <div className="faq-list">
            {FAQ.map((f, i) => (
              <details key={f.q} className="faq-item" open={i === 0}>
                <summary>{f.q}</summary>
                <div className="faq-body">{f.a}</div>
              </details>
            ))}
          </div>
          <div className="faq-cta">
            <Link href="/faq" className="arrow-link">
              Všechny otázky a odpovědi
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <FinalCta
        eyebrow="Začněte hned"
        heading="Dokud si první slova ještě pamatujete."
        lede="Jednorázově, přístup napořád — bez předplatného."
        ctaHref="/signup?product=babybook"
        footer={
          <>
            Nebo se podívejte na{" "}
            <FinalCtaFooterLink href="/cenik">ceník</FinalCtaFooterLink>.
          </>
        }
      />
    </Shell>
  );
}

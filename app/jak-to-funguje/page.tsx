import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/site";
import { Shell } from "@/components/landing/Shell";
import { QuestionDeck } from "@/components/landing/QuestionDeck";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { FinalCta, FinalCtaFooterLink } from "@/components/landing/FinalCta";

export const metadata: Metadata = {
  title: "Jak to funguje",
  description:
    "Čtyři kroky od přihlášení k tištěné knize. Týdenní otázka, jednoduchá odpověď hlasem nebo textem, automatický přepis a rodinná knihovna.",
  alternates: { canonical: canonical("/jak-to-funguje") },
};

/* ─────────────────────────────────────────────────────────────────────────
 * /jak-to-funguje — full editorial rebuild
 *
 * Mirrors the homepage editorial scope: cream paper canvas, navy ink,
 * oxblood + gold accents. Section rhythm follows the homepage exactly:
 * .hero on top, .divider fleurons between major sections, .section padding
 * everywhere, .feature-quote.dark for the warm-brown quote belt, and the
 * shared .btn / .arrow-link button language. No legacy --color-* tokens.
 * ─────────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    n: "I",
    eyebrow: "Týden 1",
    title: "Vyberete otázky",
    body: "Z knihovny 200+ otázek vyberete ty, na které by rodič rád odpověděl. Můžete přidat i vlastní — třeba na konkrétní příhodu, kterou si pamatujete z dětství.",
    aside: "Otázky jsou rozdělené do osmi témat (dětství, rodiče, mládí, láska, práce, výchova, místa, životní moudro). Vy zvolíte tempo.",
  },
  {
    n: "II",
    eyebrow: "Každé pondělí",
    title: "Rodič dostane jednu otázku",
    body: "Otázka přijde e-mailem. Jedno kliknutí spustí nahrávání. Pokud rodič raději píše, odpoví textem.",
    aside: "Žádné účty, žádné aplikace, žádné stahování. Cílem je, aby maminka u sedmdesátky neřešila techniku — jen vyprávěla.",
  },
  {
    n: "III",
    eyebrow: "Do 48 hodin",
    title: "Přepíšeme a vyhladíme",
    body: "Hlasovou nahrávku převedeme do textu. Korektor přečte, vyhladí věty, ale ponechá způsob, jakým to rodič řekl. Slang, dialekt, oblíbená spojení zůstanou — to je přece to, kvůli čemu si knihu jednou otevřete.",
    aside: "Pod každou kapitolou v knize bude QR kód, který spustí původní hlas. Aby zůstal i ten zvuk, ne jen slova.",
  },
  {
    n: "IV",
    eyebrow: "Když je vzpomínek dost",
    title: "Vytisknete knihu",
    body: "Online náhled vám ukáže přesné rozložení stránek, sazbu i fotky. Když je vše tak, jak chcete, kliknete na „Objednat tisk“. Kniha přijde za 2–3 týdny — tvrdé desky, šitá vazba, krémový papír.",
    aside: "První tištěná kniha je v ceně — objednáte ji, až bude hotová. Online přístup do knihovny vám zůstává navždy, i kdyby k tisku nikdy nedošlo.",
  },
] as const;

/* Eight representative questions sampled across categories — same shape
 * as the homepage deck so the visitor sees an actual taste of the
 * library, not a placeholder. */
const DECK_QUESTIONS = [
  { category: "Dětství",  question: "Kde jsi vyrůstal? Popiš mi dům, ve kterém jsi bydlel." },
  { category: "Škola",    question: "Který učitel na tebe v životě nejvíc zapůsobil — a proč?" },
  { category: "Vánoce",   question: "Jak vypadaly Vánoce u vás doma, když jsi byla malá?" },
  { category: "Mládí",    question: "Jakou hudbu jsi poslouchal, když ti bylo kolem dvaceti?" },
  { category: "Láska",    question: "Jak jste se s mámou seznámili? Vzpomínáš si na první setkání?" },
  { category: "Rodina",   question: "Pamatuješ si na den, kdy se ti narodilo první dítě?" },
  { category: "Práce",    question: "Jaké bylo tvoje první zaměstnání? Jak jsi se k němu dostala?" },
  { category: "Moudro",   question: "Co bys poradila svému dvacetiletému já, kdybys mohla?" },
] as const;

const FAQ = [
  {
    q: "Jak dlouho trvá, než kniha vznikne?",
    a: "V průměru 9–12 měsíců. Záleží jen na tom, kolik otázek si vyberete a v jakém tempu rodič odpovídá.",
  },
  {
    q: "Co když rodič nemá smartphone?",
    a: "Pošleme odpovědní telefonní číslo. Stačí prozvonit, my hovor zaznamenáme a přepíšeme. Funguje i z tlačítkového telefonu.",
  },
  {
    q: "Můžu otázky upravovat za jízdy?",
    a: "Ano. Kdykoliv můžete přidat novou, posunout, vyřadit. Knihovna roste s vámi, ne podle pevného plánu.",
  },
];

export default function JakToFungujePage() {
  return (
    <Shell>
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        <div className="container">
          <h1 style={{ maxWidth: "20ch", margin: "0 auto 24px" }}>
            Čtyři kroky od otázky ke knize.
          </h1>
          <p className="lede">
            Vy vyberete otázky. Rodič odpoví hlasem nebo textem. My všechno
            vyhladíme. Z toho vznikne kniha, kterou držíte v ruce.
          </p>
          <PrimaryCta variant="hero" />
        </div>
      </section>

      {/* ═══════════ FOUR STEPS — alternating sides with Roman watermarks ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Od první otázky po hotovou knihu.</h2>
            <p className="lede">
              Vy řešíte jen výběr otázek. Posílání, přepis, sazba i tisk
              jsou na nás.
            </p>
          </div>

          <ol
            className="jtf-steps"
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            {STEPS.map((step, i) => {
              const isEven = i % 2 === 1;
              return (
                <li
                  key={step.n}
                  data-reveal
                  className="jtf-step"
                  data-side={isEven ? "right" : "left"}
                >
                  <span className="jtf-step-watermark" aria-hidden>
                    {step.n}
                  </span>

                  <div className="jtf-step-copy">
                    <h2>{step.title}</h2>
                    <p>{step.body}</p>
                    <p className="jtf-step-aside">{step.aside}</p>
                  </div>

                  <div className="jtf-step-photo-wrap">
                    <div className={`jtf-step-photo tone-${(i % 4) + 1}`} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ═══════════ QUOTE BELT — warm dark ═══════════ */}
      <section className="feature-quote dark">
        <div className="container">
          <blockquote>
            „Maminka první pondělí odpověděla z čistého pocitu povinnosti.
            Třetí pondělí už čekala telefonem v ruce, kdy otázka přijde.&ldquo;
          </blockquote>
          <div className="feature-attr">— Lucie, 47 let, Plzeň</div>
        </div>
      </section>

      {/* ═══════════ QUESTION DECK — actual library taste ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section question-deck-section">
        <div className="container">
          <div className="section-head">
            <h2 className="q-deck-title">
              Osm z dvou set otázek,
              <br />
              které pondělky otevírají.
            </h2>
            <p className="lede">
              Listujte. Pokaždé jedna otázka, jedna kapitola příběhu, kterou
              jste možná nikdy neslyšeli.
            </p>
          </div>
          <QuestionDeck questions={DECK_QUESTIONS} totalCount={200} />
        </div>
      </section>

      {/* ═══════════ ROLES — co dělá rodina vs my ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section">
        <div className="container">
          <div className="jtf-roles">
            <div data-reveal>
              <h2>Vy jen vyprávíte.</h2>
              <ul className="feature-list">
                <li>Vyberete otázky, na které stojí za to odpovědět.</li>
                <li>Rodič každý týden odpoví — hlasem nebo textem.</li>
                <li>Doplníte fotky, jestli chcete. (Není povinné.)</li>
                <li>Když je vzpomínek dost, kliknete na „Objednat tisk“.</li>
              </ul>
            </div>

            <div data-reveal>
              <h2>My všechno ostatní.</h2>
              <ul className="feature-list">
                <li>Posíláme otázky každé pondělí ráno v 10:00.</li>
                <li>Přepisujeme nahrávky a vyhladíme věty.</li>
                <li>Sázíme stránky, vybíráme typografii, řadíme kapitoly.</li>
                <li>Tiskneme, vážeme, balíme a posíláme.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MINI-FAQ — uses homepage .faq-item ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="faq">
        <div className="container">
          <div className="section-head">
            <h2>Tři otázky, které slyšíme nejčastěji.</h2>
            <p className="lede">
              Celý seznam najdete v plném{" "}
              <Link href="/faq" style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>
                FAQ
              </Link>
              .
            </p>
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

      {/* ═══════════ FINAL SIGNUP CARD — navy + gold ═══════════ */}
      <FinalCta
        heading="Zeptejte se na to důležité ještě dnes."
        lede="Jednorázově, přístup napořád — bez předplatného."
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

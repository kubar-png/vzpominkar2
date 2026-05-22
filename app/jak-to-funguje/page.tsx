import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";

export const metadata: Metadata = {
  title: "Jak to funguje",
  description:
    "Čtyři kroky od přihlášení k tištěné knize. Týdenní otázka, jednoduchá odpověď hlasem nebo textem, automatický přepis a rodinná knihovna.",
};

const STEPS = [
  {
    n: "I",
    eyebrow: "Týden 1",
    title: "Vyberete otázky",
    body:
      "Z knihovny 200+ otázek vyberete ty, na které by rodič rád odpověděl. Můžete přidat i vlastní — třeba na konkrétní příhodu, kterou si pamatujete z dětství.",
    aside:
      "Otázky jsou rozdělené do osmi témat (dětství, rodiče, mládí, láska, práce, výchova, místa, životní moudro). Vy zvolíte tempo.",
  },
  {
    n: "II",
    eyebrow: "Každé pondělí",
    title: "Rodič dostane jednu otázku",
    body:
      "Otázka přijde SMSkou nebo e-mailem. Jedno kliknutí spustí nahrávání. Pokud rodič raději píše, odpoví textem. Funguje i z tlačítkového telefonu — stačí prozvonit naše číslo.",
    aside:
      "Žádné účty, žádné aplikace, žádné stahování. Cílem je, aby maminka u sedmdesátky neřešila techniku — jen vyprávěla.",
  },
  {
    n: "III",
    eyebrow: "Do 48 hodin",
    title: "Přepíšeme a vyhladíme",
    body:
      "Hlasovou nahrávku převedeme do textu. Korektor přečte, vyhladí věty, ale ponechá způsob, jakým to rodič řekl. Slang, dialekt, oblíbená spojení zůstanou — to je přece to, kvůli čemu si knihu jednou otevřete.",
    aside:
      "Pod každou kapitolou v knize bude QR kód, který spustí původní hlas. Aby zůstal i ten zvuk, ne jen slova.",
  },
  {
    n: "IV",
    eyebrow: "Když je vzpomínek dost",
    title: "Vytisknete knihu",
    body:
      "Online náhled vám ukáže přesné rozložení stránek, sazbu i fotky. Když je vše tak, jak chcete, kliknete na „Objednat tisk“. Kniha přijde za 2–3 týdny — tvrdé desky, šitá vazba, krémový papír.",
    aside:
      "Tisk se účtuje až ve chvíli objednávky. Online přístup do knihovny vám zůstává navždy, i kdyby k tisku nikdy nedošlo.",
  },
];

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
      {/* Hero */}
      <section className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <span className="eyebrow">Jak to funguje</span>
          <h1 style={{ margin: "0 auto", maxWidth: "20ch" }}>
            Čtyři kroky od otázky ke knize.
          </h1>
          <p
            className="lede"
            style={{ margin: "28px auto 0", maxWidth: "54ch" }}
          >
            Vy vyberete otázky. Rodič odpoví hlasem nebo textem. My všechno
            vyhladíme. Z toho vznikne kniha, kterou držíte v ruce.
          </p>
        </div>
      </section>

      <div className="divider" aria-hidden />

      {/* Steps */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
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
                    <span className="step-label">{step.eyebrow}</span>
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

      {/* Quote belt — dark editorial */}
      <section className="feature-quote dark">
        <div className="container">
          <span className="eyebrow">Z dopisů, které nám chodí</span>
          <blockquote>
            &bdquo;Maminka první pondělí odpověděla z čistého pocitu povinnosti.
            Třetí pondělí už čekala telefonem v ruce, kdy otázka přijde.&ldquo;
          </blockquote>
          <div className="feature-attr">— Lucie, 47 let, Plzeň</div>
        </div>
      </section>

      <div className="divider" aria-hidden />

      {/* What we do / what you do */}
      <section className="section">
        <div className="container">
          <div className="jtf-roles">
            <div data-reveal>
              <span className="eyebrow">Co dělá rodina</span>
              <h2>Vy jen vyprávíte.</h2>
              <ul className="feature-list">
                <li>Vyberete otázky, na které stojí za to odpovědět.</li>
                <li>Rodič každý týden odpoví — hlasem nebo textem.</li>
                <li>Doplníte fotky, jestli chcete. (Není povinné.)</li>
                <li>Když je vzpomínek dost, kliknete na &bdquo;Objednat tisk&ldquo;.</li>
              </ul>
            </div>

            <div data-reveal>
              <span className="eyebrow">Co děláme my</span>
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

      <div className="divider" aria-hidden />

      {/* Mini-FAQ */}
      <section className="faq">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Než začnete</span>
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

      {/* Final CTA */}
      <section className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <h2 style={{ margin: "0 auto", maxWidth: "22ch" }}>
            Začněte dnes. Pošleme první otázku v pondělí.
          </h2>
          <div
            style={{
              marginTop: 36,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px 24px",
            }}
          >
            <Link href="/signup" className="btn btn-gold">
              Začít zdarma <span className="arrow">↗</span>
            </Link>
            <Link href="/cenik" className="arrow-link">
              Podívat se na ceník
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}

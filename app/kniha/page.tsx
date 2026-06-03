import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { FinalCta, FinalCtaFooterLink } from "@/components/landing/FinalCta";
import { KnihaHeroScroll } from "@/components/landing/KnihaHeroScroll";

export const metadata: Metadata = {
  title: "Kniha vzpomínek — vyplňovací kniha jako dárek",
  description:
    "Klasická tištěná kniha s otázkami napříč šesti životními obdobími. Darujete ji blízkému, on ji vlastní rukou vyplní — a vznikne rodinná kronika jeho slovy. Otázky si můžete sami sestavit.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * /kniha — fyzická vyplňovací kniha (doplněk k appce)
 *
 * Stejný editorial scope jako zbytek webu (krémový papír, navy inkoust,
 * oxblood + zlatá). Pro lidi, kterým digitální model nesedí: klasická
 * kniha, do které se píše rukou. Naše přidaná hodnota = kupující si může
 * otázky navolit (konfigurátor, cesta B).
 * ─────────────────────────────────────────────────────────────────────── */

const PHASES = [
  {
    n: "I",
    eyebrow: "Životní fáze 1",
    h: "Dětství",
    items: [
      "Jaká je vaše nejranější vzpomínka? Kolik vám tehdy mohlo být let?",
      "Kde jste vyrůstali? Popište dům nebo byt, ve kterém jste bydleli.",
      "Jak vypadaly Vánoce ve vaší rodině, když jste byli malí?",
      "Co jste mívali na nedělní oběd — a kdo ho vařil?",
    ],
  },
  {
    n: "II",
    eyebrow: "Životní fáze 2",
    h: "Školní léta",
    items: [
      "Vzpomínáte si na svůj první školní den? Jaký byl?",
      "Kdo byl váš nejoblíbenější učitel a proč?",
      "Měli jste nejlepšího kamaráda nebo kamarádku? Co o nich víte dnes?",
      "Jaký školní zážitek vás nejvíc potrápil — a jak jste to zvládli?",
    ],
  },
  {
    n: "III",
    eyebrow: "Životní fáze 3",
    h: "Dospívání",
    items: [
      "Co byl váš první větší sen, když vám bylo kolem dvaceti?",
      "Jakou hudbu jste poslouchali, když vám bylo dvacet?",
      "Kam jste jezdili s kamarády? Měli jste oblíbené místo?",
      "Jak jste se seznámili se svým partnerem? Vzpomínáte na první setkání?",
    ],
  },
  {
    n: "IV",
    eyebrow: "Životní fáze 4",
    h: "Rodina",
    items: [
      "Pamatujete si na den, kdy se vám narodilo první dítě?",
      "Jaká byla vaše svatba? Co si z ní pamatujete nejlíp?",
      "Která rodinná tradice vám byla nejdražší a proč?",
      "Kdo z rodiny vás nejvíc ovlivnil a v čem?",
    ],
  },
  {
    n: "V",
    eyebrow: "Životní fáze 5",
    h: "Kariéra",
    items: [
      "Jaké bylo vaše první zaměstnání? Jak jste se k němu dostali?",
      "Co byl nejhezčí den ve vaší kariéře?",
      "Vzpomínáte si na pracovní výzvu, která vás pořádně prověřila?",
      "Měli jste kolegu, kterého si dodnes vážíte?",
    ],
  },
  {
    n: "VI",
    eyebrow: "Životní fáze 6",
    h: "Zralý věk",
    items: [
      "Když se ohlédnete zpět, na co jste opravdu hrdí?",
      "Co považujete v životě za to nejdůležitější?",
      "Co byste poradili svému dvacetiletému já, kdybyste mohli?",
      "Co by vaše vnoučata měla vědět o světě, ve kterém jste vyrůstali?",
    ],
  },
];

const WHY = [
  {
    n: "I",
    h: "Píše se rukou, ne do telefonu",
    body: "Žádná aplikace, žádné přihlašování. Sednete si s knihou a perem a píšete vlastní rukou — tak, jak to máte rádi. Rukopis, který po letech zůstane.",
  },
  {
    n: "II",
    h: "Dárek, který se dává z ruky do ruky",
    body: "Krásná tištěná kniha, kterou zabalíte a předáte. Pro narozeniny, Vánoce, kulatiny — nebo jen tak, z lásky.",
  },
  {
    n: "III",
    h: "Vlastním tempem",
    body: "Šest životních období, spousta otázek, žádný spěch. Obdarovaný vyplňuje, kdy se mu chce — týdny i měsíce. Kniha počká.",
  },
  {
    n: "IV",
    h: "Otázky si vyberete vy",
    body: "Na rozdíl od běžných knih si u nás můžete otázky sami sestavit — přidat vlastní, jiné odebrat, přepsat. Kniha bude přesně o tom, co vás zajímá.",
  },
];

const FAQ = [
  {
    q: "Kdo knihu vyplňuje?",
    a: "Ten, komu ji darujete — vlastní rukou. Vy vyberete otázky a věnujete knihu; blízký do ní postupně zapisuje své vzpomínky. Výsledkem je rodinná kronika jeho slovy a jeho rukopisem.",
  },
  {
    q: "Kolik je v knize otázek?",
    a: "Standardní kniha má kolem 300 otázek napříč šesti životními obdobími. Pokud si zvolíte vlastní sestavení, počet i znění otázek si upravíte sami.",
  },
  {
    q: "Můžu si otázky upravit?",
    a: "Ano — to je naše přidaná hodnota. Ve variantě „vlastní otázky“ projdete šest životních fází a v každé můžete otázky přidat, odebrat nebo přepsat. Z knihy se stane originál na míru.",
  },
  {
    q: "Jak se kniha liší od vaší aplikace?",
    a: "Aplikace posílá otázky po týdnech a vzpomínky nahráváte hlasem nebo píšete do telefonu. Kniha je pro ty, kdo mají radši papír a pero — žádná technologie, jen vy a kniha.",
  },
];

export default function KnihaPage() {
  return (
    <Shell>
      <KnihaHeroScroll />
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Kniha vzpomínek — vyplňovací kniha</span>
          <h1 style={{ maxWidth: "24ch", margin: "0 auto 24px" }}>
            Kniha, do které blízký vlastní rukou napíše svůj život.
          </h1>
          <p className="lede">
            Klasická tištěná kniha s otázkami napříč šesti životními obdobími.
            Darujete ji rodiči nebo prarodiči, oni ji v klidu vyplní — a vy
            získáte rodinnou kroniku jejich slovy. Otázky si můžete sami
            sestavit.
          </p>
          <PrimaryCta href="/kniha/sestavit" label="Sestavit vlastní knihu" variant="hero" />
        </div>

        <div className="kniha-stage" aria-label="Kniha vzpomínek">
          {/* Ruled paper slides out to the right and fills with handwriting on scroll */}
          <div className="kniha-paper" aria-hidden>
            <p className="kniha-handwriting">
              Narodila jsem se v zimě roku 1948 v malém domku na kraji vesnice.
              Pamatuju si vůni chleba, který maminka pekla každou sobotu, a jak
              jsme s bratrem běhali bosi po louce za stodolou…
            </p>
          </div>

          <div className="book-cover kniha-cover">
            <div className="book-spine" aria-hidden="true" />
            <div className="kniha-eyebrow">Kniha vzpomínek</div>
            <div className="book-title">Příběh tvého života</div>
            <div className="book-year">Pro tebe, babičko</div>
          </div>
        </div>
      </section>

      {/* ═══════════ SAMPLE QUESTIONS — six life phases ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }} id="ukazka">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Ukázka otázek</span>
            <h2>
              Šest životních období.
              <br />
              Celý jeden život.
            </h2>
            <p className="lede">
              Od prvních vzpomínek z dětství po moudro zralého věku. Tady je
              ochutnávka — kniha jich má kolem tří set.
            </p>
          </div>
          <div className="kniha-chapters">
            {PHASES.map((ch) => (
              <article key={ch.n} className="kniha-chapter" data-reveal>
                <div className="kniha-chapter-head">
                  <span className="kniha-chapter-numeral">{ch.n}</span>
                  <div>
                    <span className="eyebrow">{ch.eyebrow}</span>
                    <h3>{ch.h}</h3>
                  </div>
                </div>
                <ol className="kniha-chapter-list">
                  {ch.items.map((q, i) => (
                    <li key={q}>
                      <span className="kniha-q-num">
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

      {/* ═══════════ WHY a physical book ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Proč kniha</span>
            <h2>
              Pro ty, kdo mají
              <br />
              radši papír a pero.
            </h2>
            <p className="lede">
              Máte radši aplikaci s týdenními otázkami a hlasovými nahrávkami?
              Podívejte se na{" "}
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
            {WHY.map((d) => (
              <div key={d.n} className="onas-value" data-reveal>
                <h3>{d.h}</h3>
                <p>{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING — two tiers ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }} id="cena">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Cena</span>
            <h2>Jedna kniha, dvě varianty.</h2>
            <p className="lede">
              Jednorázová platba, poštovné zdarma (ČR i SK). Žádné předplatné.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gap: "20px",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              maxWidth: "760px",
              margin: "48px auto 0",
            }}
          >
            <div
              data-reveal
              style={{
                border: "1px solid var(--line)",
                borderRadius: "12px",
                padding: "32px",
                background: "var(--paper)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <span className="eyebrow">Standardní</span>
              <div
                style={{
                  fontFamily: "var(--font-display-editorial)",
                  fontSize: "36px",
                  fontWeight: 500,
                  color: "var(--ink)",
                }}
              >
                599 Kč
              </div>
              <p style={{ flex: 1 }}>
                Kniha s ~300 pečlivě vybranými otázkami napříč šesti životními
                obdobími. Stačí darovat.
              </p>
              <Link
                href="/kniha/sestavit"
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                Koupit standardní <span className="arrow">↗</span>
              </Link>
            </div>
            <div
              data-reveal
              data-reveal-delay-100
              style={{
                border: "2px solid var(--gold)",
                borderRadius: "12px",
                padding: "32px",
                background: "var(--paper)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <span className="eyebrow">Vlastní otázky</span>
              <div
                style={{
                  fontFamily: "var(--font-display-editorial)",
                  fontSize: "36px",
                  fontWeight: 500,
                  color: "var(--ink)",
                }}
              >
                1 099 Kč
              </div>
              <p style={{ flex: 1 }}>
                Projdete šest životních fází a otázky si sami přidáte, odeberete
                nebo přepíšete. Kniha na míru.
              </p>
              <Link
                href="/kniha/sestavit"
                className="btn btn-gold"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                Sestavit vlastní <span className="arrow">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MINI-FAQ ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="faq">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Než objednáte</span>
            <h2>Co se nejčastěji ptáte.</h2>
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
        eyebrow="Darujte vzpomínky"
        heading="Než ty příběhy vyblednou."
        lede="Jednorázově, poštovné zdarma — kniha, kterou si nikdo nekoupí v obchodě úplně stejnou."
        ctaHref="/kniha/sestavit"
        ctaLabel="Sestavit vlastní knihu"
        footer={
          <>
            Nebo se podívejte na{" "}
            <FinalCtaFooterLink href="/cenik">ceník appky</FinalCtaFooterLink>.
          </>
        }
      />
    </Shell>
  );
}

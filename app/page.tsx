import Link from "next/link";
import { HeroScrollDriver } from "@/components/landing/HeroScrollDriver";
import { HomeMobileMenu } from "@/components/landing/HomeMobileMenu";
import { QuestionDeck } from "@/components/landing/QuestionDeck";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";

const FORBES_TESTIMONIALS = [
  {
    title: "Z povinnosti se stal rituál",
    quote:
      "„Táta se těší na sobotní otázku jako na seriál. Vařím kafe a poslouchám, jak vypráví o vojně v Olomouci.”",
    author: "Pavla W., dcera",
  },
  {
    title: "Hodiny jejího hlasu",
    quote:
      "„Babička loni odešla. Neměla jsem po ní jediný záznam. Dneska mám hodiny — a knihu, kterou děti otevřou kdykoliv.”",
    author: "Jana M., dcera",
  },
  {
    title: "Pohádka místo pohádky",
    quote:
      "„Holky si pouští babiččin hlas na dobrou noc. Vyprávění o tom, jak se v padesátých letech bruslilo na Lužánkách.”",
    author: "Marie V., matka dvou dcer",
  },
] as const;

/* Eight representative questions from the seed library, sampled across the
 * 8 categories. Phrased in tykání as if the visitor is imagining asking the
 * question to their own parent (alternating masculine + feminine address so
 * it reads as a natural conversation with both mom and dad). */
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

/* ─────────────────────────────────────────────────────────────────────────
 * Marketing homepage — editorial direction (M3 reskin, vzpominkar2)
 *
 * Mirrors `docs/MOCKUP-REFERENCE.html` section-for-section. All visual
 * styling lives in `app/globals.css` under the `.editorial` scope so other
 * routes are untouched while parallel agents reskin them.
 *
 * The hero scroll-fan animation drives a single `--hero-scroll` CSS var on
 * <html> (0 → 1 over the first ~700px). That's the only client-side JS on
 * this page; everything else stays a Server Component.
 * ─────────────────────────────────────────────────────────────────────── */

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vzpomínkář",
  url: "https://vzpominkar2.vercel.app",
  logo: "https://vzpominkar2.vercel.app/logo.png",
  description:
    "Vzpomínkář — kniha rodinné paměti. Rok týdenních otázek pro rodiče a prarodiče; z jejich hlasů uděláme tištěnou knihu pro vnoučata.",
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "ahoj@vzpominkar.cz",
      areaServed: "CZ",
      availableLanguage: ["Czech"],
    },
  ],
} as const;

export default function HomePage() {
  return (
    <div className="editorial">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape `</` so a future dynamic value can't break out of the
          // script tag with `</script>`. Inputs are static today; this is
          // a hardening pass.
          __html: JSON.stringify(ORG_JSON_LD).replace(/<\//g, "<\\/"),
        }}
      />
      <HeroScrollDriver />

      {/* ═══════════ HEADER ═══════════ */}
      <header className="editorial-header">
        <div className="container">
          <nav className="nav">
            <Link href="/" className="logo" aria-label="Vzpomínkář — domů">
              <span className="logo-mark" aria-hidden="true" />
            </Link>
            <div className="nav-links">
              <a href="#jak">Jak to funguje</a>
              <a href="#produkt">Produkt</a>
              <a href="/cenik">Ceník</a>
              <a href="#faq">Otázky</a>
              <a href="/o-nas">Náš příběh</a>
            </div>
            <a href="/signup" className="btn btn-gold nav-cta-desktop">
              Začít zdarma <span className="arrow">↗</span>
            </a>
            <HomeMobileMenu />
          </nav>
        </div>
      </header>

      <main>
        {/* ═══════════ 1. HERO ═══════════ */}
        <section className="hero">
          <div className="container">
            <span className="eyebrow">Vzpomínkář — kniha rodinné paměti</span>
            <h1>
              Kolik příběhů vašeho blízkého
              <br />
              zatím nikdo nezapsal?
            </h1>
            <p className="lede">
              Životní příběhy mizí dřív, než si jich všimneme. Týden po týdnu
              položíme vašemu blízkému jednu otázku — odpoví, jak mu je
              nejpřirozenější. Za rok mu vyrobíme vázanou knihu pro budoucí
              generace.
            </p>
            <a href="/signup" className="btn btn-gold hero-cta">
              Začít sbírat vzpomínky <span className="arrow">↗</span>
            </a>
          </div>

          <div className="bg-wordmark" aria-hidden="true">
            VZPOMÍNKÁŘ.
          </div>

          <div className="book-stage" aria-label="Kniha životních příběhů">
            {/* 3 leaves on the left */}
            <div className="page-leaf leaf-note leaf-L1" />
            <div className="page-leaf leaf-photo leaf-L2" />
            <div className="page-leaf leaf-text leaf-L3" />

            {/* The book cover itself — leather brown with gold-stamped title */}
            <div className="book-cover book-leather">
              <div className="book-spine" aria-hidden="true" />
              <div className="book-title">Vzpomínkář</div>
              <div className="book-year">2026</div>
            </div>

            {/* 3 leaves on the right */}
            <div className="page-leaf leaf-text leaf-text-2 leaf-R1" />
            <div className="page-leaf leaf-photo leaf-R2" />
            <div className="page-leaf leaf-note leaf-note-2 leaf-R3" />
          </div>
        </section>

        {/* ═══════════ 2. PRESS STRIP ═══════════ */}
        <section className="press">
          <div className="container press-inner">
            <span className="press-label">Píší o nás</span>
            <div className="press-logos">
              <span className="press-logo">Hospodářské noviny</span>
              <span className="press-logo">Forbes CZ</span>
              <span className="press-logo">Český rozhlas</span>
              <span className="press-logo">Heroine</span>
              <span className="press-logo">Reflex</span>
              <span className="press-logo">Refresher</span>
            </div>
          </div>
        </section>

        {/* ═══════════ 3. HOW IT WORKS ═══════════ */}
        <div className="divider" />
        <section className="section" id="jak">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Jak to funguje</span>
              <h2>Jednoduchý týdenní rituál.</h2>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step-photo" />
                <div className="step-label">I.</div>
                <h3>Vyberete otázky</h3>
                <p>
                  Z knihovny 200+ otázek vyberete ty, na které by váš blízký
                  rád odpověděl. Můžete přidat i své vlastní — na konkrétní
                  příhodu, kterou si pamatujete.
                </p>
              </div>
              <div className="step">
                <div className="step-photo tone-2" />
                <div className="step-label">II.</div>
                <h3>Blízký odpoví</h3>
                <p>
                  Každou sobotu mu přijde SMS s jednou otázkou. Stiskne velké
                  tlačítko a vypráví — svým tempem, svými slovy. Žádné aplikace,
                  žádná hesla.
                </p>
              </div>
              <div className="step">
                <div className="step-photo tone-3" />
                <div className="step-label">III.</div>
                <h3>Vyhladíme přepis</h3>
                <p>
                  Hlas převedeme do textu, korektor jemně uhladí věty —
                  zachová slang, dialekt, oblíbená spojení. Vy se na všechno
                  podíváte před tiskem.
                </p>
              </div>
              <div className="step">
                <div className="step-photo tone-4" />
                <div className="step-label">IV.</div>
                <h3>Vytiskneme knihu</h3>
                <p>
                  Pevný hřbet, šitá vazba, krémový papír. U každé kapitoly QR
                  kód, který přehraje původní hlas. Kniha přijde v plátěné
                  krabičce.
                </p>
              </div>
            </div>
            <div className="section-cta">
              <p>Od první otázky po hotovou knihu — celá cesta v detailech.</p>
              <a href="/jak-to-funguje" className="btn btn-outline">
                Celý proces <span className="arrow">↗</span>
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════ 3b. QUESTION DECK ═══════════ */}
        <section className="section question-deck-section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Otázky z knihovny</span>
              <h2 className="q-deck-title">
                Co všechno nevíte
                <br />
                o svých blízkých?
              </h2>
              <p className="lede">
                Vyberte si jednu z otázek a zkuste si představit, co byste
                slyšeli zpátky. V knihovně jich je přes dvě stě — a každá
                otevírá kapitolu, na kterou by jinak nikdy nepřišla řeč.
              </p>
            </div>
            <QuestionDeck
              questions={DECK_QUESTIONS}
              totalCount={300}
            />
          </div>
        </section>

        {/* ═══════════ 4. PRODUCT ═══════════ */}
        <section className="product" id="produkt">
          <div className="container">
            <div className="product-grid">
              <div>
                <div className="product-img">
                  <span className="product-img-label">
                    Kniha životních příběhů — ručně vázaná
                  </span>
                </div>
              </div>
              <div className="product-copy">
                <span className="eyebrow">Produkt</span>
                <h2>Vázaná kniha s hlasem na každé stránce.</h2>
                <p className="lede">
                  Z padesáti hodin vyprávění vznikne kniha, kterou udržíte
                  v rukou. A u každé kapitoly hlas, který ji vyprávěl.
                </p>
                <ul className="feature-list">
                  <li>Padesát dva otázek, jedna za týden</li>
                  <li>Jeden výtisk vázané knihy v ceně</li>
                  <li>Nahrávání z mobilu, počítače nebo tabletu</li>
                  <li>QR u každé kapitoly otevírá nahrávku</li>
                  <li>Vlastní kopie nahrávek navždy</li>
                  <li>Sourozenci a vnoučata se mohou připojit</li>
                </ul>
                <a href="/signup" className="btn btn-gold">
                  Začít zdarma <span className="arrow">↗</span>
                </a>
                <div className="product-meta">
                  <span>
                    <strong>30 dní</strong> na rozmyšlenou
                  </span>
                  <span>·</span>
                  <span className="stars">★★★★★</span>
                  <span>
                    <strong>Stovky rodin po celé republice</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ 5. FORBES FEATURE ═══════════ */}
        <div className="divider" />
        <section className="feature-quote dark">
          <div className="container">
            <span className="eyebrow">Píše o nás Forbes CZ</span>
            <blockquote>
              „Vzpomínkář je nejlepší dárek, na který jsme letos narazili.&rdquo;
            </blockquote>
            <div className="feature-attr">— Forbes CZ, podzim 2026</div>
            <TestimonialCarousel items={FORBES_TESTIMONIALS} />
          </div>
        </section>

        {/* ═══════════ 6. QR VOICE / OPEN BOOK ═══════════ */}
        <div className="divider" />
        <section className="qr-section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Hlas v knize</span>
              <h2>
                Jejich hlas.
                <br />
                Na každé stránce.
              </h2>
              <p className="lede">
                U každé kapitoly malý QR kód. Naskenujete telefonem a slyšíte
                je tak, jak to vyprávěli — přízvuk, pauzy, smích uprostřed
                věty.
              </p>
            </div>
            <div className="book-mockup">
              <div className="book">
                <div className="book-page">
                  <p className="book-eyebrow">Kapitola 4</p>
                  <h4>První vzpomínky z dětství</h4>
                  <div className="book-lines">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className="book-line" />
                    ))}
                  </div>
                </div>
                <div className="book-page">
                  <p className="book-eyebrow">Kapitola 5</p>
                  <h4>Když přišla zima</h4>
                  <div className="book-lines">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="book-line" />
                    ))}
                  </div>
                  <div className="book-qr-row">
                    <div className="qr-code">
                      {"1101110101011101010111011".split("").map((bit, i) => (
                        <span key={i} className={bit === "1" ? "" : "off"} />
                      ))}
                    </div>
                    <small>Skenovat</small>
                  </div>
                </div>
              </div>
              <div className="phone-overlay">
                <div className="phone-screen">
                  <span className="play-circle" />
                  <small>Moje první láska</small>
                  <span className="time">3:42</span>
                </div>
              </div>
            </div>
            <div className="qr-cta">
              <a href="/jak-to-funguje" className="btn btn-outline">
                Podívat se dovnitř knihy <span className="arrow">↗</span>
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════ 7. STORY GALLERY ═══════════ */}
        <section className="gallery">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Co píší rodiny</span>
              <h2>
                Padesát let paměti,
                <br />
                konečně pevně svázáno.
              </h2>
              <p className="lede">
                Tohle nám píší rodiny, když knížka dorazí.
              </p>
            </div>
            <div className="gallery-grid">
              <article className="story-card">
                <div className="story-photo">
                  <span className="story-role">Vyprávěla</span>
                  <span className="story-play" />
                </div>
                <div className="story-body">
                  <blockquote>
                    „Bylo to jako otevřít zásuvku, kterou jsem padesát let
                    nezavřela.&rdquo;
                  </blockquote>
                  <cite>Marie V., 78 let, Třebíč</cite>
                </div>
              </article>
              <article className="story-card">
                <div className="story-photo tone-2">
                  <span className="story-role">Koupila mámě</span>
                  <span className="story-play" />
                </div>
                <div className="story-body">
                  <blockquote>
                    „Máma poprvé v životě něco používá sama. A těší se na
                    sobotu.&rdquo;
                  </blockquote>
                  <cite>Jana M., dcera, Brno</cite>
                </div>
              </article>
              <article className="story-card">
                <div className="story-photo tone-3">
                  <span className="story-role">Koupila tátovi</span>
                  <span className="story-play" />
                </div>
                <div className="story-body">
                  <blockquote>
                    „Táta nic nepíše. Ale když má vyprávět, nezavře pusu.&rdquo;
                  </blockquote>
                  <cite>Pavla W., dcera, Plzeň</cite>
                </div>
              </article>
              <article className="story-card">
                <div className="story-photo tone-4">
                  <span className="story-role">Pro vnoučata</span>
                  <span className="story-play" />
                </div>
                <div className="story-body">
                  <blockquote>
                    „Holky si pouští babiččin hlas na dobrou noc. Místo
                    pohádky.&rdquo;
                  </blockquote>
                  <cite>Petra K., matka, Praha</cite>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ═══════════ 8. NO WRITING DARK CARD ═══════════ */}
        <section className="no-writing">
          <div className="container">
            <div className="dark-card">
              <div className="dark-card-photo" />
              <div className="dark-card-content">
                <h2>
                  Otestováno babičkami.
                  <br />
                  Schváleno rodinou.
                </h2>
                <div className="feature-tiles">
                  <div className="feature-tile">
                    <div className="icon">✎</div>
                    <div className="label">Bez psaní</div>
                  </div>
                  <div className="feature-tile">
                    <div className="icon">⤓</div>
                    <div className="label">Bez stahování</div>
                  </div>
                  <div className="feature-tile">
                    <div className="icon">⌽</div>
                    <div className="label">Bez aplikací</div>
                  </div>
                </div>
                <a href="/jak-to-funguje" className="btn-record">
                  Zkusit, jak to zní
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ 9. SPEECH TO STORY TECH ═══════════ */}
        <div className="divider" />
        <section className="tech">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Technologie</span>
              <h2>Mluvené slovo, otištěné na papír.</h2>
              <p className="lede">
                Hlas do příběhu převede nahrávku na plynulý text — a
                zachová jejich rytmus, jejich slova, jejich vrstvu. Můžete
                upravit, zkrátit, doplnit. Nikdy nepřepsat.
              </p>
            </div>
            <div className="tech-img" />
            <a href="/jak-to-funguje" className="arrow-link">
              Ukázka přepisu
            </a>
          </div>
        </section>

        {/* ═══════════ 11. FOUNDER + GIFT STACK ═══════════ */}
        <section className="stack">
          <div className="container">
            <div className="stack-grid">
              {/* 11a. Founder story */}
              <div className="story-block dark">
                <div className="story-video" />
                <div>
                  <h2>Náš příběh</h2>
                  <p>
                    Když mojí babičce bylo osmdesát, začal jsem ji nahrávat.
                    Telefonem, pod stolem, ať nevidí. Měl jsem strach, že
                    zapomenu, jak se směje, jak skládá věty, jak mluví
                    o válce.
                  </p>
                  <p>
                    Po roce jsem měl třicet hodin nahrávek a žádný způsob, jak
                    z nich udělat něco, co se dá podržet v ruce. Tak vznikl
                    Vzpomínkář.
                  </p>
                  <div className="signature">Jakub</div>
                  <div className="author-row">
                    <div className="avatar" />
                    <div>
                      <strong>Jakub Š.</strong>
                      <br />
                      <span>Zakladatel, Vzpomínkář</span>
                    </div>
                  </div>
                  <div style={{ marginTop: "24px" }}>
                    <a href="/o-nas" className="arrow-link">
                      Více o našem příběhu
                    </a>
                  </div>
                </div>
              </div>

              {/* 11b. Gift delivery */}
              <div className="gift-block">
                <div>
                  <span className="eyebrow">Dárek</span>
                  <h2>
                    Dárek, který se
                    <br />
                    rozbalí v určený den.
                  </h2>
                  <p style={{ margin: "20px 0 28px", maxWidth: "440px" }}>
                    Vyberte datum. Pošleme dárek e-mailem v den, který si
                    přejete — nebo si vytiskněte plátěný certifikát doma a
                    vložte do obálky.
                  </p>
                  <a href="/darek" className="btn btn-dark">
                    Darovat Vzpomínkář <span className="arrow">↗</span>
                  </a>
                </div>
                <div className="gift-img" />
              </div>

              {/* 11c. Companion cards */}
              <div className="companion-grid">
                <a href="/darek" className="companion-card">
                  <span className="arrow-icon">↗</span>
                  <h3>Dárkový certifikát</h3>
                  <p>
                    Plátěný certifikát k vytištění. Pro narozeniny, kulatiny,
                    Vánoce — nebo jen tak.
                  </p>
                  <div className="companion-img" />
                </a>
                <a href="/babybook" className="companion-card">
                  <span className="arrow-icon">↗</span>
                  <h3>Babybook</h3>
                  <p>
                    To samé od druhé strany. Otázky pro rodiče, nahrávky
                    prvních let, kniha pro to dítě, až bude dospělé.
                  </p>
                  <div className="companion-img" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ 12. FAQ ═══════════ */}
        <section className="faq" id="faq">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Časté otázky</span>
              <h2>
                Na co se nás
                <br />
                často ptáte.
              </h2>
            </div>
            <div className="faq-list">
              <details className="faq-item" open>
                <summary>
                  Zvládne to babička, která nikdy nepoužívala chytrý telefon?
                </summary>
                <div className="faq-body">
                  Ano. SMS přijde s odkazem, který otevře jednu obrazovku
                  s velkým červeným tlačítkem. Stisknout, mluvit, pustit.
                  Žádné aplikace, žádná hesla, žádné instalace. Otestovali
                  jsme to v zařízeních pro seniory v Třebíči a v Brně —
                  funguje to.
                </div>
              </details>
              <details className="faq-item">
                <summary>
                  Co když maminka jeden týden vyprávět nestihne?
                </summary>
                <div className="faq-body">
                  Pošleme jemnou připomínku v úterý. Nebo si můžete otázky
                  zastavit a vrátit se k nim, až se to bude hodit. Žádné
                  pokuty, žádný tlak. Vyprávění by mělo být radost, ne
                  povinnost.
                </div>
              </details>
              <details className="faq-item">
                <summary>Co všechno je v ceně?</summary>
                <div className="faq-body">
                  Padesát dva otázek, rok neomezeného nahrávání, jeden výtisk
                  vázané knihy doručený v plátěné krabičce, QR kódy
                  s nahrávkami u každé kapitoly, archiv všech nahrávek ke
                  stažení a pozvánky pro celou rodinu.
                </div>
              </details>
              <details className="faq-item">
                <summary>A co bude po roce?</summary>
                <div className="faq-body">
                  Můžete pokračovat dalším rokem — některé rodiny dělají tři.
                  Můžete objednat další výtisky pro sourozence nebo vnoučata.
                  Nebo můžete skončit a všechno si stáhnout. Vaše hlasy
                  zůstávají vaše.
                </div>
              </details>
              <details className="faq-item">
                <summary>Můžu upravit, co se v knize objeví?</summary>
                <div className="faq-body">
                  Před tiskem vám pošleme náhled. Vyberete, které příběhy
                  zařadit, opravíte přepisy, doplníte fotografie. Babička
                  nikdy nečte to, co napsal stroj — vždycky to, co schválila
                  rodina.
                </div>
              </details>
              <details className="faq-item">
                <summary>Co když Vzpomínkář jednou skončí?</summary>
                <div className="faq-body">
                  Nahrávky a texty si stáhnete kdykoliv. Kniha je fyzická —
                  zůstane vám i kdyby internet zítra zmizel. To je vlastně
                  celý smysl: dělat něco, co přežije software.
                </div>
              </details>
            </div>
            <div className="faq-cta">
              <a href="/faq" className="arrow-link">
                Všechny otázky a odpovědi
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════ 13. EMAIL CAPTURE ═══════════ */}
        <section className="signup" id="signup">
          <div className="container">
            <div className="signup-card">
              <span className="eyebrow">Ochutnávka — sleva 200 Kč</span>
              <h2>Pošlete jim první otázku zdarma.</h2>
              <p className="lede">
                Vyzkoušejte, jak Vzpomínkář funguje. Tři e-maily — v prvním
                ukázka skutečné knihy, ve druhém příběh jedné rodiny, ve
                třetím slevový kód. Žádný spam, žádné triky.
              </p>
              {/* The full sign-up flow lives in /app/(auth) routes. This is a
               * lead-magnet form — a Server Action will be wired in by the
               * Marketing-flows agent. For now it submits to /api/leads with
               * a graceful HTML fallback if that endpoint doesn't exist yet. */}
              <form className="signup-form" action="/api/leads" method="post">
                <input
                  type="email"
                  name="email"
                  placeholder="vase@email.cz"
                  required
                  aria-label="E-mailová adresa"
                />
                <button type="submit" className="btn btn-gold">
                  Poslat ukázku <span className="arrow">↗</span>
                </button>
              </form>
              <p className="signup-disclaimer">
                Odesláním souhlasíte se zpracováním e-mailu. Odhlásit se
                můžete jedním klikem.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="editorial-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-left">
              <h2>
                Staré příběhy,
                <br />
                nová generace.
              </h2>
              <a href="/signup" className="btn btn-gold">
                Začít zdarma <span className="arrow">↗</span>
              </a>
            </div>
            <div className="footer-col">
              <h4>Procházet</h4>
              <ul>
                <li>
                  <a href="/jak-to-funguje">
                    Jak to funguje <span className="ext">↗</span>
                  </a>
                </li>
                <li>
                  <a href="#produkt">
                    Produkt <span className="ext">↗</span>
                  </a>
                </li>
                <li>
                  <a href="/cenik">
                    Ceník <span className="ext">↗</span>
                  </a>
                </li>
                <li>
                  <a href="/faq">
                    Časté otázky <span className="ext">↗</span>
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Dárek</h4>
              <ul>
                <li>
                  <a href="/darek">
                    Vzpomínkář jako dárek <span className="ext">↗</span>
                  </a>
                </li>
                <li>
                  <a href="/darek">
                    Dárkový certifikát <span className="ext">↗</span>
                  </a>
                </li>
                <li>
                  <a href="/babybook">
                    Babybook <span className="ext">↗</span>
                  </a>
                </li>
              </ul>
              <h4 style={{ marginTop: "36px" }}>O nás</h4>
              <ul>
                <li>
                  <a href="/o-nas">
                    Náš příběh <span className="ext">↗</span>
                  </a>
                </li>
                <li>
                  <a href="/kontakt">
                    Kontakt <span className="ext">↗</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <span className="logo-mark footer-logo" aria-label="Vzpomínkář" />
          <div className="footer-bottom">
            <span>© 2026 Vzpomínkář</span>
            <span>
              <a href="/podminky">Podmínky</a> ·{" "}
              <a href="/soukromi">Soukromí</a> ·{" "}
              <a href="/cookies">Cookies</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

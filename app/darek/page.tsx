import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { FinalCta, FinalCtaFooterLink } from "@/components/landing/FinalCta";

export const metadata: Metadata = {
  title: "Vzpomínkář jako dárek",
  description:
    "Nejhezčí dárek pro maminku, tatínka nebo prarodiče — rok týdenních otázek a kniha plná jejich příběhů. Tištěný certifikát, čtyři pole, žádný formulář na pět stránek.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * /darek — unified gifting page
 *
 * Merges former /darek + /darek/certifikat into one strong funnel:
 * Hero → 4 reasons → certificate preview → 3-step "jak na to" →
 * 4 fields → occasions belt → testimonial → final CTA card.
 *
 * Single CTA verb across the page: "Darovat Vzpomínkář ↗" → /signup?gift=1.
 * Mid-page outline CTA replaced with in-page anchor (no outline buttons).
 * ─────────────────────────────────────────────────────────────────────── */

const REASONS = [
  {
    n: "I",
    h: "Otevírá se každý týden znovu",
    body: "Dárek, který se neopotřebuje. Každé pondělí přijde nová otázka — a s ní nová vzpomínka, na kterou by jinak nikdy nepřišla řeč.",
  },
  {
    n: "II",
    h: "Nestojí v obchodě",
    body: "Nemůžete koupit svetr ve dvou kusech. Tohle si neobjedná soused. Dárek pro lidi, pro které už jste „všechno“ rozbalili.",
  },
  {
    n: "III",
    h: "Zůstává po vás",
    body: "Kniha, kterou si vaše vnoučata otevřou za třicet let. Kdy už pravnoučata uslyší prababiččin hlas přes QR kód.",
  },
  {
    n: "IV",
    h: "Funguje bez technologií",
    body: "Žádné aplikace, žádná hesla. Babička stiskne velké tlačítko a vypráví. Otestováno na seniorech od sedmdesáti do devadesáti.",
  },
];

const STEPS = [
  {
    n: "I",
    h: "Vyberete den a vzkaz",
    body: "Online za pár minut. Kdy má první otázka odejít, co má v certifikátu být napsané, od koho dárek je.",
  },
  {
    n: "II",
    h: "Doručíme certifikát",
    body: "PDF ke stažení a vytištění doma. Nebo vám tištěnou verzi na ručním papíře pošleme v krémové obálce do tří pracovních dnů.",
  },
  {
    n: "III",
    h: "V pondělí přijde první otázka",
    body: "V den, který jste vybrali, odejde první otázka SMSkou nebo e-mailem. Babička stiskne tlačítko a její příběh začíná vznikat.",
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
    body: "Den, který chcete. Vánoce, narozeniny, výročí — nebo libovolná středa. První otázka odchází v pondělí ráno v 10:00.",
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

const OCCASIONS = [
  {
    h: "K Vánocům",
    body: "Otevřete pod stromečkem certifikát s jeho jménem. První otázka odejde 6. ledna ráno — krásně v klidu po svátcích.",
  },
  {
    h: "K narozeninám",
    body: "První otázka přijde přesně v den narozenin (nebo den po, jak chcete). Stačí přidat foto z dětství a krátký vzkaz.",
  },
  {
    h: "Ke zlaté svatbě",
    body: "Kniha vyrobená pro oba — dvě paralelní pravdy o stejných padesáti letech. Jedna z nejhezčích věcí, které jsme za rok udělali.",
  },
  {
    h: "Po nemoci",
    body: "Pomalá, jemná aktivita. Vyprávění jako rehabilitace. Pošlete v klidu, žádný tlak — kdykoliv může pauznout.",
  },
];

export default function DarekPage() {
  return (
    <Shell>
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Vzpomínkář jako dárek</span>
          <h1 style={{ maxWidth: "20ch", margin: "0 auto 24px" }}>
            Dárek, který se otevře každý týden znovu.
          </h1>
          <p className="lede">
            Rok týdenních otázek pro maminku, tátu nebo prarodiče.
            A na konci kniha, kterou si budou číst i ti, kteří se ještě
            nenarodili.
          </p>
          <Link href="/signup?gift=1" className="btn btn-gold hero-cta">
            Darovat Vzpomínkář <span className="arrow">↗</span>
          </Link>
        </div>
      </section>

      {/* ═══════════ FOUR REASONS ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Proč Vzpomínkář</span>
            <h2>
              Čtyři důvody,
              <br />
              proč ho budou rozbalovat se slzou.
            </h2>
          </div>
          <div className="onas-values">
            {REASONS.map((r) => (
              <div key={r.n} className="onas-value" data-reveal>
                <span className="onas-value-numeral">{r.n}</span>
                <h3>{r.h}</h3>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CERTIFICATE PREVIEW — CSS render ═══════════ */}
      <div className="divider" aria-hidden />
      <section
        id="certifikat"
        className="section"
        style={{ paddingTop: 0 }}
      >
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Co dostane do ruky</span>
            <h2>
              Tištěný certifikát
              <br />
              na ručním papíře.
            </h2>
            <p className="lede">
              Karta v krémové obálce s jeho jménem, vaším vzkazem a datem,
              kdy první otázka odejde. Vy si vyberete PDF k tisku doma —
              nebo vám pošleme hotový kus poštou.
            </p>
          </div>

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

      {/* ═══════════ HOW GIFTING WORKS — three numbered steps ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Jak to celé probíhá</span>
            <h2>
              Tři kroky.
              <br />
              Pět minut vašeho času.
            </h2>
            <p className="lede">
              Od „chci darovat“ k „v pondělí přijde první otázka“. Vy
              zařizujete pět minut a den. Zbytek je na nás a na obdarovaném.
            </p>
          </div>

          <div className="darek-steps">
            {STEPS.map((s) => (
              <div className="darek-step" key={s.n} data-reveal>
                <span className="darek-step-numeral">{s.n}</span>
                <h3>{s.h}</h3>
                <p>{s.body}</p>
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
            <p className="lede">
              Vyplníte za pět minut z gauče. Ostatní vyřešíme my.
            </p>
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

      {/* ═══════════ TESTIMONIAL ═══════════ */}
      <section className="feature-quote dark">
        <div className="container">
          <span className="eyebrow">Z dopisů, které nám chodí</span>
          <blockquote>
            „Babička otevřela obálku, přečetla certifikát a dala se do
            pláče. Asi takhle si představuju dárek, který se nezapomene.&ldquo;
          </blockquote>
          <div className="feature-attr">— Klára, Brno · darovala k 75. narozeninám</div>
        </div>
      </section>

      {/* ═══════════ OCCASIONS — when it fits ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Pro jakou příležitost</span>
            <h2>
              Čtyři okamžiky,
              <br />
              kdy se to nejvíc hodí.
            </h2>
            <p className="lede">
              Můžete pro každou jinou. Den, kdy první otázka odejde, si
              vybíráte vy.
            </p>
          </div>
          <div className="darek-occasions">
            {OCCASIONS.map((o) => (
              <div key={o.h} className="darek-occasion" data-reveal>
                <h3>{o.h}</h3>
                <p>{o.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <FinalCta
        eyebrow="Vyberte den, napište vzkaz"
        heading="Darujte Vzpomínkář."
        lede="Jednorázových 2 990 Kč. Vrácení peněz do 30 dnů, bez závazku. Pokud se obdarovaný nerozpovídá, peníze vrátíme bez výmluv."
        ctaHref="/signup?gift=1"
        ctaLabel="Darovat Vzpomínkář"
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

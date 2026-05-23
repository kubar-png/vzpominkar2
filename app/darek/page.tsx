import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";

export const metadata: Metadata = {
  title: "Vzpomínkář jako dárek",
  description:
    "Nejhezčí dárek pro maminku, tatínka nebo prarodiče — rok týdenních otázek a kniha plná jejich příběhů. K Vánocům, výročí, narozeninám.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * /darek — full editorial rebuild
 *
 * Editorial cream-paper hero (no red-900 fall-through), reasons grid,
 * three-step "how gifting works" with Roman numerals, occasions belt,
 * testimonial in warm-dark, navy signup-card finale.
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
    h: "My doručíme",
    body: "PDF certifikát ke stažení a vytištění doma. Nebo vám tištěnou verzi v krémové obálce pošleme do tří pracovních dnů.",
  },
  {
    n: "III",
    h: "Blízký otevře a začne vyprávět",
    body: "V den D odejde první otázka SMSkou nebo e-mailem. Babička stiskne tlačítko a její příběh začíná vznikat.",
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
          <Link href="/darek/certifikat" className="btn btn-gold hero-cta">
            Vybrat certifikát <span className="arrow">↗</span>
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

      {/* ═══════════ HOW GIFTING WORKS — three numbered steps ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Jak darování probíhá</span>
            <h2>
              Tři kroky.
              <br />
              Dva z nich jsou „čekat“.
            </h2>
            <p className="lede">
              Vy zařizujete pět minut a den. Zbytek je na nás a na obdarovaném.
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

          <div className="section-cta">
            <p>Karta v obálce, která začíná celý rok vyprávění.</p>
            <Link href="/darek/certifikat" className="btn btn-outline">
              Dárkový certifikát <span className="arrow">↗</span>
            </Link>
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
      <section className="signup">
        <div className="container">
          <div className="signup-card">
            <span className="eyebrow">Vyberte den, napište vzkaz</span>
            <h2>Zbytek roku už řešíme my.</h2>
            <p className="lede">
              Pilotní verze je zdarma. Vrácení peněz do 30 dnů, žádný závazek.
            </p>
            <div style={{ display: "inline-flex", position: "relative" }}>
              <Link href="/darek/certifikat" className="btn btn-gold">
                Vybrat certifikát <span className="arrow">↗</span>
              </Link>
            </div>
            <p className="signup-disclaimer" style={{ marginTop: 18 }}>
              Nebo se podívejte na{" "}
              <Link
                href="/cenik"
                style={{
                  color: "var(--gold-soft)",
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                }}
              >
                ceník
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}

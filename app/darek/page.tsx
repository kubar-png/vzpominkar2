import type { Metadata } from "next";
import { Shell } from "@/components/landing/Shell";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { FinalCta, FinalCtaFooterLink } from "@/components/landing/FinalCta";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vzpomínkář jako dárek",
  description:
    "Nejhezčí dárek pro maminku, tatínka nebo prarodiče — rok týdenních otázek a kniha plná jejich příběhů. Připravíte za pár minut, první otázka odejde e-mailem v pondělí.",
  alternates: { canonical: canonical("/darek") },
};

/* ─────────────────────────────────────────────────────────────────────────
 * /darek — unified gifting page
 *
 * Hero → 4 reasons → 3-step "jak na to" → what you set up → occasions belt →
 * final CTA card.
 *
 * Single CTA verb across the page: "Darovat Vzpomínkář ↗" → /darovat (the
 * 3-card product chooser, Krok 1 of the gift flow).
 *
 * HONESTY: today the gift CTA routes to the ordinary signup, which sets up the
 * e-mail-based weekly question flow. The page must NOT promise a chosen
 * send-date, SMS delivery, or a printed/PDF certificate — none of that ships
 * yet. Keep copy to what is true today. (A dedicated gift branch is a later
 * build; restore certificate/date copy only once it actually delivers.)
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
    h: "Připravíte to za pár minut",
    body: "Online a v klidu z gauče. Zadáte, komu vyprávění patří a jak ho doma oslovují, a vyberete první otázky, na které se chcete zeptat.",
  },
  {
    n: "II",
    h: "V pondělí přijde první otázka",
    body: "První otázka odejde v pondělí ráno e-mailem. Stačí kliknout, otevře se jedna stránka s velkým tlačítkem — bez aplikace, bez hesla.",
  },
  {
    n: "III",
    h: "Z roku vyprávění vznikne kniha",
    body: "Každý týden přibude jedna vzpomínka. Odpovědi se průběžně ukládají do online knihovny a na konci si je necháte vytisknout jako knihu.",
  },
];

const FIELDS = [
  {
    n: "01",
    h: "Komu vyprávění patří",
    body: "Jméno a oslovení obdarovaného — to, jak ho doma oslovují. „Babi Marie“, „dědo Karle“, „mami“, jak je vám blízké. Podle toho se otázky ptají.",
  },
  {
    n: "02",
    h: "Na co se chcete zeptat",
    body: "Vyberete první otázky z osmi témat — dětství, láska, práce, životní moudro. Nebo přidáte vlastní. Měnit a doplňovat je můžete kdykoliv.",
  },
  {
    n: "03",
    h: "Váš e-mail pro správu",
    body: "Sem chodí přepisy odpovědí a do online knihovny vidíte vy i celá rodina. Obdarovaný nemusí nic instalovat ani se nikam přihlašovat.",
  },
];

const OCCASIONS = [
  {
    h: "K Vánocům",
    body: "Pod stromeček oznámíte, že vyprávění začíná. První otázka přijde hned v nejbližší pondělí e-mailem — krásně v klidu po svátcích.",
  },
  {
    h: "K narozeninám",
    body: "Místo dalšího předmětu rok společných vzpomínek. Vyberete první otázky, přidáte vlastní — a v pondělí to celé začne.",
  },
  {
    h: "Ke zlaté svatbě",
    body: "Kniha vyrobená pro oba — dvě paralelní pravdy o stejných padesáti letech. Jedna z nejhezčích věcí, které jsme za rok udělali.",
  },
  {
    h: "Po nemoci",
    body: "Pomalá, jemná aktivita. Vyprávění jako rehabilitace. Žádný tlak — odpovídá se vlastním tempem a kdykoliv může pauznout.",
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
          <PrimaryCta href="/darovat" label="Darovat Vzpomínkář" variant="hero" />
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
            <span className="eyebrow">Jak to celé probíhá</span>
            <h2>
              Tři kroky.
              <br />
              Pět minut vašeho času.
            </h2>
            <p className="lede">
              Od „chci darovat“ k „v pondělí přijde první otázka“. Vy to
              připravíte za pár minut. Zbytek je na nás a na obdarovaném.
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
            <span className="eyebrow">Co u nás nastavíte</span>
            <h2>Pár polí. Žádný formulář na pět stránek.</h2>
            <p className="lede">
              Vyplníte za pár minut z gauče. Ostatní vyřešíme my.
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

      {/* ═══════════ REASSURANCE — honest, no fabricated proof ═══════════ */}
      <section className="feature-quote dark">
        <div className="container">
          <span className="eyebrow">Klid na duši</span>
          <blockquote>
            Píše a pomáhá vám člověk, ne robot. Vzpomínky i přístup ke knize
            zůstávají vaší rodině napořád. A když si nebudete vědět rady,
            ozvěte se nám — jsme tu.
          </blockquote>
          <div className="feature-attr">— tým Vzpomínkáře</div>
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
              Hodí se k nim ke všem. První otázka vždy odejde v nejbližší
              pondělí ráno e-mailem.
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
        eyebrow="Připravíte za pár minut"
        heading="Darujte Vzpomínkář."
        lede="Jednorázově, přístup napořád — bez předplatného."
        ctaHref="/darovat"
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

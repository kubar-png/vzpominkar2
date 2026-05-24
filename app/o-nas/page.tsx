import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";

export const metadata: Metadata = {
  title: "Náš příběh",
  description:
    "Vzpomínkář založila parta lidí v Praze, kteří přišli o svoje babičky dřív, než stihli zaznamenat jejich příběhy. Nechceme, aby to znovu potkalo jinou rodinu.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * /o-nas — full editorial rebuild
 *
 * Founder letter uses .story-block.dark (mirrors homepage stack — navy
 * card with signature + author row). Values use homepage step pattern.
 * Team uses dark-card-like testimonial grid. Final CTA = signup-card.
 * ─────────────────────────────────────────────────────────────────────── */

const VALUES = [
  {
    n: "I",
    h: "Pomalu, ale dotaženě",
    body:
      "Nevyrábíme knihu jako rychlou aplikaci. Jedna otázka týdně, jedna kapitola měsíčně, jedna kniha za rok. Pomalost není pomalost — je to způsob, jak se vyprávění dostane do hloubky.",
  },
  {
    n: "II",
    h: "Hlas zůstává jeho",
    body:
      "Přepis vyhladíme, ale slang, dialekt, oblíbená slova a pauzy zůstanou. Pod každou kapitolou v knize bude QR kód s původním hlasem — protože to je to, kvůli čemu si knihu jednou otevřete.",
  },
  {
    n: "III",
    h: "Žádné předplatné, žádný tlak",
    body:
      "Jedna roční platba, jedna kniha. Nepoužíváme dark patterns, abychom vás přemluvili k vyšší úrovni. Tisk si objednáte, až vy uznáte, že je čas.",
  },
  {
    n: "IV",
    h: "Vzpomínky jsou vaše",
    body:
      "Data patří rodině, ne nám. Kdykoliv si je můžete stáhnout nebo nechat smazat. Žádné AI tréninky, žádné prodávání třetím stranám. Garance v podmínkách, ne jen v marketingu.",
  },
];

const PEOPLE = [
  {
    name: "Jakub Š.",
    role: "Zakladatel · produkt",
    quote:
      "Když mi v devadesáti zemřela babička, zůstaly nám tři fotky a krabice s pohlednicemi. Vzpomínkář jsme stvořili, abychom neopakovali stejnou chybu u svých rodičů.",
  },
  {
    name: "Tereza M.",
    role: "Korektura a sazba",
    quote:
      "Přepis nikdy nevyhladím tak, aby z toho zmizel ten člověk. Pauza, kterou udělá, je často důležitější než slovo, které řekne potom.",
  },
  {
    name: "Marek H.",
    role: "Tisk a vazba",
    quote:
      "Vážeme ručně v malé tiskárně na Smíchově. Naše babičky by stejně nepoznaly knihu, která by byla vyrobená jinde než ručně.",
  },
];

export default function ONasPage() {
  return (
    <Shell>
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Náš příběh</span>
          <h1 style={{ maxWidth: "22ch", margin: "0 auto 24px" }}>
            Pomalá kniha jednoho života.
          </h1>
          <p className="lede">
            Vzpomínkář dělá v Praze parta lidí, kteří přišli o svoje babičky
            dřív, než stihli zaznamenat jejich příběhy. Nechceme, aby to
            znovu potkalo jinou rodinu.
          </p>
        </div>
      </section>

      {/* ═══════════ FOUNDER LETTER — navy story-block ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="story-block dark" data-reveal>
            <div className="story-video" aria-hidden />
            <div>
              <span className="eyebrow">Slovo zakladatele</span>
              <h2 style={{ margin: "8px 0 20px" }}>
                Proč jsme to vůbec začali dělat.
              </h2>
              <p>
                Babička Anna mi v devíti vyprávěla, jak ve čtyřicátém pátém
                přešla pěšky z Berouna do Plzně. Ve dvanácti to vyprávěla
                znovu, jen jinak. V sedmnácti už mě to nezajímalo — pak jsem
                odjel studovat a vrátil se za třináct let. Tehdy mě poprosila,
                ať si zapamatuju, jak se jmenovala kočka, kterou měla jako
                holka. Slíbil jsem to. Jenže jsem si nezapamatoval ani jméno
                kočky, ani cestu z Berouna.
              </p>
              <p>
                Když umřela, zůstaly nám tři fotky a krabice s pohlednicemi
                od příbuzných, které nikdo neznal. Žádné nahrávky. Žádný
                rukopis. Žádný způsob, jak její vyprávění vrátit.
              </p>
              <p>
                Vzpomínkář jsme rozjeli proto, aby ostatním rodinám nezůstaly
                jen tři fotky. Aby vzpomínky, které dnes večer otec vypráví
                u stolu, byly za rok napsané. A za deset let pořád slyšitelné.
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
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PULL QUOTE — emotional breath ═══════════ */}
      <section className="pull-quote">
        <div className="container">
          <blockquote>
            Vzpomínky mizí dřív,
            <br />
            než si jich všimneme.
          </blockquote>
        </div>
      </section>

      {/* ═══════════ VALUES — four numbered tiles ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Čím se řídíme</span>
            <h2>
              Čtyři pravidla,
              <br />
              kterých se držíme.
            </h2>
            <p className="lede">
              Žádné porady o hodnotách, žádné nástěnky. Jen tohle, dokud
              fungujeme.
            </p>
          </div>

          <div className="onas-values">
            {VALUES.map((v) => (
              <div key={v.n} className="onas-value" data-reveal>
                <span className="onas-value-numeral">{v.n}</span>
                <h3>{v.h}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TEAM — warm-dark testimonial grid ═══════════ */}
      <section className="feature-quote dark">
        <div className="container">
          <span className="eyebrow">Lidé za knihou</span>
          <blockquote>
            Malá parta. Velký důraz na detail.
          </blockquote>
          <div className="feature-attr">— Praha, Smíchov</div>
          <div className="testimonial-grid">
            {PEOPLE.map((p) => (
              <article className="testimonial" key={p.name}>
                <div className="onas-team-avatar" aria-hidden />
                <h4>{p.name}</h4>
                <blockquote>„{p.quote}&ldquo;</blockquote>
                <cite>{p.role}</cite>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST BLOCK — what we promise ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Náš slib</span>
            <h2>
              Co u nás vždycky platí.
            </h2>
          </div>
          <ul
            className="feature-list"
            style={{ maxWidth: 720, margin: "0 auto" }}
          >
            <li>Lidský korektor čte každou nahrávku, kterou pošleme do tisku.</li>
            <li>Knihu vážeme ručně v malé tiskárně na Smíchově, ne v zahraničí.</li>
            <li>Data zpracováváme podle GDPR — žádné AI tréninky, žádné prodávání dál.</li>
            <li>Když napíšete, ozve se vám člověk, ne chatbot. Většinou do hodiny.</li>
            <li>Vaše vzpomínky si můžete kdykoliv stáhnout nebo nechat smazat.</li>
          </ul>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="signup">
        <div className="container">
          <div className="signup-card">
            <span className="eyebrow">Začněte dnes</span>
            <h2>Pošlete vašemu blízkému první otázku.</h2>
            <p className="lede">
              Jednorázových 2 990 Kč. Vrácení peněz do 30 dnů, bez závazku.
            </p>
            <div style={{ display: "inline-flex", position: "relative" }}>
              <Link href="/signup" className="btn btn-gold">
                Založit Vzpomínkář <span className="arrow">↗</span>
              </Link>
            </div>
            <p className="signup-disclaimer" style={{ marginTop: 18 }}>
              Nebo si přečtěte,{" "}
              <Link
                href="/jak-to-funguje"
                style={{
                  color: "var(--gold-soft)",
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                }}
              >
                jak to celé funguje
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}

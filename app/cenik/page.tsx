import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { FinalCta, FinalCtaFooterLink } from "@/components/landing/FinalCta";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ceník",
  description:
    "Přístup ke knize jednorázově, napořád. První tištěná kniha je v ceně. Tištěnou knihu si objednáte, až bude vzpomínek dost.",
  alternates: { canonical: canonical("/cenik") },
};

/* ─────────────────────────────────────────────────────────────────────────
 * /cenik — full editorial rebuild
 *
 * Single paper-card plan (no shadcn), homepage .feature-list bullets,
 * mini-FAQ using .faq-item, final signup-card. Prices are hidden while the
 * app runs as a free testing version — cards show a number-free "V testovací
 * verzi zdarma" state; structure and CTAs stay intact.
 * ─────────────────────────────────────────────────────────────────────── */

const INCLUDED = [
  "Padesát dva otázek, jedna za týden",
  "Hlasové i textové odpovědi — bez aplikací",
  "Automatický přepis a korektura",
  "Online knihovna pro celou rodinu",
  "Sourozenci a vnoučata se mohou připojit",
  "První tištěná kniha v ceně — objednáte, až bude hotová",
];

const ADDONS: ReadonlyArray<string> = [
  "Jiná barva desek — hnědá se zlatým písmem je v ceně",
  "Dárkové balení s raženým věnováním",
  "Další výtisk pro sourozence",
];

const FAQ_EXCERPT = [
  {
    q: "Jak dlouho trvá, než kniha vznikne?",
    a: "V průměru 9–12 měsíců. Záleží jen na tom, kolik otázek si vyberete a v jakém tempu rodič odpovídá. Online knihovna roste průběžně — knihu si objednáte, až bude hotová.",
  },
  {
    q: "Co když rodič přestane odpovídat?",
    a: "Pošleme jemnou připomínku. Pokud delší dobu mlčí, zavoláme nebo napíšeme a zeptáme se, jak pomoci. Zaplacený přístup je váš napořád, ať se rozpovídá kdykoliv.",
  },
  {
    q: "Můžu si odpovědi sám/sama upravit?",
    a: "Ano. V rodinném editoru vidíte přepis, doplníte fotku, opravíte překlep. Nic ale není povinné — kniha funguje i bez vašeho zásahu.",
  },
];

export default function PricingPage() {
  return (
    <Shell>
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        <div className="container">
          <h1 style={{ maxWidth: "22ch", margin: "0 auto 24px" }}>
            Jedna platba. Žádné předplatné.
          </h1>
          <p className="lede">
            Zaplatíte jednou a přístup ke knize i online knihovně máte napořád.
            Tištěnou knihu si objednáváte až tehdy, kdy víte, že je hotová.
          </p>
          <PrimaryCta variant="hero" />
        </div>
      </section>

      {/* ═══════════ MAIN PRICE CARD ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cenik-card" data-reveal>
            <div className="cenik-price">
              <span className="cenik-price-amount">V testovací verzi zdarma</span>
              <span className="cenik-price-sub">přístup ke knize · napořád</span>
            </div>
            <p className="cenik-price-note">
              Po spuštění placené verze jedna platba a kniha je vaše napořád —
              žádné předplatné. Zahrnuje jednoho blízkého, až 52 otázek a první
              tištěnou knihu v ceně. Další blízký nebo další díl řešíme
              samostatně níže.
            </p>

            <ul className="feature-list" style={{ margin: "32px 0 32px" }}>
              {INCLUDED.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>

            <PrimaryCta className="btn-gold-full" />
            <p className="cenik-price-guarantee">
              Jednorázově · bez předplatného · přístup napořád
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ ADD-ON: další blízký / další díl ═══════════ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cenik-card" data-reveal>
            <div className="cenik-price">
              <span className="cenik-price-amount">V testovací verzi zdarma</span>
              <span className="cenik-price-sub">další blízký nebo další díl</span>
            </div>
            <p className="cenik-price-note">
              Chcete vyprávění od druhého rodiče, nebo druhý díl pro stejného
              blízkého? Přidáte si jeho vlastní sadu otázek a jeho vlastní
              knihu — za každého dalšího blízkého nebo každý další díl.
            </p>
            <PrimaryCta className="btn-gold-full" />
          </div>
        </div>
      </section>

      {/* ═══════════ PRINT + ADD-ONS (warm dark belt) ═══════════ */}
      <section className="feature-quote dark" style={{ textAlign: "left" }}>
        <div className="container">
          <div className="cenik-print-grid">
            <div data-reveal>
              <h2 style={{ margin: "0 0 20px" }}>
                První tištěná kniha je v ceně.
              </h2>
              <p style={{ maxWidth: "44ch", marginBottom: 28 }}>
                Tvrdé desky, šitá vazba, papír v krémové barvě. U každé kapitoly
                QR kód s původním hlasem. Hnědé desky se zlatým písmem patří
                k základu. Doplňky níže jsou volitelné — vyberete si je až při
                objednávce tisku.
              </p>
              <Link href="/signup" className="btn btn-dark">
                Založit Vzpomínkář <span className="arrow">↗</span>
              </Link>
            </div>

            <ul className="cenik-addons" data-reveal>
              {ADDONS.map((label) => (
                <li key={label}>
                  <span>{label}</span>
                  <span className="cenik-addons-price">v testovací verzi zdarma</span>
                </li>
              ))}
              <li className="cenik-addons-note">
                Doplňky si vyberete až v okamžiku tisku.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ EXCERPT ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="faq">
        <div className="container">
          <div className="section-head">
            <h2>
              Co se nejčastěji
              <br />
              ptáte před objednávkou.
            </h2>
            <p className="lede">
              Celý seznam najdete v plném{" "}
              <Link href="/faq" style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>
                FAQ
              </Link>
              .
            </p>
          </div>
          <div className="faq-list">
            {FAQ_EXCERPT.map((f, i) => (
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

      {/* ═══════════ FINAL SIGNUP CARD ═══════════ */}
      <FinalCta
        heading="Pošlete jim první otázku v pondělí."
        lede="Jednorázově, přístup napořád — bez předplatného."
        footer={
          <>
            Mám ještě <FinalCtaFooterLink href="/faq">otázky</FinalCtaFooterLink>.
          </>
        }
      />
    </Shell>
  );
}

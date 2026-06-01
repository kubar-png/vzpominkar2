import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { FinalCta, FinalCtaFooterLink } from "@/components/landing/FinalCta";

export const metadata: Metadata = {
  title: "Ceník",
  description:
    "Přístup ke knize jednorázově, napořád. Tištěnou knihu si objednáte, až bude vzpomínek dost.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * /cenik — full editorial rebuild
 *
 * Single paper-card plan (no shadcn), homepage .feature-list bullets,
 * mini-FAQ using .faq-item, final signup-card. Pricing tokens come from
 * env; flat 2 890 Kč fallback (pilotní verze retired).
 * ─────────────────────────────────────────────────────────────────────── */

const PRICE_BASE = Number(process.env.PRICE_BOOK_BASE_CZK ?? "2890");
const PRICE_ADDON = Number(process.env.PRICE_BOOK_ADDON_CZK ?? "1790");
const PRICE_BOOK = Number(process.env.PRICE_BOOK_PRINT_CZK ?? "0");

function formatCzk(n: number): string {
  return `${n.toLocaleString("cs-CZ")} Kč`;
}

const INCLUDED = [
  "Padesát dva otázek, jedna za týden",
  "Hlasové i textové odpovědi — bez aplikací",
  "Automatický přepis a korektura",
  "Online knihovna pro celou rodinu",
  "Sourozenci a vnoučata se mohou připojit",
];

const ADDONS: ReadonlyArray<readonly [string, string]> = [
  ["Druhý výtisk pro sourozence", "od 1 290 Kč"],
  ["Kožená edice — ručně vázaná", "+ 1 800 Kč"],
  ["Dárkové balení s certifikátem", "+ 290 Kč"],
  ["Doručení mimo ČR", "od 350 Kč"],
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
          <span className="eyebrow">Ceník</span>
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
            <div className="cenik-card-head">
              <span className="eyebrow">Přístup ke knize</span>
            </div>
            <div className="cenik-price">
              <span className="cenik-price-amount">{formatCzk(PRICE_BASE)}</span>
              <span className="cenik-price-sub">jednorázově · napořád</span>
            </div>
            <p className="cenik-price-note">
              Jedna platba, kniha je vaše napořád — žádné předplatné. Zahrnuje
              jednoho blízkého a až 52 otázek. Další blízký nebo další díl{" "}
              {formatCzk(PRICE_ADDON)}. Cena tisku se přičítá, až knihu budete
              chtít vyrobit.
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

      {/* ═══════════ PRINT + ADD-ONS (warm dark belt) ═══════════ */}
      <section className="feature-quote dark" style={{ textAlign: "left" }}>
        <div className="container">
          <div className="cenik-print-grid">
            <div data-reveal>
              <span className="eyebrow">Tisk a doplňky</span>
              <h2 style={{ margin: "12px 0 20px" }}>
                {PRICE_BOOK > 0
                  ? <>Tištěná kniha {formatCzk(PRICE_BOOK)}.</>
                  : "Tištěnou knihu objednáte, až bude hotová."}
              </h2>
              <p style={{ maxWidth: "44ch", marginBottom: 28 }}>
                Tvrdé desky, šitá vazba, papír v krémové barvě. U každé kapitoly
                QR kód s původním hlasem. Cenu tisku uvidíte před objednávkou —
                počítá se podle počtu stran a typu vazby.
              </p>
              <Link href="/signup" className="btn btn-dark">
                Založit Vzpomínkář <span className="arrow">↗</span>
              </Link>
            </div>

            <ul className="cenik-addons" data-reveal>
              {ADDONS.map(([label, price]) => (
                <li key={label}>
                  <span>{label}</span>
                  <span className="cenik-addons-price">{price}</span>
                </li>
              ))}
              <li className="cenik-addons-note">
                Doplňky účtujeme jen tehdy, pokud si je v okamžiku tisku
                zvolíte.
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
            <span className="eyebrow">Tři odpovědi před rozhodnutím</span>
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
        eyebrow="Začněte dnes"
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

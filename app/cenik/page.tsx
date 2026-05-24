import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";

export const metadata: Metadata = {
  title: "Ceník",
  description:
    "Roční přístup za 2 990 Kč. Tištěnou knihu si objednáte, až bude vzpomínek dost. Vrácení peněz do 30 dnů, bez závazku.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * /cenik — full editorial rebuild
 *
 * Single paper-card plan (no shadcn), homepage .feature-list bullets,
 * mini-FAQ using .faq-item, final signup-card. Pricing tokens come from
 * env; flat 2 990 Kč fallback (pilotní verze retired).
 * ─────────────────────────────────────────────────────────────────────── */

const PRICE_YEARLY = Number(process.env.PRICE_YEARLY_ACCESS_CZK ?? "2990");
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
  "Vrácení peněz do 30 dnů, bez výmluv",
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
    a: "Pošleme jemnou připomínku. Pokud delší dobu mlčí, zavoláme nebo napíšeme a zeptáme se, jak pomoci. Zaplacený rok je váš, ať se rozpovídá kdykoliv.",
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
            Roční přístup do knihovny máte v ceně. Tištěnou knihu si
            objednáváte až tehdy, kdy víte, že je hotová. Vrácení peněz do
            třiceti dnů, bez výmluv.
          </p>
          <Link href="/signup" className="btn btn-gold hero-cta">
            Založit Vzpomínkář <span className="arrow">↗</span>
          </Link>
        </div>
      </section>

      {/* ═══════════ MAIN PRICE CARD ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cenik-card" data-reveal>
            <div className="cenik-card-head">
              <span className="eyebrow">Roční přístup</span>
            </div>
            <div className="cenik-price">
              <span className="cenik-price-amount">{formatCzk(PRICE_YEARLY)}</span>
              <span className="cenik-price-sub">jednorázově, na 12 měsíců</span>
            </div>
            <p className="cenik-price-note">
              Jednorázová platba na rok vyprávění. Cena tisku knihy se přičítá
              až ve chvíli, kdy ji budete chtít vyrobit.
            </p>

            <ul className="feature-list" style={{ margin: "32px 0 32px" }}>
              {INCLUDED.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="btn btn-gold"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Založit Vzpomínkář <span className="arrow">↗</span>
            </Link>
            <p className="cenik-price-guarantee">
              Vrácení peněz do 30 dnů · bez závazku
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

      {/* ═══════════ MONEY-BACK GUARANTEE ═══════════ */}
      <section className="pull-quote">
        <div className="container">
          <blockquote>
            Vyzkoušejte první týdny v klidu.
            <br />
            Pokud to není pro vás, peníze do třiceti dnů vrátíme.
          </blockquote>
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
      <section className="signup">
        <div className="container">
          <div className="signup-card">
            <span className="eyebrow">Začněte dnes</span>
            <h2>Pošlete jim první otázku v pondělí.</h2>
            <p className="lede">
              Jednorázových 2 990 Kč. Vrácení peněz do 30 dnů, bez závazku.
            </p>
            <div style={{ display: "inline-flex", position: "relative" }}>
              <Link href="/signup" className="btn btn-gold">
                Založit Vzpomínkář <span className="arrow">↗</span>
              </Link>
            </div>
            <p className="signup-disclaimer" style={{ marginTop: 18 }}>
              Mám ještě{" "}
              <Link
                href="/faq"
                style={{
                  color: "var(--gold-soft)",
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                }}
              >
                otázky
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}

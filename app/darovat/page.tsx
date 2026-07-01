import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { FinalCta, FinalCtaFooterLink } from "@/components/landing/FinalCta";
import { canonical } from "@/lib/site";
import { Logo } from "@/components/brand/Logo";
import { GiftProductCard } from "./_components/GiftProductCard";

export const metadata: Metadata = {
  title: "Darovat Vzpomínkář — vyberte dárek",
  description:
    "Tři způsoby, jak darovat příběh: online Vzpomínkář s tištěnou knihou, vyplňovací kniha s připravenými otázkami, nebo kniha s vlastními otázkami. Vyberete a připravíte za pár minut.",
  alternates: { canonical: canonical("/darovat") },
};

/* ─────────────────────────────────────────────────────────────────────────
 * /darovat — Krok 1 of the gift flow: the 3-card product chooser.
 *
 * Entry point for the "Darovat Vzpomínkář" CTA on /darek. The buyer picks one
 * of three products; each card routes into its existing purchase flow carrying
 * a gift marker (?gift=1). Stage 4 finalizes the exact threading + the voucher
 * step that follows — here we render the chooser + sensible hrefs.
 *
 *   MIDDLE (featured) = app access + první tištěná kniha — 2 890 Kč.
 *                       Highlighted light-navy card, "Doporučeno", benefit
 *                       bullets. Needs an account → /signup?gift=1.
 *   LEFT  (side) = vyplňovací kniha, předvyplněné otázky — 599 Kč.
 *                  Guest checkout → /kniha/objednat?gift=1.
 *   RIGHT (side) = kniha s vlastními otázkami — 899 Kč.
 *                  Guest configurator → /kniha/sestavit?gift=1.
 *
 * This chooser stays number-free on purpose: the buyer sees the exact charge
 * inside each funnel (and can compare on /cenik), so no prices are printed here.
 * Editorial styles reused; bespoke 3-up layout in the scoped block. Mobile =
 * stacked with the app card FIRST (the page renders it first; the desktop grid
 * re-orders it to the centre column).
 * ─────────────────────────────────────────────────────────────────────── */

const APP_BULLETS = [
  "Online knihovna pro celou rodinu — napořád",
  "Hlas u každé kapitoly přes QR kód",
  "První tištěná kniha v ceně",
  "Píše a pomáhá vám člověk, ne robot",
] as const;

export default function DarovatPage() {
  return (
    <Shell
      stickyCtaHref="/signup?gift=1"
      stickyCtaLabel="Darovat Vzpomínkář"
      stickyCtaNote="Online přístup + první tištěná kniha v ceně."
    >
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        <div className="container">
          <div className="gpc-hero-logo">
            <Logo tone="raspberry" height={30} />
          </div>
          <h1 style={{ maxWidth: "20ch", margin: "0 auto 24px" }}>
            Vyberte, jaký dárek to bude.
          </h1>
          <p className="lede">
            Tři způsoby, jak darovat příběh. Online Vzpomínkář s tištěnou knihou
            na konci, nebo klasická kniha, do které blízký píše vlastní rukou.
            Vyberete a připravíte za pár minut.
          </p>
        </div>
      </section>

      {/* ═══════════ KROK 1 — 3-card chooser ═══════════ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="gpc-grid">
            {/* MIDDLE / FEATURED — rendered first so mobile leads with the app
                card; the desktop grid re-orders it into the centre column. */}
            <GiftProductCard
              variant="featured"
              title="Vzpomínkář pro celý rok"
              priceSub="jednorázově · přístup napořád"
              blurb="Každý týden přijde jedna otázka. Z roku vyprávění vznikne online knihovna pro celou rodinu — a na konci tištěná kniha s hlasem u každé kapitoly."
              bullets={APP_BULLETS}
              ctaHref="/signup?gift=1"
              ctaLabel="Darovat Vzpomínkář"
              note="Vyžaduje účet — nastavíte ho vy a předáte poukaz. Bez předplatného."
            />

            {/* LEFT — standard fill-in book */}
            <GiftProductCard
              variant="side"
              title="Kniha s připravenými otázkami"
              priceSub="jednorázově · poštovné zdarma"
              blurb="Klasická tištěná kniha s našimi otázkami napříč šesti životními obdobími. Stačí vybrat, komu ji věnujete, a objednat — bez sestavování."
              ctaHref="/kniha/objednat?gift=1"
              ctaLabel="Objednat knihu"
              note="Bez přihlášení. Kniha dorazí poštou (3–4 týdny)."
            />

            {/* RIGHT — custom book */}
            <GiftProductCard
              variant="side"
              title="Kniha s vlastními otázkami"
              priceSub="jednorázově · poštovné zdarma"
              blurb="Otázky si sami přidáte, odeberete nebo přepíšete. Tištěná kniha přesně o tom, co vás u vašeho blízkého zajímá."
              ctaHref="/kniha/sestavit?gift=1"
              ctaLabel="Sestavit vlastní knihu"
              note="Bez přihlášení. Kniha dorazí poštou (3–4 týdny)."
            />
          </div>

          <p className="gpc-foot-note">
            Ke každému dárku si po zaplacení připravíte dárkový poukaz —
            vytisknete a předáte, i když kniha ještě nedorazila. Nejste si jistí?{" "}
            <Link href="/cenik" className="gpc-foot-link">
              Porovnejte ceník
            </Link>{" "}
            nebo se mrkněte na{" "}
            <Link href="/kniha" className="gpc-foot-link">
              ukázku knihy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <FinalCta
        heading="Darujte příběh, ne další předmět."
        lede="Jednorázově, bez předplatného. Vyberte produkt nahoře a my vás provedeme zbytkem."
        ctaHref="/signup?gift=1"
        ctaLabel="Darovat Vzpomínkář"
        footer={
          <>
            Nebo se podívejte na{" "}
            <FinalCtaFooterLink href="/darek">
              proč Vzpomínkář jako dárek
            </FinalCtaFooterLink>
            .
          </>
        }
      />

      {/* Scoped layout — editorial tokens reused (--ink navy, --gold raspberry,
          --paper + --footer-ink off-white, display font). The bespoke 3-up grid
          isn't covered by a globals.css class, so it lives here; nothing below
          touches global brand sections. Mobile: single column, app card first.
          Desktop: featured centre column, wider + lifted. */}
      <style>{`
        .gpc-hero-logo {
          display: flex;
          justify-content: flex-start;
          margin: 0 0 20px;
        }
        .gpc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          max-width: 1120px;
          margin: 8px auto 0;
          align-items: stretch;
        }
        .gpc {
          position: relative;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--paper);
          padding: clamp(28px, 3vw, 40px);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }
        .gpc:hover {
          box-shadow: 0 18px 44px -22px rgba(27, 46, 77, 0.28);
          border-color: var(--line-2);
        }
        .gpc-title {
          font-family: var(--font-display-editorial);
          font-size: clamp(22px, 2vw, 27px);
          font-weight: 500;
          color: var(--ink);
          margin: 2px 0 0;
          line-height: 1.2;
        }
        .gpc-price { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
        .gpc-price-amount {
          font-family: var(--font-display-editorial);
          font-size: clamp(30px, 3vw, 38px);
          font-weight: 500;
          color: var(--ink);
          line-height: 1;
        }
        .gpc-price-sub {
          font-family: var(--font-body-editorial);
          font-size: 13px;
          color: var(--ink-mute);
        }
        .gpc-blurb {
          font-family: var(--font-body-editorial);
          font-size: 15px;
          line-height: 1.6;
          color: var(--ink-soft);
          margin: 0;
          flex: 1;
        }
        .gpc-bullets {
          list-style: none;
          margin: 4px 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .gpc-bullets li {
          position: relative;
          padding-left: 28px;
          font-family: var(--font-body-editorial);
          font-size: 14.5px;
          line-height: 1.45;
        }
        .gpc-bullets li::before {
          content: "✓";
          position: absolute;
          left: 0;
          top: 0;
          color: var(--gold);
          font-weight: 700;
        }
        .gpc-foot {
          margin-top: auto;
          padding-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .gpc-cta { width: 100%; justify-content: space-between; }
        /* Side-card CTAs → raspberry outline (featured uses filled btn-gold). */
        .gpc .btn-outline.gpc-cta {
          border-color: var(--gold);
          color: var(--gold);
        }
        .gpc .btn-outline.gpc-cta:hover {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--bg);
        }
        .gpc .btn-outline.gpc-cta .arrow {
          background: var(--gold);
          color: var(--bg);
        }
        .gpc .btn-outline.gpc-cta:hover .arrow {
          background: var(--bg);
          color: var(--gold);
        }
        .gpc-note {
          font-family: var(--font-body-editorial);
          font-size: 12.5px;
          line-height: 1.45;
          color: var(--ink-mute);
          margin: 0;
        }

        /* ── Featured (app) card — light-navy with cream text ── */
        .gpc-featured {
          background: var(--card-navy);
          border-color: var(--card-navy);
        }
        .gpc-featured:hover {
          box-shadow: 0 24px 56px -24px rgba(27, 46, 77, 0.55);
          border-color: var(--card-navy);
        }
        .gpc-featured .gpc-title,
        .gpc-featured .gpc-price-amount { color: var(--footer-ink); }
        .gpc-featured .gpc-price-sub { color: var(--footer-mute); }
        .gpc-featured .gpc-blurb { color: var(--footer-ink); opacity: 0.92; }
        .gpc-featured .gpc-bullets li { color: var(--footer-ink); }
        .gpc-featured .gpc-note { color: var(--footer-mute); }
        .gpc-chip {
          position: absolute;
          top: 18px;
          right: 18px;
          font-family: var(--font-body-editorial);
          font-size: 12px;
          font-weight: 600;
          color: #FEF7D7;
          background: var(--gold);
          border-radius: 999px;
          padding: 6px 12px;
        }

        .gpc-foot-note {
          max-width: 60ch;
          margin: 28px auto 0;
          text-align: center;
          font-family: var(--font-body-editorial);
          font-size: 14px;
          line-height: 1.6;
          color: var(--ink-soft);
        }
        .gpc-foot-link {
          color: var(--ink);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .gpc-foot-link:hover { color: var(--gold); }

        /* ── Desktop: 3 columns, featured centre + wider + lifted ── */
        @media (min-width: 900px) {
          .gpc-grid {
            grid-template-columns: 1fr 1.18fr 1fr;
            gap: 24px;
            align-items: center;
          }
          /* Source order is featured-first (for mobile); re-order on desktop so
             it sits in the centre column between the two side cards. */
          .gpc-featured { order: 2; transform: scale(1.05); z-index: 1; }
          .gpc-grid > .gpc:nth-of-type(2) { order: 1; }
          .gpc-grid > .gpc:nth-of-type(3) { order: 3; }
          .gpc-featured:hover { transform: scale(1.05) translateY(-2px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .gpc { transition: box-shadow 0.25s ease, border-color 0.25s ease; }
          .gpc-featured:hover { transform: scale(1.05); }
        }
      `}</style>
    </Shell>
  );
}

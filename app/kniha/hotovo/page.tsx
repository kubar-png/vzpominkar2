import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { PrimaryCta } from "@/components/landing/PrimaryCta";

export const metadata: Metadata = {
  title: "Objednávka přijata — Kniha vzpomínek",
  robots: { index: false },
};

/* ─────────────────────────────────────────────────────────────────────────
 * /kniha/hotovo — guest confirmation after a gift-book order (createGiftOrder).
 *
 * Reached two ways:
 *   - free path  → server action returns redirect "/kniha/hotovo"
 *   - paid path  → Stripe success_url "/kniha/hotovo?order=<id>"
 * No account, so we keep it simple: confirm, set expectations, link back.
 * ───────────────────────────────────────────────────────────────────────── */

export default function KnihaHotovoPage() {
  return (
    <Shell>
      <section className="hero" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <div className="container" style={{ maxWidth: "640px" }}>
          <span className="eyebrow">Objednávka přijata</span>
          <h1 style={{ maxWidth: "20ch", margin: "0 auto 24px" }}>Děkujeme — knihu máme.</h1>
          <p className="lede">
            Vaši objednávku knihy vzpomínek jsme přijali. Potvrzení jsme poslali na váš e-mail.
            Teď knihu vysázíme, vytiskneme a svážeme — tisk, vazba a doprava trvají přibližně
            tři až čtyři týdny. Jakmile bude hotová, pošleme ji na uvedenou adresu.
          </p>
          <p style={{ margin: "8px auto 28px", color: "var(--ink-soft)", maxWidth: "52ch" }}>
            Pokud byste cokoli potřebovali upravit, stačí odpovědět na potvrzovací e-mail —
            píše vám člověk.
          </p>
          <PrimaryCta href="/kniha" label="Zpět na knihu" variant="hero" />
          <p style={{ marginTop: "20px" }}>
            <Link
              href="/"
              style={{ textDecoration: "underline", textUnderlineOffset: 4, color: "var(--ink-soft)" }}
            >
              Domů na Vzpomínkář
            </Link>
          </p>
        </div>
      </section>
    </Shell>
  );
}

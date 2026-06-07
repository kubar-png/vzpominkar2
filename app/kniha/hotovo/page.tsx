import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { VoucherDownloadButton } from "@/components/gift/VoucherDownloadButton";

export const metadata: Metadata = {
  title: "Objednávka přijata — Kniha vzpomínek",
  robots: { index: false },
};

// The voucher download depends on a per-request query param — render fresh.
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────────────────
 * /kniha/hotovo — guest confirmation after a gift-book order (createGiftOrder).
 *
 * Reached two ways:
 *   - free path  → server action returns redirect "/kniha/hotovo"
 *   - paid path  → Stripe success_url "/kniha/hotovo?order=<id>"
 * No account, so we keep it simple: confirm, set expectations, link back.
 * ───────────────────────────────────────────────────────────────────────── */

export default async function KnihaHotovoPage({
  searchParams,
}: {
  searchParams: Promise<{ voucher?: string; order?: string }>;
}) {
  const sp = await searchParams;
  // A 64-hex token from the gift flow → offer the dárkový poukaz download. The
  // render route still gates on the voucher being paid, so a tampered/old token
  // simply yields nothing. We don't verify here (the button does the work).
  const voucherToken =
    sp.voucher && /^[a-f0-9]{64}$/i.test(sp.voucher.trim()) ? sp.voucher.trim() : null;

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

          {voucherToken ? (
            <div
              style={{
                margin: "0 auto 28px",
                maxWidth: "52ch",
                padding: "22px 24px",
                border: "1px solid var(--line)",
                borderRadius: 14,
                background: "var(--paper)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <p style={{ margin: 0, color: "var(--ink-soft)" }}>
                Dárkový poukaz je připravený. Stáhněte si ho jako PDF, vytiskněte a předejte —
                kniha je na cestě, poukaz dáte hned.
              </p>
              <VoucherDownloadButton token={voucherToken} className="auth-submit" />
            </div>
          ) : null}

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

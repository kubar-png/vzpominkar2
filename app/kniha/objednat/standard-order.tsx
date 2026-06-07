"use client";

import { useState } from "react";
import Link from "next/link";
import { GoldWordmark } from "@/components/brand/GoldWordmark";
import { BOOK_PHASES } from "@/lib/book-shop/phases";
import { type Gender } from "@/lib/gender";
import { createGiftOrder, type CreateGiftOrderInput } from "@/lib/shop/order-actions";
import {
  VoucherConfigurator,
  DEFAULT_VOUCHER_COLOR,
  type VoucherConfig,
} from "@/app/darovat/_components/VoucherConfigurator";
import {
  COVER_BG,
  COVER_TEXT,
  COVER_BG_HEX,
  COVER_TEXT_HEX,
  COVER_PREMIUM_CZK,
  DEFAULT_COVER_BG,
  DEFAULT_COVER_TEXT,
  isLegibleCover,
  isPremiumCover,
  defaultTextFor,
  type CoverBg,
  type CoverText,
} from "@/lib/book/cover";

/* Standard gift book (599 Kč) — our curated questions, no editing. A familiar
 * checkout that mirrors the owner login split (navy pitch + vertically-centered
 * form), with an order summary, the standard gold submit button and trust
 * signals by the CTA. The custom book lives in the configurator (/kniha/sestavit). */

const GIFTWRAP_CZK = 290;

function buildStandardQuestions(): Record<string, { id: string; text: string }[]> {
  const out: Record<string, { id: string; text: string }[]> = {};
  for (const p of BOOK_PHASES) {
    out[p.key] = p.questions.filter((q) => q.recommended).map((q) => ({ id: q.id, text: q.text }));
  }
  return out;
}

const STANDARD_QUESTION_COUNT = Object.values(buildStandardQuestions()).reduce(
  (n, arr) => n + arr.length,
  0,
);

function formatCzk(n: number): string {
  return `${n.toLocaleString("cs-CZ")} Kč`;
}

export function StandardOrder({
  basePriceCzk,
  isFree,
}: {
  basePriceCzk: number;
  /** Server-resolved: the charged base price is 0 (free path → no Stripe). */
  isFree: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [coverBg, setCoverBg] = useState<CoverBg>(DEFAULT_COVER_BG);
  const [coverText, setCoverText] = useState<CoverText>(DEFAULT_COVER_TEXT);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [giftwrap, setGiftwrap] = useState(false);
  const [dedication, setDedication] = useState("");
  const [voucher, setVoucher] = useState<VoucherConfig>({
    color: DEFAULT_VOUCHER_COLOR,
    recipient: null,
    message: null,
    signedBy: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function chooseCoverBg(bg: CoverBg) {
    setCoverBg(bg);
    setCoverText((t) => (isLegibleCover(bg, t) ? t : defaultTextFor(bg)));
  }

  const coverSurcharge = isPremiumCover(coverBg) ? COVER_PREMIUM_CZK : 0;
  const giftwrapSurcharge = giftwrap ? GIFTWRAP_CZK : 0;
  const totalCzk = basePriceCzk + coverSurcharge + giftwrapSurcharge;
  const hasSurcharge = coverSurcharge > 0 || giftwrapSurcharge > 0;

  // CTA label mirrors /onboarding/platba: "Objednat knihu" on the free path,
  // "Pokračovat k platbě" when there's a charge. `isFree` is the server-resolved
  // base (priceCzk === 0); the order only stays free when no priced surcharge is
  // added, so a free base + giftwrap (+290) truthfully reverts to the pay label.
  const ordersFree = isFree && totalCzk === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const input: CreateGiftOrderInput = {
      buyerName: name,
      buyerEmail: email,
      recipientGender: gender,
      coverBg,
      coverText,
      giftwrap,
      dedication: giftwrap ? dedication : undefined,
      tier: "standard",
      questions: buildStandardQuestions(),
      shippingAddress: { name, street, city, zip },
      voucher,
    };

    setSubmitting(true);
    try {
      const result = await createGiftOrder(input);
      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      window.location.assign(result.redirect);
    } catch {
      setError("Něco se pokazilo. Zkuste to prosím za chvíli znovu.");
      setSubmitting(false);
    }
  }

  return (
    <div className="senior-auth">
      {/* Left — navy editorial pitch (desktop), same as the login split */}
      <aside className="senior-auth-side">
        <GoldWordmark className="senior-auth-logo" height={30} />
        <div className="senior-auth-pitch">
          <span className="eyebrow">Kniha vzpomínek</span>
          <h2>
            Příběh, který
            <br />
            zůstane.
          </h2>
          <p>
            Pečlivě vybrané otázky napříč šesti životními obdobími. Váš blízký je
            vyplní vlastní rukou — a vznikne rodinná kronika jeho slovy.
          </p>
        </div>
        <p className="colophon">⁂ &nbsp; Standardní kniha · {STANDARD_QUESTION_COUNT} otázek</p>
      </aside>

      {/* Right — vertically-centered checkout form */}
      <main className="senior-auth-main">
        <form className="co-checkout" onSubmit={handleSubmit}>
          <span className="auth-eyebrow">Objednávka</span>
          <h1 className="auth-title">Vaše kniha vzpomínek</h1>
          <p className="auth-lede">
            Vyberte přebal a vyplňte doručení. Poštovné zdarma, bez vytvoření účtu.
          </p>

          {/* Order summary — what you're buying, with a live cover thumbnail */}
          <div className="co-summary">
            <div className="co-thumb" style={{ background: COVER_BG_HEX[coverBg] }}>
              <span
                className="co-thumb-frame"
                style={{ borderColor: COVER_TEXT_HEX[coverText] }}
              />
            </div>
            <div className="co-summary-meta">
              <strong>Standardní kniha vzpomínek</strong>
              <span>{STANDARD_QUESTION_COUNT} doporučených otázek · 6 životních období</span>
            </div>
            <span className="co-summary-price">{formatCzk(basePriceCzk)}</span>
          </div>

          <div className="auth-form">
            <div className="auth-field">
              <label>Pro koho je kniha</label>
              <div className="co-pills">
                {(
                  [
                    ["female", "Ženu"],
                    ["male", "Muže"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    className={`co-pill${gender === val ? " is-on" : ""}`}
                    onClick={() => setGender(val)}
                    aria-pressed={gender === val}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-field">
              <label>
                Barva přebalu
                <span className="co-note">hnědá v ceně · ostatní +{COVER_PREMIUM_CZK} Kč</span>
              </label>
              <div className="co-swatches">
                {COVER_BG.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => chooseCoverBg(o.value)}
                    aria-pressed={coverBg === o.value}
                    aria-label={o.label}
                    title={isPremiumCover(o.value) ? `${o.label} — +${COVER_PREMIUM_CZK} Kč` : `${o.label} — v ceně`}
                    className={`co-swatch${coverBg === o.value ? " is-on" : ""}`}
                    style={{ background: o.hex }}
                  />
                ))}
                <div className="co-textopts">
                  {COVER_TEXT.map((o) => {
                    const ok = isLegibleCover(coverBg, o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        disabled={!ok}
                        onClick={() => setCoverText(o.value)}
                        aria-pressed={coverText === o.value}
                        title={ok ? `Text: ${o.label}` : `${o.label} — nečitelné na této barvě`}
                        className={`co-textopt${coverText === o.value ? " is-on" : ""}`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="co-name">Jméno a příjmení</label>
              <input
                id="co-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jan Novák"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="co-email">E-mail</label>
              <input
                id="co-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vy@email.cz"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="co-street">Ulice a číslo popisné</label>
              <input
                id="co-street"
                type="text"
                autoComplete="street-address"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Dlouhá 12"
              />
            </div>

            <div className="co-row">
              <div className="auth-field">
                <label htmlFor="co-city">Město</label>
                <input
                  id="co-city"
                  type="text"
                  autoComplete="address-level2"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Praha"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="co-zip">PSČ</label>
                <input
                  id="co-zip"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  required
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="110 00"
                />
              </div>
            </div>

            <label className="co-wrap">
              <input type="checkbox" checked={giftwrap} onChange={(e) => setGiftwrap(e.target.checked)} />
              <span className="co-wrap-text">
                <strong>Dárkové balení s raženým věnováním</strong>
                <span>Zabalíme jako dárek a na desky vyrazíme věnování.</span>
              </span>
              <span className="co-wrap-price">+{formatCzk(GIFTWRAP_CZK)}</span>
            </label>

            {giftwrap ? (
              <div className="auth-field">
                <label htmlFor="co-ded">Text věnování</label>
                <input
                  id="co-ded"
                  type="text"
                  maxLength={120}
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder="Pro maminku, s láskou"
                />
              </div>
            ) : null}
          </div>

          {/* Dárkový poukaz — personalize a printable card to hand over while the
              book is in the post. Downloadable as PDF on the confirmation page
              after payment (no free vouchers). */}
          <div className="co-voucher">
            <div className="co-voucher-head">
              <strong>Dárkový poukaz k vytištění</strong>
              <span>
                Kniha dorazí za 3–4 týdny — poukaz si po zaplacení stáhnete jako PDF a předáte hned.
              </span>
            </div>
            <VoucherConfigurator initialColor={voucher.color} onChange={setVoucher} />
          </div>

          {error ? (
            <p className="auth-alert" role="alert">
              {error}
            </p>
          ) : null}

          <div className="co-total">
            {hasSurcharge ? (
              <div className="co-lines">
                <div className="co-line">
                  <span>Kniha s doporučenými otázkami</span>
                  <span>{formatCzk(basePriceCzk)}</span>
                </div>
                {coverSurcharge > 0 ? (
                  <div className="co-line">
                    <span>Barevný přebal</span>
                    <span>+{formatCzk(coverSurcharge)}</span>
                  </div>
                ) : null}
                {giftwrapSurcharge > 0 ? (
                  <div className="co-line">
                    <span>Dárkové balení</span>
                    <span>+{formatCzk(giftwrapSurcharge)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="co-total-row">
              <span>Celkem</span>
              <strong>{formatCzk(totalCzk)}</strong>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? "Odesíláme…"
              : ordersFree
                ? "Objednat knihu"
                : "Pokračovat k platbě"}
            <span className="arrow" aria-hidden>
              ↗
            </span>
          </button>

          {/* Reassurance row — honest, paper-product claims only (no app /
              "přístup napořád" promises; this book has no account or app).
              Inline-styled to stay inside the owned checkout file (globals.css
              .co-* classes are owned by the gift-funnel agent). */}
          <ul
            aria-label="Co máte jisté"
            style={{
              listStyle: "none",
              padding: 0,
              margin: "14px 0 0",
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 14px",
              fontFamily: "var(--font-body-editorial)",
              fontSize: "12.5px",
              lineHeight: 1.4,
              color: "var(--ink-soft)",
            }}
          >
            {[
              "Poštovné zdarma (ČR i SK)",
              "Doručení obvykle do 3–4 týdnů",
              "Zabezpečená platba",
              "Píše a pomáhá vám člověk",
            ].map((t) => (
              <li
                key={t}
                style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                <span aria-hidden style={{ color: "var(--gold)", fontWeight: 600 }}>
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>

          <p className="auth-fineprint">
            Bez vytvoření účtu. Chcete otázky upravit nebo přidat vlastní?{" "}
            <Link href="/kniha/sestavit" className="auth-link">
              Sestavte si knihu na míru
            </Link>
            .
          </p>
        </form>
      </main>
    </div>
  );
}

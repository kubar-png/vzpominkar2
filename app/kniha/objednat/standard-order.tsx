"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
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

/* Standard gift book — our curated questions, no editing. A familiar
 * checkout that mirrors the owner login split (navy pitch + vertically-centered
 * form), with an order summary, the standard gold submit button and trust
 * signals by the CTA. The custom book lives in the configurator (/kniha/sestavit). */

const GIFTWRAP_CZK = 290;

const defaultCoverLabel =
  COVER_BG.find((o) => o.value === DEFAULT_COVER_BG)?.label ?? "Tmavě modrá";

// Honest, paper-product reassurances (no app / "přístup napořád" promises — this
// book has no account). Shown in the navy rail on desktop, inline on mobile.
const TRUST = [
  "Poštovné zdarma (ČR i SK)",
  "Doručení obvykle do 3–4 týdnů",
  "Zabezpečená platba",
  "Píše a pomáhá vám člověk",
];

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

export function StandardOrder({ basePriceCzk }: { basePriceCzk: number }) {
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
  // Voucher is opt-in: closed by default so its (now container-query-safe) live
  // preview never paints on first load and the page stays short.
  const [showVoucher, setShowVoucher] = useState(false);

  function chooseCoverBg(bg: CoverBg) {
    setCoverBg(bg);
    setCoverText((t) => (isLegibleCover(bg, t) ? t : defaultTextFor(bg)));
  }

  const coverSurcharge = isPremiumCover(coverBg) ? COVER_PREMIUM_CZK : 0;
  const giftwrapSurcharge = giftwrap ? GIFTWRAP_CZK : 0;
  const totalCzk = basePriceCzk + coverSurcharge + giftwrapSurcharge;
  const hasSurcharge = coverSurcharge > 0 || giftwrapSurcharge > 0;
  // Free testing version: env base price unset → 0. While that's the case we
  // hide every Kč figure and show a "V testovací verzi zdarma" state instead.
  // Once the price env is configured the real amounts flow through unchanged.
  const isTestFree = basePriceCzk === 0;

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
    <div className="senior-auth senior-auth--shop">
      {/* Left — NARROW STATIC navy rail (desktop): brand pitch + a live order
          summary + trust, pinned in view while only the right column scrolls. */}
      <aside className="senior-auth-side">
        <Logo variant="full" tone="offwhite" className="senior-auth-logo" height={28} />
        <div className="senior-auth-pitch">
          <h2>
            Příběh, který
            <br />
            zůstane.
          </h2>
          <p>Pečlivě vybrané otázky. Váš blízký je vyplní vlastní rukou.</p>
        </div>

        {/* Live order summary — the "what am I buying / what does it cost"
            answer stays on screen the whole time (classic checkout reassurance). */}
        <div className="co-rail">
          <div className="co-rail-head">
            <span className="co-rail-thumb" style={{ background: COVER_BG_HEX[coverBg] }}>
              <span style={{ borderColor: COVER_TEXT_HEX[coverText] }} />
            </span>
            <span className="co-rail-meta">
              <strong>Standardní kniha vzpomínek</strong>
              <span>{STANDARD_QUESTION_COUNT} otázek · 6 období</span>
            </span>
          </div>
          <div className="co-rail-lines">
            <div className="co-rail-line">
              <span>Kniha s otázkami</span>
              <span>{isTestFree ? "zdarma" : formatCzk(basePriceCzk)}</span>
            </div>
            {!isTestFree && coverSurcharge > 0 ? (
              <div className="co-rail-line">
                <span>Barevný přebal</span>
                <span>+{formatCzk(coverSurcharge)}</span>
              </div>
            ) : null}
            {!isTestFree && giftwrapSurcharge > 0 ? (
              <div className="co-rail-line">
                <span>Dárkové balení</span>
                <span>+{formatCzk(giftwrapSurcharge)}</span>
              </div>
            ) : null}
          </div>
          <div className="co-rail-total">
            <span>Celkem</span>
            <strong>{isTestFree ? "V testovací verzi zdarma" : formatCzk(totalCzk)}</strong>
          </div>
          <ul className="co-rail-trust">
            {TRUST.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right — the ONLY thing that scrolls */}
      <main className="senior-auth-main">
        <form className="co-checkout" onSubmit={handleSubmit}>
          <h1 className="auth-title">Vaše kniha vzpomínek</h1>
          <p className="auth-lede">Vyberte přebal a vyplňte doručení — poštovné zdarma, bez účtu.</p>

          {/* Mobile-only summary (on desktop the navy rail owns it). */}
          <div className="co-aside">
            <div className="co-summary">
              <div className="co-thumb" style={{ background: COVER_BG_HEX[coverBg] }}>
                <span className="co-thumb-frame" style={{ borderColor: COVER_TEXT_HEX[coverText] }} />
              </div>
              <div className="co-summary-meta">
                <strong>Standardní kniha vzpomínek</strong>
                <span>{STANDARD_QUESTION_COUNT} doporučených otázek · 6 životních období</span>
              </div>
              <span className="co-summary-price">{isTestFree ? "Zdarma" : formatCzk(basePriceCzk)}</span>
            </div>
          </div>

          <div className="auth-form">
            <p className="co-group">Kniha</p>

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

            {/* Cover folded away by default — hnědá is in the price, so most
                buyers never open it (and the brown default is the common pick). */}
            <details className="co-collapse">
              <summary>{`Změnit barvu přebalu — ${defaultCoverLabel.toLowerCase()} v ceně`}</summary>
              <div className="co-collapse-body">
                <div className="co-swatches">
                  {COVER_BG.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => chooseCoverBg(o.value)}
                      aria-pressed={coverBg === o.value}
                      aria-label={o.label}
                      title={
                        isTestFree
                          ? o.label
                          : isPremiumCover(o.value)
                            ? `${o.label} — +${COVER_PREMIUM_CZK} Kč`
                            : `${o.label} — v ceně`
                      }
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
                <p className="co-note" style={{ marginLeft: 0 }}>
                  {isTestFree
                    ? "V testovací verzi je vše zdarma"
                    : `${defaultCoverLabel} je v ceně · ostatní barvy +${COVER_PREMIUM_CZK} Kč`}
                </p>
              </div>
            </details>

            <p className="co-group">Doručení</p>

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
              <span className="co-wrap-price">{isTestFree ? "zdarma" : `+${formatCzk(GIFTWRAP_CZK)}`}</span>
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

          {/* Dárkový poukaz — opt-in (closed by default). The configurator (with
              its live A5 preview) mounts only when opened, so the page stays
              short and the preview never paints crushed on first load. */}
          <div className="co-voucher">
            <button
              type="button"
              className="co-voucher-toggle"
              aria-expanded={showVoucher}
              onClick={() => setShowVoucher((v) => !v)}
            >
              <span className="co-voucher-head">
                <strong>Přidat dárkový poukaz k vytištění</strong>
                <span>Kniha dorazí za 3–4 týdny — poukaz předáte hned. Stáhnete jako PDF po zaplacení.</span>
              </span>
              <span className="co-voucher-chev" aria-hidden>
                {showVoucher ? "–" : "+"}
              </span>
            </button>
            {showVoucher ? (
              <div className="co-voucher-body">
                <VoucherConfigurator initialColor={voucher.color} onChange={setVoucher} />
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="auth-alert" role="alert">
              {error}
            </p>
          ) : null}

          {/* Mobile-only total (on desktop the rail carries it). */}
          <div className="co-aside">
            <div className="co-total">
              {!isTestFree && hasSurcharge ? (
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
                <strong>{isTestFree ? "V testovací verzi zdarma" : formatCzk(totalCzk)}</strong>
              </div>
            </div>
          </div>

          {/* CTA: payment-intent label per owner request. The path is 0 Kč today
              (Stripe not yet live), so this reads "Přejít k platbě" ahead of the
              charge going live; a surcharge appends the live total. */}
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? "Odesíláme…"
              : !isTestFree && totalCzk > 0
                ? `Přejít k platbě · ${formatCzk(totalCzk)}`
                : "Přejít k platbě"}
            <span className="arrow" aria-hidden>
              ↗
            </span>
          </button>

          {/* Mobile-only trust row (on desktop the rail carries it). Inline-styled
              for the cream page; wrapped in .co-aside so it hides on desktop. */}
          <div className="co-aside">
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
              {TRUST.map((t) => (
                <li key={t} style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <span aria-hidden style={{ color: "var(--gold)", fontWeight: 600 }}>
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

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

"use client";

import { useState } from "react";
import { createGiftOrder, type CreateGiftOrderInput } from "@/lib/shop/order-actions";
import type { Gender } from "@/lib/gender";
import { COVER_BG_HEX, COVER_TEXT_HEX, type CoverBg, type CoverText } from "@/lib/book/cover";

const STORAGE_KEY = "kniha-config-v1";
const META_KEY = "kniha-config-meta-v1";

interface Q {
  id: string;
  text: string;
  custom?: boolean;
}
type Selection = Record<string, Q[]>;

// Gift wrapping + embossed dedication surcharge (CZK). Mirrors
// priceForProductCzk("book_giftwrap") on the server, which stays authoritative.
const GIFTWRAP_CZK = 290;

interface OrderFormProps {
  /** Total selected questions — for the summary line + empty-cart guard. */
  total: number;
  pluralQ: (n: number) => string;
  /** Base book price (CZK) — without any surcharges. */
  basePriceCzk: number;
  /** Premium-cover surcharge (CZK), already resolved from the chosen cover. */
  coverSurchargeCzk: number;
  /** Czech price formatter shared with the configurator. */
  formatCzk: (n: number) => string;
  /** Go back to the recap (edit questions / cover). */
  onBack: () => void;
}

/**
 * Read the persisted draft straight from localStorage at submit time — it's the
 * source of truth (the configurator writes it on every change). Falls back to
 * empty so a missing/corrupt draft surfaces as the "no questions" error rather
 * than crashing.
 */
function readDraft(): {
  questions: Selection;
  gender: Gender | null;
  coverBg?: CoverBg;
  coverText?: CoverText;
} {
  let questions: Selection = {};
  let gender: Gender | null = null;
  let coverBg: CoverBg | undefined;
  let coverText: CoverText | undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) questions = JSON.parse(raw) as Selection;
  } catch {
    /* corrupt draft — treated as empty (guarded below) */
  }
  try {
    const meta = localStorage.getItem(META_KEY);
    if (meta) {
      const m = JSON.parse(meta) as {
        gender?: Gender | null;
        coverBg?: CoverBg;
        coverText?: CoverText;
      };
      if (m?.gender === "male" || m?.gender === "female") gender = m.gender;
      if (m?.coverBg && COVER_BG_HEX[m.coverBg]) coverBg = m.coverBg;
      if (m?.coverText && COVER_TEXT_HEX[m.coverText]) coverText = m.coverText;
    }
  } catch {
    /* ignore */
  }
  return { questions, gender, coverBg, coverText };
}

export function OrderForm({
  total,
  pluralQ,
  basePriceCzk,
  coverSurchargeCzk,
  formatCzk,
  onBack,
}: OrderFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [note, setNote] = useState("");
  const [giftwrap, setGiftwrap] = useState(false);
  const [dedication, setDedication] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Displayed total = base + premium cover + gift wrapping (if chosen). The
  // server recomposes the authoritative amount, so this is for display only.
  const giftwrapSurcharge = giftwrap ? GIFTWRAP_CZK : 0;
  const priceLabel = formatCzk(basePriceCzk + coverSurchargeCzk + giftwrapSurcharge);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const draft = readDraft();
    const input: CreateGiftOrderInput = {
      buyerName: name,
      buyerEmail: email,
      recipientGender: draft.gender,
      coverBg: draft.coverBg,
      coverText: draft.coverText,
      giftwrap,
      dedication: giftwrap ? dedication : undefined,
      tier: "custom",
      questions: draft.questions,
      shippingAddress: { name, street, city, zip, note },
    };

    setSubmitting(true);
    try {
      const result = await createGiftOrder(input);
      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      // Server hands back either an internal path (free) or a Stripe URL (paid).
      window.location.assign(result.redirect);
    } catch {
      setError("Něco se pokazilo. Zkuste to prosím za chvíli znovu.");
      setSubmitting(false);
    }
  }

  return (
    <section className="kc-order">
      <form className="kc-order-card" onSubmit={handleSubmit}>
        <div className="kc-order-head">
          <h2>Doručovací údaje</h2>
          <p className="kc-order-sub">
            Knihu vysázíme, vytiskneme a pošleme na vámi uvedenou adresu. Účet zakládat nemusíte.
          </p>
        </div>

        <div className="kc-field">
          <label htmlFor="kc-name">Jméno a příjmení</label>
          <input
            id="kc-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jan Novák"
          />
        </div>

        <div className="kc-field">
          <label htmlFor="kc-email">E-mail</label>
          <input
            id="kc-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan@example.cz"
          />
          <span className="kc-field-hint">Pošleme sem potvrzení objednávky.</span>
        </div>

        <div className="kc-field">
          <label htmlFor="kc-street">Ulice a číslo popisné</label>
          <input
            id="kc-street"
            type="text"
            autoComplete="street-address"
            required
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Dlouhá 12"
          />
        </div>

        <div className="kc-field-row">
          <div className="kc-field">
            <label htmlFor="kc-city">Město</label>
            <input
              id="kc-city"
              type="text"
              autoComplete="address-level2"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Praha"
            />
          </div>
          <div className="kc-field kc-field-zip">
            <label htmlFor="kc-zip">PSČ</label>
            <input
              id="kc-zip"
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

        <div className="kc-field">
          <label htmlFor="kc-note">Poznámka k objednávce (nepovinné)</label>
          <textarea
            id="kc-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cokoli, co bychom měli vědět…"
          />
        </div>

        <div className="kc-field kc-field-giftwrap">
          <label className="kc-checkbox">
            <input
              type="checkbox"
              checked={giftwrap}
              onChange={(e) => setGiftwrap(e.target.checked)}
            />
            <span>Dárkové balení s raženým věnováním (+{formatCzk(GIFTWRAP_CZK)})</span>
          </label>
          <span className="kc-field-hint">
            Knihu zabalíme jako dárek a na desky vyrazíme krátké věnování.
          </span>
        </div>

        {giftwrap ? (
          <div className="kc-field">
            <label htmlFor="kc-dedication">Text věnování</label>
            <textarea
              id="kc-dedication"
              rows={2}
              maxLength={500}
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              placeholder="Pro maminku, s láskou…"
            />
            <span className="kc-field-hint">Krátký text, který vyrazíme na desky.</span>
          </div>
        ) : null}

        <div className="kc-order-total">
          <span>
            {total} {pluralQ(total)} · poštovné zdarma
          </span>
          <strong>{priceLabel}</strong>
        </div>

        {error ? (
          <p className="kc-order-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="kc-order-actions">
          <button type="button" className="btn btn-outline" onClick={onBack} disabled={submitting}>
            ← Zpět na souhrn
          </button>
          <button
            type="submit"
            className="btn btn-gold btn-gold-full"
            disabled={submitting || total === 0}
          >
            {submitting ? "Odesílám…" : "Závazně objednat"} <span className="arrow">↗</span>
          </button>
        </div>
        <p className="kc-order-fineprint">
          Kliknutím na „Závazně objednat“ odešlete objednávku. U placené varianty vás přesměrujeme
          na zabezpečenou platební bránu.
        </p>
      </form>
    </section>
  );
}

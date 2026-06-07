"use client";

import { useId, useState } from "react";
import { resolveGender, type Gender } from "@/lib/gender";
import { COVER_BG, COVER_BG_HEX, type CoverBg } from "@/lib/book/cover";

/**
 * Voucher configurator (Krok: personalizace poukazu) — the buyer picks a brand
 * colour and optionally adds a recipient oslovení, a personal line, and their
 * own signature, while a LIVE A5-landscape preview updates beside the controls.
 *
 * The preview is a faithful web rendering of the print page
 * (app/print/voucher/[token]/page.tsx): same gold frame, gold eyebrow "Dárkový
 * poukaz", the fixed two-line message ("Zajímá mě tvůj příběh." / "Proto jsem
 * ti koupil/a Vzpomínkář."), optional personal line, gold rule + signature, and
 * the gold "Vzpomínkář" brand line — on a full-bleed brand-coloured card. The
 * type scales with the card via container-query units (cqw) so it stays A5-
 * proportioned on every screen.
 *
 * Config is surfaced TWO ways so checkout can persist it through
 * lib/gift/voucher.ts regardless of how the parent flow is wired:
 *   1. `onChange(config)` callback — for a state-driven flow.
 *   2. hidden form fields (when `fieldPrefix` is set) — for a plain <form> POST.
 *
 * No payment is wired here (stage 4). Reduced-motion safe (transitions are
 * colour/opacity only; the global prefers-reduced-motion guard disables them),
 * 44px tap targets, mobile-first (controls stack under the preview).
 */

// Mirrors the print page exactly. "koupil{a}" is gender-aware via lib/gender;
// the voucher stores no buyer gender, so the card shows the slash form
// ("koupil/a") — honest and unambiguous in print.
const MESSAGE_LINE_1 = "Zajímá mě tvůj příběh.";
const MESSAGE_LINE_2 = "Proto jsem ti {koupil|koupila} Vzpomínkář.";
const VOUCHER_GENDER: Gender | null = null;

const RECIPIENT_MAX = 40;
const MESSAGE_MAX = 160;
const SIGNED_MAX = 40;

export interface VoucherConfig {
  color: CoverBg;
  /** Recipient oslovení (e.g. "Milá babičko"), or null when blank. */
  recipient: string | null;
  /** Optional personal line under the fixed message, or null when blank. */
  message: string | null;
  /** Buyer signature (e.g. "Tvůj vnuk Honza"), or null when blank. */
  signedBy: string | null;
}

export const DEFAULT_VOUCHER_COLOR: CoverBg = "navy";

/** Trim to null so blank inputs never store "". Mirrors lib/gift/voucher clean(). */
function clean(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

interface VoucherConfiguratorProps {
  /** Initial colour; defaults to navy (matches createVoucher's default). */
  initialColor?: CoverBg;
  initialRecipient?: string;
  initialMessage?: string;
  initialSignedBy?: string;
  /** Called on every edit with the normalized (trimmed → null) config. */
  onChange?: (config: VoucherConfig) => void;
  /**
   * When set, the chosen config is also mirrored into hidden inputs named
   * `${fieldPrefix}_color|recipient|message|signed_by`, so a parent <form> can
   * POST it straight to the order/voucher persistence (lib/gift/voucher.ts).
   */
  fieldPrefix?: string;
}

export function VoucherConfigurator({
  initialColor = DEFAULT_VOUCHER_COLOR,
  initialRecipient = "",
  initialMessage = "",
  initialSignedBy = "",
  onChange,
  fieldPrefix,
}: VoucherConfiguratorProps) {
  const [color, setColor] = useState<CoverBg>(initialColor);
  const [recipient, setRecipient] = useState(initialRecipient);
  const [message, setMessage] = useState(initialMessage);
  const [signedBy, setSignedBy] = useState(initialSignedBy);

  const ids = useId();
  const recipientId = `${ids}-recipient`;
  const messageId = `${ids}-message`;
  const signedId = `${ids}-signed`;

  // Push the normalized config to the parent on every change. We compute the
  // next config from the incoming value so the callback never lags a render.
  function emit(next: Partial<VoucherConfig> = {}) {
    onChange?.({
      color: next.color ?? color,
      recipient: next.recipient !== undefined ? next.recipient : clean(recipient),
      message: next.message !== undefined ? next.message : clean(message),
      signedBy: next.signedBy !== undefined ? next.signedBy : clean(signedBy),
    });
  }

  function chooseColor(next: CoverBg) {
    setColor(next);
    emit({ color: next });
  }

  const bgHex = COVER_BG_HEX[color] ?? COVER_BG_HEX.navy;
  const line2 = resolveGender(MESSAGE_LINE_2, VOUCHER_GENDER);

  const previewRecipient = recipient.trim() || null;
  const previewMessage = message.trim() || null;
  const previewSigned = signedBy.trim() || null;

  return (
    <div className="vc">
      {/* ── LIVE A5-landscape preview ── */}
      <div className="vc-preview-wrap">
        <div
          className="vc-card"
          style={{ background: bgHex }}
          role="img"
          aria-label="Náhled dárkového poukazu"
        >
          <div className="vc-frame">
            <p className="vc-eyebrow">Dárkový poukaz</p>

            {previewRecipient ? <p className="vc-recipient">{previewRecipient}</p> : null}

            <p className="vc-message">
              <span>{MESSAGE_LINE_1}</span>
              <span>{line2}</span>
            </p>

            {previewMessage ? <p className="vc-personal">{previewMessage}</p> : null}

            {previewSigned ? (
              <>
                <hr className="vc-rule" />
                <p className="vc-signed">{previewSigned}</p>
              </>
            ) : null}

            <p className="vc-brand">Vzpomínkář</p>
          </div>
        </div>
        <p className="vc-hint">
          Náhled formátu A5 na šířku. Poukaz si stáhnete jako PDF po zaplacení.
        </p>
      </div>

      {/* ── Controls ── */}
      <div className="vc-controls">
        <div className="vc-field">
          <span className="vc-label">Barva poukazu</span>
          <div role="radiogroup" aria-label="Vyberte barvu poukazu" className="vc-swatches">
            {COVER_BG.map((o) => {
              const active = o.value === color;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={o.label}
                  title={o.label}
                  onClick={() => chooseColor(o.value)}
                  className={`vc-swatch${active ? " is-on" : ""}`}
                  style={{ background: o.hex }}
                >
                  {active ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                      className="vc-swatch-check"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="vc-field">
          <label htmlFor={recipientId} className="vc-label">
            Oslovení <span className="vc-optional">nepovinné</span>
          </label>
          <input
            id={recipientId}
            type="text"
            className="vc-input"
            maxLength={RECIPIENT_MAX}
            value={recipient}
            placeholder="Milá babičko"
            onChange={(e) => {
              setRecipient(e.target.value);
              emit({ recipient: clean(e.target.value) });
            }}
          />
        </div>

        <div className="vc-field">
          <label htmlFor={messageId} className="vc-label">
            Vlastní vzkaz <span className="vc-optional">nepovinné</span>
          </label>
          <textarea
            id={messageId}
            className="vc-input vc-textarea"
            rows={2}
            maxLength={MESSAGE_MAX}
            value={message}
            placeholder="Pár vět od srdce…"
            onChange={(e) => {
              setMessage(e.target.value);
              emit({ message: clean(e.target.value) });
            }}
          />
        </div>

        <div className="vc-field">
          <label htmlFor={signedId} className="vc-label">
            Podpis <span className="vc-optional">nepovinné</span>
          </label>
          <input
            id={signedId}
            type="text"
            className="vc-input"
            maxLength={SIGNED_MAX}
            value={signedBy}
            placeholder="Tvůj vnuk Honza"
            onChange={(e) => {
              setSignedBy(e.target.value);
              emit({ signedBy: clean(e.target.value) });
            }}
          />
        </div>
      </div>

      {/* Hidden mirror for a plain-form parent — checkout persists via
          lib/gift/voucher.ts. Only emitted when fieldPrefix is provided. */}
      {fieldPrefix ? (
        <>
          <input type="hidden" name={`${fieldPrefix}_color`} value={color} />
          <input type="hidden" name={`${fieldPrefix}_recipient`} value={recipient.trim()} />
          <input type="hidden" name={`${fieldPrefix}_message`} value={message.trim()} />
          <input type="hidden" name={`${fieldPrefix}_signed_by`} value={signedBy.trim()} />
        </>
      ) : null}

      {/* Scoped styles — editorial tokens reused (--gold, --ink, fonts); the
          preview mirrors print/voucher (gold frame #d4a017, cream text). Type
          scales with the card via container-query units so it stays A5-
          proportioned at any width. Nothing here touches global brand sections. */}
      <style>{`
        .vc {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          align-items: start;
        }
        .vc-preview-wrap { min-width: 0; }
        .vc-card {
          container-type: inline-size;
          width: 100%;
          aspect-ratio: 210 / 148;
          border-radius: 8px;
          box-shadow: 0 18px 44px -22px rgba(14, 59, 100, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4.8cqw;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .vc-frame {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          border: 0.7cqw solid #d4a017;
          border-radius: 1cqw;
          padding: 5.5cqw 6.5cqw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #f4ecd8;
          overflow: hidden;
        }
        .vc-eyebrow {
          font-family: var(--font-display-editorial);
          font-size: 2.6cqw;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: #d4a017;
          margin: 0 0 3.6cqw;
        }
        .vc-recipient {
          font-family: var(--font-display-editorial);
          font-style: italic;
          font-size: 4.2cqw;
          color: #f4ecd8;
          margin: 0 0 2.6cqw;
          max-width: 100%;
          overflow-wrap: anywhere;
        }
        .vc-message {
          font-family: var(--font-display-editorial);
          font-size: 6.4cqw;
          line-height: 1.3;
          margin: 0;
          color: #fbf6ea;
        }
        .vc-message span { display: block; }
        .vc-personal {
          font-family: Georgia, "Times New Roman", serif;
          font-style: italic;
          font-size: 3.2cqw;
          line-height: 1.5;
          color: #e7dcc4;
          margin: 3.6cqw 0 0;
          max-width: 72cqw;
          overflow-wrap: anywhere;
        }
        .vc-rule {
          width: 12.5cqw;
          height: 0.24cqw;
          min-height: 1px;
          background: #d4a017;
          margin: 4cqw 0 2.6cqw;
          border: 0;
        }
        .vc-signed {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 3cqw;
          color: #e7dcc4;
          margin: 0;
          max-width: 100%;
          overflow-wrap: anywhere;
        }
        .vc-brand {
          font-family: var(--font-display-editorial);
          font-size: 2.4cqw;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #d4a017;
          margin: 4.6cqw 0 0;
        }
        .vc-hint {
          font-family: var(--font-body-editorial);
          font-size: 12.5px;
          line-height: 1.45;
          color: var(--ink-soft);
          margin: 12px 2px 0;
        }
        .vc-controls {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .vc-field { display: flex; flex-direction: column; gap: 8px; }
        .vc-label {
          font-family: var(--font-body-editorial);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-soft);
        }
        .vc-optional {
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: none;
          color: var(--ink-mute);
        }
        .vc-swatches { display: flex; flex-wrap: wrap; gap: 12px; }
        .vc-swatch {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
          transition: box-shadow 140ms ease, transform 140ms ease;
        }
        .vc-swatch:hover { transform: translateY(-1px); }
        .vc-swatch.is-on {
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08), 0 0 0 2px var(--ink);
        }
        .vc-swatch:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px var(--gold), 0 0 0 4px var(--bg, #fbf5e3);
        }
        .vc-swatch-check { filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5)); }
        .vc-input {
          width: 100%;
          box-sizing: border-box;
          font-family: var(--font-body-editorial);
          font-size: 15px;
          color: var(--ink);
          background: #fff;
          border: 1px solid var(--color-border, rgba(14, 59, 100, 0.18));
          border-radius: 10px;
          padding: 12px 14px;
          min-height: 44px;
          transition: border-color 140ms ease, box-shadow 140ms ease;
        }
        .vc-textarea { resize: vertical; line-height: 1.5; min-height: 64px; }
        .vc-input::placeholder { color: var(--ink-mute); }
        .vc-input:focus-visible {
          outline: none;
          border-color: var(--ink);
          box-shadow: 0 0 0 2px rgba(212, 160, 23, 0.35);
        }
        @media (min-width: 880px) {
          .vc {
            grid-template-columns: minmax(0, 1.15fr) minmax(280px, 1fr);
            gap: 40px;
            align-items: center;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vc-swatch, .vc-input { transition: none; }
          .vc-swatch:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}

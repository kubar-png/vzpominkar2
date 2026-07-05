"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { sendTesterQuestions } from "./actions";

type Step = "login" | "create_senior" | "send_question" | "await_answer" | "feedback";

const linkSoft: React.CSSProperties = {
  fontSize: 15,
  color: "var(--ink-soft)",
  textDecoration: "underline",
  textUnderlineOffset: 4,
};

const smallBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "none",
  background: "var(--gold)",
  color: "var(--color-on-accent)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const smallBtnGhost: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid var(--color-border)",
  background: "transparent",
  color: "var(--color-navy-700)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

/**
 * The logged-in tester Hub. Unlike the old static checklist, this is driven by the
 * tester state machine (getTesterProgress): it walks the tester through add-blízký
 * → send-questions-today → open-the-magic-link-and-answer → give-feedback, and
 * surfaces the senior's no-password answering link inline so the tester never has
 * to hunt for it in the app.
 */
export function TesterHub({
  firstName,
  seniorName,
  magicLink: initialLink,
  questionsSent,
  answersCount,
  nextStep,
}: {
  firstName: string;
  seniorName: string | null;
  magicLink: string | null;
  questionsSent: number;
  answersCount: number;
  nextStep: Step;
}) {
  const [pending, start] = useTransition();
  const [magicLink, setMagicLink] = useState(initialLink);
  const [sent, setSent] = useState(questionsSent > 0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasSenior = nextStep !== "create_senior" && nextStep !== "login";
  const hasAnswer = answersCount > 0;
  const name = seniorName?.trim() || "";
  const who = name || "vašeho blízkého";

  function handleSend() {
    setError(null);
    start(async () => {
      const res = await sendTesterQuestions();
      if (!res.ok) {
        setError(res.error ?? "Otázky se nepodařilo odeslat. Zkuste to prosím znovu.");
        return;
      }
      if (res.magicLink) setMagicLink(res.magicLink);
      setSent(true);
    });
  }

  async function copyLink() {
    if (!magicLink) return;
    try {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the link is on screen to copy by hand */
    }
  }

  return (
    <>
      <h1 style={{ fontSize: "clamp(34px, 5vw, 56px)", marginBottom: 20 }}>
        {firstName ? `Děkujeme, ${firstName}!` : "Děkujeme!"} Váš testovací účet je připravený.
      </h1>

      {/* Step 1 — no blízký yet */}
      {!hasSenior ? (
        <>
          <p style={{ fontSize: "clamp(17px, 1.4vw, 20px)", lineHeight: 1.6, maxWidth: 640 }}>
            Prvním krokem přidejte blízkého, jehož vzpomínky chcete zachytit — rodiče nebo
            prarodiče. Uvnitř aplikace vás krátce provede průvodce.
          </p>
          <div style={{ marginTop: 32 }}>
            <Link href="/dashboard" className="btn btn-gold hero-cta">
              Otevřít aplikaci a přidat blízkého
              <span className="arrow" aria-hidden>
                ↗
              </span>
            </Link>
          </div>
        </>
      ) : null}

      {/* Step 2 — blízký added, send the first questions today */}
      {hasSenior && !sent && !hasAnswer ? (
        <>
          <p style={{ fontSize: "clamp(17px, 1.4vw, 20px)", lineHeight: 1.6, maxWidth: 640 }}>
            {name ? `${name} je přidaný.` : "Váš blízký je přidaný."} Pošlete mu dvě otázky ještě
            dnes — pak mu předáte odkaz, přes který odpoví hlasem nebo textem, bez hesla.
          </p>
          <div
            style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}
          >
            <button
              type="button"
              className="btn btn-gold hero-cta"
              onClick={handleSend}
              disabled={pending}
              style={{ opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "Odesílám…" : `Poslat ${name || "blízkému"} dvě otázky`}
              {!pending ? (
                <span className="arrow" aria-hidden>
                  ↗
                </span>
              ) : null}
            </button>
            <Link href="/dashboard" style={linkSoft}>
              Otevřít aplikaci →
            </Link>
          </div>
          {error ? (
            <p style={{ marginTop: 12, color: "var(--gold)", fontSize: 14 }}>{error}</p>
          ) : null}
        </>
      ) : null}

      {/* Step 3 — questions sent, share the answering link */}
      {hasSenior && sent && !hasAnswer ? (
        <>
          <p style={{ fontSize: "clamp(17px, 1.4vw, 20px)", lineHeight: 1.6, maxWidth: 640 }}>
            Otázky jsou naplánované na dnešek. Teď otevřete odkaz níže jako {who} a odpovězte na
            otázku — přesně jako to udělá on.
          </p>

          {magicLink ? (
            <div
              style={{
                marginTop: 24,
                padding: "16px 18px",
                borderRadius: 14,
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                maxWidth: 640,
              }}
            >
              <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 10 }}>
                Odkaz pro {who} k odpovídání (bez hesla):
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <code
                  style={{
                    flex: "1 1 240px",
                    minWidth: 0,
                    wordBreak: "break-all",
                    fontSize: 13,
                    color: "var(--color-navy-700)",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {magicLink}
                </code>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={copyLink} style={smallBtn}>
                    {copied ? "Zkopírováno ✓" : "Kopírovat"}
                  </button>
                  <a href={magicLink} target="_blank" rel="noreferrer" style={smallBtnGhost}>
                    Otevřít ↗
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 24 }}>
            <Link href="/testovani/nazor" style={linkSoft}>
              Až budete hotoví, řekněte nám názor →
            </Link>
          </div>
        </>
      ) : null}

      {/* Step 4 — first answer captured → feedback */}
      {hasAnswer ? (
        <>
          <p style={{ fontSize: "clamp(17px, 1.4vw, 20px)", lineHeight: 1.6, maxWidth: 640 }}>
            Skvělé — máte první odpověď od {who}! Prošli jste test od začátku do konce. Zbývá
            poslední krok: pár otázkami se vás zeptáme na názor.
          </p>
          <div style={{ marginTop: 32 }}>
            <Link href="/testovani/nazor" className="btn btn-gold hero-cta">
              Řekněte nám názor
              <span className="arrow" aria-hidden>
                ↗
              </span>
            </Link>
          </div>
        </>
      ) : null}
    </>
  );
}

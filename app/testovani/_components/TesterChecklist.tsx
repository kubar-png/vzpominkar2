"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { TesterProgress, SendTestQuestionsResult } from "@/lib/testing/state";

const RASPBERRY = "#CF364C";
const NAVY = "#1B2E4D";
const CARD = "#FFFDF3";
const OFFWHITE = "#FEF7D7";
const BORDER = "rgba(27, 46, 77, 0.14)";

interface Props {
  progress: TesterProgress;
  /** Data-URL PNG of the senior's magic link, or null. */
  qrDataUrl: string | null;
  /** Deep link into the real in-app prompt picker, or null if no family yet. */
  promptsHref: string | null;
  /** Foundation server action — schedules 2 questions for TODAY. */
  sendAction: (count?: number) => Promise<SendTestQuestionsResult>;
}

export function TesterChecklist({ progress, qrDataUrl, promptsHref, sendAction }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SendTestQuestionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const account = progress.loggedIn;
  const senior = progress.hasSenior;
  const sent = progress.questionsSent > 0;
  const answered = progress.answersCount > 0;

  const doneFlags = [account, senior, sent, answered, false];
  const activeIndex = doneFlags.findIndex((d) => !d);

  const magicLink = progress.magicLink ?? result?.magicLink ?? null;
  const seniorLabel = progress.seniorName?.trim() || "blízkého";

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const res = await sendAction(2);
      if (res.ok) {
        setResult(res);
        router.refresh();
      } else {
        setError(res.error ?? "Otázky se nepodařilo odeslat. Zkuste to prosím znovu.");
      }
    });
  }

  async function copyLink() {
    if (!magicLink) return;
    try {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is visible for manual copy */
    }
  }

  const steps = [
    { label: "Založte si účet" },
    { label: "Přidejte blízkého" },
    { label: "Pošlete 2 otázky" },
    { label: "Blízký odpoví" },
    { label: "Řekněte nám názor" },
  ];

  return (
    <ol style={{ listStyle: "none", padding: 0, margin: "48px 0 0", display: "grid", gap: 16 }}>
      {steps.map((step, i) => {
        const isDone = doneFlags[i];
        const isActive = i === activeIndex;
        return (
          <li
            key={step.label}
            style={{
              background: CARD,
              border: `1px solid ${isActive ? RASPBERRY : BORDER}`,
              borderRadius: 16,
              padding: "20px 22px",
              boxShadow: isActive ? "0 12px 30px -18px rgba(207,54,76,0.45)" : "none",
              opacity: !isDone && !isActive ? 0.62 : 1,
              transition: "border-color 200ms ease, opacity 200ms ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                aria-hidden
                style={{
                  flex: "0 0 auto",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 600,
                  background: isDone ? RASPBERRY : isActive ? NAVY : "transparent",
                  color: isDone || isActive ? OFFWHITE : "var(--ink-soft)",
                  border: isDone || isActive ? "none" : `1.5px solid ${BORDER}`,
                }}
              >
                {isDone ? <Check size={17} strokeWidth={3} color={OFFWHITE} /> : i + 1}
              </span>
              <h3
                style={{
                  fontSize: 20,
                  margin: 0,
                  color: NAVY,
                  textDecoration: isDone ? "none" : undefined,
                }}
              >
                {step.label}
              </h3>
              {isDone ? (
                <span style={{ marginLeft: "auto", fontSize: 14, color: RASPBERRY, fontWeight: 500 }}>
                  Hotovo
                </span>
              ) : null}
            </div>

            {isActive ? (
              <div style={{ marginTop: 16, paddingLeft: 46 }}>
                {i === 0 ? (
                  <>
                    <p style={{ margin: "0 0 16px" }}>
                      Stačí e-mail a heslo. Hned potom vás provedeme krátkým nastavením.
                    </p>
                    <Link href="/signup?test=1" className="btn btn-gold">
                      Založit účet
                      <span className="arrow" aria-hidden>
                        ↗
                      </span>
                    </Link>
                  </>
                ) : null}

                {i === 1 ? (
                  <>
                    <p style={{ margin: "0 0 16px" }}>
                      Otevřeme vám aplikaci s krátkým průvodcem a přidáte rodiče nebo prarodiče,
                      jehož vzpomínky chcete zachytit. Zadáte jen jméno — žádný účet ani telefon
                      nepotřebují.
                    </p>
                    <Link href="/dashboard" className="btn btn-gold">
                      Přidat blízkého
                      <span className="arrow" aria-hidden>
                        ↗
                      </span>
                    </Link>
                  </>
                ) : null}

                {i === 2 ? (
                  <>
                    <p style={{ margin: "0 0 16px" }}>
                      Pošleme {seniorLabel} dvě otázky rovnou dnes, ať nemusíte čekat na pondělní
                      rozesílku. Potom vám ukážeme odkaz, který mu předáte.
                    </p>
                    <button
                      type="button"
                      className="btn btn-gold"
                      onClick={handleSend}
                      disabled={pending}
                      style={{ opacity: pending ? 0.7 : 1 }}
                    >
                      {pending ? "Odesílám…" : "Poslat 2 otázky teď"}
                      <span className="arrow" aria-hidden>
                        ↗
                      </span>
                    </button>
                    {promptsHref ? (
                      <div style={{ marginTop: 12 }}>
                        <Link
                          href={promptsHref}
                          style={{ fontSize: 14, color: "var(--ink-soft)", textDecoration: "underline" }}
                        >
                          Nebo si otázky vyberte ručně v aplikaci
                        </Link>
                      </div>
                    ) : null}
                    {error ? (
                      <p style={{ marginTop: 12, color: RASPBERRY, fontSize: 14 }}>{error}</p>
                    ) : null}
                  </>
                ) : null}

                {i === 3 ? (
                  <p style={{ margin: 0 }}>
                    Předejte {seniorLabel} odkaz níže. Otevře se bez přihlášení a rovnou může
                    odpovědět hlasem nebo textem. Jakmile odpoví, posuneme vás k poslednímu kroku.
                  </p>
                ) : null}

                {i === 4 ? (
                  <>
                    <p style={{ margin: "0 0 16px" }}>
                      Hotovo — máte za sebou celý koloběh. Řekněte nám prosím, co bylo srozumitelné a
                      co drhlo. Zabere to pár minut.
                    </p>
                    <Link href="/testovani/nazor" className="btn btn-gold">
                      Sdílet názor
                      <span className="arrow" aria-hidden>
                        ↗
                      </span>
                    </Link>
                  </>
                ) : null}
              </div>
            ) : null}

            {/* Magic-link handoff panel — visible under "Blízký odpoví" whenever a
                senior exists, so the tester can pass the link across at any point. */}
            {i === 3 && magicLink ? (
              <MagicLinkPanel
                magicLink={magicLink}
                qrDataUrl={qrDataUrl}
                copied={copied}
                onCopy={copyLink}
                confirmation={
                  result?.ok
                    ? result.scheduled > 0
                      ? `Odeslali jsme ${result.scheduled} ${czQuestions(result.scheduled)}. Předejte odkaz blízkému, může odpovědět hned.`
                      : "Blízký už dostal všechny dostupné otázky. Odkaz níže mu zůstává funkční."
                    : null
                }
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function czQuestions(n: number): string {
  if (n === 1) return "otázku";
  if (n >= 2 && n <= 4) return "otázky";
  return "otázek";
}

function MagicLinkPanel({
  magicLink,
  qrDataUrl,
  copied,
  onCopy,
  confirmation,
}: {
  magicLink: string;
  qrDataUrl: string | null;
  copied: boolean;
  onCopy: () => void;
  confirmation: string | null;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        marginLeft: 46,
        padding: 18,
        borderRadius: 14,
        background: "var(--bg)",
        border: `1px solid ${BORDER}`,
      }}
    >
      {confirmation ? (
        <p style={{ margin: "0 0 14px", color: NAVY, fontWeight: 500 }}>{confirmation}</p>
      ) : null}
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="QR kód s odkazem pro blízkého"
            width={120}
            height={120}
            style={{ borderRadius: 10, border: `1px solid ${BORDER}`, flex: "0 0 auto" }}
          />
        ) : null}
        <div style={{ flex: "1 1 240px", minWidth: 240 }}>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 6 }}>
            Odkaz pro blízkého (bez přihlášení)
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <code
              style={{
                flex: "1 1 200px",
                minWidth: 0,
                overflowWrap: "anywhere",
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 13,
                color: NAVY,
              }}
            >
              {magicLink}
            </code>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-gold" onClick={onCopy}>
              {copied ? "Zkopírováno" : "Zkopírovat odkaz"}
              <span className="arrow" aria-hidden>
                <Copy size={13} color={OFFWHITE} />
              </span>
            </button>
            <a href={magicLink} target="_blank" rel="noreferrer" className="btn btn-outline">
              Otevřít odkaz
              <span className="arrow" aria-hidden>
                <ExternalLink size={13} />
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

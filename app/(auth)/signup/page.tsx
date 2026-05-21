import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Registrace",
  description:
    "Vytvořte si účet a začněte sbírat vzpomínky maminky nebo tatínka. První otázka tento týden.",
};

interface SignupPageProps {
  searchParams: Promise<{ product?: string; gift?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const isBabybook = params.product === "babybook";
  const isGift = params.gift === "1";

  if (isBabybook || isGift) {
    // Log so the variant carries through server-side until we wire it to
    // user metadata in the signup Server Action.
    console.log(
      `[signup] variant — product=${params.product ?? "-"} gift=${params.gift ?? "-"}`,
    );
  }

  return (
    <div className="editorial">
      <section className="auth-shell">
        <div className="auth-card is-wide">
          <span className="auth-eyebrow">
            <span className="roman">I.</span> Začínáme rodinnou kroniku
          </span>

          {isBabybook ? (
            <p
              className="auth-variant-badge"
              style={{
                display: "inline-block",
                marginTop: "0.75rem",
                padding: "0.4rem 0.85rem",
                fontSize: "0.78rem",
                letterSpacing: "0.04em",
                background: "var(--color-paper-200, #f4ecd8)",
                color: "var(--color-navy-900, #16213a)",
                borderRadius: "999px",
              }}
            >
              Začínáte s&nbsp;Babybookem &mdash; knihou prvních let.
            </p>
          ) : null}

          {isGift ? (
            <p
              className="auth-variant-badge"
              style={{
                display: "inline-block",
                marginTop: "0.75rem",
                padding: "0.4rem 0.85rem",
                fontSize: "0.78rem",
                letterSpacing: "0.04em",
                background: "var(--color-paper-200, #f4ecd8)",
                color: "var(--color-navy-900, #16213a)",
                borderRadius: "999px",
              }}
            >
              Registrace pro dárkovou objednávku.
            </p>
          ) : null}

          <h1 className="auth-title">První otázka odejde v&nbsp;pondělí ráno.</h1>
          <p className="auth-lede">
            Stačí pár minut. Otázky vyberete, kontakty zadáte, my se postaráme
            o&nbsp;zbytek — přepis, sazbu, vazbu.
          </p>

          <SignupForm
            product={isBabybook ? "babybook" : undefined}
            gift={isGift}
          />

          <p className="auth-fineprint">
            Pilotní verze — roční přístup zdarma. Vrácení peněz do 30&nbsp;dnů,
            bez výmluv.
          </p>

          <div className="auth-meta">
            <p>
              Už máte účet?{" "}
              <Link href="/login" className="auth-link">
                Přihlaste se
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

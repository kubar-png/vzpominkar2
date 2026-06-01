import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "./signup-form";
import { GoldWordmark } from "@/components/brand/GoldWordmark";
import { priceForProductCzk } from "@/lib/stripe/server";

export const metadata: Metadata = {
  title: "Registrace",
  description:
    "Vytvořte si účet a začněte sbírat vzpomínky maminky nebo tatínka. První otázka tento týden.",
};

interface SignupPageProps {
  searchParams: Promise<{ product?: string; gift?: string }>;
}

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: "1rem",
  padding: "0.4rem 0.85rem",
  fontSize: "0.78rem",
  letterSpacing: "0.04em",
  background: "var(--color-paper-200, #f4ecd8)",
  color: "var(--color-navy-900, #16213a)",
  borderRadius: "999px",
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const isBabybook = params.product === "babybook";
  const isGift = params.gift === "1";
  const basePriceCzk = priceForProductCzk("book_base");

  return (
    <div className="editorial">
      <div className="senior-auth-mobile-bar">
        <GoldWordmark height={24} />
      </div>

      <div className="senior-auth">
        {/* Left: navy editorial pitch (desktop) */}
        <aside className="senior-auth-side">
          <GoldWordmark className="senior-auth-logo" height={30} />
          <div className="senior-auth-pitch">
            <span className="eyebrow">Nový Vzpomínkář</span>
            <h2>
              Začněte
              <br />
              rodinnou knihu.
            </h2>
            <p>
              Pár minut a&nbsp;první otázka může vyrazit za vaším blízkým.
              Přepis, sazbu i&nbsp;vazbu do krásné knihy obstaráme my.
            </p>
          </div>
          <p className="colophon">⁂ &nbsp; Kniha rodinné paměti</p>
        </aside>

        {/* Right: the form */}
        <main className="senior-auth-main">
          <div style={{ width: "100%", maxWidth: 460 }}>
            <span className="auth-eyebrow">Registrace</span>
            <h1 className="auth-title">Vytvořte si účet.</h1>
            <p className="auth-lede">
              Stačí vaše jméno, e-mail a&nbsp;heslo. Pak řeknete, kdo bude
              vyprávět — přístup pro něj připravíte za chvíli v&nbsp;aplikaci.
            </p>

            {isBabybook ? (
              <p style={badgeStyle}>Začínáte s&nbsp;Babybookem &mdash; knihou prvních let.</p>
            ) : null}
            {isGift ? <p style={badgeStyle}>Registrace pro dárkovou objednávku.</p> : null}

            <SignupForm product={isBabybook ? "babybook" : undefined} gift={isGift} />

            <p className="auth-fineprint">
              {basePriceCzk > 0
                ? `Jednorázově ${basePriceCzk.toLocaleString("cs-CZ")} Kč — přístup napořád, bez předplatného.`
                : "Přístup napořád, bez předplatného."}
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
        </main>
      </div>
    </div>
  );
}

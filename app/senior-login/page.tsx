import type { Metadata } from "next";
import { SeniorLoginForm } from "./senior-login-form";
import { GoldWordmark } from "@/components/brand/GoldWordmark";

export const metadata: Metadata = {
  title: "Přihlášení vyprávějícího",
  description:
    "Přihlášení vyprávějícího. Otevřete týdenní otázku a začněte vyprávět.",
};

export default function SeniorLoginPage() {
  return (
    <div className="editorial">
      {/* Mobile-only top bar with logo */}
      <div className="senior-auth-mobile-bar">
        <GoldWordmark height={24} />
      </div>

      <div className="senior-auth">
        {/* ── Left side: navy editorial pitch, desktop only ── */}
        <aside className="senior-auth-side" aria-hidden="false">
          <GoldWordmark className="senior-auth-logo" height={30} />

          <div className="senior-auth-pitch">
            <span className="eyebrow">Vyprávějící</span>
            <h2>
              Váš příběh
              <br />
              čeká.
            </h2>
            <p>
              Rodina pro vás připravila otázku. Stačí se přihlásit&nbsp;—
              ostatní obstará čas a&nbsp;vaše vzpomínky.
            </p>
          </div>

          <p className="colophon">⁂ &nbsp; Kniha rodinné paměti</p>
        </aside>

        {/* ── Right side: large, accessible form ── */}
        <main className="senior-auth-main" data-surface="senior">
          <div className="senior-auth-card">
            <span className="auth-eyebrow">Přihlášení</span>
            <h1 className="auth-title">Vítejte zpátky.</h1>
            <p className="auth-lede">
              Zadejte uživatelské jméno a&nbsp;heslo, které vám rodina
              připravila.
            </p>

            <SeniorLoginForm />

            <p className="auth-meta" style={{ textAlign: "left" }}>
              Zapomněli jste heslo? Požádejte rodinu, aby vám vygenerovala nové.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

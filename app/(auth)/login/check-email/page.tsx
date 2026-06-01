import type { Metadata } from "next";
import Link from "next/link";
import { GoldWordmark } from "@/components/brand/GoldWordmark";

export const metadata: Metadata = {
  title: "Zkontrolujte e-mail",
  description: "Potvrzovací e-mail je na cestě. Zkontrolujte schránku.",
};

export default function CheckEmailPage() {
  return (
    <div className="editorial">
      <div className="senior-auth-mobile-bar">
        <GoldWordmark height={24} />
      </div>

      <div className="senior-auth">
        <aside className="senior-auth-side">
          <GoldWordmark className="senior-auth-logo" height={30} />
          <div className="senior-auth-pitch">
            <span className="eyebrow">Odkaz odeslán</span>
            <h2>
              Podívejte se
              <br />
              do schránky.
            </h2>
            <p>
              Poslali jsme vám přihlašovací odkaz. Stačí na něj kliknout
              a&nbsp;vrátit se sem.
            </p>
          </div>
          <p className="colophon">⁂ &nbsp; Kniha rodinné paměti</p>
        </aside>

        <main className="senior-auth-main">
          <div style={{ width: "100%", maxWidth: 460 }}>
            <span className="auth-eyebrow">Odkaz odeslán</span>
            <h1 className="auth-title">Podívejte se do schránky.</h1>
            <p className="auth-lede">
              Poslali jsme vám přihlašovací odkaz. Stačí na něj kliknout
              a&nbsp;vrátit se sem.
            </p>

            <p className="auth-fineprint">
              Nedorazil? Mrkněte do nevyžádané pošty. Případně se zkuste přihlásit
              znovu — pošleme čerstvý odkaz.
            </p>

            <div className="auth-meta">
              <Link href="/login" className="auth-link">
                Zpět na přihlášení
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

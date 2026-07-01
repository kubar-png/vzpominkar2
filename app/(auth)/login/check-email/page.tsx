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
        <GoldWordmark height={24} tone="offwhite" />
      </div>

      <div className="senior-auth">
        <aside className="senior-auth-side">
          <GoldWordmark className="senior-auth-logo" height={30} tone="offwhite" />
          <div className="senior-auth-pitch">
            <h2>
              E-mail už
              <br />
              letí k vám.
            </h2>
            <p>
              Otevřete ho na počítači i&nbsp;v&nbsp;telefonu — odkaz zůstává
              platný, i&nbsp;když tuto stránku zavřete.
            </p>
          </div>
          <p className="colophon">⁂ &nbsp; Kniha rodinné paměti</p>
        </aside>

        <main className="senior-auth-main">
          <div style={{ width: "100%", maxWidth: 460 }}>
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

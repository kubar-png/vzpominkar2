import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { GoldWordmark } from "@/components/brand/GoldWordmark";

export const metadata: Metadata = {
  title: "Přihlášení",
  description:
    "Přihlášení do účtu Vzpomínkáře. Otevřete e-mail s otázkami a poslechněte vyprávění.",
};

export default function LoginPage() {
  return (
    <div className="editorial">
      <div className="senior-auth-mobile-bar">
        <GoldWordmark height={24} tone="offwhite" />
      </div>

      <div className="senior-auth">
        {/* Left: navy editorial pitch (desktop) */}
        <aside className="senior-auth-side">
          <GoldWordmark className="senior-auth-logo" height={30} tone="offwhite" />
          <div className="senior-auth-pitch">
            <h2>
              Vaše vzpomínky
              <br />
              čekají.
            </h2>
            <p>
              Přihlaste se a&nbsp;pokračujte přesně tam, kde jste skončili —
              ani věta navíc, ani věta míň.
            </p>
          </div>
          <p className="colophon">⁂ &nbsp; Kniha rodinné paměti</p>
        </aside>

        {/* Right: the form */}
        <main className="senior-auth-main">
          <div style={{ width: "100%", maxWidth: 460 }}>
            <h1 className="auth-title">Vítejte zpátky.</h1>
            <p className="auth-lede">
              Zadejte e-mail a&nbsp;heslo, kterými jste se zaregistrovali.
            </p>

            <LoginForm />

            <div className="auth-meta">
              <p>
                Zapomněli jste heslo?{" "}
                <Link href="/login/reset" className="auth-link">
                  Pošleme reset na e-mail
                </Link>
                .
              </p>
              <p>
                Ještě nemáte účet?{" "}
                <Link href="/signup" className="auth-link">
                  Zaregistrujte se
                </Link>
                .
              </p>
              <p>
                Jste senior a dostali jste přihlašovací údaje od rodiny?{" "}
                <Link href="/senior-login" className="auth-link">
                  Použijte přihlášení pro vyprávějící
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

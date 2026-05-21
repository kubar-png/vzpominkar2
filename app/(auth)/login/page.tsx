import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Přihlášení",
  description:
    "Přihlášení do účtu Vzpomínkáře. Otevřete e-mail s otázkami a poslechněte vyprávění.",
};

export default function LoginPage() {
  return (
    <div className="editorial">
      <section className="auth-shell">
        <div className="auth-card">
          <span className="auth-eyebrow">
            <span className="roman">II.</span> Vstup do knihovny
          </span>
          <h1 className="auth-title">Vítejte zpátky.</h1>
          <p className="auth-lede">
            Vaše vzpomínky čekají přesně tam, kde jste je zanechali. Ani věta navíc,
            ani věta míň.
          </p>

          <LoginForm />

          <div className="auth-meta">
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
      </section>
    </div>
  );
}

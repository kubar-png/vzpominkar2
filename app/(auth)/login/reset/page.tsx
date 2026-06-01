import Link from "next/link";
import type { Metadata } from "next";
import { ResetRequestForm } from "./reset-request-form";

export const metadata: Metadata = {
  title: "Reset hesla",
  description:
    "Pošleme vám e-mailem odkaz, kterým si nastavíte nové heslo.",
};

export default function ResetRequestPage() {
  return (
    <div className="editorial">
      <section className="auth-shell">
        <div className="auth-card">
          <span className="auth-eyebrow">Zapomenuté heslo</span>
          <h1 className="auth-title">Pošleme vám odkaz.</h1>
          <p className="auth-lede">
            Zadejte e-mail, kterým jste se registrovali. Pošleme vám odkaz, kterým
            si během pár minut nastavíte nové heslo.
          </p>

          <ResetRequestForm />

          <div className="auth-meta">
            <p>
              Vzpomněli jste si?{" "}
              <Link href="/login" className="auth-link">
                Zpět na přihlášení
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

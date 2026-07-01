import Link from "next/link";
import type { Metadata } from "next";
import { ResetRequestForm } from "./reset-request-form";
import { GoldWordmark } from "@/components/brand/GoldWordmark";

export const metadata: Metadata = {
  title: "Reset hesla",
  description:
    "Pošleme vám e-mailem odkaz, kterým si nastavíte nové heslo.",
};

export default function ResetRequestPage() {
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
              Nové heslo
              <br />
              za pár minut.
            </h2>
            <p>
              Zadejte e-mail, kterým jste se registrovali — během pár minut
              si nastavíte nové heslo.
            </p>
          </div>
          <p className="colophon">⁂ &nbsp; Kniha rodinné paměti</p>
        </aside>

        <main className="senior-auth-main">
          <div style={{ width: "100%", maxWidth: 460 }}>
            <h1 className="auth-title">Pošleme vám odkaz.</h1>
            <p className="auth-lede">
              Zadejte e-mail, kterým jste se registrovali. Pošleme vám odkaz,
              kterým si během pár minut nastavíte nové heslo.
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
        </main>
      </div>
    </div>
  );
}

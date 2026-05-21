import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Registrace" };

export default function SignupPage() {
  return (
    <div className="editorial">
      <section className="auth-shell">
        <div className="auth-card is-wide">
          <span className="auth-eyebrow">
            <span className="roman">I.</span> Začínáme rodinnou kroniku
          </span>
          <h1 className="auth-title">První otázka odejde v&nbsp;pondělí ráno.</h1>
          <p className="auth-lede">
            Stačí pár minut. Otázky vyberete, kontakty zadáte, my se postaráme
            o&nbsp;zbytek — přepis, sazbu, vazbu.
          </p>

          <SignupForm />

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

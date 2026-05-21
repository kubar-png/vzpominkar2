import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Zkontrolujte e-mail",
  description: "Potvrzovací e-mail je na cestě. Zkontrolujte schránku.",
};

export default function CheckEmailPage() {
  return (
    <div className="editorial">
      <section className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-status-mark" aria-hidden>
            ✉
          </div>

          <span
            className="auth-eyebrow"
            style={{ justifyContent: "center", display: "inline-flex" }}
          >
            Odkaz odeslán
          </span>
          <h1 className="auth-title">Podívejte se do schránky.</h1>
          <p className="auth-lede">
            Poslali jsme vám přihlašovací odkaz. Stačí na něj kliknout
            a&nbsp;vrátit se sem.
          </p>

          <div className="auth-fleuron" aria-hidden>
            <span>⁂</span>
          </div>

          <p className="auth-fineprint" style={{ textAlign: "center" }}>
            Nedorazil? Mrkněte do nevyžádané pošty. Případně se zkuste přihlásit
            znovu — pošleme čerstvý odkaz.
          </p>

          <div className="auth-meta" style={{ textAlign: "center" }}>
            <Link href="/login" className="auth-back">
              Zpět na přihlášení
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

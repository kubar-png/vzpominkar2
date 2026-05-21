import Link from "next/link";
import type { Metadata } from "next";
import { SectionEyebrow } from "@/components/landing/Editorial";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Přihlášení" };

export default function LoginPage() {
  return (
    <section className="mx-auto grid min-h-[70svh] max-w-[var(--container-wide)] items-center gap-16 px-6 py-16 lg:grid-cols-[1fr_1fr] sm:py-24">
      {/* Left - quiet foyer copy */}
      <div className="hidden lg:block">
        <SectionEyebrow>Vstup do knihovny</SectionEyebrow>
        <h2
          className="mt-5 max-w-[18ch] font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.1] tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Vítejte zpátky k&nbsp;rodinné kronice.
        </h2>
        <p className="mt-6 max-w-[40ch] font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text-muted)]">
          Vaše vzpomínky čekají přesně tam, kde jste je zanechali.
          Ani věta navíc, ani věta míň.
        </p>
        <div className="mt-12 border-t border-[var(--color-border-strong)] pt-8 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>
            Jste senior a dostali jste přihlašovací údaje od rodiny?{" "}
            <Link
              href="/senior-login"
              className="text-[var(--color-navy-800)] underline-offset-4 hover:underline"
            >
              Použijte přihlášení pro vyprávějící
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Right - form */}
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-normal tracking-tight text-[var(--color-ink-900)] sm:text-3xl">
          Přihlášení
        </h1>
        <p className="mt-3 text-base text-[var(--color-text-muted)]">
          Pošleme vám e-mailem odkaz, který vás přihlásí.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>

        <div className="mt-10 border-t border-[var(--color-border-strong)] pt-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>
            Ještě nemáte účet?{" "}
            <Link
              href="/signup"
              className="text-[var(--color-navy-800)] underline-offset-4 hover:underline"
            >
              Zaregistrujte se
            </Link>
            .
          </p>
          <p className="mt-2 lg:hidden">
            Jste senior?{" "}
            <Link
              href="/senior-login"
              className="text-[var(--color-navy-800)] underline-offset-4 hover:underline"
            >
              Přihlášení pro vyprávějící
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

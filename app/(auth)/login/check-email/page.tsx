import type { Metadata } from "next";
import Link from "next/link";
import { SectionEyebrow } from "@/components/landing/Editorial";

export const metadata: Metadata = { title: "Zkontrolujte e-mail" };

export default function CheckEmailPage() {
  return (
    <section className="mx-auto flex min-h-[60svh] max-w-xl items-center px-6 py-20 text-center">
      <div className="w-full">
        <SectionEyebrow className="mx-auto">Odkaz odeslán</SectionEyebrow>
        <h1
          className="mt-5 font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.1] tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          Podívejte se do e-mailové schránky.
        </h1>
        <p className="mx-auto mt-6 max-w-prose font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text-muted)]">
          Poslali jsme vám přihlašovací odkaz. Stačí na něj kliknout
          a&nbsp;vrátit se sem.
        </p>
        <p className="mx-auto mt-5 max-w-prose text-sm leading-relaxed text-[var(--color-text-subtle)]">
          Nedorazil? Mrkněte do nevyžádané pošty. Případně se zkuste přihlásit
          znovu - pošleme čerstvý odkaz.
        </p>

        <div className="mt-10 border-t border-[var(--color-border-strong)] pt-8">
          <Link
            href="/login"
            className="font-[family-name:var(--font-display)] text-base text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
          >
            ← Zpět na přihlášení
          </Link>
        </div>
      </div>
    </section>
  );
}

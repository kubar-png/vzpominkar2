import Link from "next/link";
import type { Metadata } from "next";
import { SectionEyebrow } from "@/components/landing/Editorial";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Registrace" };

export default function SignupPage() {
  return (
    <section className="mx-auto grid min-h-[70svh] max-w-[var(--container-wide)] items-center gap-16 px-6 py-16 lg:grid-cols-[1fr_1fr] sm:py-24">
      {/* Left - what they're signing up for */}
      <div className="hidden lg:block">
        <SectionEyebrow numeral="I">Začínáme rodinnou kroniku</SectionEyebrow>
        <h2
          className="mt-5 max-w-[20ch] font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.1] tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
          style={{ textWrap: "balance" }}
        >
          První otázka odejde v&nbsp;pondělí ráno.
        </h2>
        <p className="mt-6 max-w-[42ch] font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text-muted)]">
          Stačí pár minut. Otázky vyberete, kontakty zadáte, my se postaráme
          o&nbsp;zbytek - přepis, sazbu, vazbu.
        </p>

        {/* Proof rail - real testimonial + Heuréka + press + guarantee */}
        <figure className="mt-12 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-navy-50)] p-6">
          <blockquote className="font-[family-name:var(--font-display)] text-base italic leading-relaxed text-[var(--color-ink-900)]">
            &bdquo;Máma by si to nikdy sama nesepsala. Takhle je to o&nbsp;tolik
            jednodušší - a&nbsp;mám její hlas navždy.&ldquo;
          </blockquote>
          <figcaption className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            - Tereza H., Praha
          </figcaption>
        </figure>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <span className="font-medium tnum-old text-[var(--color-ink-900)]">4,9</span>
            <span>★ na Heuréce</span>
          </span>
          <span aria-hidden className="text-[var(--color-paper-400)]">·</span>
          <span>Forbes · HN · ČRo</span>
        </div>

        <ul className="mt-8 space-y-3 text-sm text-[var(--color-text-muted)]">
          <li className="flex items-baseline gap-3">
            <span className="text-[var(--color-red-700)]">·</span>
            Pilotní verze - roční přístup zdarma.
          </li>
          <li className="flex items-baseline gap-3">
            <span className="text-[var(--color-red-700)]">·</span>
            Vrácení peněz do 30&nbsp;dnů, bez výmluv.
          </li>
          <li className="flex items-baseline gap-3">
            <span className="text-[var(--color-red-700)]">·</span>
            Tištěnou knihu objednáte, až bude hotová.
          </li>
        </ul>
      </div>

      {/* Right - form */}
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-normal tracking-tight text-[var(--color-ink-900)] sm:text-3xl">
          Vytvořit účet
        </h1>
        <p className="mt-3 text-base text-[var(--color-text-muted)]">
          Začněte zdarma. Knihu zaplatíte, až ji budete chtít vytisknout.
        </p>

        <div className="mt-8">
          <SignupForm />
        </div>

        <p className="mt-10 border-t border-[var(--color-border-strong)] pt-6 text-sm text-[var(--color-text-muted)]">
          Už máte účet?{" "}
          <Link
            href="/login"
            className="text-[var(--color-navy-800)] underline-offset-4 hover:underline"
          >
            Přihlaste se
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

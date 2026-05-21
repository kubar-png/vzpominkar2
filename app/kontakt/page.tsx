import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Napište nám, zavolejte, nebo pošlete poštou. Odpovídá člověk, ne robot.",
};

const CHANNELS = [
  {
    eyebrow: "Nejrychlejší",
    label: "E-mail",
    value: "ahoj@vzpominkar.cz",
    href: "mailto:ahoj@vzpominkar.cz",
    body:
      "Odpovídáme do jednoho pracovního dne, většinou do hodiny. Hodí se, když máte konkrétní dotaz k účtu nebo objednávce.",
  },
  {
    /* TODO: doplnit reálné telefonní číslo */
    eyebrow: "Po telefonu",
    label: "Telefon",
    value: "Telefonní podpora — připravujeme",
    href: null as string | null,
    body:
      "Telefonní linku spouštíme krátce po pilotu. Mezitím napište e-mailem — odpovídáme do hodiny v pracovní době.",
  },
  {
    /* TODO: doplnit reálnou adresu sídla před spuštěním */
    eyebrow: "Osobně",
    label: "Adresa",
    value: "Sídlo — doplníme před spuštěním",
    href: null as string | null,
    body:
      "Adresu redakce zveřejníme s ostrým spuštěním. Pokud nás potřebujete potkat dřív, napište a domluvíme se.",
  },
  {
    /* TODO: doplnit IČO, DIČ a fakturační adresu po založení s.r.o. */
    eyebrow: "Poštou",
    label: "Fakturační údaje",
    value: "Firemní údaje — připravujeme",
    href: null as string | null,
    body:
      "Po dokončení zápisu do obchodního rejstříku tu najdete IČO, DIČ i fakturační adresu pro zaslání rukopisů a poštovních zásilek.",
  },
];

export default function KontaktPage() {
  return (
    <Shell>
      {/* Hero */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pt-20 pb-16 text-center sm:pt-28">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
          <span className="mr-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-500)]" />
          Kontakt
          <span className="ml-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-500)]" />
        </p>
        <h1
          className="heritage-press mx-auto mt-8 max-w-[20ch] font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.05] tracking-tight text-[var(--color-navy-900)] sm:text-6xl"
          style={{ textWrap: "balance" }}
        >
          Pište. Volejte. <em>Nebo nás potkejte.</em>
        </h1>
        <p className="mx-auto mt-7 max-w-[52ch] font-[family-name:var(--font-display)] text-lg italic leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
          Odpovídá vám člověk z&nbsp;malé pražské party, ne chatbot.
          A&nbsp;ano, čteme každou zprávu &mdash; i&nbsp;tu, která začíná
          „Vaše stránka se mi nelíbí, protože&hellip;“.
        </p>
      </section>

      {/* Channels grid */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pb-24">
        <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {CHANNELS.map((c, i) => (
            <li key={c.label} data-reveal>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-red-700)]">
                {String(i + 1).padStart(2, "0")} &nbsp;·&nbsp; {c.eyebrow}
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy-900)] sm:text-3xl">
                {c.label}
              </p>
              {c.href ? (
                <a
                  href={c.href}
                  className="mt-3 inline-block font-[family-name:var(--font-display)] text-xl italic text-[var(--color-navy-800)] underline underline-offset-[6px] decoration-[var(--color-gold-500)] hover:text-[var(--color-navy-900)]"
                >
                  {c.value}
                </a>
              ) : (
                <p className="mt-3 font-[family-name:var(--font-display)] text-xl italic text-[var(--color-navy-900)]">
                  {c.value}
                </p>
              )}
              <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-[var(--color-text-muted)]">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Founder note — navy chord */}
      <section className="bg-[var(--color-navy-900)] py-24 text-[var(--color-paper-100)] sm:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center" data-reveal>
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-gold-400)]">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-[var(--color-gold-400)]" />
            Slibujeme jen tohle
            <span className="ml-3 inline-block h-px w-8 align-middle bg-[var(--color-gold-400)]" />
          </p>
          <p
            className="mt-8 font-[family-name:var(--font-display)] text-2xl italic leading-snug text-[var(--color-paper-50)] sm:text-3xl"
            style={{ textWrap: "balance" }}
          >
            &bdquo;Když napíšete, odpovíme do druhého rána. Když zavoláte,
            zvedneme. Když pošlete dopis, přečteme ho a&nbsp;napíšeme zpátky
            &mdash; rukou, na kartě.&ldquo;
          </p>
          <p className="mt-8 font-[family-name:var(--font-script)] text-5xl leading-none text-[var(--color-paper-100)]" aria-hidden>
            Jakub Š.
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.32em] text-[var(--color-paper-400)]">
            <span className="sr-only">Jakub Š., </span>zakladatel
          </p>
        </div>
      </section>

      {/* Quick links */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-20 text-center">
        <div data-reveal>
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-gold-500)]">
            Než nám napíšete
          </p>
          <h2
            className="heritage-press mx-auto mt-6 max-w-[26ch] font-[family-name:var(--font-display)] text-3xl font-medium leading-snug text-[var(--color-navy-900)] sm:text-4xl"
            style={{ textWrap: "balance" }}
          >
            Možná najdete odpověď <em>rychleji sami</em>.
          </h2>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <li>
              <Link
                href="/faq"
                className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
              >
                Časté otázky →
              </Link>
            </li>
            <li>
              <Link
                href="/jak-to-funguje"
                className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
              >
                Jak to funguje →
              </Link>
            </li>
            <li>
              <Link
                href="/cenik"
                className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
              >
                Ceník →
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </Shell>
  );
}

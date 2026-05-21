import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dárkový certifikát",
  description:
    "Tištěný dárkový certifikát pro maminku, tatínka nebo prarodiče. Vyberete den, kdy odejde první otázka, a vzkaz na kartu.",
};

const VARIANTS = [
  {
    eyebrow: "Klasik",
    title: "Tištěný certifikát",
    price: "0 Kč",
    perks: [
      "PDF s krásnou sazbou ke stažení",
      "Vytisknete doma na A5 papír",
      "Zalomení s prostorem na vlastní vzkaz",
      "K dispozici hned po objednávce",
    ],
    primary: false,
  },
  {
    eyebrow: "Slavnostní",
    title: "Krémové dárkové balení",
    price: "+ 290 Kč",
    perks: [
      "Tištěná A5 karta na krémovém papíře",
      "Kožená obálka s razbou a tkanicí",
      "Ručně psaná pohlednice s vaším vzkazem",
      "Doručíme do 3 pracovních dnů (ČR)",
    ],
    primary: true,
  },
];

const FIELDS = [
  {
    n: "01",
    h: "Komu certifikát patří",
    body:
      "Jméno a křestní oslovení obdarovaného. To, jak ho oslovují vnoučata. „Babi Marie“, „dědo Karle“, „mami“ — jak je vám blízké.",
  },
  {
    n: "02",
    h: "Datum, kdy první otázka odejde",
    body:
      "Den, který chcete. Vánoce, narozeniny, výročí — nebo libovolná středa. První otázka odchází tu pondělí ráno v 10:00.",
  },
  {
    n: "03",
    h: "Krátký vzkaz",
    body:
      "Pár vět, které se otisknou do certifikátu pod obrázek. Větu z dětství, oblíbenou pasáž z písničky, vlastní slib.",
  },
  {
    n: "04",
    h: "Kdo dárek dává",
    body:
      "Vaše jméno (nebo „od celé rodiny“). Otiskne se rukou na certifikát — písmem, které vypadá jako pero, ne tisk.",
  },
];

export default function CertifikatPage() {
  return (
    <Shell>
      {/* Hero */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pt-20 pb-16 text-center sm:pt-28">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
          <span className="mr-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-500)]" />
          Dárkový certifikát
          <span className="ml-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-500)]" />
        </p>
        <h1
          className="heritage-press mx-auto mt-8 max-w-[22ch] font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.05] tracking-tight text-[var(--color-navy-900)] sm:text-6xl"
          style={{ textWrap: "balance" }}
        >
          Karta v obálce, <em>která začíná celý rok vyprávění</em>.
        </h1>
        <p className="mx-auto mt-7 max-w-[52ch] font-[family-name:var(--font-display)] text-lg italic leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
          Vyberete den, kdy první otázka odejde. Napíšete vzkaz. Předáte při
          slavnostní chvíli. Zbytek roku už řešíme my.
        </p>
      </section>

      {/* Two variants */}
      <section className="bg-[var(--color-surface)] py-24 sm:py-28">
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
              Vyberte balení
            </p>
            <h2
              className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Dvě varianty. <em>Stejně jedinečný dárek.</em>
            </h2>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {VARIANTS.map((v) => (
              <article
                key={v.title}
                data-reveal
                className={
                  v.primary
                    ? "relative rounded-[var(--radius-2xl)] bg-[var(--color-navy-900)] p-10 text-[var(--color-paper-100)] shadow-[var(--shadow-xl)]"
                    : "relative rounded-[var(--radius-2xl)] bg-[var(--color-bg)] p-10 text-[var(--color-text)] ring-1 ring-[var(--color-border-strong)]"
                }
              >
                {v.primary && (
                  <div
                    aria-hidden
                    className="absolute -top-3 left-10 rounded-[var(--radius-xs)] bg-[var(--color-gold-500)] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[var(--color-navy-900)]"
                  >
                    Doporučujeme
                  </div>
                )}
                <p
                  className={
                    v.primary
                      ? "text-[10px] uppercase tracking-[0.32em] text-[var(--color-gold-300)]"
                      : "text-[10px] uppercase tracking-[0.32em] text-[var(--color-red-700)]"
                  }
                >
                  {v.eyebrow}
                </p>
                <h3
                  className={
                    v.primary
                      ? "mt-3 font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--color-paper-50)] sm:text-4xl"
                      : "mt-3 font-[family-name:var(--font-display)] text-3xl font-medium text-[var(--color-navy-900)] sm:text-4xl"
                  }
                >
                  {v.title}
                </h3>
                <p
                  className={
                    v.primary
                      ? "mt-4 font-[family-name:var(--font-display)] text-5xl font-medium text-[var(--color-paper-50)]"
                      : "mt-4 font-[family-name:var(--font-display)] text-5xl font-medium text-[var(--color-navy-900)]"
                  }
                >
                  {v.price}
                </p>
                <p
                  className={
                    v.primary
                      ? "mt-2 text-sm text-[var(--color-paper-300)]"
                      : "mt-2 text-sm text-[var(--color-text-muted)]"
                  }
                >
                  {v.primary
                    ? "K ceně ročního přístupu."
                    : "Zdarma k ročnímu přístupu."}
                </p>
                <ul
                  className={
                    v.primary
                      ? "mt-8 space-y-3 border-t border-[var(--color-navy-700)] pt-6 text-base text-[var(--color-paper-200)]"
                      : "mt-8 space-y-3 border-t border-[var(--color-border-strong)] pt-6 text-base text-[var(--color-text-muted)]"
                  }
                >
                  {v.perks.map((p) => (
                    <li key={p} className="flex items-baseline gap-3">
                      <span
                        aria-hidden
                        className={
                          v.primary
                            ? "translate-y-[1px] text-[var(--color-gold-400)]"
                            : "translate-y-[1px] text-[var(--color-gold-500)]"
                        }
                      >
                        ✦
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup?gift=1"
                  className={
                    v.primary
                      ? "mt-10 inline-flex items-center justify-center rounded-full bg-[var(--color-gold-500)] px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-navy-900)] transition-colors hover:bg-[var(--color-gold-400)]"
                      : "mt-10 inline-flex items-center justify-center rounded-full bg-[var(--color-navy-900)] px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-paper-50)] transition-colors hover:bg-[var(--color-navy-800)]"
                  }
                >
                  Vybrat tuto variantu
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll fill in */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-[1fr_2fr]">
          <div data-reveal>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
              Co po vás chceme
            </p>
            <h2
              className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Čtyři pole. <em>Pět minut vašeho času.</em>
            </h2>
            <p className="mt-6 max-w-prose text-base leading-relaxed text-[var(--color-text-muted)]">
              Žádné dlouhé formuláře. Stačí to, co opravdu potřebujeme.
            </p>
          </div>

          <dl className="space-y-10">
            {FIELDS.map((f) => (
              <div key={f.n} data-reveal>
                <dt>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-red-700)]">
                    {f.n}
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy-900)]">
                    {f.h}
                  </p>
                </dt>
                <dd className="mt-3 max-w-[60ch] text-base leading-relaxed text-[var(--color-text-muted)]">
                  {f.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Guarantee */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-20">
        <div className="mx-auto max-w-3xl text-center" data-reveal>
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-gold-500)]">
            Naše záruka
          </p>
          <h2
            className="heritage-press mx-auto mt-6 max-w-[24ch] font-[family-name:var(--font-display)] text-3xl font-medium leading-snug text-[var(--color-navy-900)] sm:text-4xl"
            style={{ textWrap: "balance" }}
          >
            Pokud se obdarovaný nerozpovídá, vrátíme peníze do 30&nbsp;dnů.
          </h2>
          <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--color-text-muted)]">
            Vyzkoušejte první týdny v klidu. Pokud zjistíte, že to není
            pro vaši rodinu, napište nám &mdash; vrátíme peníze, žádné výmluvy,
            žádné otázky.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <Link href="/signup?gift=1" className={buttonVariants({ size: "lg" })}>
              Začít s certifikátem
            </Link>
            <Link
              href="/darek"
              className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
            >
              Zpět na přehled dárků →
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}

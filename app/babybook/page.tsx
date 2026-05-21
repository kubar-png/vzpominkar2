import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { buttonVariants } from "@/components/ui/button";
import { Placeholder } from "@/components/shared/Placeholder";

export const metadata: Metadata = {
  title: "Babybook — kniha prvních let",
  description:
    "Týdenní otázky pro rodiče malých dětí. Zapisujte první slova, krůčky a směšné věty. Kniha, kterou předáte dítěti, až bude dospělé.",
};

const CHAPTERS = [
  {
    n: "I",
    eyebrow: "Měsíce 0–6",
    h: "První všechno",
    items: [
      "Co jste cítili, když jste ho/ji poprvé drželi v náručí?",
      "Jak vypadala vaše první noc bez spánku?",
      "Co vám táta nebo máma řekli, když se narodil/a?",
      "Jaký zvuk dělala, když chtěla pít?",
    ],
  },
  {
    n: "II",
    eyebrow: "Měsíce 6–18",
    h: "První slova a krůčky",
    items: [
      "Které bylo její první srozumitelné slovo?",
      "Kdy poprvé sama udělala krok?",
      "Co byla její nejoblíbenější písnička před spaním?",
      "Jakou věc nesla všude s sebou?",
    ],
  },
  {
    n: "III",
    eyebrow: "Roky 2–4",
    h: "Vlastní názor na svět",
    items: [
      "Co byla její první „vlastní“ věta, která vás dostala?",
      "Komu se nejvíc smála a proč?",
      "Co odmítala jíst, ať dělali rodiče cokoliv?",
      "Jaká byla její vysněná profese ve čtyřech?",
    ],
  },
  {
    n: "IV",
    eyebrow: "Roky 4+",
    h: "Vlastní příběhy",
    items: [
      "Co byla první samostatná noc bez rodičů?",
      "Kdo byl její první nejlepší kamarád/ka?",
      "Jakou historku v rodině vyprávíme dodnes?",
      "Co byste si přáli, aby si pamatovala z dětství?",
    ],
  },
];

const DIFFERENCES = [
  {
    h: "Otázky pro vás, ne pro dítě",
    body:
      "Klasický Vzpomínkář se ptá maminky nebo dědy. Babybook se ptá vás, mladých rodičů. Dítě v knize bude — jako hrdina příběhu, ne jako autor.",
  },
  {
    h: "Rychlejší tempo na začátku",
    body:
      "První rok přijdou otázky každé pondělí (děti rostou rychle a vzpomínky vyblednou ještě rychleji). Druhý rok přepneme na jedna otázka za dva týdny.",
  },
  {
    h: "Místo na fotky a kresby",
    body:
      "Babybook má v sazbě širší prostor pro obrázky — fotky z porodnice, první kresba pastelkou, otisk dlaně. Dvojstrana pro jeden moment.",
  },
  {
    h: "Kniha předaná v dospělosti",
    body:
      "Knihu tisknete, až dítě dospívá (18, 25, ke svatbě, k narození vlastního dítěte). Dárek, který nikdo neumí koupit v obchodě.",
  },
];

export default function BabybookPage() {
  return (
    <Shell>
      {/* Hero */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pt-20 pb-16 sm:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-500)]" />
              Babybook
            </p>
            <h1
              className="heritage-press mt-8 max-w-[20ch] font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.05] tracking-tight text-[var(--color-navy-900)] sm:text-6xl"
              style={{ textWrap: "balance" }}
            >
              Kniha prvních let, <em>na kterou si vzpomenete za třicet</em>.
            </h1>
            <p className="mt-7 max-w-[54ch] font-[family-name:var(--font-display)] text-lg italic leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
              Týdenní otázky pro rodiče malých dětí. Zapisujte první slova,
              krůčky, směšné věty &mdash; než vyblednou. Až bude dospělé,
              dáte mu knihu, kterou si nikdy nikdo nekoupí v obchodě.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="/signup?product=babybook"
                className={buttonVariants({ size: "lg" })}
              >
                Začít zdarma
              </Link>
              <Link
                href="#ukazka"
                className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
              >
                Ukázka otázek →
              </Link>
            </div>

            {/* Trust trio */}
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-[var(--color-border)] pt-5">
              {[
                { k: "1×", v: "týdně otázka" },
                { k: "180+", v: "otázek v knihovně" },
                { k: "18 let", v: "knihu uchováváme" },
              ].map((m) => (
                <div key={m.v}>
                  <div className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-navy-800)] sm:text-2xl">
                    {m.k}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                    {m.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal>
            <div className="relative">
              <Placeholder
                kind="image"
                w={640}
                h={780}
                aspect="640/780"
                label="Otevřený babybook s fotkou"
                tone="navy"
              />
              <div className="absolute -bottom-6 -left-6 max-w-[260px] rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)]">
                <p className="font-[family-name:var(--font-display)] text-sm leading-snug text-[var(--color-navy-900)]">
                  {"„Otevřeli jsme babybook k jejím osmnáctým. Slzela tři kapitoly v kuse.“"}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">
                  — Markéta · maminka
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample questions by chapter */}
      <section id="ukazka" className="bg-[var(--color-surface)] py-24 sm:py-28">
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
              Ukázka otázek
            </p>
            <h2
              className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Čtyři kapitoly. <em>Roky 0 až 5.</em>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[var(--color-text-muted)]">
              Otázky se mění s tím, jak dítě roste. Z prvního „mám tě“
              k vlastním názorům na svět.
            </p>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-2">
            {CHAPTERS.map((ch) => (
              <article
                key={ch.n}
                data-reveal
                className="rounded-[var(--radius-lg)] bg-[var(--color-bg)] p-8 ring-1 ring-[var(--color-border)] sm:p-10"
              >
                <div className="flex items-baseline gap-5">
                  <span className="font-[family-name:var(--font-display)] text-4xl font-medium leading-none text-[var(--color-gold-500)] sm:text-5xl">
                    {ch.n}
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-red-700)]">
                      {ch.eyebrow}
                    </p>
                    <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy-900)] sm:text-3xl">
                      {ch.h}
                    </h3>
                  </div>
                </div>
                <ol className="mt-7 space-y-4 border-t border-[var(--color-border-strong)] pt-6 text-base leading-relaxed text-[var(--color-text-muted)]">
                  {ch.items.map((q, i) => (
                    <li key={q} className="flex gap-4">
                      <span className="shrink-0 text-sm italic text-[var(--color-text-subtle)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Differences from main product */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-24 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_2fr]">
          <div data-reveal>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
              Čím se liší
            </p>
            <h2
              className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Stejný formát, <em>úplně jiný účel</em>.
            </h2>
            <p className="mt-6 max-w-prose text-base leading-relaxed text-[var(--color-text-muted)]">
              Pokud chcete sbírat vzpomínky maminky nebo dědy, podívejte se na{" "}
              <Link href="/" className="text-[var(--color-navy-800)] underline-offset-4 hover:underline">
                klasický Vzpomínkář
              </Link>
              .
            </p>
          </div>

          <dl className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {DIFFERENCES.map((d) => (
              <div key={d.h} data-reveal>
                <dt>
                  <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy-900)]">
                    {d.h}
                  </p>
                </dt>
                <dd className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
                  {d.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Founder note */}
      <section className="bg-[var(--color-navy-900)] py-28 text-[var(--color-paper-100)] sm:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center" data-reveal>
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-gold-400)]">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-[var(--color-gold-400)]" />
            Proč jsme babybook přidali
            <span className="ml-3 inline-block h-px w-8 align-middle bg-[var(--color-gold-400)]" />
          </p>
          <p
            className="mt-8 font-[family-name:var(--font-display)] text-2xl italic leading-snug text-[var(--color-paper-50)] sm:text-3xl"
            style={{ textWrap: "balance" }}
          >
            &bdquo;Když se mi narodila dcera, řešili jsme, jak budeme zapisovat
            první rok. Druhý týden po porodu jsme měli sešit. Pátý týden už ne.
            Babybook je sešit, který si pamatuje sám.&ldquo;
          </p>
          <p className="mt-8 font-[family-name:var(--font-script)] text-5xl leading-none text-[var(--color-paper-100)]" aria-hidden>
            Jakub Š.
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.32em] text-[var(--color-paper-400)]">
            <span className="sr-only">Jakub Š., </span>zakladatel
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-28 text-center">
        <div data-reveal>
          <h2
            className="heritage-press mx-auto max-w-[24ch] font-[family-name:var(--font-display)] text-4xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-5xl"
            style={{ textWrap: "balance" }}
          >
            Začněte, dokud si první slova <em>ještě pamatujete</em>.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <Link href="/signup?product=babybook" className={buttonVariants({ size: "lg" })}>
              Začít zdarma
            </Link>
            <Link
              href="/cenik"
              className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
            >
              Ceník →
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}

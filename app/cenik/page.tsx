import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { buttonVariants } from "@/components/ui/button";
import {
  Fleuron,
  SectionEyebrow,
  editorialHeadingClass,
} from "@/components/landing/Editorial";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ceník",
  description:
    "Jedna platba ročně, žádné předplatné. Tištěnou knihu zaplatíte, až bude vzpomínek dost.",
};

const PRICE_YEARLY = Number(process.env.PRICE_YEARLY_ACCESS_CZK ?? "0");
const PRICE_BOOK = Number(process.env.PRICE_BOOK_PRINT_CZK ?? "0");

function formatCzk(n: number): string {
  if (n === 0) return "Zdarma";
  return `${n.toLocaleString("cs-CZ")} Kč`;
}

const INCLUDED = [
  {
    h: "Týdenní otázky",
    body: "Každé pondělí ráno přijde rodiči SMS nebo e-mail s jednou otázkou. Žádné účty, žádná aplikace.",
  },
  {
    h: "Hlasové i textové odpovědi",
    body: "Stačí jedno tlačítko a rodič nahraje odpověď. Pokud raději píše, odpoví textem. I starý telefon stačí.",
  },
  {
    h: "Automatický přepis",
    body: "Hlasové nahrávky převedeme do textu. Korektor vyhladí věty, ale ponechá způsob, jakým to rodič řekl.",
  },
  {
    h: "Online knihovna pro rodinu",
    body: "Vy a vaši sourozenci máte přístup do společné knihovny. Můžete přidat fotky, poznámky, schvalovat kapitoly.",
  },
];

const ADDONS: ReadonlyArray<readonly [string, string]> = [
  ["Druhý výtisk pro sourozence", "od 1 290 Kč"],
  ["Kožená edice - ručně vázaná", "+ 1 800 Kč"],
  ["Dárkové balení s certifikátem", "+ 290 Kč"],
  ["Doručení mimo ČR", "od 350 Kč"],
];

const FAQ_EXCERPT = [
  {
    q: "Jak dlouho trvá, než kniha vznikne?",
    a: "V průměru 9-12 měsíců. Záleží jen na tom, kolik otázek si vyberete a v jakém tempu rodič odpovídá. Online knihovna roste průběžně - knihu si objednáte, až bude hotová.",
  },
  {
    q: "Co když rodič přestane odpovídat?",
    a: "Pošleme jemnou připomínku. Pokud delší dobu mlčí, zavoláme nebo napíšeme a zeptáme se, jak pomoci. Zaplacený rok je váš, ať se rozpovídá kdykoliv.",
  },
  {
    q: "Můžu si odpovědi sám/sama upravit?",
    a: "Ano. V rodinném editoru vidíte přepis, doplníte fotku, opravíte překlep. Nic ale není povinné - kniha funguje i bez vašeho zásahu.",
  },
];

export default function PricingPage() {
  return (
    <Shell>
      {/* ── 1. Hero ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pt-16 pb-14 text-center sm:pt-24 sm:pb-16">
        <SectionEyebrow numeral="I" className="mx-auto">
          Ceník
        </SectionEyebrow>
        <h1
          className="mx-auto mt-5 max-w-[20ch] font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.08] tracking-tight text-[var(--color-ink-900)] sm:text-5xl"
          style={{ textWrap: "balance" }}
        >
          Jedna platba. Žádné předplatné.
        </h1>
        <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
          Roční přístup do knihovny máte v ceně. Tištěnou knihu si objednáváte
          až tehdy, kdy víte, že je hotová.
        </p>
      </section>

      {/* ── 2. Pricing chapter - navy ─────────────────────────────────── */}
      <section className="bg-[var(--color-navy-900)] py-20 text-[var(--color-paper-100)] sm:py-28">
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Plan card */}
            <div
              data-reveal
              className="group relative rounded-[var(--radius-2xl)] bg-white p-10 text-[var(--color-text)] shadow-[var(--shadow-xl)] ring-1 ring-black/[0.05] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-[var(--radius-2xl)] before:bg-[var(--color-red-700)] before:content-['']"
            >
              <div
                aria-hidden
                className="absolute -top-3 left-10 rounded-[var(--radius-xs)] bg-[var(--color-red-700)] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white"
              >
                Pilotní verze
              </div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">
                Roční plán
              </p>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-[family-name:var(--font-display)] tnum-old text-6xl font-normal tracking-tight text-[var(--color-navy-900)] sm:text-7xl">
                  {PRICE_YEARLY === 0 ? "Zdarma" : formatCzk(PRICE_YEARLY)}
                </span>
                {PRICE_YEARLY > 0 && (
                  <span className="font-[family-name:var(--font-display)] tnum-old text-base text-[var(--color-text-subtle)] line-through">
                    1&nbsp;990
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                {PRICE_YEARLY === 0
                  ? "V této pilotní verzi je roční přístup zdarma. Cena tisku knihy se přičítá až ve chvíli, kdy ji budete chtít vyrobit."
                  : "Jednorázově na 12 měsíců. Cena tisku knihy se přičítá až ve chvíli, kdy ji budete chtít vyrobit."}
              </p>

              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-8 w-full justify-center",
                )}
              >
                Začít zdarma
              </Link>
              <p className="mt-4 text-center text-xs text-[var(--color-text-subtle)]">
                Vrácení peněz do 30 dnů · bez závazku
              </p>
            </div>

            {/* Right column - plain language */}
            <div data-reveal>
              <SectionEyebrow numeral="II" dark>
                Co kupujete
              </SectionEyebrow>
              <h2
                className="mt-5 font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.1] tracking-tight text-[var(--color-paper-50)] sm:text-4xl"
                style={{ textWrap: "balance" }}
              >
                Rok psaní rodinné kroniky - spolu s námi.
              </h2>
              <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-[var(--color-paper-300)] sm:text-lg">
                Posíláme otázky, čistíme přepisy, řadíme kapitoly. Vaše rodina
                jen vypráví a poslouchá. Když je vzpomínek dost, dáte tisk
                a&nbsp;držíte v ruce hotovou knihu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. What's included ────────────────────────────────────────── */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-16 sm:py-24">
        <Fleuron className="mb-10 sm:mb-14" />
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div data-reveal>
            <SectionEyebrow numeral="III">V&nbsp;ceně máte</SectionEyebrow>
            <h2
              className={cn(editorialHeadingClass, "mt-5")}
              style={{ textWrap: "balance" }}
            >
              Vše, co rodina potřebuje, aby kniha vznikla sama.
            </h2>
          </div>
          <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {INCLUDED.map((item, i) => (
              <div key={item.h} data-reveal>
                <dt>
                  <p className="tnum-old text-[10px] uppercase tracking-[0.32em] text-[var(--color-red-700)]">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)] sm:text-2xl">
                    {item.h}
                  </p>
                </dt>
                <dd className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── 4. Print + add-ons ────────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-24">
        <Fleuron className="mb-10 sm:mb-14" />
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div data-reveal>
              <SectionEyebrow numeral="IV">Tisk a doplňky</SectionEyebrow>
              <h2
                className={cn(editorialHeadingClass, "mt-5")}
                style={{ textWrap: "balance" }}
              >
                Tištěná kniha <span className="tnum-old">{formatCzk(PRICE_BOOK)}</span>.
              </h2>
              <p className="mt-5 max-w-[40ch] text-base leading-relaxed text-[var(--color-text-muted)]">
                {PRICE_BOOK === 0
                  ? "V této pilotní verzi je tisk v rámci testování zdarma - všechno ostatní (papír, vazba, doprava) hradíme my, abychom kvalitu ladili spolu s rodinami."
                  : "Tvrdé desky, šitá vazba, papír v krémové barvě. U každé kapitoly QR kód s původním hlasem. Cena včetně tisku, vazby, balení a poštovného v ČR."}
              </p>
              <p className="mt-6">
                <Link
                  href="/signup"
                  className={buttonVariants({ variant: "primary", size: "lg" })}
                >
                  Vyzkoušet zdarma
                </Link>
              </p>
            </div>

            <div data-reveal>
              <ul className="divide-y divide-[var(--color-border-strong)]">
                {ADDONS.map(([label, price]) => (
                  <li
                    key={label}
                    className="flex items-baseline justify-between gap-6 py-5"
                  >
                    <span className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink-900)]">
                      {label}
                    </span>
                    <span className="tnum-old text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      {price}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-[var(--color-text-subtle)]">
                Doplňky účtujeme jen tehdy, pokud si je v okamžiku tisku zvolíte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Money-back guarantee ───────────────────────────────────── */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-16 sm:py-24">
        <Fleuron className="mb-10 sm:mb-14" />
        <div className="mx-auto max-w-3xl text-center" data-reveal>
          <SectionEyebrow numeral="V" className="mx-auto">
            Naše záruka
          </SectionEyebrow>
          <h2
            className={cn(editorialHeadingClass, "mx-auto mt-5 max-w-[26ch]")}
            style={{ textWrap: "balance" }}
          >
            Pokud se rodič nerozpovídá, vrátíme peníze do 30&nbsp;dnů.
          </h2>
          <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--color-text-muted)]">
            Vyzkoušejte první týdny v klidu. Pokud zjistíte, že to není pro vaši
            rodinu, napište nám - vrátíme peníze, žádné výmluvy, žádné
            otázky.
          </p>
        </div>
      </section>

      {/* ── 6. FAQ excerpt ────────────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-24">
        <Fleuron className="mb-10 sm:mb-14" />
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div data-reveal>
              <SectionEyebrow numeral="VI">Časté dotazy</SectionEyebrow>
              <h2
                className={cn(editorialHeadingClass, "mt-5")}
                style={{ textWrap: "balance" }}
              >
                Tři odpovědi před&nbsp;rozhodnutím.
              </h2>
              <p className="mt-5 max-w-prose text-base leading-relaxed text-[var(--color-text-muted)]">
                Všechny ostatní otázky najdete v plném{" "}
                <Link href="/faq" className="text-[var(--color-navy-800)] underline-offset-4 hover:underline">
                  FAQ
                </Link>
                .
              </p>
            </div>

            <ul className="space-y-2 border-t border-[var(--color-border-strong)]">
              {FAQ_EXCERPT.map((f, i) => (
                <li key={f.q} className="border-b border-[var(--color-border-strong)]">
                  <details
                    open={i === 0}
                    className="group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 text-left">
                      <span className="font-[family-name:var(--font-display)] text-lg font-normal text-[var(--color-ink-900)] sm:text-xl">
                        <span className="tnum-old mr-4 inline-block w-8 text-sm text-[var(--color-text-subtle)]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {f.q}
                      </span>
                      <span
                        aria-hidden
                        className="mt-1 shrink-0 text-2xl text-[var(--color-text-muted)] transition-transform duration-[var(--duration-normal)] group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-prose pb-6 pl-12 text-base leading-relaxed text-[var(--color-text-muted)]">
                      {f.a}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 7. Final CTA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-20 text-center sm:py-24">
        <div data-reveal>
          <h2
            className={cn(editorialHeadingClass, "mx-auto max-w-[24ch]")}
            style={{ textWrap: "balance" }}
          >
            Začněte dnes. Pošleme první otázku v pondělí.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Začít zdarma
            </Link>
            <Link
              href="/faq"
              className="font-[family-name:var(--font-display)] text-lg text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
            >
              Mám ještě otázky →
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { Placeholder } from "@/components/shared/Placeholder";

export const metadata: Metadata = {
  title: "Jak to funguje",
  description:
    "Čtyři kroky od přihlášení k tištěné knize. Týdenní otázka, jednoduchá odpověď hlasem nebo textem, automatický přepis a rodinná knihovna.",
};

const STEPS = [
  {
    n: "I",
    eyebrow: "Týden 1",
    title: "Vyberete otázky",
    body:
      "Z knihovny 200+ otázek vyberete ty, na které by rodič rád odpověděl. Můžete přidat i vlastní — třeba na konkrétní příhodu, kterou si pamatujete z dětství.",
    aside:
      "Otázky jsou rozdělené do osmi témat (dětství, rodiče, mládí, láska, práce, výchova, místa, životní moudro). Vy zvolíte tempo.",
  },
  {
    n: "II",
    eyebrow: "Každé pondělí",
    title: "Rodič dostane jednu otázku",
    body:
      "Otázka přijde SMSkou nebo e-mailem. Jedno kliknutí spustí nahrávání. Pokud rodič raději píše, odpoví textem. Funguje i z tlačítkového telefonu — stačí prozvonit naše číslo.",
    aside:
      "Žádné účty, žádné aplikace, žádné stahování. Cílem je, aby maminka u sedmdesátky neřešila techniku — jen vyprávěla.",
  },
  {
    n: "III",
    eyebrow: "Do 48 hodin",
    title: "Přepíšeme a vyhladíme",
    body:
      "Hlasovou nahrávku převedeme do textu. Korektor přečte, vyhladí věty, ale ponechá způsob, jakým to rodič řekl. Slang, dialekt, oblíbená spojení zůstanou — to je přece to, kvůli čemu si knihu jednou otevřete.",
    aside:
      "Pod každou kapitolou v knize bude QR kód, který spustí původní hlas. Aby zůstal i ten zvuk, ne jen slova.",
  },
  {
    n: "IV",
    eyebrow: "Když je vzpomínek dost",
    title: "Vytisknete knihu",
    body:
      "Online náhled vám ukáže přesné rozložení stránek, sazbu i fotky. Když je vše tak, jak chcete, kliknete na „Objednat tisk“. Kniha přijde za 2–3 týdny — tvrdé desky, šitá vazba, krémový papír.",
    aside:
      "Tisk se účtuje až ve chvíli objednávky. Online přístup do knihovny vám zůstává navždy, i kdyby k tisku nikdy nedošlo.",
  },
];

const FAQ = [
  {
    q: "Jak dlouho trvá, než kniha vznikne?",
    a: "V průměru 9–12 měsíců. Záleží jen na tom, kolik otázek si vyberete a v jakém tempu rodič odpovídá.",
  },
  {
    q: "Co když rodič nemá smartphone?",
    a: "Pošleme odpovědní telefonní číslo. Stačí prozvonit, my hovor zaznamenáme a přepíšeme. Funguje i z tlačítkového telefonu.",
  },
  {
    q: "Můžu otázky upravovat za jízdy?",
    a: "Ano. Kdykoliv můžete přidat novou, posunout, vyřadit. Knihovna roste s vámi, ne podle pevného plánu.",
  },
];

export default function JakToFungujePage() {
  return (
    <Shell>
      {/* Hero */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pt-20 pb-16 text-center sm:pt-28">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
          <span className="mr-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-500)]" />
          Jak to funguje
          <span className="ml-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-500)]" />
        </p>
        <h1
          className="heritage-press mx-auto mt-8 max-w-[20ch] font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.05] tracking-tight text-[var(--color-navy-900)] sm:text-6xl"
          style={{ textWrap: "balance" }}
        >
          Čtyři kroky <span>od otázky ke knize</span>.
        </h1>
        <p className="mx-auto mt-7 max-w-[54ch] font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
          Vy vyberete otázky. Rodič odpoví hlasem nebo textem. My všechno
          vyhladíme. Z toho vznikne kniha, kterou držíte v ruce.
        </p>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pb-12">
        <ol className="space-y-20 sm:space-y-28">
          {STEPS.map((step, i) => {
            const isEven = i % 2 === 1;
            return (
              <li
                key={step.n}
                data-reveal
                className="relative grid items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16"
              >
                {/* Huge transparent Roman numeral behind the step */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute select-none font-[family-name:var(--font-display)] font-medium leading-[0.8] text-[var(--color-navy-900)] ${
                    isEven ? "right-[-2vw] lg:right-[-1vw]" : "left-[-2vw] lg:left-[-1vw]"
                  } top-[-2vw]`}
                  style={{
                    fontSize: "clamp(180px, 28vw, 380px)",
                    opacity: 0.06,
                    letterSpacing: "-0.04em",
                    zIndex: 0,
                  }}
                >
                  {step.n}
                </span>

                <div className={`relative z-10 ${isEven ? "lg:order-2" : ""}`}>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-red-700)]">
                    {step.eyebrow}
                  </p>
                  <h2
                    className="heritage-press mt-3 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
                    style={{ textWrap: "balance" }}
                  >
                    {step.title}
                  </h2>
                  <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-[var(--color-text-muted)]">
                    {step.body}
                  </p>
                  <p className="mt-6 max-w-[52ch] border-l-2 border-[var(--color-gold-400)] pl-5 font-[family-name:var(--font-display)] text-base leading-relaxed text-[var(--color-text-subtle)]">
                    {step.aside}
                  </p>
                </div>

                <div className={`relative z-10 ${isEven ? "lg:order-1" : ""}`}>
                  <Placeholder
                    kind="image"
                    w={720}
                    h={540}
                    aspect="4/3"
                    label={`Ukázka kroku ${step.n}`}
                    tone="navy"
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* In-between belt — quote */}
      <section className="bg-[var(--color-navy-900)] py-24 text-[var(--color-paper-100)] sm:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center" data-reveal>
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-gold-400)]">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-[var(--color-gold-400)]" />
            Z dopisů, které nám chodí
            <span className="ml-3 inline-block h-px w-8 align-middle bg-[var(--color-gold-400)]" />
          </p>
          <p
            className="mt-8 font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--color-paper-50)] sm:text-3xl"
            style={{ textWrap: "balance" }}
          >
            &bdquo;Maminka první pondělí odpověděla z čistého pocitu povinnosti.
            Třetí pondělí už čekala telefonem v ruce, kdy otázka přijde.&ldquo;
          </p>
          <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-[var(--color-paper-400)]">
            — Lucie, 47 let, Plzeň
          </p>
        </div>
      </section>

      {/* What we do / what you do */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-2">
          <div data-reveal>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
              Co dělá rodina
            </p>
            <h2
              className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Vy <span>jen vyprávíte</span>.
            </h2>
            <ul className="mt-8 space-y-5 text-base leading-relaxed text-[var(--color-text-muted)]">
              <li className="flex gap-4">
                <span aria-hidden className="mt-2 inline-block h-px w-6 shrink-0 bg-[var(--color-gold-500)]" />
                <span>Vyberete otázky, na které stojí za to odpovědět.</span>
              </li>
              <li className="flex gap-4">
                <span aria-hidden className="mt-2 inline-block h-px w-6 shrink-0 bg-[var(--color-gold-500)]" />
                <span>Rodič každý týden odpoví — hlasem nebo textem.</span>
              </li>
              <li className="flex gap-4">
                <span aria-hidden className="mt-2 inline-block h-px w-6 shrink-0 bg-[var(--color-gold-500)]" />
                <span>Doplníte fotky, jestli chcete. (Není povinné.)</span>
              </li>
              <li className="flex gap-4">
                <span aria-hidden className="mt-2 inline-block h-px w-6 shrink-0 bg-[var(--color-gold-500)]" />
                <span>Když je vzpomínek dost, kliknete na „Objednat tisk“.</span>
              </li>
            </ul>
          </div>

          <div data-reveal>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
              Co děláme my
            </p>
            <h2
              className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              My <span>všechno ostatní</span>.
            </h2>
            <ul className="mt-8 space-y-5 text-base leading-relaxed text-[var(--color-text-muted)]">
              <li className="flex gap-4">
                <span aria-hidden className="mt-2 inline-block h-px w-6 shrink-0 bg-[var(--color-red-700)]" />
                <span>Posíláme otázky každé pondělí ráno v 10:00.</span>
              </li>
              <li className="flex gap-4">
                <span aria-hidden className="mt-2 inline-block h-px w-6 shrink-0 bg-[var(--color-red-700)]" />
                <span>Přepisujeme nahrávky a vyhladíme věty.</span>
              </li>
              <li className="flex gap-4">
                <span aria-hidden className="mt-2 inline-block h-px w-6 shrink-0 bg-[var(--color-red-700)]" />
                <span>Sázíme stránky, vybíráme typografii, řadíme kapitoly.</span>
              </li>
              <li className="flex gap-4">
                <span aria-hidden className="mt-2 inline-block h-px w-6 shrink-0 bg-[var(--color-red-700)]" />
                <span>Tiskneme, vážeme, balíme a posíláme.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Mini-FAQ */}
      <section className="bg-[var(--color-surface)] py-24">
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div data-reveal>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
                <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
                Než začnete
              </p>
              <h2
                className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
                style={{ textWrap: "balance" }}
              >
                Tři otázky, které <span>slyšíme nejčastěji</span>.
              </h2>
              <p className="mt-6 max-w-prose text-base leading-relaxed text-[var(--color-text-muted)]">
                Celý seznam najdete v plném{" "}
                <Link href="/faq" className="text-[var(--color-navy-800)] underline-offset-4 hover:underline">
                  FAQ
                </Link>
                .
              </p>
            </div>

            <ul className="space-y-2 border-t border-[var(--color-border-strong)]">
              {FAQ.map((f, i) => (
                <li key={f.q} className="border-b border-[var(--color-border-strong)]">
                  <details
                    open={i === 0}
                    className="group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 text-left">
                      <span className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-navy-900)] sm:text-2xl">
                        <span className="mr-4 inline-block w-8 text-sm text-[var(--color-text-subtle)]">
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

      {/* Final CTA */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-28 text-center">
        <div data-reveal>
          <h2
            className="heritage-press mx-auto max-w-[22ch] font-[family-name:var(--font-display)] text-4xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-5xl"
            style={{ textWrap: "balance" }}
          >
            Začněte dnes. <span>Pošleme první otázku v pondělí.</span>
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-[var(--color-gold-500)] bg-[var(--color-gold-500)] py-3 pl-6 pr-3.5 text-[15px] font-medium text-[var(--color-navy-900)] transition-colors hover:bg-[var(--color-gold-400)] hover:border-[var(--color-gold-400)]"
            >
              Začít zdarma
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-navy-900)] text-[13px] font-semibold text-[var(--color-gold-500)]">↗</span>
            </Link>
            <Link
              href="/cenik"
              className="font-[family-name:var(--font-display)] text-lg text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
            >
              Podívat se na ceník →
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}

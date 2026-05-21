import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { buttonVariants } from "@/components/ui/button";
import { Placeholder } from "@/components/shared/Placeholder";

export const metadata: Metadata = {
  title: "Vzpomínkář jako dárek",
  description:
    "Nejhezčí dárek pro maminku, tatínka nebo prarodiče — rok týdenních otázek a kniha plná jejich příběhů. K Vánocům, výročí, narozeninám.",
};

const OCCASIONS = [
  {
    n: "I",
    h: "K Vánocům",
    body:
      "Otevřete pod stromečkem certifikát s jeho jménem. První otázka odejde 6. ledna ráno — krásně v klidu po svátcích.",
  },
  {
    n: "II",
    h: "K narozeninám",
    body:
      "První otázka přijde přesně v den narozenin (nebo den po, jak chcete). Stačí, když přidáte foto z dětství a krátký vzkaz.",
  },
  {
    n: "III",
    h: "Ke zlaté svatbě",
    body:
      "Kniha vyrobená pro oba — dvě paralelní pravdy o stejných padesáti letech. Jedna z nejhezčích věcí, které jsme za rok udělali.",
  },
  {
    n: "IV",
    h: "Po nemoci",
    body:
      "Pomalá, jemná aktivita. Vyprávění jako rehabilitace. Pošlete v klidu, žádný tlak — kdykoliv může pauznout.",
  },
];

const STEPS = [
  {
    n: "1",
    h: "Koupíte certifikát",
    body:
      "Online za pár minut. Vyberete den, kdy má první otázka odejít, a co má v certifikátu být napsané.",
  },
  {
    n: "2",
    h: "Vytisknete nebo necháme vytisknout",
    body:
      "PDF s krásnou sazbou na klasickém krémovém papíře — vytisknete doma a vložíte do dárkové obálky. Nebo vám tištěnou verzi pošleme.",
  },
  {
    n: "3",
    h: "Předáte při slavnostní chvíli",
    body:
      "Babička otevře obálku, přečte si vzkaz a uvidí, že její příběh stojí někomu za vydání.",
  },
  {
    n: "4",
    h: "V den D odejde první otázka",
    body:
      "Nemusíte zařizovat nic víc. My pošleme SMS nebo e-mail. Babička odpoví. Kniha začíná vznikat.",
  },
];

export default function DarekPage() {
  return (
    <Shell>
      {/* Hero — red chord */}
      <section className="bg-[var(--color-red-900)] py-24 text-[var(--color-paper-100)] sm:py-32">
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div data-reveal>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-gold-300)]">
                <span className="mr-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-400)]" />
                Jako dárek
              </p>
              <h1
                className="heritage-press mt-8 max-w-[20ch] font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.05] tracking-tight text-[var(--color-paper-50)] sm:text-6xl"
                style={{ textWrap: "balance" }}
              >
                Nejhezčí dárek <em>nestojí v obchodě</em>.
              </h1>
              <p className="mt-7 max-w-[52ch] font-[family-name:var(--font-display)] text-lg italic leading-relaxed text-[var(--color-paper-300)] sm:text-xl">
                Rok týdenních otázek pro maminku, tátu nebo prarodiče.
                A&nbsp;na&nbsp;konci kniha, kterou si budou číst i&nbsp;ti,
                kteří se ještě nenarodili.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link
                  href="/darek/certifikat"
                  className={buttonVariants({ variant: "primary", size: "lg" })}
                >
                  Vybrat certifikát
                </Link>
                <Link
                  href="#jak-darovat"
                  className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-paper-100)] underline-offset-[6px] hover:underline"
                >
                  Jak darování probíhá →
                </Link>
              </div>
            </div>

            <div data-reveal>
              <Placeholder
                kind="image"
                w={640}
                h={780}
                aspect="640/780"
                label="Dárkové balení s certifikátem"
                tone="red"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Occasions */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-24 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_2fr]">
          <div data-reveal>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
              Pro jakou příležitost
            </p>
            <h2
              className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Čtyři okamžiky, <em>kdy se to nejvíc hodí</em>.
            </h2>
            <p className="mt-6 max-w-prose text-base leading-relaxed text-[var(--color-text-muted)]">
              Můžete pro každou jinou příležitost. Den, kdy první otázka
              odejde, si vybíráte vy.
            </p>
          </div>

          <dl className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {OCCASIONS.map((o) => (
              <div key={o.n} data-reveal>
                <dt>
                  <p className="font-[family-name:var(--font-display)] text-3xl font-medium leading-none text-[var(--color-gold-500)]">
                    {o.n}
                  </p>
                  <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy-900)]">
                    {o.h}
                  </p>
                </dt>
                <dd className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
                  {o.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How gifting works */}
      <section id="jak-darovat" className="bg-[var(--color-surface)] py-24 sm:py-28">
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
              Jak darování probíhá
            </p>
            <h2
              className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Čtyři kroky, <em>jeden z nich je „čekat na Vánoce“</em>.
            </h2>
          </div>

          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} data-reveal className="relative">
                <div className="flex items-start gap-4">
                  <span className="font-[family-name:var(--font-display)] text-5xl font-medium leading-none text-[var(--color-gold-500)]">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-navy-900)]">
                      {s.h}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
                      {s.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-24">
        <div className="mx-auto max-w-3xl text-center" data-reveal>
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-gold-500)]">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-[var(--color-gold-500)]" />
            Z dopisů, které nám chodí
            <span className="ml-3 inline-block h-px w-8 align-middle bg-[var(--color-gold-500)]" />
          </p>
          <p
            className="mt-8 font-[family-name:var(--font-display)] text-2xl italic leading-snug text-[var(--color-navy-900)] sm:text-3xl"
            style={{ textWrap: "balance" }}
          >
            &bdquo;Babička otevřela obálku, přečetla certifikát a&nbsp;dala se do
            pláče. Asi takhle si představuju dárek, který se nezapomene.&ldquo;
          </p>
          <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">
            — Klára, Brno · darovala k 75. narozeninám
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--color-red-900)] py-24 text-[var(--color-paper-100)] sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center" data-reveal>
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-gold-300)]">
            Připraveni?
          </p>
          <h2
            className="heritage-press mx-auto mt-6 max-w-[24ch] font-[family-name:var(--font-display)] text-4xl font-medium leading-tight text-[var(--color-paper-50)] sm:text-5xl"
            style={{ textWrap: "balance" }}
          >
            Vyberte den, vyberte vzkaz. <em>Zbytek zařídíme my.</em>
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <Link href="/darek/certifikat" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Vybrat certifikát
            </Link>
            <Link
              href="/cenik"
              className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-paper-100)] underline-offset-[6px] hover:underline"
            >
              Podívat se na ceník →
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}

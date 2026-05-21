import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { buttonVariants } from "@/components/ui/button";
import { Placeholder } from "@/components/shared/Placeholder";

export const metadata: Metadata = {
  title: "O nás",
  description:
    "Vzpomínkář založila parta lidí v Praze, kteří přišli o svoje babičky dřív, než stihli zaznamenat jejich příběhy. Nechceme, aby to znovu potkalo jinou rodinu.",
};

const VALUES = [
  {
    n: "I",
    h: "Pomalu, ale dotaženě",
    body:
      "Nevyrábíme knihu jako rychlou aplikaci. Jedna otázka týdně, jedna kapitola měsíčně, jedna kniha za rok. Pomalost není pomalost — je to způsob, jak se vyprávění dostane do hloubky.",
  },
  {
    n: "II",
    h: "Hlas zůstává jeho",
    body:
      "Přepis vyhladíme, ale slang, dialekt, oblíbená slova a pauzy zůstanou. Pod každou kapitolou v knize bude QR kód s původním hlasem — protože to je to, kvůli čemu si knihu jednou otevřete.",
  },
  {
    n: "III",
    h: "Žádné předplatné, žádný tlak",
    body:
      "Jedna roční platba, jedna kniha. Nepoužíváme dark patterns, abychom vás přemluvili k vyšší úrovni. Tisk si objednáte, až vy uznáte, že je čas.",
  },
  {
    n: "IV",
    h: "Vzpomínky jsou vaše",
    body:
      "Data patří rodině, ne nám. Kdykoliv si je můžete stáhnout nebo nechat smazat. Žádné AI tréninky, žádné prodávání třetím stranám. Garance v podmínkách, ne jen v marketingu.",
  },
];

const PEOPLE = [
  {
    name: "Jakub Š.",
    role: "Zakladatel · produkt",
    quote:
      "Když mi v devadesáti zemřela babička, zůstaly nám tři fotky a krabice s pohlednicemi. Vzpomínkář jsme stvořili, abychom neopakovali stejnou chybu u svých rodičů.",
  },
  {
    name: "Tereza M.",
    role: "Korektura a sazba",
    quote:
      "Přepis nikdy nevyhladím tak, aby z toho zmizel ten člověk. Pauza, kterou udělá, je často důležitější než slovo, které řekne potom.",
  },
  {
    name: "Marek H.",
    role: "Tisk a vazba",
    quote:
      "Vážeme ručně v malé tiskárně na Smíchově. Naše babičky by stejně nepoznaly knihu, která by byla vyrobená jinde než ručně.",
  },
];

export default function ONasPage() {
  return (
    <Shell>
      {/* Hero */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pt-20 pb-16 sm:pt-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-10 align-middle bg-[var(--color-gold-500)]" />
              O nás
            </p>
            <h1
              className="heritage-press mt-8 max-w-[22ch] font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.05] tracking-tight text-[var(--color-navy-900)] sm:text-6xl"
              style={{ textWrap: "balance" }}
            >
              Založeno proto, <em>aby se vzpomínky neztrácely</em>.
            </h1>
            <p className="mt-7 max-w-[54ch] font-[family-name:var(--font-display)] text-lg italic leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
              Vzpomínkář dělá v Praze parta lidí, kteří přišli o svoje babičky
              dřív, než stihli zaznamenat jejich příběhy. Nechceme, aby to
              znovu potkalo jinou rodinu.
            </p>
          </div>
          <div data-reveal>
            <Placeholder
              kind="image"
              w={640}
              h={780}
              aspect="640/780"
              label="Foto týmu — Praha · 2025"
              tone="navy"
            />
          </div>
        </div>
      </section>

      {/* Founder note — letter style */}
      <section className="bg-[var(--color-surface)] py-24 sm:py-32">
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div data-reveal>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
                <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
                Slovo zakladatele
              </p>
              <h2
                className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
                style={{ textWrap: "balance" }}
              >
                Proč jsme to <em>vůbec začali dělat</em>.
              </h2>
            </div>

            <div data-reveal className="heritage-dropcap font-[family-name:var(--font-display)] text-lg leading-relaxed text-[var(--color-text)] sm:text-xl">
              <p>
                Babička Anna mi v devíti vyprávěla, jak ve čtyřicátém pátém
                přešla pěšky z Berouna do Plzně. Ve dvanácti to vyprávěla
                znovu, jen jinak. V sedmnácti už mě to nezajímalo — pak jsem
                odjel studovat a vrátil se za třináct let. Tehdy mě poprosila,
                ať si zapamatuju, jak se jmenovala kočka, kterou měla jako
                holka. Slíbil jsem to. Jenže jsem si nezapamatoval ani jméno
                kočky, ani cestu z Berouna.
              </p>
              <p className="mt-5">
                Když umřela, zůstaly nám tři fotky a krabice s pohlednicemi
                od příbuzných, které nikdo neznal. Žádné nahrávky. Žádný
                rukopis. Žádný způsob, jak její vyprávění vrátit.
              </p>
              <p className="mt-5">
                Vzpomínkář jsme rozjeli proto, aby ostatním rodinám nezůstaly
                jen tři fotky. Aby vzpomínky, které dnes večer otec vypráví
                u stolu, byly za rok napsané. A za deset let pořád slyšitelné.
              </p>
              <p
                className="mt-10 font-[family-name:var(--font-script)] text-4xl leading-none text-[var(--color-navy-900)]"
                aria-hidden
              >
                Jakub Š.
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
                <span className="sr-only">Jakub Š., </span>zakladatel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-24 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_2fr]">
          <div data-reveal>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-500)]" />
              Čím se řídíme
            </p>
            <h2
              className="heritage-press mt-6 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[var(--color-navy-900)] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Čtyři pravidla, <em>kterých se držíme</em>.
            </h2>
            <p className="mt-6 max-w-prose text-base leading-relaxed text-[var(--color-text-muted)]">
              Žádné porady o hodnotách, žádné nástěnky. Jen tohle, dokud
              fungujeme.
            </p>
          </div>

          <dl className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.n} data-reveal>
                <dt>
                  <p className="font-[family-name:var(--font-display)] text-3xl font-medium leading-none text-[var(--color-gold-500)]">
                    {v.n}
                  </p>
                  <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy-900)]">
                    {v.h}
                  </p>
                </dt>
                <dd className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
                  {v.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Team */}
      <section className="bg-[var(--color-navy-900)] py-28 text-[var(--color-paper-100)] sm:py-32">
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-gold-400)]">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-[var(--color-gold-400)]" />
              Lidé za knihou
            </p>
            <h2
              className="heritage-press mt-6 font-[family-name:var(--font-display)] text-4xl font-medium leading-tight text-[var(--color-paper-50)] sm:text-5xl"
              style={{ textWrap: "balance" }}
            >
              Malá parta. <em>Velký důraz na detail.</em>
            </h2>
          </div>

          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {PEOPLE.map((p) => (
              <figure
                key={p.name}
                data-reveal
                className="rounded-[var(--radius-lg)] bg-[var(--color-navy-800)]/40 p-7"
              >
                <Placeholder
                  kind="avatar"
                  w={120}
                  h={120}
                  aspect="1/1"
                  rounded
                  label={p.name}
                  tone="navy"
                  className="!w-20"
                />
                <blockquote className="mt-6 font-[family-name:var(--font-display)] text-base italic leading-snug text-[var(--color-paper-100)]">
                  &bdquo;{p.quote}&ldquo;
                </blockquote>
                <figcaption className="mt-5">
                  <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-paper-50)]">
                    {p.name}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[var(--color-paper-400)]">
                    {p.role}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Footnote / contact */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 py-24 text-center">
        <div data-reveal>
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-gold-500)]">
            Sídlo a kontakt
          </p>
          <h2
            className="heritage-press mx-auto mt-6 max-w-[26ch] font-[family-name:var(--font-display)] text-3xl font-medium leading-snug text-[var(--color-navy-900)] sm:text-4xl"
            style={{ textWrap: "balance" }}
          >
            Praha &mdash; <em>Smíchov, druhé patro nad knihovnou</em>.
          </h2>
          <p className="mx-auto mt-6 max-w-prose text-base leading-relaxed text-[var(--color-text-muted)]">
            Pošta &nbsp;·&nbsp; e-mail &nbsp;·&nbsp; tlustá obálka s rukopisem.
            Všechno čteme. Na <Link href="/kontakt" className="text-[var(--color-navy-800)] underline-offset-4 hover:underline">stránce kontakt</Link> najdete přesnou adresu i telefon.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Začít zdarma
            </Link>
            <Link
              href="/jak-to-funguje"
              className="font-[family-name:var(--font-display)] text-lg italic text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
            >
              Jak to funguje →
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}

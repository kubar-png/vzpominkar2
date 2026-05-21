"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Placeholder } from "@/components/shared/Placeholder";
import { HowItWorksStack, type StackStep } from "@/components/jak-to-funguje/HowItWorksStack";
import { SpeechToStoryDemo } from "@/components/jak-to-funguje/SpeechToStoryDemo";
import { ShufflePrompts } from "@/components/jak-to-funguje/ShufflePrompts";
import {
  Fleuron,
  SectionEyebrow,
  editorialHeadingClass,
} from "@/components/landing/Editorial";
import { cn } from "@/lib/utils";

type Path = "gift" | "self";

function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-[44px] items-center gap-2 py-2 text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
    >
      <span className="font-[family-name:var(--font-display)] text-lg">{children}</span>
      <span
        aria-hidden
        className="translate-y-[1px] transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out-quart)] group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Path-specific copy
 * ─────────────────────────────────────────────────────────────────────── */

const HERO_COPY: Record<Path, { lead: string; accent: string; sub: string }> = {
  gift: {
    lead: "Vzpomínky rodičů ve vlastním hlase.",
    accent: "Pro celou rodinu.",
    sub: "Šest kroků, ve kterých se z týdenních otázek a hlasových odpovědí vaší babičky nebo táty stává ručně vázaná kniha.",
  },
  self: {
    lead: "Váš život. Vaším hlasem.",
    accent: "Pro ty, kteří přijdou po vás.",
    sub: "Šest kroků, ve kterých se z vašich týdenních vyprávění stává ručně vázaná kniha - a živý archiv pro vaše potomky.",
  },
};

const STEPS: Record<Path, StackStep[]> = {
  gift: [
    {
      roman: "I.",
      title: "Vyberete otázky, na které chcete, aby rodič vyprávěl",
      body: "Z naší knihovny přes 300 otázek vyberete ty, které vás u rodičů zajímají. Můžete přidat i vlastní. My je rozvrhneme po týdnech, aby blízkého nezahltily.",
      src: "/placeholder-photos/ctenarka-stul.jpg",
      alt: "Žena u stolu vybírá otázky pro knihu vzpomínek",
      caption: "Knihovna otázek",
      link: { href: "/cenik", label: "Podívat se na ukázku otázek" },
    },
    {
      roman: "II.",
      title: "Každý týden přijde rodiči jedna otázka",
      body: "V pondělí ráno přijde otázka SMS nebo e-mailem. Žádné aplikace, žádné účty, žádná hesla. Jedno kliknutí a rodič odpovídá.",
      src: "/placeholder-photos/spolu-na-pohovce.jpg",
      alt: "Rodina sedící na pohovce a procházející týdenní otázku",
      caption: "Týdenní doručení",
    },
    {
      roman: "III.",
      title: "Blízký vypráví hlasem, my děláme zbytek",
      body: "Stačí stisknout nahrávací tlačítko a mluvit, jako by mluvil s vnoučaty. Žádné psaní, žádná korektura. Nahrávky zůstávají v archivu napořád.",
      src: "/placeholder-photos/babicka-usmev.jpg",
      alt: "Babička s úsměvem vypráví do telefonu",
      caption: "Hlasová odpověď",
      isVideo: true,
    },
    {
      roman: "IV.",
      title: "Hlas se mění v napsaný příběh",
      body: "Naše technologie Hlas do příběhu přepíše nahrávku, vyčistí ji a převede do plynulého textu. Vy si vyberete styl - v první osobě, ve třetí, nebo původní přepis.",
      src: "/placeholder-photos/ruce-na-knize.jpg",
      alt: "Ruce držící knihu vzpomínek s otevřenou kapitolou",
      caption: "Hlas → příběh",
      link: { href: "#hlas-do-pribehu", label: "Vyzkoušet ukázku níže" },
    },
    {
      roman: "V.",
      title: "Sdílejte vzpomínky s celou rodinou",
      body: "Pozvěte sourozence, děti, vnoučata. Mohou přidávat fotky, navrhovat otázky a hlasovat, na co by chtěli, aby se babička zeptala dál. Z jednoho úkolu se stává společný projekt.",
      src: "/placeholder-photos/spolu-stoji.jpg",
      alt: "Tři generace rodiny stojící spolu",
      caption: "Rodinný projekt",
    },
    {
      roman: "VI.",
      title: "Ručně vázaná kniha s hlasem v každé kapitole",
      body: "Když je vzpomínek dost, objednáte ručně vázaný výtisk pro rodiče i pro sebe. Tvrdé desky, šitá vazba, krémový papír. U každé kapitoly QR kód s původním hlasem.",
      src: "/placeholder-photos/kniha-stojici-alt.jpg",
      alt: "Hotová kniha vzpomínek s ručně šitou vazbou stojící na stole",
      caption: "Kniha doma",
      link: { href: "/cenik", label: "Podívat se na ceník" },
    },
  ],
  self: [
    {
      roman: "I.",
      title: "Vyberete příběhy, které chcete vyprávět",
      body: "Z knihovny přes 300 otázek si vyberete ty, na které máte co říct. Můžete přidat vlastní. My je rozvrhneme po týdnech tak, ať máte čas se ke každé hlubší vzpomínce vrátit.",
      src: "/placeholder-photos/ctenarka-stul.jpg",
      alt: "Žena u stolu vybírá otázky pro knihu vzpomínek",
      caption: "Vaše knihovna",
      link: { href: "/cenik", label: "Podívat se na ukázku otázek" },
    },
    {
      roman: "II.",
      title: "Každý týden vám přijde jedna otázka",
      body: "V pondělí ráno SMS nebo e-mail s jednou otázkou. Bez aplikací, bez hesel. Stačí jedno kliknutí, jedna nahraná odpověď - kdykoliv vám to vyhovuje.",
      src: "/placeholder-photos/ruce-na-knize.jpg",
      alt: "Detail ruky pracující s knihou vzpomínek",
      caption: "Týdenní rytmus",
    },
    {
      roman: "III.",
      title: "Vyprávíte hlasem, my děláme zbytek",
      body: "Stačí zmáčknout nahrávací tlačítko a mluvit, jak vám to přirozeně plyne. Žádné psaní, žádné formulace. Nahrávky zůstávají uložené v archivu navždy.",
      src: "/placeholder-photos/babicka-usmev.jpg",
      alt: "Detail nahrávání hlasové odpovědi",
      caption: "Hlasová odpověď",
      isVideo: true,
    },
    {
      roman: "IV.",
      title: "Váš hlas se mění v napsaný příběh",
      body: "Technologie Hlas do příběhu přepíše vaši nahrávku, vyčistí ji a převede do plynulého textu. Můžete si vybrat styl - v 1. osobě, ve 3. osobě, nebo původní přepis.",
      src: "/placeholder-photos/kniha-detail.jpg",
      alt: "Detail otevřené knihy s textem příběhu",
      caption: "Hlas → příběh",
      link: { href: "#hlas-do-pribehu", label: "Vyzkoušet ukázku níže" },
    },
    {
      roman: "V.",
      title: "Sdílejte své příběhy s lidmi, na kterých vám záleží",
      body: "Pozvěte děti, vnoučata, partnera. Mohou si poslechnout nové nahrávky, přidávat fotky a navrhovat otázky. Z vaší knihy se stává živý rodinný archiv.",
      src: "/placeholder-photos/spolu-stoji.jpg",
      alt: "Rodina spolu prochází vzpomínky",
      caption: "Sdílení s rodinou",
    },
    {
      roman: "VI.",
      title: "Ručně vázaná kniha vašich vzpomínek",
      body: "Když máte vzpomínek dost, objednáte si ručně vázanou knihu. Tvrdé desky, šitá vazba, krémový papír. U každé kapitoly QR kód s původním hlasem - váš odkaz, kdykoliv k poslechu.",
      src: "/placeholder-photos/knihy-stoh.jpg",
      alt: "Hotová kniha vzpomínek",
      caption: "Vaše kniha",
      link: { href: "/cenik", label: "Podívat se na ceník" },
    },
  ],
};

const FAMILY_COPY: Record<Path, { title: string; titleAccent: string; lead: string; bullets: Array<[string, string]> }> = {
  gift: {
    title: "Generace spolu.",
    titleAccent: "U jedné knihy.",
    lead: "Vzpomínkář dělá z vyprávění společný rodinný zážitek. Zatímco rodič nahrává příběhy, vy přidáváte fotky, vybíráte další otázky a sledujete, jak kniha vzniká.",
    bullets: [
      ["Vybírejte otázky", "Hlasujte spolu o tom, na co se chcete zeptat dál."],
      ["Přidávejte fotky", "Nahrajte rodinný archiv, který se vplete přímo do kapitol."],
      ["Pozvěte sourozence", "Každý člen rodiny má vlastní přístup - bez sdílených hesel."],
      ["Sdílejte odpovědi", "Notifikace, když přijde nová nahrávka, ať vám nic neunikne."],
    ],
  },
  self: {
    title: "Váš odkaz.",
    titleAccent: "Společný projekt.",
    lead: "Vzpomínkář dělá z vašeho vyprávění společný rodinný zážitek. Zatímco vy nahráváte své příběhy, rodina přidává fotky, navrhuje otázky a slyší vás kdykoliv.",
    bullets: [
      ["Vy vybíráte témata", "Vyprávějte o tom, co dává smysl právě vám."],
      ["Rodina přidává kontext", "Děti a vnoučata mohou nahrávat fotky k vašim kapitolám."],
      ["Vlastní tempo", "Žádné termíny. Nahrávejte, kdy máte chuť - nebo náladu."],
      ["Slyšitelný odkaz", "QR kódy v knize zachovají váš hlas v každé kapitole."],
    ],
  },
};

/* ─────────────────────────────────────────────────────────────────────────
 * Path toggle pill
 * ─────────────────────────────────────────────────────────────────────── */

function PathToggle({ value, onChange }: { value: Path; onChange: (v: Path) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Kupujete jako dárek nebo pro sebe?"
      className="relative inline-flex items-center gap-1 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-1 shadow-sm"
    >
      {(["gift", "self"] as const).map((p) => {
        const selected = p === value;
        const label = p === "gift" ? "Jako dárek" : "Pro sebe";
        return (
          <button
            key={p}
            role="tab"
            aria-selected={selected}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              "relative z-10 min-w-[8rem] rounded-full px-6 py-3 text-sm font-semibold transition-colors sm:text-base",
              selected
                ? "bg-[var(--color-navy-900)] text-[var(--color-paper-50)] shadow-md"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-navy-900)]",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Main client component
 * ─────────────────────────────────────────────────────────────────────── */

export function JakToFungujeClient() {
  const [path, setPath] = useState<Path>("gift");

  /* Page-wide background tint - flips when path changes so it's immediately
   * visible which journey the visitor is on. Cream/warm = gift, paper-cool =
   * self. We expose it as a CSS variable so individual sections can opt into
   * the path-driven tint without hard-coding the colour. */
  const tint = path === "gift" ? "#ffffff" : "#f4f5f7";
  const accent = path === "gift" ? "var(--color-heritage-red)" : "var(--color-navy-800)";

  const hero = HERO_COPY[path];
  const steps = STEPS[path];
  const family = FAMILY_COPY[path];

  return (
    <div
      style={
        {
          "--jtf-bg": tint,
          "--jtf-accent": accent,
        } as React.CSSProperties
      }
      className="relative bg-[var(--jtf-bg)] transition-colors duration-[600ms] ease-out"
    >
      {/* ── 1. Hero with path toggle ───────────────────────────────────── */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pt-8 pb-10 sm:pt-14 sm:pb-14">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow numeral="I" className="mx-auto">
            Jak to funguje
          </SectionEyebrow>
          <h1
            className="mt-5 font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.08] tracking-tight text-[var(--color-ink-900)] sm:text-5xl"
            style={{ textWrap: "balance" }}
          >
            {hero.lead}{" "}
            <span style={{ color: "var(--jtf-accent)" }}>{hero.accent}</span>
          </h1>
          <div className="mt-7 flex justify-center">
            <PathToggle value={path} onChange={setPath} />
          </div>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[var(--color-text-muted)] sm:text-xl">
            {hero.sub}
          </p>
        </div>

        {/* Co-founder intro video card */}
        <div className="mx-auto mt-14 grid max-w-[var(--container-default)] gap-6 sm:mt-16 sm:grid-cols-[1.6fr_1fr] sm:items-stretch">
          <button
            type="button"
            className="group relative aspect-video overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--color-border)] bg-[var(--color-paper-200)] text-left shadow-md"
            aria-label="Přehrát představení Vzpomínkáře - 3 minuty"
          >
            <Image
              src="/placeholder-photos/hero-portrait.jpg"
              alt=""
              fill
              sizes="(min-width: 768px) 60vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy-900)]/55 via-[var(--color-navy-900)]/10 to-transparent" />
            <span className="absolute bottom-6 left-6 flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-navy-900)] shadow-lg backdrop-blur transition-transform group-hover:scale-105">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden>
                  <path d="M7 5.2v11.6c0 .9 1 1.4 1.7.9l8.5-5.8a1.1 1.1 0 0 0 0-1.8L8.7 4.3A1.1 1.1 0 0 0 7 5.2z" />
                </svg>
              </span>
              <span className="font-[family-name:var(--font-display)] text-base text-[var(--color-paper-50)] sm:text-lg">
                3 minuty - proč jsme Vzpomínkář postavili
              </span>
            </span>
          </button>

          <figure className="flex flex-col justify-between rounded-[var(--radius-3xl)] border border-[var(--color-border)] bg-[var(--color-navy-50)] p-7 shadow-sm sm:p-9">
            <blockquote className="font-[family-name:var(--font-display)] text-xl italic leading-snug text-[var(--color-ink-900)] sm:text-2xl">
              {path === "gift"
                ? "„Babičce stačilo zmáčknout jedno tlačítko a mluvit. Z toho se za půl roku stala kniha, kterou doma každý zná.“"
                : "„Z vyprávění, na které bych si bez Vzpomínkáře nikdy nesedl, teď doma máme knihu, kterou ode mě jednou děti zdědí.“"}
            </blockquote>
            <figcaption className="mt-6 text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">
              {path === "gift" ? "- Tereza H., Praha" : "- Petr K., Olomouc"}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── 2. Vertical-rail step list ─────────────────────────────────── */}
      <section className="pb-12 pt-2 sm:pb-24 sm:pt-6">
        <HowItWorksStack steps={steps} />
      </section>

      {/* ── 3. Speech-to-Story demo ────────────────────────────────────── */}
      <section
        id="hlas-do-pribehu"
        className="bg-white py-16 sm:py-24"
      >
        <Fleuron className="mb-10 sm:mb-14" />
        <div className="mx-auto max-w-[var(--container-default)] px-6">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow numeral="III" className="mx-auto">
              Naše technologie
            </SectionEyebrow>
            <h2
              className={cn(editorialHeadingClass, "mt-5")}
              style={{ textWrap: "balance" }}
            >
              Bez psaní. Ale jak?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-muted)]">
              Naše technologie Hlas do příběhu mění mluvenou řeč v plynulý text.
              Vy si vyberete styl a finální podobu si můžete upravit.
            </p>
          </div>

          <div className="mt-14">
            <SpeechToStoryDemo />
          </div>
        </div>
      </section>

      {/* ── 4. Testimonial ─────────────────────────────────────────────── */}
      <section className="bg-[var(--jtf-bg)] py-20 transition-colors duration-[600ms] ease-out sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <svg
            aria-hidden
            width="44"
            height="32"
            viewBox="0 0 44 32"
            className="mx-auto text-[var(--color-gold-400)]"
            fill="currentColor"
          >
            <path d="M0 32V18C0 8.1 5.7 2 14 0v6c-4.2 1.8-7 5.6-7 10h7v16H0zm22 0V18c0-9.9 5.7-16 14-18v6c-4.2 1.8-7 5.6-7 10h7v16H22z" />
          </svg>
          <blockquote
            className="hang-quotes mt-8 font-[family-name:var(--font-display)] text-2xl italic leading-[1.2] text-[var(--color-ink-900)] sm:text-4xl"
            style={{ textWrap: "balance" }}
          >
            {path === "gift"
              ? "„Stačilo, že babička klikla na odkaz a začala mluvit.“"
              : "„Začal jsem nahrávat ve čtvrtek. V neděli už děti poslouchaly příběh, který jsem nikdy nikomu nevyprávěl.“"}
          </blockquote>
          <p className="mt-8 text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-subtle)]">
            {path === "gift" ? "- Jana M., Brno" : "- Martin P., Plzeň"}
          </p>
          <div className="mt-8">
            <ArrowLink href="/#priklady">Přečíst další recenze</ArrowLink>
          </div>
        </div>
      </section>

      {/* ── 5. FAQ + video preview + lifestyle image - 3-col row ───────── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <Link
              href="/faq"
              className="group relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-3xl)] bg-[var(--color-navy-900)] p-8 text-[var(--color-paper-50)] shadow-md transition-transform hover:-translate-y-1 sm:p-10"
            >
              <div>
                <SectionEyebrow dark>Otázky a odpovědi</SectionEyebrow>
                <h3
                  className="mt-5 font-[family-name:var(--font-display)] text-2xl font-normal leading-[1.2] tracking-tight sm:text-3xl"
                  style={{ textWrap: "balance" }}
                >
                  Vše, co potřebujete vědět o Vzpomínkáři
                </h3>
              </div>
              <span className="mt-10 inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-lg">
                Přečíst FAQ
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>

            <button
              type="button"
              aria-label="Přehrát 3-minutové představení"
              className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--color-border)] bg-[var(--color-paper-200)] text-left shadow-md transition-transform hover:-translate-y-1 sm:aspect-auto"
            >
              <Image
                src="/placeholder-photos/babicka-usmev.jpg"
                alt=""
                fill
                sizes="(min-width: 768px) 30vw, 100vw"
                className="object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy-900)]/65 via-[var(--color-navy-900)]/10 to-transparent" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)]/95 text-[var(--color-navy-900)] shadow-lg backdrop-blur transition-transform group-hover:scale-110">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" aria-hidden>
                    <path d="M7 5.2v11.6c0 .9 1 1.4 1.7.9l8.5-5.8a1.1 1.1 0 0 0 0-1.8L8.7 4.3A1.1 1.1 0 0 0 7 5.2z" />
                  </svg>
                </span>
              </span>
              <span className="absolute bottom-6 left-6 right-6 font-[family-name:var(--font-display)] text-lg text-[var(--color-paper-50)]">
                Jak to funguje - 3 minuty
              </span>
            </button>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--color-border)] bg-[var(--color-paper-200)] shadow-md sm:aspect-auto">
              <Image
                src="/placeholder-photos/spolu-na-pohovce.jpg"
                alt="Rodina spolu na pohovce listuje knihou vzpomínek"
                fill
                sizes="(min-width: 768px) 30vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Family experience CTA ───────────────────────────────────── */}
      <section className="bg-[var(--jtf-bg)] py-20 transition-colors duration-[600ms] ease-out sm:py-28">
        <div className="mx-auto max-w-[var(--container-wide)] px-6">
          <div className="grid items-center gap-12 sm:grid-cols-2 sm:gap-16">
            <div>
              <SectionEyebrow numeral="V">Rodinný projekt</SectionEyebrow>
              <h2
                className={cn(editorialHeadingClass, "mt-5")}
                style={{ textWrap: "balance" }}
              >
                {family.title} {family.titleAccent}
              </h2>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-[var(--color-text-muted)]">
                {family.lead}
              </p>

              <ul className="mt-10 space-y-4">
                {family.bullets.map(([title, body]) => (
                  <li key={title} className="flex gap-4">
                    <span
                      aria-hidden
                      className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-gold-400)] bg-[var(--color-gold-100)] text-[var(--color-gold-700)]"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path
                          d="M3 7l3 3 5-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-lg font-normal text-[var(--color-ink-900)]">
                        {title}
                      </p>
                      <p className="mt-1 text-base text-[var(--color-text-muted)]">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link href="/signup" className={buttonVariants({ variant: "primary", size: "lg" })}>
                  Začít zdarma
                </Link>
              </div>
            </div>

            <div className="relative">
              <Placeholder
                kind="image"
                w={1000}
                h={1250}
                aspect="4/5"
                src="/placeholder-photos/spolu-stoji.jpg"
                alt="Tři generace rodiny spolu prochází knihu vzpomínek"
                sizes="(min-width: 768px) 45vw, 100vw"
                className="overflow-hidden rounded-[var(--radius-3xl)] shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Shuffle prompts CTA ─────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-24">
        <Fleuron className="mb-10 sm:mb-14" />
        <div className="mx-auto max-w-[var(--container-default)] px-6">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow numeral="VII" className="mx-auto">
              Z čeho je možné vyprávět
            </SectionEyebrow>
            <h2
              className={cn(editorialHeadingClass, "mt-5")}
              style={{ textWrap: "balance" }}
            >
              {path === "gift"
                ? "Jaké příběhy se v rodině skrývají vám?"
                : "Jaké příběhy stojí za to vyprávět?"}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-muted)]">
              Každý týden přijde jedna otázka, která probudí konkrétní vzpomínku.
              Vyzkoušejte si, jak vypadají - můžete si je zamíchat.
            </p>
          </div>

          <div className="mt-14">
            <ShufflePrompts />
          </div>

          <div className="mt-16 flex flex-col items-center gap-4">
            <Link href="/signup" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Začít zdarma
            </Link>
            <Link
              href="/cenik"
              className="text-sm text-[var(--color-text-muted)] underline-offset-4 hover:underline"
            >
              Nebo se podívejte na ceník →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

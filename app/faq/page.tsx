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
import { FaqList, type Category } from "./faq-list";

export const metadata: Metadata = {
  title: "Časté otázky",
  description:
    "Vše, co potřebujete vědět, než s Vzpomínkářem začnete - od přihlášení seniora po tisk knihy a soukromí dat.",
};

const CATEGORIES: Category[] = [
  {
    id: "zacatek",
    numeral: "I",
    title: "Začátek",
    intro: "Co stojí na začátku a co od vás potřebujeme.",
    items: [
      {
        q: "Pro koho je Vzpomínkář?",
        a: "Pro rodiny, které chtějí zaznamenat vzpomínky rodičů a prarodičů - hlasem, písmem nebo přes fotky - a vytvořit z nich tištěnou knihu. Aplikaci nastavujete vy; vyprávějícímu předáme jednoduchý přístup, který zvládne i bez technické zkušenosti.",
      },
      {
        q: "Kolik vzpomínek je potřeba na knihu?",
        a: "Pro plnohodnotnou knihu doporučujeme alespoň 30 vzpomínek. Můžete jich mít víc - kniha pak bude bohatší. Méně se také nebojte: i 15 dobře vyprávěných příběhů dává krásnou tenkou edici.",
      },
      {
        q: "Jak rychle se rozjedete?",
        a: "Registrace zabere pár minut. První otázka odejde rodiči ten následující pondělí ráno. Než přijde odpověď, můžete v knihovně vybrat další otázky a přidat fotky.",
      },
      {
        q: "Můžu Vzpomínkář dát jako dárek?",
        a: "Ano. Buď koupíte dárkový certifikát, který vytisknete a předáte, nebo si zvolíte konkrétní datum doručení (narozeniny, Vánoce, výročí) a my v ten den pošleme první otázku přímo obdarovanému.",
      },
    ],
  },
  {
    id: "senior",
    numeral: "II",
    title: "Senior",
    intro: "Jak fungují odpovědi pro toho, kdo vypráví.",
    items: [
      {
        q: "Musí umět senior s počítačem?",
        a: "Nemusí. Stačí jednoduchý telefon nebo tablet. Otázku dostane SMSkou nebo e-mailem, jedno kliknutí spustí nahrávání. Žádné účty, žádná aplikace, žádné stahování.",
      },
      {
        q: "Co když senior nezvládne psát?",
        a: "Odpovídá hlasem - jedním tlačítkem nahraje, co chce říct. My nahrávku převedeme do textu, korektor vyhladí věty, ale ponechá způsob, jakým to rodič řekl. V knize zůstane i původní zvuk, schovaný pod QR kódem.",
      },
      {
        q: "A co když nemá ani smartphone?",
        a: "Pošleme jeho odpovědní číslo. Stačí prozvonit, my hovor zaznamenáme a přepíšeme. Funguje i z tlačítkového telefonu.",
      },
      {
        q: "Co když odmítne odpovídat?",
        a: "Pošleme jemnou připomínku po týdnu. Pokud delší dobu mlčí, ozveme se vám i jemu osobně. Někdy stačí změnit otázku, jindy přibrat foto k otázce. Zaplacený rok je váš, ať se rozpovídá kdykoliv.",
      },
    ],
  },
  {
    id: "pribehy",
    numeral: "III",
    title: "Příběhy & soukromí",
    intro: "Komu vzpomínky patří a kdo je vidí.",
    items: [
      {
        q: "Komu patří nahrané vzpomínky?",
        a: "Vám a vaší rodině. My data zpracováváme jen proto, abychom vám pomohli sebrat a vydat knihu. Můžete je kdykoliv stáhnout nebo smazat - bez výmluv, bez prodlev.",
      },
      {
        q: "Je to bezpečné?",
        a: "Audio i fotky leží v privátním úložišti. Přístup k souborům má jen ten, kdo je členem konkrétní rodiny. Stahovací odkazy mají krátkou platnost (15 minut), takže se nedají sdílet dál.",
      },
      {
        q: "Můžu odpovědi sám/sama upravit?",
        a: "Ano. V rodinném editoru vidíte přepis, doplníte fotku, opravíte překlep. Nic ale není povinné - kniha funguje i bez vašeho zásahu, pokud chcete jen poslouchat a být u toho.",
      },
      {
        q: "Můžu zveřejnit knihu jen pro určité členy rodiny?",
        a: "Online knihovnu nasdílíte jen těm, kdo by ji měli vidět. Tištěnou knihu si pak objednáváte vy - a kolik výtisků chcete (pro sourozence, vnoučata).",
      },
    ],
  },
  {
    id: "kniha",
    numeral: "IV",
    title: "Kniha a&nbsp;tisk",
    intro: "Jak vypadá výsledek na vaší poličce.",
    items: [
      {
        q: "Jak dlouho trvá, než kniha vznikne?",
        a: "V průměru 9-12 měsíců. Záleží jen na tom, kolik otázek si vyberete a v jakém tempu rodič odpovídá. Knihu si můžete objednat kdykoliv - nebo počkat, až bude celá hotová.",
      },
      {
        q: "Jak kniha vypadá fyzicky?",
        a: "Tvrdé desky, šitá vazba, papír v krémové barvě, ražba na hřbetě. Formát A5, ručně dokončená. U každé kapitoly QR kód, který spustí původní hlasové vyprávění.",
      },
      {
        q: "Můžu si objednat víc výtisků?",
        a: "Samozřejmě. Většina rodin dělá kopie pro každé dospělé dítě. Druhý výtisk je o 35 % levnější, další pak ještě méně.",
      },
      {
        q: "Co když chci knihu předtím vidět?",
        a: "Online náhled vám ukážeme zdarma - vidíte přesné rozložení stránek, sazbu, fotky. Knihu objednáváte až tehdy, když je vše tak, jak chcete.",
      },
    ],
  },
  {
    id: "predplatne",
    numeral: "V",
    title: "Cena a&nbsp;předplatné",
    intro: "Co platíte, kdy a co dostáváte.",
    items: [
      {
        q: "Kdy a kolik se platí?",
        a: "Roční přístup je v pilotní verzi zdarma. Cenu za tisk knihy uvidíte v ceníku - platí se zvlášť, až ji budete chtít skutečně vytisknout. Žádné automatické předplatné.",
      },
      {
        q: "Co se stane po roce, pokud knihu nestihnu objednat?",
        a: "Online knihovna zůstává navždy zdarma - všechny vzpomínky tam najdete, kdykoliv se vrátíte. Tisk si můžete objednat klidně za pět let. Vzpomínky nemizí.",
      },
      {
        q: "Mohu mít víc seniorů - babičku i dědu?",
        a: "Zatím podporujeme jednoho seniora na rodinu. Pokud chcete dvě paralelní knihy, zaregistrujte se dvakrát. Společný profil pro dva vyprávějící chystáme.",
      },
      {
        q: "Mohu si peníze nechat vrátit?",
        a: "Do 30 dnů od platby ano - bez výmluv, bez otázek. Stačí napsat. Jedno z nejmenších nebezpečí, které u nás máte.",
      },
    ],
  },
  {
    id: "pomoc",
    numeral: "VI",
    title: "Pomoc",
    intro: "Když se zasekne to, co se nemělo.",
    items: [
      {
        q: "Co když budu potřebovat pomoct?",
        a: "Napište nám - odpovídáme rychle a osobně, ne přes chatbota. Většinu drobností vyřešíme do hodiny.",
      },
      {
        q: "Co když rodič udělá v aplikaci chybu?",
        a: "Nic se nerozbije. Všechny odpovědi se dají upravit, smazat nebo přepsat. A pokud rodič nemůže, uděláte to vy v rodinném editoru.",
      },
      {
        q: "Můžu Vzpomínkář používat ze zahraničí?",
        a: "Ano. Otázky chodí stejně, knihovna funguje odkudkoliv. Tisk a doručení mimo ČR účtujeme zvlášť (od 350 Kč podle země).",
      },
    ],
  },
];

function stripHtml(s: string): string {
  return s.replace(/&nbsp;/g, " ").replace(/&[a-z]+;/gi, "").replace(/<[^>]+>/g, "").trim();
}

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({
      "@type": "Question",
      name: stripHtml(item.q),
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(item.a),
      },
    })),
  ),
};

export default function FaqPage() {
  return (
    <Shell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      {/* Hero */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pt-16 pb-12 text-center sm:pt-24">
        <SectionEyebrow className="mx-auto">Časté dotazy</SectionEyebrow>
        <h1
          className="mx-auto mt-5 max-w-[22ch] font-[family-name:var(--font-display)] text-3xl font-normal leading-[1.08] tracking-tight text-[var(--color-ink-900)] sm:text-5xl"
          style={{ textWrap: "balance" }}
        >
          Na co se ptáte nejčastěji.
        </h1>
        <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--color-text-muted)]">
          Pokud něco z následujícího nezodpovíme, napište nám - odpovídáme
          osobně, ne přes formulář.
        </p>
      </section>

      {/* TOC + Q&A - searchable */}
      <section className="mx-auto max-w-[var(--container-wide)] px-6 pb-16">
        <FaqList categories={CATEGORIES} />
      </section>

      {/* Closing CTA */}
      <section className="bg-white py-16 sm:py-24">
        <Fleuron className="mb-10 sm:mb-14" />
        <div className="mx-auto max-w-3xl px-6 text-center" data-reveal>
          <SectionEyebrow className="mx-auto">Stále váháte?</SectionEyebrow>
          <h2
            className={cn(editorialHeadingClass, "mx-auto mt-5 max-w-[26ch]")}
            style={{ textWrap: "balance" }}
          >
            Vyzkoušejte první týdny zdarma. Pokud to není pro vás,
            do 30&nbsp;dnů vrátíme peníze.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Začít zdarma
            </Link>
            <Link
              href="/cenik"
              className="font-[family-name:var(--font-display)] text-lg text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
            >
              Zpět na ceník →
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}

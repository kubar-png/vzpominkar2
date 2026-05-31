import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { FinalCta, FinalCtaFooterLink } from "@/components/landing/FinalCta";
import { FaqList, type Category } from "./faq-list";

export const metadata: Metadata = {
  title: "Časté otázky",
  description:
    "Vše, co potřebujete vědět, než s Vzpomínkářem začnete — od přihlášení seniora po tisk knihy a soukromí dat.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * /faq — full editorial rebuild
 *
 * Hero + grouped accordion via FaqList (client search). Uses homepage
 * .faq-item gold-circle toggles for the accordion so reading from
 * homepage → here feels seamless.
 * ─────────────────────────────────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  {
    id: "zacatek",
    numeral: "I",
    title: "Začátek",
    intro: "Co stojí na začátku a co od vás potřebujeme.",
    items: [
      {
        q: "Pro koho je Vzpomínkář?",
        a: "Pro rodiny, které chtějí zaznamenat vzpomínky rodičů a prarodičů — hlasem, písmem nebo přes fotky — a vytvořit z nich tištěnou knihu. Aplikaci nastavujete vy; vyprávějícímu předáme jednoduchý přístup, který zvládne i bez technické zkušenosti.",
      },
      {
        q: "Kolik vzpomínek je potřeba na knihu?",
        a: "Pro plnohodnotnou knihu doporučujeme alespoň 30 vzpomínek. Můžete jich mít víc — kniha pak bude bohatší. Méně se také nebojte: i 15 dobře vyprávěných příběhů dává krásnou tenkou edici.",
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
    title: "Vyprávějící",
    intro: "Jak fungují odpovědi pro toho, kdo vypráví.",
    items: [
      {
        q: "Musí umět senior s počítačem?",
        a: "Nemusí. Stačí jednoduchý telefon nebo tablet. Otázku dostane SMSkou nebo e-mailem, jedno kliknutí spustí nahrávání. Žádné účty, žádná aplikace, žádné stahování.",
      },
      {
        q: "Co když senior nezvládne psát?",
        a: "Odpovídá hlasem — jedním tlačítkem nahraje, co chce říct. My nahrávku převedeme do textu, korektor vyhladí věty, ale ponechá způsob, jakým to rodič řekl. V knize zůstane i původní zvuk, schovaný pod QR kódem.",
      },
      {
        q: "A co když nemá ani smartphone?",
        a: "Pošleme jeho odpovědní číslo. Stačí prozvonit, my hovor zaznamenáme a přepíšeme. Funguje i z tlačítkového telefonu.",
      },
      {
        q: "Co když odmítne odpovídat?",
        a: "Pošleme jemnou připomínku po týdnu. Pokud delší dobu mlčí, ozveme se vám i jemu osobně. Někdy stačí změnit otázku, jindy přibrat foto k otázce. Zaplacený přístup je váš napořád, ať se rozpovídá kdykoliv.",
      },
    ],
  },
  {
    id: "soukromi",
    numeral: "III",
    title: "Soukromí a&nbsp;data",
    intro: "Komu vzpomínky patří a kdo je vidí.",
    items: [
      {
        q: "Komu patří nahrané vzpomínky?",
        a: "Vám a vaší rodině. My data zpracováváme jen proto, abychom vám pomohli sebrat a vydat knihu. Můžete je kdykoliv stáhnout nebo smazat — bez výmluv, bez prodlev.",
      },
      {
        q: "Je to bezpečné?",
        a: "Audio i fotky leží v privátním úložišti. Přístup k souborům má jen ten, kdo je členem konkrétní rodiny. Stahovací odkazy mají krátkou platnost (15 minut), takže se nedají sdílet dál.",
      },
      {
        q: "Můžu odpovědi sám/sama upravit?",
        a: "Ano. V rodinném editoru vidíte přepis, doplníte fotku, opravíte překlep. Nic ale není povinné — kniha funguje i bez vašeho zásahu, pokud chcete jen poslouchat a být u toho.",
      },
      {
        q: "Můžu zveřejnit knihu jen pro určité členy rodiny?",
        a: "Online knihovnu nasdílíte jen těm, kdo by ji měli vidět. Tištěnou knihu si pak objednáváte vy — a kolik výtisků chcete (pro sourozence, vnoučata).",
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
        a: "V průměru 9–12 měsíců. Záleží jen na tom, kolik otázek si vyberete a v jakém tempu rodič odpovídá. Knihu si můžete objednat kdykoliv — nebo počkat, až bude celá hotová.",
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
        a: "Online náhled vám ukážeme zdarma — vidíte přesné rozložení stránek, sazbu, fotky. Knihu objednáváte až tehdy, když je vše tak, jak chcete.",
      },
    ],
  },
  {
    id: "cena",
    numeral: "V",
    title: "Cena a&nbsp;platba",
    intro: "Co platíte, kdy a co dostáváte.",
    items: [
      {
        q: "Kdy a kolik se platí?",
        a: "Jednorázových 2 890 Kč za přístup k jedné knize — jeden blízký a až 52 otázek, napořád. Žádné předplatné, nic se neobnovuje. Další blízký nebo další díl stojí 1 790 Kč. Tisk knihy se platí zvlášť, až ji budete chtít vytisknout.",
      },
      {
        q: "Co se stane, když vyčerpám 52 otázek?",
        a: "Tím je kniha plná. Můžete objednat tisk a/nebo si pořídit další díl (1 790 Kč) a plynule pokračovat — vznikne Díl 2 s dalšími 52 otázkami o stejném blízkém. Přístup k hotové knize i vzpomínkám máte napořád.",
      },
      {
        q: "Mohu mít víc seniorů — babičku i dědu?",
        a: "Ano. Dalšího blízkého přidáte za 1 790 Kč — každý má svou vlastní knihu a svůj jednoduchý přístup. Babička i děda tak mohou vyprávět souběžně, každý svůj příběh.",
      },
      {
        q: "Mohu si peníze nechat vrátit?",
        a: "Do 30 dnů od platby ano — bez výmluv, bez otázek. Stačí napsat.",
      },
    ],
  },
  {
    id: "pomoc",
    numeral: "VI",
    title: "Po objednávce",
    intro: "Když se zasekne to, co se nemělo.",
    items: [
      {
        q: "Co když budu potřebovat pomoct?",
        a: "Napište nám — odpovídáme rychle a osobně, ne přes chatbota. Většinu drobností vyřešíme do hodiny.",
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
        dangerouslySetInnerHTML={{
          // Escape `</` so a future dynamic FAQ value can't break out of
          // the script tag with `</script>`.
          __html: JSON.stringify(FAQ_JSON_LD).replace(/<\//g, "<\\/"),
        }}
      />

      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Časté otázky</span>
          <h1 style={{ maxWidth: "22ch", margin: "0 auto 24px" }}>
            Na co se ptáte nejčastěji.
          </h1>
          <p className="lede">
            Pokud něco z následujícího nezodpovíme, napište nám — odpovídá
            člověk, ne formulář.
          </p>
        </div>
      </section>

      {/* ═══════════ GROUPED Q&A ═══════════ */}
      <div className="divider" aria-hidden />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <FaqList categories={CATEGORIES} />
        </div>
      </section>

      {/* ═══════════ FINAL CTA — navy signup-card ═══════════ */}
      <FinalCta
        eyebrow="Stále váháte?"
        heading="Přístup ke knize s 30denní zárukou vrácení peněz."
        lede="Jednorázových 2 890 Kč. Pokud to není pro vás, do 30 dnů vrátíme peníze bez výmluv."
        footer={
          <>
            Nenašli jste odpověď?{" "}
            <FinalCtaFooterLink href="/kontakt">Napište nám</FinalCtaFooterLink>.
          </>
        }
      />
    </Shell>
  );
}

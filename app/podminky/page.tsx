import type { Metadata } from "next";
import { Shell } from "@/components/landing/Shell";
import {
  SectionEyebrow,
  editorialHeadingClass,
} from "@/components/landing/Editorial";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Obchodní podmínky",
  description:
    "Obchodní podmínky služby Vzpomínkář - rok týdenních otázek a ručně vázané knihy vzpomínek.",
};

export default function PodminkyPage() {
  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <SectionEyebrow>Právní</SectionEyebrow>
        <h1
          className={cn(editorialHeadingClass, "mt-5")}
          style={{ textWrap: "balance" }}
        >
          Obchodní podmínky
        </h1>
        <p className="mt-6 text-sm text-[var(--color-text-subtle)]">
          Verze platná od 1. ledna 2026.
        </p>

        <div className="prose-vzp mt-10 space-y-6 text-base leading-relaxed text-[var(--color-text)]">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            1. Kdo jsme
          </h2>
          <p>
            Vzpomínkář provozuje fyzická osoba Jakub Š., IČ pilotně bez zápisu,
            kontakt: <a href="mailto:ahoj@vzpominkar.cz" className="text-[var(--color-navy-800)] underline-offset-4 hover:underline">ahoj@vzpominkar.cz</a>.
            V této pilotní verzi (MVP) testujeme službu s prvními rodinami.
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            2. Co služba dělá
          </h2>
          <p>
            Jednou týdně posíláme dohodnuté osobě otázku o jejím životě (SMS
            nebo e-mailem). Odpovědi (hlasové i textové) ukládáme do soukromé
            online knihovny vaší rodiny. Po skončení období si můžete objednat
            ručně vázaný tištěný výtisk s QR kódy, které přehrají původní hlas.
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            3. Cena a platba
          </h2>
          <p>
            V pilotní verzi je roční přístup zdarma. Tištěná kniha se objednává
            samostatně; konečnou cenu uvidíte před potvrzením objednávky.
            Žádné automatické předplatné se neúčtuje.
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            4. Garance vrácení peněz
          </h2>
          <p>
            Pokud do 30 dnů od první platby zjistíte, že vám služba nevyhovuje,
            stačí napsat na náš e-mail a my peníze vrátíme bez dalších otázek.
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            5. Vaše data
          </h2>
          <p>
            Nahrávky, fotky a přepisy patří vám a vaší rodině. Můžete je
            kdykoliv stáhnout nebo smazat. Podrobnosti popisuje{" "}
            <a href="/soukromi" className="text-[var(--color-navy-800)] underline-offset-4 hover:underline">
              prohlášení o&nbsp;soukromí
            </a>
            .
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            6. Reklamace
          </h2>
          <p>
            Vady tištěné knihy (vazba, tisk) řešíme zdarma do 14 dnů od
            doručení. Stačí poslat e-mail s fotkou problému; nahrazení nebo
            vrácení peněz vyřídíme do 7 dnů.
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            7. Změny
          </h2>
          <p>
            Tyto podmínky můžeme upravit; o&nbsp;podstatných změnách budeme
            informovat e-mailem alespoň 14 dní předem. Pokud nesouhlasíte,
            můžete účet bez sankcí ukončit.
          </p>

          <p className="pt-6 text-sm text-[var(--color-text-subtle)]">
            Máte-li otázku, napište na{" "}
            <a href="mailto:ahoj@vzpominkar.cz" className="text-[var(--color-navy-800)] underline-offset-4 hover:underline">
              ahoj@vzpominkar.cz
            </a>
            . Odpovídáme osobně, obvykle do jednoho pracovního dne.
          </p>
        </div>
      </section>
    </Shell>
  );
}

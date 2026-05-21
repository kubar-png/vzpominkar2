import type { Metadata } from "next";
import { Shell } from "@/components/landing/Shell";
import {
  SectionEyebrow,
  editorialHeadingClass,
} from "@/components/landing/Editorial";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Prohlášení o soukromí",
  description:
    "Jak nakládáme s vašimi vzpomínkami, hlasy, fotkami a osobními údaji ve službě Vzpomínkář.",
};

export default function SoukromiPage() {
  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <SectionEyebrow>Právní</SectionEyebrow>
        <h1
          className={cn(editorialHeadingClass, "mt-5")}
          style={{ textWrap: "balance" }}
        >
          Prohlášení o soukromí
        </h1>
        <p className="mt-6 text-sm text-[var(--color-text-subtle)]">
          Verze platná od 1. ledna 2026. Zpracováváme údaje podle nařízení GDPR.
        </p>

        <div className="prose-vzp mt-10 space-y-6 text-base leading-relaxed text-[var(--color-text)]">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            Jaké údaje zpracováváme
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Jméno, e-mail a telefonní číslo zadavatele a vyprávějícího.</li>
            <li>Nahrávky hlasu, přepisy, fotky a textové vzpomínky.</li>
            <li>Technické údaje (IP, prohlížeč) pro provoz a bezpečnost.</li>
          </ul>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            Proč je zpracováváme
          </h2>
          <p>
            Jen pro to, abychom mohli posílat otázky, ukládat odpovědi
            a&nbsp;vyrobit vám knihu. Data nikomu neprodáváme a&nbsp;nepoužíváme
            je k&nbsp;reklamě.
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            Komu data svěřujeme
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Hostingu (Vercel, Supabase) v&nbsp;EU regionu.</li>
            <li>Přepisové službě pro automatické převedení hlasu do textu.</li>
            <li>Tiskárně, která vytiskne vaši knihu. Po dotisku se data smažou.</li>
          </ul>
          <p>
            Všichni partneři podléhají písemné smlouvě o&nbsp;zpracování osobních
            údajů.
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            Vaše práva
          </h2>
          <p>
            Můžete si data kdykoliv stáhnout, opravit nebo nechat smazat.
            Stačí napsat na{" "}
            <a href="mailto:soukromi@vzpominkar.cz" className="text-[var(--color-navy-800)] underline-offset-4 hover:underline">
              soukromi@vzpominkar.cz
            </a>
            . Vyhovíme nejpozději do 14 dnů.
          </p>
          <p>
            Můžete také podat stížnost u&nbsp;Úřadu pro ochranu osobních údajů
            (uoou.cz).
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            Jak dlouho data držíme
          </h2>
          <p>
            Vzpomínky držíme tak dlouho, dokud chcete účet zachovat. Po smazání
            účtu obsah odstraníme do 30 dnů; ze záloh do 90 dnů.
          </p>
        </div>
      </section>
    </Shell>
  );
}

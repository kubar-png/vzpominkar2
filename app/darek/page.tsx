import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { buttonVariants } from "@/components/ui/button";
import {
  SectionEyebrow,
  editorialHeadingClass,
} from "@/components/landing/Editorial";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Vzpomínkář jako dárek",
  description:
    "Darujte rodičům rok týdenních otázek a hotovou knihu vzpomínek. Doručíme v den, který si zvolíte.",
};

const BENEFITS: ReadonlyArray<readonly [string, string]> = [
  [
    "Vyberete datum doručení",
    "Mother's Day, narozeniny, Vánoce nebo libovolný den - my v ten den pošleme první otázku.",
  ],
  [
    "Žádné aplikace pro obdarovaného",
    "Otázka přijde SMSkou nebo e-mailem. Stačí kliknout a začít vyprávět.",
  ],
  [
    "Vy vidíte, jak kniha vzniká",
    "Můžete poslouchat odpovědi, přidávat fotky, navrhovat další otázky - bez tlaku.",
  ],
  [
    "Hotová kniha s hlasem",
    "Po roce dorazí ručně vázaná kniha. U každé kapitoly QR kód s původní nahrávkou.",
  ],
];

export default function DarekPage() {
  return (
    <Shell>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center sm:pt-24">
        <SectionEyebrow className="mx-auto">Jako dárek</SectionEyebrow>
        <h1
          className={cn(editorialHeadingClass, "mx-auto mt-5 max-w-[22ch]")}
          style={{ textWrap: "balance" }}
        >
          Darujte rok vyprávění a&nbsp;knihu, která zůstane.
        </h1>
        <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
          Vzpomínkář pošle obdarovanému e-mail s&nbsp;první otázkou v&nbsp;den,
          který si zvolíte. Vy sledujete, jak z&nbsp;týdenních nahrávek roste
          ručně vázaná kniha jejich života.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-3">
          <Link
            href="/signup"
            className={buttonVariants({ size: "lg" })}
          >
            Darovat Vzpomínkář
          </Link>
          <Link
            href="/darek/certifikat"
            className="font-[family-name:var(--font-display)] text-lg text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
          >
            Dárkový certifikát -&gt;
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <ul className="grid gap-6 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-10">
          {BENEFITS.map(([title, body], i) => (
            <li key={title} className="text-left">
              <p className="tnum-old text-[10px] uppercase tracking-[0.32em] text-[var(--color-red-700)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
                {title}
              </p>
              <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}

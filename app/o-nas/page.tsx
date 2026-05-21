import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/landing/Shell";
import { buttonVariants } from "@/components/ui/button";
import {
  SectionEyebrow,
  Fleuron,
  editorialHeadingClass,
} from "@/components/landing/Editorial";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Náš příběh",
  description:
    "Proč jsme Vzpomínkář postavili. Příběh, který za projektem stojí.",
};

export default function ONasPage() {
  return (
    <Shell>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center sm:pt-24">
        <SectionEyebrow className="mx-auto">Náš příběh</SectionEyebrow>
        <h1
          className={cn(editorialHeadingClass, "mx-auto mt-5 max-w-[20ch]")}
          style={{ textWrap: "balance" }}
        >
          Proč Vzpomínkář vznikl.
        </h1>
      </section>

      <Fleuron className="mb-8 sm:mb-12" />

      {/* Founder story */}
      <section className="mx-auto max-w-2xl px-6 pb-20">
        <div className="prose-vzp space-y-6 text-base leading-relaxed text-[var(--color-text)] sm:text-lg">
          <p>
            V roce 2024 mi babička v&nbsp;devadesáti zemřela. Zbyly tři fotky
            a&nbsp;krabice s&nbsp;pohlednicemi. Koupil jsem mámě knížku na
            psaní vzpomínek - nikdy ji nepoužila. &bdquo;Psaní mi přijde jako
            domácí úkol,&ldquo; řekla mi.
          </p>
          <p>
            Tak jsem vytáhl telefon, zmáčkl nahrávání a&nbsp;začali jsme se
            prostě bavit. Naučil jsem se o&nbsp;svojí mámě víc, než bych si
            kdy uměl představit. A&nbsp;hlavně - mám její hlas. Slyším ji
            kdykoliv chci.
          </p>
          <p>
            Z&nbsp;toho vznikl Vzpomínkář: tak jednoduchý, aby ho zvládla
            i&nbsp;moje máma. Aby žádná rodina nemusela jednou litovat, že to
            nestihla.
          </p>

          <p
            aria-hidden
            className="pt-4 font-[family-name:var(--font-script)] text-3xl leading-none text-[var(--color-navy-700)]"
          >
            Jakub
          </p>
          <p className="text-sm text-[var(--color-text-subtle)]">
            Zakladatel, Vzpomínkář
          </p>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Začít zdarma
          </Link>
          <Link
            href="/jak-to-funguje"
            className="font-[family-name:var(--font-display)] text-lg text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
          >
            Jak to funguje -&gt;
          </Link>
        </div>
      </section>
    </Shell>
  );
}

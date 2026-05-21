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
  title: "Dárkový certifikát",
  description:
    "Vytiskněte krásný certifikát s pečetí a předejte jej osobně. Obdarovaný se přihlásí, kdy bude chtít.",
};

export default function CertifikatPage() {
  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center sm:pt-24">
        <SectionEyebrow className="mx-auto">Dárek osobně</SectionEyebrow>
        <h1
          className={cn(editorialHeadingClass, "mx-auto mt-5 max-w-[22ch]")}
          style={{ textWrap: "balance" }}
        >
          Vytisknete certifikát a&nbsp;předáte jej z&nbsp;ruky do ruky.
        </h1>
        <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
          Vzpomínkář vám připraví elegantní PDF s&nbsp;pečetí a&nbsp;osobní zprávou.
          Vytisknete na běžné A5, vložíte do obálky - a&nbsp;dárek je hmatatelný
          ještě před prvním vyprávěním.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-3">
          <Link
            href="/signup"
            className={buttonVariants({ size: "lg" })}
          >
            Začít zdarma
          </Link>
          <Link
            href="/darek"
            className="font-[family-name:var(--font-display)] text-lg text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
          >
            &lt;- Zpět na dárky
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-20">
        <div className="space-y-6 text-base leading-relaxed text-[var(--color-text)]">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--color-ink-900)]">
            Co dárkový certifikát obsahuje
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Vaše osobní věnování v&nbsp;textu certifikátu.</li>
            <li>Unikátní kód, kterým se obdarovaný přihlásí.</li>
            <li>Vysvětlení, jak služba funguje, dotyčného nepřekvapí.</li>
            <li>Návod, kde najde první otázku.</li>
          </ul>

          <p>
            Certifikát si stáhnete ihned po objednání. Obdarovaný se může
            přihlásit, kdy bude chtít - rok týdenních otázek začne až
            v&nbsp;den, kdy poprvé klikne.
          </p>
        </div>
      </section>
    </Shell>
  );
}

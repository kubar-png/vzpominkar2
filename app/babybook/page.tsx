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
  title: "Babybook - kniha vzpomínek pro vaše dítě",
  description:
    "Zachyťte první chvíle vašeho dítěte a vzpomínky za každou z nich. Babybook od Vzpomínkáře.",
};

export default function BabybookPage() {
  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center sm:pt-24">
        <SectionEyebrow className="mx-auto">Babybook</SectionEyebrow>
        <h1
          className={cn(editorialHeadingClass, "mx-auto mt-5 max-w-[22ch]")}
          style={{ textWrap: "balance" }}
        >
          První roky života. Vaším hlasem.
        </h1>
        <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
          Babybook je verze Vzpomínkáře pro mladé rodiče. Týdenní otázky o
          dítěti, fotky, hlasové vzkazy. Po roce dorazí ručně vázaná kniha,
          kterou dítě dostane jednou jako dárek.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-3">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Začít zdarma
          </Link>
          <Link
            href="/cenik"
            className="font-[family-name:var(--font-display)] text-lg text-[var(--color-navy-800)] underline-offset-[6px] hover:underline"
          >
            Podívat se na ceník -&gt;
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-20">
        <p className="text-center text-sm text-[var(--color-text-subtle)]">
          Babybook je nyní v&nbsp;přípravě. Zaregistrujte se a&nbsp;ozveme se vám
          hned, jak ho spustíme.
        </p>
      </section>
    </Shell>
  );
}

import type { Metadata } from "next";
import { Shell } from "@/components/landing/Shell";
import {
  SectionEyebrow,
  editorialHeadingClass,
} from "@/components/landing/Editorial";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Napište nám - odpovídáme osobně, obvykle do hodiny.",
};

export default function KontaktPage() {
  return (
    <Shell>
      <section className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-24">
        <SectionEyebrow className="mx-auto">Kontakt</SectionEyebrow>
        <h1
          className={cn(editorialHeadingClass, "mx-auto mt-5 max-w-[20ch]")}
          style={{ textWrap: "balance" }}
        >
          Napište nám rovnou - odpovídá člověk.
        </h1>
        <p className="mx-auto mt-6 max-w-prose text-base leading-relaxed text-[var(--color-text-muted)]">
          Žádné formuláře, žádný chatbot. Odpovídá vám jeden z&nbsp;nás osobně,
          obvykle do hodiny v&nbsp;pracovní době.
        </p>

        <div className="mx-auto mt-10 grid max-w-md gap-3 text-left">
          <a
            href="mailto:ahoj@vzpominkar.cz"
            className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white px-5 py-4 text-base text-[var(--color-ink-900)] transition-colors hover:border-[var(--color-navy-300)]"
          >
            <span className="font-[family-name:var(--font-display)]">
              ahoj@vzpominkar.cz
            </span>
            <span className="text-[var(--color-text-subtle)]" aria-hidden>
              -&gt;
            </span>
          </a>
          <a
            href="mailto:soukromi@vzpominkar.cz"
            className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white px-5 py-4 text-base text-[var(--color-ink-900)] transition-colors hover:border-[var(--color-navy-300)]"
          >
            <span className="font-[family-name:var(--font-display)]">
              soukromi@vzpominkar.cz
            </span>
            <span className="text-[var(--color-text-subtle)]" aria-hidden>
              -&gt;
            </span>
          </a>
        </div>

        <p className="mt-12 text-sm leading-relaxed text-[var(--color-text-subtle)]">
          Vzpomínkář provozuje Jakub Š. Pilotní verze testovaná
          s&nbsp;prvními rodinami v&nbsp;Česku.
        </p>
      </section>
    </Shell>
  );
}

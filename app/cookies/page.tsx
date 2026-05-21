import type { Metadata } from "next";
import { Shell } from "@/components/landing/Shell";
import {
  SectionEyebrow,
  editorialHeadingClass,
} from "@/components/landing/Editorial";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cookies",
  description: "Jaké cookies a podobné technologie používáme na Vzpomínkáři.",
};

export default function CookiesPage() {
  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <SectionEyebrow>Právní</SectionEyebrow>
        <h1
          className={cn(editorialHeadingClass, "mt-5")}
          style={{ textWrap: "balance" }}
        >
          Cookies a&nbsp;podobné technologie
        </h1>

        <div className="prose-vzp mt-10 space-y-6 text-base leading-relaxed text-[var(--color-text)]">
          <p>
            Vzpomínkář používá jen nezbytné cookies pro provoz - bez nich byste
            se nepřihlásili. Žádný tracking pro reklamu nebo třetí strany.
          </p>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            Co konkrétně ukládáme
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Přihlašovací relaci (Supabase Auth, vypršení 7 dní).</li>
            <li>Preferenci jazyka a nastavení mobilního menu.</li>
            <li>Anonymní metriku rychlosti načítání (Vercel Speed Insights).</li>
          </ul>

          <h2 className="font-[family-name:var(--font-display)] text-xl font-normal text-[var(--color-ink-900)]">
            Co nepoužíváme
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Google Analytics, Facebook Pixel ani jiné reklamní trackery.</li>
            <li>Cookies třetích stran pro profilování.</li>
          </ul>

          <p>
            Cookies můžete kdykoliv smazat v&nbsp;nastavení prohlížeče. Při
            smazání budete jen muset znovu přihlásit.
          </p>
        </div>
      </section>
    </Shell>
  );
}

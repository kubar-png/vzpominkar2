import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/site";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "Jaké cookies Vzpomínkář používá, k čemu jsou potřeba a jak je můžete vypnout.",
  alternates: { canonical: canonical("/cookies") },
};

export default function CookiesPage() {
  return (
    <LegalLayout
      title={
        <>
          Co o vás ukládáme do prohlížeče.
        </>
      }
      intro={
        <>
          Přiznáváme se ke každému cookie, který používáme. Žádné skryté
          trackery, žádné reklamní sítě.
        </>
      }
      updatedAt="21. 5. 2026"
    >
      <h2>Co je cookie</h2>
      <p>
        Cookie je krátký textový soubor, který si váš prohlížeč ukládá, abychom
        si vás při další návštěvě pamatovali &mdash; třeba aby vás nemusel
        odhlašovat při každém kliknutí. Některé cookies stránka potřebuje,
        aby vůbec fungovala. Jiné jsou volitelné a&nbsp;můžete je odmítnout.
      </p>

      <h2>Jaké cookies používáme</h2>

      <h3>Nezbytné &mdash; vždy zapnuté</h3>
      <p>
        Bez nich by služba nefungovala. Souhlas se nevyžaduje, protože vyplývají
        ze samé podstaty toho, co po nás chcete (přihlásit vás, načíst data).
      </p>
      <dl>
        <dt>sb-access-token, sb-refresh-token</dt>
        <dd>
          Supabase autentizace. Drží vás přihlášené. Bez nich by vás stránka
          odhlásila po každém kliknutí. Platnost 7 dní.
        </dd>
        <dt>vzp-promo-dismissed</dt>
        <dd>
          Pamatuje si, že jste zavřeli horní promo lištu, ať se nezobrazuje
          znovu. Platnost 30 dní.
        </dd>
        <dt>vzp-cookie-consent</dt>
        <dd>
          Pamatuje si vaši volbu ohledně volitelných cookies, ať se vás
          neptáme znovu. Platnost 12 měsíců.
        </dd>
      </dl>

      <h3>Analytické &mdash; jen po souhlasu</h3>
      <p>
        Pomáhají nám pochopit, které stránky lidé navštěvují a&nbsp;kde se
        zasekávají. Žádná identifikace jednotlivců, žádné prodávání dat.
      </p>
      <dl>
        <dt>_pk_id, _pk_ses (Plausible/Umami)</dt>
        <dd>
          Anonymní statistiky návštěvnosti. IP adresy se hashují, nikdy
          neukládáme celou adresu. Platnost 30 minut (relace) / 13 měsíců
          (návratnost).
        </dd>
      </dl>

      <h3>Co u nás nikdy nenajdete</h3>
      <ul>
        <li>Reklamní cookies třetích stran (Google Ads, Meta, TikTok).</li>
        <li>Trackingové pixely pro retargeting.</li>
        <li>
          Cookies sdílené napříč weby (third-party). Všechny naše cookies jsou
          first-party.
        </li>
      </ul>

      <h2>Jak souhlas spravovat</h2>
      <p>
        Při první návštěvě se objeví lišta, kde můžete volitelné cookies
        odmítnout nebo přijmout. Volbu lze kdykoliv změnit:
      </p>
      <ul>
        <li>
          Volbu lze kdykoliv změnit tak, že smažete cookies a&nbsp;localStorage
          tohoto webu v&nbsp;nastavení soukromí prohlížeče &mdash; lišta se
          souhlasem se pak při další návštěvě objeví znovu.
        </li>
        <li>
          Cookies lze také smazat přímo v&nbsp;prohlížeči &mdash; všechny
          moderní prohlížeče to umí v&nbsp;nastavení soukromí.
        </li>
      </ul>

      <h2>Místní úložiště (localStorage)</h2>
      <p>
        Kromě cookies používáme i&nbsp;localStorage prohlížeče &mdash; tam si
        ukládáme rozpracovaný text vzpomínky, abyste o&nbsp;něj nepřišli, pokud
        zavřete kartu. Tato data nikdy neopouští váš počítač.
      </p>

      <h2>Otázky?</h2>
      <p>
        Pokud chcete přesně vědět, co která hodnota dělá, napište nám &mdash;
        odpovídáme osobně. Detaily o&nbsp;širším zpracování dat najdete
        v&nbsp;dokumentu <Link href="/soukromi">Ochrana soukromí</Link>.
      </p>
    </LegalLayout>
  );
}

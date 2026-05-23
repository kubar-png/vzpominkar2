import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Obchodní podmínky",
  description:
    "Pravidla, za kterých Vzpomínkář poskytuje službu sběru rodinných vzpomínek a tisku rodinné kroniky.",
};

export default function PodminkyPage() {
  return (
    <LegalLayout
      eyebrow="Obchodní podmínky"
      title={
        <>
          Pravidla, za kterých Vzpomínkář funguje.
        </>
      }
      intro={
        <>
          Stručně a srozumitelně. Pokud něco není jasné, napište nám &mdash;
          radši to vysvětlíme než aby se kdokoli ocitl v&nbsp;překvapení.
        </>
      }
      updatedAt="21. 5. 2026"
    >
      <h2>1. Kdo jsme</h2>
      <p>
        Provozovatelem služby Vzpomínkář je <strong>Vzpomínkář, s. r. o.</strong>,
        se sídlem v Praze, IČO bude doplněno před spuštěním placené verze.
        Kontaktní e-mail najdete na stránce{" "}
        <Link href="/kontakt">kontakt</Link>.
      </p>
      <p>
        Tyto podmínky platí pro každého, kdo si u nás vytvoří účet — ať už
        jako rodinný správce, nebo jako vyprávějící senior, kterého do služby
        pozval někdo z rodiny.
      </p>

      <h2>2. Co služba dělá</h2>
      <p>
        Vzpomínkář pomáhá rodinám sbírat vzpomínky starší generace ve formě
        krátkých týdenních otázek. Odpovědi (hlasové, psané nebo s fotkou)
        ukládáme do soukromé rodinné knihovny. Z těchto odpovědí později
        vznikne tištěná rodinná kronika &mdash; teprve tehdy, když ji budete
        chtít skutečně vytisknout.
      </p>
      <p>
        Online přístup do knihovny vám zůstává trvale, i kdyby ke knize nikdy
        nedošlo.
      </p>

      <h2>3. Účet a registrace</h2>
      <h3>Rodinný správce</h3>
      <p>
        Účet rodinného správce je vázán na e-mailovou adresu a heslo. Jeden
        správce může spravovat jednu rodinu (jednoho vyprávějícího). Zavazujete
        se uvádět pravdivé údaje a držet přístupové údaje v bezpečí.
      </p>
      <h3>Senior (vyprávějící)</h3>
      <p>
        Senior přístup vytváří správce z dashboardu. Senior nikdy nezadává
        e-mail &mdash; přihlašuje se uživatelským jménem a heslem, které mu
        vytisknete nebo předáte osobně. Heslo lze kdykoliv vygenerovat znovu.
      </p>

      <h2>4. Cena a platba</h2>
      <p>
        V aktuální verzi MVP je roční přístup zdarma. Po skončení testovacího
        období bude služba nabízena za jednorázový roční poplatek (ne
        předplatné &mdash; nic se neobnovuje automaticky).
      </p>
      <p>
        Tisk fyzické knihy se účtuje zvlášť, ve chvíli kdy si knihu objednáte.
        Cenu uvidíte na stránce <Link href="/cenik">ceník</Link> a v okamžiku
        objednávky před potvrzením platby.
      </p>

      <h2>5. Vrácení peněz</h2>
      <p>
        Pokud zjistíte, že Vzpomínkář pro vaši rodinu není to pravé, máte
        nárok na <strong>vrácení peněz do 30 dnů</strong> od platby ročního
        přístupu &mdash; bez výmluv a bez nutnosti zdůvodnit důvod.
      </p>
      <p>
        U již zhotovené tištěné knihy (kniha je vyrobena na míru) vrácení peněz
        nelze nárokovat. Pokud kniha dorazí poškozená nebo s tiskovou chybou,
        vyrobíme novou na naše náklady.
      </p>

      <h2>6. Vaše data a soukromí</h2>
      <p>
        Vzpomínky, audio a fotky patří vám &mdash; jejich vlastníkem zůstává
        vaše rodina. My data zpracováváme jen proto, abychom službu mohli
        provozovat. Detaily najdete v samostatném dokumentu{" "}
        <Link href="/soukromi">Ochrana soukromí</Link>.
      </p>
      <p>
        Můžete kdykoliv požádat o export všech dat ve strojově čitelném formátu
        nebo o jejich smazání. Vyřídíme do 30 dnů.
      </p>

      <h2>7. Co od vás chceme</h2>
      <ul>
        <li>
          Aby vyprávějící senior věděl, že jeho odpovědi nahráváme &mdash;
          a souhlasil s tím.
        </li>
        <li>
          Aby fotky a vzpomínky, které do služby vložíte, byly skutečně vaše
          nebo vaší rodiny. Cizí obsah do knihy nepatří.
        </li>
        <li>
          Aby se služba nepoužívala k šíření nenávisti, urážek nebo nezákonného
          obsahu. V takovém případě si vyhrazujeme právo účet zrušit.
        </li>
      </ul>

      <h2>8. Co můžete očekávat od nás</h2>
      <ul>
        <li>Že vám služba pojede &mdash; cílíme na 99,5 % dostupnosti měsíčně.</li>
        <li>
          Že na vás budeme reagovat osobně, ne přes chatbota. Většinu drobností
          vyřešíme do jednoho pracovního dne.
        </li>
        <li>
          Že vás budeme upozorňovat na podstatné změny podmínek &mdash;
          e-mailem, ne v patičce stránky.
        </li>
      </ul>

      <h2>9. Ukončení účtu</h2>
      <p>
        Účet můžete zrušit kdykoliv z nastavení. Veškerá data smažeme do 30 dnů,
        pokud si je předtím nestáhnete. Některé technické záznamy (např. logy
        plateb) si ze zákona musíme nechat &mdash; ty smažeme po uplynutí
        zákonné lhůty.
      </p>

      <h2>10. Změny podmínek</h2>
      <p>
        Pokud podmínky upravíme, dáme vám vědět e-mailem alespoň 30 dnů
        předem. Pokud se změnou nesouhlasíte, máte právo účet zrušit
        s vrácením poměrné části platby.
      </p>

      <h2>11. Rozhodné právo</h2>
      <p>
        Smluvní vztah se řídí českým právním řádem. Pro spotřebitelské spory
        platí mimosoudní řešení prostřednictvím{" "}
        <a href="https://adr.coi.cz" target="_blank" rel="noopener noreferrer">
          České obchodní inspekce
        </a>
        .
      </p>

      <hr />
      <p>
        Otázky? Napište nám na <Link href="/kontakt">kontakt</Link> &mdash;
        odpovídáme osobně.
      </p>
    </LegalLayout>
  );
}

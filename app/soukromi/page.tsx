import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/site";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Ochrana soukromí",
  description:
    "Jak ve Vzpomínkáři zacházíme s vašimi daty, vzpomínkami a fotkami — bez právnického jazyka.",
  alternates: { canonical: canonical("/soukromi") },
};

export default function SoukromiPage() {
  return (
    <LegalLayout
      eyebrow="Ochrana soukromí"
      title={
        <>
          Vaše vzpomínky patří vám.
        </>
      }
      intro={
        <>
          Tady stojí, jak s daty zacházíme &mdash; lidsky a&nbsp;bez
          právnického balastu. Plné znění (GDPR) je dole.
        </>
      }
      updatedAt="21. 5. 2026"
    >
      <h2>Co krátce</h2>
      <p>
        Audio nahrávky, fotky a texty vašich rodičů ukládáme do soukromého
        úložiště, ke kterému má přístup jen vaše rodina. My data zpracováváme
        proto, abychom službu mohli provozovat &mdash; nikomu je neprodáváme,
        nesdílíme s reklamními sítěmi a&nbsp;nepoužíváme je k trénování
        umělé inteligence třetích stran.
      </p>
      <p>
        Můžete si všechna data kdykoliv stáhnout nebo nás požádat o&nbsp;jejich
        smazání. Vyřídíme do 30 dnů.
      </p>

      <h2>Kdo je správce dat</h2>
      <p>
        Správcem osobních údajů je <strong>Vzpomínkář, s. r. o.</strong>, se
        sídlem v&nbsp;Praze. Kontaktní e-mail je uveden na stránce{" "}
        <Link href="/kontakt">kontakt</Link>.
      </p>

      <h2>Jaké údaje zpracováváme</h2>
      <h3>Účet a kontakt</h3>
      <ul>
        <li>E-mailová adresa rodinného správce a&nbsp;jeho jméno.</li>
        <li>
          Uživatelské jméno a&nbsp;heslo seniora (heslo ukládáme jen jako
          jednosměrný otisk &mdash; nikdo, ani my, ho nedokáže přečíst zpět).
        </li>
        <li>Údaje pro fakturaci a&nbsp;doručení tištěné knihy.</li>
      </ul>

      <h3>Obsahová data (vzpomínky)</h3>
      <ul>
        <li>Hlasové nahrávky odpovědí seniora.</li>
        <li>Textové přepisy a&nbsp;jejich uživatelské úpravy.</li>
        <li>Fotografie nahrané do rodinné knihovny.</li>
      </ul>

      <h3>Provozní data</h3>
      <ul>
        <li>
          Anonymizované údaje o&nbsp;tom, které stránky služby si načítáte
          (kvůli vylepšování).
        </li>
        <li>Záznamy o&nbsp;přihlášení a&nbsp;platebních operacích.</li>
      </ul>

      <h2>Proč data zpracováváme</h2>
      <ul>
        <li>
          <strong>Plnění smlouvy</strong> &mdash; abychom mohli službu
          provozovat: ukládat odpovědi, posílat týdenní otázky, vyrobit knihu.
        </li>
        <li>
          <strong>Oprávněný zájem</strong> &mdash; bezpečnost účtu, prevence
          podvodů, anonymní statistiky pro zlepšování produktu.
        </li>
        <li>
          <strong>Zákonné povinnosti</strong> &mdash; účetnictví, daně,
          povinné archivace.
        </li>
        <li>
          <strong>Souhlas</strong> &mdash; pouze tam, kde to zákon vyžaduje
          (např. marketingové e-maily, které posíláme jen po výslovném
          souhlasu).
        </li>
      </ul>

      <h2>Komu data předáváme</h2>
      <p>
        Pouze poskytovatelům, bez kterých služba nemůže fungovat. Všichni mají
        s námi uzavřenou zpracovatelskou smlouvu (DPA):
      </p>
      <dl>
        <dt>Supabase</dt>
        <dd>
          Databáze a&nbsp;úložiště souborů. Servery v&nbsp;EU
          (eu-central-1, Frankfurt).
        </dd>
        <dt>Vercel</dt>
        <dd>Provoz webové aplikace.</dd>
        <dt>Stripe</dt>
        <dd>
          Zpracování plateb. Údaje o&nbsp;kartě nikdy nevidíme &mdash; chodí
          přímo do&nbsp;Stripe.
        </dd>
        <dt>Resend</dt>
        <dd>
          Rozesílání transakčních e-mailů (potvrzení registrace, týdenní
          otázky).
        </dd>
        <dt>Tiskárna v&nbsp;ČR</dt>
        <dd>
          Po objednávce knihy předáváme tiskárně PDF s&nbsp;obsahem a&nbsp;adresu
          pro doručení. Tiskárna data po vyrobení knihy maže.
        </dd>
      </dl>

      <h2>Jak dlouho data uchováváme</h2>
      <ul>
        <li>
          <strong>Vzpomínky a&nbsp;obsah knihovny</strong> &mdash; po celou dobu
          existence účtu. Online přístup je trvalý.
        </li>
        <li>
          <strong>Účetní doklady</strong> &mdash; po zákonem stanovenou dobu
          (10 let).
        </li>
        <li>
          <strong>Logy a&nbsp;technické záznamy</strong> &mdash; nejdéle
          12 měsíců.
        </li>
        <li>
          <strong>Po zrušení účtu</strong> &mdash; obsah smažeme do 30 dnů.
        </li>
      </ul>

      <h2>Vaše práva</h2>
      <p>
        Podle GDPR máte právo na:
      </p>
      <ul>
        <li>Přístup k datům, která o vás máme.</li>
        <li>Opravu nepřesných údajů.</li>
        <li>Smazání („právo být zapomenut“).</li>
        <li>Přenositelnost &mdash; export ve strojově čitelném formátu.</li>
        <li>Omezení zpracování.</li>
        <li>Vznesení námitky proti zpracování.</li>
        <li>
          Podání stížnosti u{" "}
          <a
            href="https://www.uoou.cz"
            target="_blank"
            rel="noopener noreferrer"
          >
            Úřadu pro ochranu osobních údajů
          </a>
          .
        </li>
      </ul>
      <p>
        Pro uplatnění kteréhokoliv práva nám stačí napsat na e-mail uvedený
        v&nbsp;kontaktech.
      </p>

      <h2>Bezpečnost</h2>
      <p>
        Audio i fotky leží v&nbsp;privátním úložišti za vrstvou Row-Level
        Security. Stahovací odkazy mají krátkou platnost (15 minut), takže
        se nedají sdílet dál. Hesla seniorů ukládáme jen jako Argon2-hash.
        K&nbsp;produkčním datům mají přístup dva lidé z&nbsp;týmu, oba
        s&nbsp;dvoufaktorovou autentizací.
      </p>

      <h2>Cookies</h2>
      <p>
        Používáme jen nezbytné cookies pro přihlášení a&nbsp;preference. Žádné
        marketingové ani trackingové cookies bez vašeho souhlasu. Detaily
        v&nbsp;samostatném dokumentu <Link href="/cookies">cookies</Link>.
      </p>

      <h2>AI a&nbsp;přepisy</h2>
      <p>
        Hlasové nahrávky převádíme do textu pomocí přepisovacího modelu
        provozovaného v&nbsp;EU. Audio se posílá ke zpracování zašifrovaně
        a&nbsp;model si data neukládá &mdash; používají se pouze k&nbsp;vytvoření
        přepisu a&nbsp;okamžitě se vyhazují. Vaše vzpomínky neslouží
        k&nbsp;trénování žádného AI modelu.
      </p>

      <hr />
      <p>
        Pokud máte jakoukoliv pochybnost o&nbsp;tom, co se s&nbsp;vašimi daty
        děje, napište nám. Odpovídá vám člověk, ne robot.
      </p>
    </LegalLayout>
  );
}

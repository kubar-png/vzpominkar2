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
        proto, abychom službu mohli provozovat &mdash; nikomu je neprodáváme
        a&nbsp;nepoužíváme je k trénování umělé inteligence třetích stran.
        Měřicí a&nbsp;marketingové nástroje (Google Analytics, Meta Pixel)
        zapínáme jen tehdy, když nám k&nbsp;tomu dáte souhlas v&nbsp;cookie
        liště &mdash; a&nbsp;obsah vašich vzpomínek (nahrávky, přepisy, fotky)
        jim nepředáváme nikdy.
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
        <dt>OpenAI (USA)</dt>
        <dd>
          Přepis hlasových nahrávek (Whisper) a&nbsp;korektura textu
          (GPT-4o&nbsp;mini). Data se nepoužívají k&nbsp;trénování modelů; OpenAI
          je uchovává nejdéle 30&nbsp;dnů kvůli prevenci zneužití. Přenos
          do&nbsp;USA na&nbsp;základě standardních smluvních doložek.
        </dd>
        <dt>Tiskárna v&nbsp;ČR</dt>
        <dd>
          Po objednávce knihy předáváme tiskárně PDF s&nbsp;obsahem a&nbsp;adresu
          pro doručení. Tiskárna data po vyrobení knihy maže.
        </dd>
        <dt>Google (Google Analytics)</dt>
        <dd>
          Anonymizovaná statistika návštěvnosti webu &mdash; jen pokud k&nbsp;tomu
          dáte souhlas v&nbsp;cookie liště. Viz „Analytika a&nbsp;marketingové
          nástroje“ níže.
        </dd>
        <dt>Meta (Meta Pixel)</dt>
        <dd>
          Měření účinnosti naší reklamy na Facebooku a&nbsp;Instagramu &mdash;
          jen s&nbsp;vaším souhlasem. Viz „Analytika a&nbsp;marketingové
          nástroje“ níže.
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

      <h2>Analytika a&nbsp;marketingové nástroje</h2>
      <p>
        Abychom rozuměli tomu, jak se web používá, a&nbsp;mohli ho zlepšovat,
        využíváme měřicí a&nbsp;marketingové nástroje třetích stran. Spouštíme je
        výhradně tehdy, když k&nbsp;tomu dáte souhlas v&nbsp;cookie liště (volba
        „Souhlasím se vším“). Pokud zvolíte „Pouze nezbytné“, vůbec se nenačtou.
      </p>
      <dl>
        <dt>Google Analytics 4 (Google Ireland Ltd.)</dt>
        <dd>
          Anonymizovaná statistika návštěvnosti &mdash; které stránky si lidé
          prohlížejí, odkud přicházejí a&nbsp;jak se po webu pohybují. IP adresu
          zkracujeme. Google může část údajů zpracovávat i&nbsp;mimo EU (USA)
          na&nbsp;základě standardních smluvních doložek. Právní základ: váš
          souhlas.
        </dd>
        <dt>Meta Pixel (Meta Platforms Ireland Ltd.)</dt>
        <dd>
          Měření účinnosti naší reklamy na&nbsp;Facebooku a&nbsp;Instagramu
          (například že jste přišli z&nbsp;reklamy a&nbsp;dokončili objednávku)
          a&nbsp;sestavování reklamních publik. Meta přitom zpracovává údaje
          ve&nbsp;svých systémech, případně i&nbsp;mimo EU (USA) na&nbsp;základě
          standardních smluvních doložek. Právní základ: váš souhlas.
        </dd>
      </dl>
      <p>
        Souhlas můžete kdykoliv odvolat &mdash; smažte cookies ve&nbsp;svém
        prohlížeči nebo nám napište. Měřicím ani reklamním nástrojům nikdy
        nepředáváme obsah vašich vzpomínek (nahrávky, přepisy ani fotky).
      </p>

      <h2>AI a&nbsp;přepisy</h2>
      <p>
        Hlasové nahrávky převádíme do textu a&nbsp;lehce upravujeme pomocí
        služeb <strong>OpenAI</strong> (model Whisper pro přepis a&nbsp;GPT-4o&nbsp;mini
        pro korekturu a&nbsp;doplnění roku). Audio i&nbsp;text se k&nbsp;OpenAI
        posílají zabezpečeně přes šifrované spojení.
      </p>
      <p>
        OpenAI je americká společnost, data se proto zpracovávají i&nbsp;mimo
        EU (USA) na&nbsp;základě standardních smluvních doložek. Podle podmínek
        OpenAI API se vaše data <strong>nepoužívají k&nbsp;trénování</strong>
        jejich modelů; OpenAI je smí dočasně uchovat (nejdéle 30&nbsp;dnů)
        výhradně kvůli prevenci zneužití, poté je maže. Přepis je jádrem naší
        služby, takže právním základem je plnění smlouvy.
      </p>

      <hr />
      <p>
        Pokud máte jakoukoliv pochybnost o&nbsp;tom, co se s&nbsp;vašimi daty
        děje, napište nám. Odpovídá vám člověk, ne robot.
      </p>
    </LegalLayout>
  );
}

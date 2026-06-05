# Pre-launch audit — konverze, výnosy, bezpečnost, bugy

> Vygenerováno workflow auditem 2026-06-04 · 30 agentů · 117 nálezů → 139 potvrzených (z toho 23 z completeness critic).


## Shrnutí (TL;DR)

Web je stavebně hotový, ale na třech místech rozdává hodnotu zadarmo a na jednom místě teče soukromá data ven. Nejvyšší příjmová páka je dovybavit objednávku tisku i dárkový konfigurátor o cenu a doprodeje (extra výtisk, prémiový přebal, digitál, balení) — celá platební infrastruktura `shop_orders`/`book_orders` i env ceny už existují, jen se nepoužívají. Druhá páka je rozhýbat mrtvé e-mailové smyčky (milníky knihy, „kniha plná → další díl", připomínka dárci, opuštěný onboarding) — šablony i data v DB leží hotové a nikdy se neodešlou. Třetí páka je konzistence ceny: env ceny chybí, takže paywall ukazuje „Zdarma" proti slibovaným 2 890 Kč, dlaždice „599 Kč" účtuje 1 099 Kč a /cenik inzeruje čtyři doplňky, které nejdou koupit.

Nejnaléhavější must-fix před launchem: **veřejný IDOR endpoint `/api/print/book`**, který bez přihlášení vyrenderuje kompletní soukromou knihu cizí rodiny, a **globální canonical na `/`**, který deindexuje všechny prodejní podstránky.

## Scorecard

| Oblast | Hodnocení | Nálezy |
|---|---|---|
| Konverze (landing, paywall, checkout) | Slabší — chybí cena na klíčových místech, žádná zpětná vazba formulářů, cenové pasti | ~28 |
| Upsell / Výnosy | Velká nevyužitá příležitost — infra hotová, žádný bump ani doprodej nezapnut | ~24 |
| App UX & retence | Křehké — týdenní smyčka je celá ruční, studený start, žádná emoční smyčka pro seniora | ~13 |
| SEO / akvizice | Kritická díra (canonical), jinak rychlé výhry | ~13 |
| Bezpečnost | Jeden kritický IDOR + drahá DoS past, zbytek nízká priorita | ~8 |
| Bugy / korektnost | Tiskové bugy (přebal, „QR" text, výběr knihy) + cenové free-path pasti | ~16 |
| Lifecycle / leady | Nejslabší článek — sliby bez doručení, mrtvé šablony, žádný recovery | ~17 |

## 🟢 Top quick wins (vysoký dopad / nízká práce)

1. **Oprava globálního canonicalu (SEO kritické)** — `app/layout.tsx:52` má `alternates:{canonical:"/"}` v root layoutu a žádná podstránka ho nepřepisuje, takže /cenik, /faq, /jak-to-funguje, /darek, /kniha emitují canonical na homepage a Google je vidí jako duplikát. Dopad 5, effort S. Přidat helper `canonical(path)` do `lib/site.ts` a rozšířit do metadata každé marketingové stránky.

2. **Auth na `/api/print/book` (IDOR, viz must-fix)** — jeden `requireOwner()` + porovnání `books.family_id`. Dopad 5, effort S. `app/api/print/book/route.ts`.

3. **Povinná doručovací adresa v dárkové objednávce** — `order-form.tsx` ulice/město/PSČ nemají `required` a `ShippingAddressSchema` (`lib/shop/order-actions.ts:45-53`) je celý `.optional()` → placená kniha jde objednat bez adresy, kam ji poslat. Dopad 5, effort S.

4. **Cancel-state na paywallu** — `lib/stripe/checkout.ts:71` posílá `?cancelled=1`, ale `app/onboarding/platba/page.tsx` searchParams nečte. Wavering uživatel přistane na identické stránce beze slova. Přidat tichý proužek „Platbu jste nedokončili — kniha {jméno} na vás počká." Dopad 4, effort S.

5. **Zpětná vazba lead formuláře** — `app/page.tsx:76` `HomePage()` nemá searchParams, takže `?signup=success`/`error` z `/api/leads` se nikde nepřečte (ověřeno). Návštěvník po odeslání nedostane potvrzení. Dopad 4, effort S.

6. **Přebal se nepropíše do PDF** — `loadRealBook` (`lib/book/load.ts:74-84`) nevybírá `cover_bg`/`cover_text`, takže tištěná kniha je vždy modro-zlatá, ať uživatel zvolí cokoli. Dopad 4, effort S.

7. **Patička footeru „QR" v tisku** — `BookDocument.tsx:132-137` tiskne doslovný text „QR" do patičky každé stránky, protože top-level `qr` je u reálné knihy vždy `undefined`. Změnit na `{qr ? <img/> : null}`. Dopad 3, effort S.

8. **CTA z QR přehrávací stránky `/v/[token]`** — `app/v/[token]/page.tsx:161-165` patička není odkaz; každý sken QR je nejteplejší organický lead bez cesty dál. Přidat jeden tichý serifový `<Link>` na /darek (vzor `signup-disclaimer-link` už existuje). Dopad 4, effort S.

9. **Serverová kontrola minima 30 vzpomínek** — `placeBookOrder` (`lib/book/actions.ts`) minimum nehlídá, drží ho jen UI. Dopad 4, effort S.

10. **Org JSON-LD 404 logo** — `app/page.tsx:62` má `/logo.png`, soubor je `/brand/logo.png`. Jednořádková oprava. Dopad 3, effort S.

11. **OG/Twitter karta 1200×630** — `app/layout.tsx:63,66` sdílí úzký wordmark 1892×390; sdílení v rodině (hlavní kanál) vypadá rozbitě. Vytvořit `app/opengraph-image.tsx` přes next/og. Dopad 4, effort S–M.

## 💰 Příležitosti na výnos & marži (UPSELL / DOPRODEJ)

Toto je nejdůležitější sekce. Infrastruktura (env ceny přes `priceForProductCzk`, `shop_orders`, `book_orders`, add-on `book_addon`, free-path) už existuje — jen se nevyužívá. Doporučený postup: **(0) migrace `book_orders.items jsonb + copies int + cover_tier text`** jako enabler (`types/database.ts:60-69` dnes neumí uložit položky), pak **(1) env hesla pro bumpy** (vzor `priceForProductCzk`, `lib/stripe/server.ts:57-68`), pak jednotlivé bumpy. Pravidlo: klient posílá jen druh+počet, cenu skládá server.

| Nabídka → SKU | Doporučená cena | Komu | Effort | Jde teď bez Stripe? |
|---|---|---|---|---|
| **Cena tisku** `PRICE_BOOK_PRINT_CZK` (dnes 0 → kniha odejde zdarma) | 1 290–1 490 Kč | owner | S (jen env + zobrazit) | Ano (UI/env teď, ostrá platba po launchi) |
| **Extra výtisk pro sourozence** `book_print_extra` | 1. plná, další −20 % | owner | M (potřebuje migraci) | Ano |
| **Prémiový přebal** `book_cover_premium` (ražba zlatou folií / plátěná vazba) | 490–890 Kč | owner + dárek | M (migrace `cover_tier`) | Ano |
| **Digitální kniha (PDF + archiv nahrávek)** `book_digital` | 390–590 Kč | owner | M (doručení signed URL je práce navíc) | Ano (render PDF už existuje) |
| **Dárkové balení** `book_giftwrap` | 190–290 Kč | owner + dárek | S | Ano |
| **Tištěné věnování do knihy** | zdarma (zvedá hodnotu) / +290 Kč ražené | owner + dárek | M (musí projít print pipeline) | Ano |
| **Order bumpy v dárkovém konfigurátoru** (express, balení, 2. výtisk) | env | dárek | M | Ano |
| **Standardní dárková kniha 599 Kč** `shop_book_standard` (dnes neexistuje, dlaždice účtuje 1 099) | 599 Kč | dárek | M | Ano |
| **Dárkový poukaz / certifikát** `gift_voucher` (dnes jen skrytý input) | = base 2 890 Kč | dárek | L | Ano (PDF cert teď, kód uplatnit po launchi) |

**Add-on 1 790 Kč** (další díl / druhý blízký) je technicky plně wired (`startVolumeCheckout`), ale prodává se jen pasivně. Povýšit z poznámky pod čarou na samostatný blok na /cenik, nabídnout v okně nejvyšší ochoty (po první platbě na /onboarding/zdroj nebo na dashboardu), a hlavně přes e-mail při naplnění knihy (viz Lifecycle). Cenu vždy z `priceForProductCzk('book_addon')`, nikdy natvrdo — code default je 0.

**Pozor na brand:** všechny labely věcné (ražba/plátno/balení), vykání, žádné kurzívy/vykřičníky. Každý bump s env cenou 0 se v UI nezobrazí — bezpečné postupné zapínání.

## 🔒 Must-fix před launchem — Bezpečnost & Bugy

1. **IDOR: kompletní soukromá kniha cizí rodiny zdarma** — `app/api/print/book/route.ts:67-84` bere `bookId` z těla bez `requireOwner`/kontroly vlastnictví a sám si vyrobí HMAC token. Print stránka token jen ověří a `loadRealBook` načte service-rolem VŠECHNY published memories, přepisy a podepsané URL fotek. Kdokoli s odhadem/znalostí UUID stáhne soukromou knihu. **Oprava:** `const owner = await requireOwner()` na začátek POST + porovnat `books.family_id` s `owner.familyId`, neshoda → 403. Sample povolit jen mimo produkci. Kritické.

2. **DoS / nákladová past na tiskovém API** — stejný endpoint (`route.ts:67-126`) nemá rate-limit, `maxDuration=300`, každý POST startuje Puppeteer (sekundy CPU, stovky MB RAM). Po opravě IDOR přidat per-rodinu limit (`lib/rate-limit.ts`, např. 5/h/familyId).

3. **Cena 0 Kč proti slibovaným 2 890 Kč** — `.env.local` nemá `PRICE_BOOK_BASE_CZK` (ověřeno: jen `PRICE_BOOK_PRINT_CZK=0` a `PRICE_YEARLY_ACCES_CZK=0`), `DEFAULT_PRICE_CZK.book_base=0` → paywall ukáže „Zdarma", /cenik tvrdí 2 890 Kč. Nastavit env před launchem + build-time CI guard, který v produkci selže při `priceForProductCzk('book_base')===0`. (Ostré zapojení čeká na Stripe — ale konfigurace a pojistka jdou teď.)

4. **Tisk knihy odejde za 0 Kč** — `PRICE_BOOK_PRINT_CZK=0` → `createPrintCheckout` (`checkout.ts:215`) nastaví objednávku na `paid`/`amount_czk 0` bez platby. Stanovit cenu, zobrazit ji v objednávce.

5. **Cenová past „599 Kč → 1 099 Kč"** — `app/kniha/page.tsx:281-302` dlaždice 599 Kč, oba CTA vedou na konfigurátor (`configurator.tsx:30` `PRICE_CUSTOM='1 099 Kč'`), order-actions vždy účtuje 1 099. Bait-and-switch v momentě platby. Buď přidat reálné SKU 599 Kč, nebo dlaždici odstranit.

6. **/cenik inzeruje 4 doplňky, které nejdou koupit** — `cenik/page.tsx:37-42` (druhý výtisk od 1 290, kožená edice +1 800, balení +290, doprava mimo ČR od 350) bez opory v env/kódu; FAQ navíc tvrdí „o 35 % levnější" bez podkladu. Buď proměnit v reálné bumpy, nebo odstranit.

7. **Prázdné/whitespace vlastní otázky se počítají a vytisknou** — `QuestionSchema` (`order-actions.ts:36-40`) `text: z.string()` bez `.min`/`.trim`; prázdná otázka projde do placené knihy jako prázdný řádek. Přidat `.trim().min(3)` a filtr.

8. **Editace gender otázky zničí token `{masc|fem}`** — `configurator.tsx:442-444` edituje `resolveGender(q.text, gender)`, uloží rozvinutý text bez tokenu; po změně pohlaví zůstane špatný rod. Editovat surový text s tokenem.

9. **Pohlaví příjemce není povinné → „vyrůstal/a"** — `configurator.tsx:59` gender startuje null, k objednávce projde; dárková kniha vyjde s neosobním slash tvarem. Vynutit volbu.

10. **Týdenní připomínka přeskočí prošlé otázky** — `weekly-reminder/route.ts:34-37` má spodní hranici `.gte('scheduled_for',isoToday)`, takže nezodpovězené otázky z minulého týdne už nikdy nepřipomene. `reminded_at` drží idempotenci, spodní hranici lze smazat.

11. **Objednávka tisku se naváže na nejnovější (prázdný Díl 2)** — `placeBookOrder` (`actions.ts:41-47`) bere `.order('created_at',desc).limit(1)`; po založení Dílu 2 se vytiskne prázdná kniha. Vybírat knihu se statusem collecting/full s navázanými memories.

## 🧭 Konverze & onboarding funnel

- **Mrtvá routa `/onboarding/credentials`** tvrdí „Krok druhý ze tří", funnel je dvoukrokový a nic na ni neodkazuje — smazat jako mrtvý kód + opravit e2e (`tests/e2e/smoke.spec.ts:59`).
- **Paywall přichází před vloženou hodnotou** — `onboarding-form.tsx` sbírá jediné pole, hned tvrdý paywall. Vložit lehký neplacený náhled (výběr 2-3 otázek / živý náhled obálky se jménem) pro sunk-cost momentum.
- **Heslo min. 10 znaků na vrcholu funnelu** — `signup-form.tsx:88` + `ownerSignupSchema` (`auth.ts:8`); senior má 8. Sjednotit na 8 (obě vrstvy).
- **Paywall nepřipomíná samostatnou platbu tisku** — přidat tichou větu „Tištěnou knihu si objednáte zvlášť, až bude hotová" (riziko chargebacku bez záruky vrácení).
- **Cena chybí na homepage i /darek** — hlavní cena 2 890 Kč ani „bez předplatného" se na homepage neobjeví (jen sleva 200 Kč); /darek v těle nemá žádné číslo. Doplnit decentní cenovou kotvu z env.
- **Žádné objection-handling na paywallu** — recyklovat 2-3 řádkové mikro-FAQ z existujícího FAQ.
- **Cena tisku v `/family/[id]/book` checkoutu mlčí** — `book-form.tsx` nikde neukáže cenu ani hodnotu; při env=0 zobrazit „Cena tisku bude potvrzena", ne prázdno/0.
- **`?cancelled=1` v dárkovém konfigurátoru nikdo nečte** (`order-actions.ts:176`) — otevřít rovnou souhrn s tichou hláškou.

## 📦 App UX & retence

- **Otázky se neplánují automaticky (kritické)** — žádný cron nedoplňuje frontu; celý slib „otázka týdně" stojí na ruční obsluze ownera. Když přestane plánovat, senior vidí „Otázka brzy přijde" napořád. Přidat auto-plánovač napojený na `prompt_frequency`.
- **Po vytvoření seniora se nenaplánuje první otázka** — `createSeniorAccount` (`lib/auth/actions.ts:294`) nevkládá žádný `prompt_assignment`; nově aktivovaný senior vidí prázdno. Naplánovat 1-3 úvodní otázky.
- **`prompt_frequency` nic neřídí** — zapisuje se a jen zobrazuje; „Dvakrát týdně" backend nikdy nesplní. Napojit na plánovač nebo volbu dočasně skrýt.
- **Reakce ownera (srdíčko) se k seniorovi nedostane** — senior vypráví do prázdna. Zobrazit tichou „Rodina si tuto vzpomínku uložila".
- **Kurzíva na senior surface porušuje brand** — `globals.css:3702,4158` `.es-question`/`.es-memory-q` mají `font-style:italic` + `home/page.tsx:215` třída `italic`. Odstranit, důraz nést serifem/vahou.
- **Po uložení vzpomínky chybí nudge na další otázku** — senior po jedné odpovědi skončí; nabídnout „Další otázka".
- Drag-to-reorder v konfigurátoru je jen myší — na mobilu kupujícího nefunguje; přidat šipky nahoru/dolů.
- Audio nahrávka nemá pauzu/pokračování (`audio-form.tsx:234`) — pro seniory s dlouhými pauzami riziko ztráty.
- Mrtvé tlačítko „Další akce" (kebab) na detailu vzpomínky (`memory-detail.tsx:373`) — naplnit nebo odstranit.

## 🔎 SEO & akvizice

**Teď bez domény:**
- Canonical fix (viz quick wins) — kritické.
- Org JSON-LD logo 404 fix.
- OG karta 1200×630 přes `app/opengraph-image.tsx` (+ per-route varianty pro /darek, /kniha).
- Homepage vlastní `metadata` (jako jediná marketingová stránka chybí) cílená na „dárek pro babičku", „kniha vzpomínek".
- Product/Offer JSON-LD na /kniha a /cenik (cena z env).
- `robots:{index:false}` na /login, /senior-login.
- BreadcrumbList na /kniha, /cenik (drobný CTR efekt).

## ✉️ Lifecycle, leady & re-engagement

Nejslabší článek — hotové šablony i data leží nepoužité.

- **Lead magnet slibuje 3 e-maily + slevu 200 Kč, ale neposílá NIC** — `/api/leads` jen upsertne e-mail a notifikuje tým; žádný autoresponder, žádná coupon logika v kódu. Buď postavit 3-dílnou sekvenci, nebo OKAMŽITĚ stáhnout slib z copy.
- **Týdenní připomínka odkazuje na neexistující `/q/[token]`** — cron token nikdy nepředá, šablona padá na `/senior-login`, route neexistuje. Senior 65+ se přihlašuje při každé odpovědi = největší třecí bod. Postavit magic-link route `/q/[token]`.
- **`seniorCredentialsEmail` se nikdy neodešle** — `createSeniorAccount` jen vrátí credentials do UI okna; po zavření přístup ztracen. Odeslat ownerovi.
- **Žádná „vyprávějící ztichl" smyčka** — jen 2 crony existují; projekty tiše umírají bez placeného výstupu. Přidat dormancy-nudge cron.
- **Žádné odchycení opuštěného onboardingu** — rodina vzniká ve stavu `trial` bez přístupu, žádný recovery e-mail; nejteplejší lead zmizí. (requiresDomainOrStripe=true pro ostré odeslání, ale logika + šablona teď.)
- **Milníkové e-maily chybí** — žádná zpráva při 30 vzpomínkách („kniha připravená k tisku"), žádná při 52/52 („kniha plná → další díl 1 790 Kč"). Nejsilnější upsell momenty cyklu se míjí. Potřebují stamp sloupce (`print_ready_notified_at`, `full_notified_at`) pro idempotenci.
- **`newMemoryNotificationEmail` neukazuje postup** — `count` je natvrdo 1; dopočítat „{answered} z 30" z `prompt_assignments`.
- **Žádný unsubscribe** — homepage slibuje „odhlásit jedním klikem", neexistuje route ani `List-Unsubscribe` hlavička → GDPR riziko + sražená doručitelnost.
- **`bookOrderConfirmationEmail` se neposílá** po aktivaci — promarněný post-purchase moment.
- **Lead bez UTM/atribuce** — `source` natvrdo „homepage"; přidat skrytá UTM pole + `leads.metadata jsonb`.
- **Žádná referral/pozvánka sourozenců** — přirozeně virální produkt bez sdílecího háčku.
- **Gift-buyer → owner most chybí** — `/kniha/hotovo` ani potvrzovací e-mail nenabízí vlastní účet nejteplejšímu owner leadu; buyer_email se nezapisuje do `leads` se `source:'gift_buyer'`.

## ⏳ Po launchi (čeká na doménu/Stripe)

Tyto nálezy nemíchat do „teď" — vyžadují ostrý Stripe nebo verifikovanou doménu:
- Nastavení ostrých env cen `PRICE_BOOK_BASE/ADDON/SHOP_BOOK_CUSTOM` a ostré účtování (logika/pojistka jde teď).
- Ostré odeslání abandoned-onboarding recovery e-mailu (doména/SMTP) — šablona + cron build teď.
- Aplikace slevového kódu 200 Kč na checkout (ostrý Stripe) — autoresponder e-maily teč.
- Doručení staženého PDF/audio archivu za platbu (signed URL gating).
- Tisk QR na finální doméně.

## Doporučené pořadí (roadmapa)

1. **IDOR `/api/print/book`** + rate-limit (bezpečnost, blokuje launch tisku).
2. **Canonical fix** napříč marketingem (SEO, deindexace).
3. **Povinná adresa** v dárkové objednávce + povinné pohlaví + filtr prázdných otázek (kritické bugy checkoutu).
4. **Cenové pasti pryč**: dlaždice 599 Kč, hardcoded doplňky na /cenik, env ceny + CI guard proti 0.
5. **Tiskové bugy**: přebal do PDF, „QR" v patičce, min. 30 serverově, výběr správné knihy.
6. **Quick-win konverze**: cancel-state paywall + dárkový konfigurátor, lead-formulář feedback, QR `/v/[token]` CTA, cena tisku v book-form, OG karta, Org logo.
7. **Lifecycle smyčky**: magic-link `/q/[token]`, seniorCredentials e-mail, auto-plánovač otázek + první otázka po vytvoření seniora, dormancy + opuštěný onboarding cron.
8. **Enabler migrace** `book_orders.items/copies/cover_tier` + env hesla pro bumpy.
9. **Výnosové bumpy**: cena tisku → extra výtisk → prémiový přebal → digitál → balení; order bumpy v dárkovém konfigurátoru; standardní 599 Kč SKU.
10. **Milníkové a upsell e-maily** (30, 52/full, dárce → owner, add-on připomínky) + progress v notifikacích.
11. **Retence app UX**: emoční smyčka seniora, kurzíva pryč, nudge na další otázku, pauza nahrávky, „nové" markery.
12. **Zbytek SEO/lifecycle**: Product JSON-LD, unsubscribe, UTM atribuce, referral, noindex login.
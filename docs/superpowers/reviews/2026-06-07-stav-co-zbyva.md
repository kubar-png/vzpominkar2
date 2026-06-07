# Stav projektu Vzpomínkář — co zbývá před spuštěním

**Datum:** 2026-06-07
**Typ:** Syntéza (sloučení CRO auditu, multichannel review a čerstvého sweepu kódu)
**Pozn.:** Effort značky S/M/L. Body jsou deduplikované napříč třemi audity. Vše s odkazem na soubor.

---

## 1) Shrnutí

Produkt je funkčně velmi blízko spuštění: nahrávání vzpomínek, kurátorství, magic-link pro seniora, týdenní cron, tisk PDF i veřejné QR přehrávání fungují, a velká část dříve trackovaných CRO/UX bodů je **hotová** (cenová past na deskách, sticky CTA, drag&drop v konfigurátoru, reassurance bloky, právní reframe SMS/WhatsApp s opt-outem a čl. 14 GDPR). Reálné launch-blockery jsou dnes spíš v **ENV/dashboardu a právu** (doména, Resend SMTP, Stripe live klíče + webhook, KV rate-limit, OpenAI cap, fakturační údaje a IČO/DIČ) než v kódu. V kódu zbývají **čtyři vážné věci**: zaplacený druhý výtisk se na Stripe cestě nikdy nepostaví do stavu „paid" (placený, ale nedoručený výtisk), RLS na `profiles` vystavuje `magic_token` (no-password přihlášení) i telefon všem členům rodiny včetně seniora, mobilní hamburger menu vede na neexistující kotvy na všech podstránkách, a homepage slibuje 3 e-maily + slevu 200 Kč, kterou systém nikdy nepošle. Z UI/UX je nejhmatatelnější problém **mobilní navigace na marketingu** a **fotka z galerie u seniora**, kterou současný `capture` může blokovat. Celkově: pár dní práce v kódu na blockerech, plus dashboard/právní úkony — pak je možné účtovat reálné peníze.

---

## 2) 🚫 Launch-blockery

> Vše níže má status `open` / `partial` / „není ověřitelné z kódu, ale je vyžadováno". Hotové položky tu nejsou.

### A. KÓD — musí se opravit před účtováním reálných peněz

| # | Co | Soubor | Effort |
|---|----|--------|--------|
| K1 | **Placený druhý výtisk se nikdy nereconciliuje.** Na Stripe cestě se účtuje `copies=2`, vloží se `book_orders` řádek `draft`, ale webhook (`book_base`/`book_addon`) volá jen `markBookPaid` a draft už nikdy nepovýší na `paid` ani nepřipojí payment intent. Zákazník zaplatí za 2. výtisk, fulfilment vidí jen `draft` a nevytiskne. Porušuje pravidlo „zaplaceno = doručeno". Sám kód to přiznává v `TODO(followups)`. | `lib/stripe/checkout.ts:57-70,88,112-121,143`; `app/api/webhooks/stripe/route.ts:84-99`; `lib/books/server.ts` (`markBookPaid`) | M |
| K2 | **RLS na `profiles` vystavuje `magic_token` + telefon + attestation text celé rodině, včetně seniora.** Jediná SELECT policy je řádková (`id = auth.uid() or family_id = current_family_id()`), žádné column-grant/revoke. `magic_token` je stálý no-password login (`/q/{token}`). Senior (login na 8znaků) si přes anon REST API může přečíst `magic_token` ownera i ostatních a převzít účet; navíc únik telefonů a attestation textu (GDPR). | `supabase/migrations/20260504141500_rls_and_storage.sql:80-83`; `20260605120000_profiles_magic_token.sql:16-28`; `types/database.ts:391,402-403`; `app/q/[token]/route.ts` | M |
| K3 | **Lead-magnet slibuje 3 e-maily + slevu 200 Kč, ale `/api/leads` uživateli neposílá nic.** Homepage i Promo lišta (na všech marketing stránkách) tvrdí „Tři e-maily… slevový kód" a „Sleva 200 Kč… pošleme e-mailem", success stav říká „První e-mail dorazí během chvíle". `/api/leads` jen uloží lead a notifikuje **tým**; žádný autoresponder, žádný slevový kód, žádný coupon ve Stripe. Porušuje honesty-first (slib≠doručení) i price-vs-charge. **Volba:** buď doručit (autoresponder + funkční Stripe coupon), nebo **stáhnout slib** z copy, než sekvence existuje. | `app/page.tsx:710-727`; `components/landing/Promo.tsx:11`; `app/api/leads/route.ts:48-84`; `lib/email/templates.ts:630` | M (doručit) / S (stáhnout copy) |
| K4 | **Free-path label trap (P2-5/P1-5):** na platbě se vedle CTA bez platby zobrazí trust-cena 2 890 Kč, když `priceForProductCzk("book_base")===0`. Standardní checkout navíc kvůli `||599` floorování ukazuje „Pokračovat k platbě" i na free path, kde se neplatí. **Min. fix v kódu:** přidat dev/prod assertion, která hlasitě selže, když `displayPriceCzk>0` a zároveň `priceCzk===0`; odvozovat `isFree` ze serverové ceny (zrušit `||599` floor na free path). Nastavení `PRICE_BOOK_BASE_CZK=2890` v prod je už ENV (viz E5). | `lib/stripe/server.ts:57`; `app/onboarding/platba/page.tsx:50-52,116-118,159`; `app/kniha/objednat/page.tsx:17`; `standard-order.tsx:338-339` | S |
| K5 | **Cross-device token_hash verify chybí (`/auth/confirm`).** Existuje jen `/auth/callback` (PKCE-only), který selže při ověření na jiném zařízení (typické u 65+). Postavit `app/auth/confirm/route.ts` s `verifyOtp({token_hash,type})` a přepnout Supabase Magic Link template na `/auth/confirm`. | `app/auth/callback/route.ts` (confirm route NEexistuje); PRE-LAUNCH.md:55-64 | M |

> **Pozn. k pořadí:** K1 a K4 „vystřelí" až po zapnutí Stripe live (dnes běží free path), ale obě musí být hotové **dříve, než se účtuje**. K2, K3 jsou živé už teď.

### B. ENV / DASHBOARD / PRÁVNÍ — neověřitelné z kódu, ale vyžadované

| # | Co | Zdroj | Effort |
|---|----|-------|--------|
| E1 | **Koupit + nasměrovat doménu `vzpominkar.cz`** (A/CNAME na Vercel, přidat doménu v projektu). Root blocker — na něm visí E2, E6, E10. | PRE-LAUNCH.md:15-18; `lib/site.ts:9` | S |
| E2 | **Resend custom SMTP v Supabase** (přidat doménu v Resend = SPF/DKIM DNS, pak Custom SMTP `smtp.resend.com:465`). Blokováno doménou. | PRE-LAUNCH.md:20-29 | S |
| E3 | **Stripe live klíče + webhook + ověření platby end-to-end.** Kódová cesta hotová (`stripe.checkout.sessions.create`, success/cancel z `SITE_URL`, recovery, metadata), ale je to stále **Stripe-hostovaný redirect** (`session.url`), ne embedded `ui_mode`. Live klíče + webhook na prod doméně jsou ENV. Pozn.: PRE-LAUNCH.md:42 chybně uvádí základ 2 000 Kč — reálně je **2 890 Kč**. | `lib/stripe/checkout.ts:124-149`; PRE-LAUNCH.md:42 | M |
| E4 | **KV/Upstash v prod env** (auth rate-limit). Bez `KV_REST_API_URL/TOKEN` je limiter fail-open → brute-force ochrana tiše vypnutá. Ověřit, že je v prod nastaveno. (Souvisí s perf. nálezem o fail-open, viz §4.) | PRE-LAUNCH.md:68-69; `lib/rate-limit.ts`; `app/q/[token]/route.ts:25-28` | S |
| E5 | **`PRICE_BOOK_BASE_CZK=2890` v prod** + ověřit, že paid CTA + Stripe redirect reálně proběhne (páruje se s K4). | `lib/stripe/server.ts:57`; PRE-LAUNCH.md | S |
| E6 | **Přepnout prod URL na doménu** (`NEXT_PUBLIC_APP_URL` + `EMAIL_FROM` na Vercelu, Supabase Auth Site URL + Redirect URLs). Kód centralizovaný hotový. | `lib/site.ts:9-11`; PRE-LAUNCH.md:35 | S |
| E7 | **Supabase leaked-password protection** (toggle v dashboardu, advisor L3). | PRE-LAUNCH.md:49-50 | S |
| E8 | **OpenAI měsíční budget cap + alert** (jediná reálná pojistka — interní capy jsou fail-open). | PRE-LAUNCH.md:86-87; `lib/rate-limit.ts` | S |
| E9 | **Reálné fakturační údaje na `/kontakt`** (telefon, sídlo, IČO/DIČ). Dnes čestné „připravujeme", ale právně vyžadované před účtováním. Páruje se s registrací s.r.o. | `app/kontakt/page.tsx:35,44,53` | S |
| E10 | **QR domain gate:** nevytisknout žádnou knihu/QR, dokud `NEXT_PUBLIC_APP_URL=https://vzpominkar.cz`. Tokeny jsou doménově nezávislé, ale URL v QR ne. Operační pravidlo. | PRE-LAUNCH.md:109-111; `lib/site.ts:9` | S |
| E11 | **Právní podklady SMS/WhatsApp:** legitimní zájem (service message), nikoli souhlas; potřebuje LIA + sign-off CZ právníka. (Kód: opt-out, `/odhlasit`, čl. 14 notice — **hotovo**, viz §5.) | MEMORY: sms-whatsapp-legal-basis; `/soukromi`, `/odhlasit/[token]` | — |

---

## 3) 🎨 UI/UX — co není dobré nebo hezké

### MARKETING (homepage + podstránky)

**Vysoká priorita:**

- **Mrtvá mobilní navigace na všech podstránkách.** `HomeMobileMenu` (jediná navigace na mobilu ≤900 px) má v `NAV` kotvy `#jak`, `#produkt`, `#faq`, které existují **jen na homepage**. Na `/cenik`, `/darek`, `/kniha`, `/jak-to-funguje`, `/faq`, `/o-nas`, `/kontakt` tři z pěti položek nedělají nic. Navíc **`/darek` v mobilním menu úplně chybí** (z menu se na dárkovou stránku nedostanete) a položka „Produkt" nemá vlastní stránku. **Fix:** sjednotit `NAV` na reálné routy (`/jak-to-funguje`, `/cenik`, `/darek`, `/faq`, `/o-nas`). `components/landing/HomeMobileMenu.tsx:8-14`; `SiteHeader.tsx:49`; **S**
- **Vymyšlené tiskové reference + falešný Forbes citát** na homepage (press strip „Píší o nás" + blok „Píše o nás Forbes CZ, podzim 2026"). Honesty-first riziko. Před spuštěním nahradit reálnými, nebo přeznačit na aspirační („Hodíme se do…") a citát odstranit. `app/page.tsx:203-215,339-347`; **S** *(už tracked)*

**Střední / polish:**

- **Tři rozdílné definice hlavní navigace** (homepage header / sdílený `SiteHeader` / mobilní menu) — zavést jednu sdílenou konstantu. `app/page.tsx:140-146`; `SiteHeader.tsx:41-47`; `HomeMobileMenu.tsx:8-14`; **S**
- **Anglické zavírací uvozovky (”) místo českých (“)** v 5 citacích na homepage (Forbes blok, story-cards) — jinde správně. `app/page.tsx:345,439,452,464,477`; **S**
- **Vymyšlené osoby týmu s citáty na `/o-nas`** („Jakub Š., Tereza M., Marek H." + „parta lidí" + „ručně vážeme na Smíchově") vs realita jediného zakladatele — sladit s pravdou. `app/o-nas/page.tsx:48-67,79-83,207`; **M**
- **Vykání seniorovi v ukázkách otázek na `/kniha`** („Kde jste vyrůstali?") porušuje pravidlo otázky=tykání. `app/kniha/page.tsx:38-99`; **S**
- **Kostrbatá věta na `/darek`** („Kdy už pravnoučata uslyší prababiččin hlas"). `app/darek/page.tsx:43`; **S**
- **Emoji placeholdery (🎁 ▶ 🍪)** tříští navy+gold estetiku — nahradit jemným gradientem/SVG ve zlaté. `app/globals.css:1653-1696`; `CookieConsent.tsx:52`; **S**
- **Cookie lišta odkazuje na neexistující tlačítko „Upravit volbu"** a chybí re-consent vstup. `app/cookies/page.tsx:93-96`; `CookieConsent.tsx`; **M**
- **`/kniha` vede chladný mobil rovnou do dražšího 899 custom flow**, 599 standard je degradovaný outline. Vést (nebo stejně vážit) 599, custom jako upgrade. `app/kniha/page.tsx:165,313,350`; **S**
- **Kolize názvu „Kniha vzpomínek"** (appka vs vyplňovací dárek) — rezervovat název jednomu produktu, dárek konzistentně „Vyplňovací kniha vzpomínek" + jednořádkový rozdíl nahoře. `app/kniha/page.tsx:155,180`; `platba/page.tsx:277`; **M**

### APPKA + SENIOR

**Vysoká priorita:**

- **Fotka u seniora vynucuje fotoaparát (`capture="environment"`) a může blokovat výběr z galerie**, který UI výslovně slibuje („Vyfotit nebo vybrat ze galerie", „Z mobilu, tabletu nebo počítače"). Na řadě mobilů (starší Android/iOS Safari, typické pro 65+) `capture` odebere volbu „vybrat z knihovny" a otevře rovnou kameru. Klíčový případ memoáru — nahrát starou naskenovanou fotku — může být nemožný. **Fix:** zahodit `capture` (nechat `accept="image/*"`), případně dvě tlačítka (Vyfotit / Vybrat ze zařízení). `app/(senior)/new-memory/photo/photo-form.tsx:100`; **S**

**Střední:**

- **App surfaces zobrazují genderované otázky se slash-fallbackem („vyrůstal/a", „hrdý/á").** Owner vidí pokažené skloňování všude (dashboard „Tento týden" hero, recent-memory karty, celá Otázky knihovna/naplánované/zodpovězené, archiv, detail), zatímco senior i tištěná kniha skloňují správně přes `profiles.gender`. Dashboard už gender načítá, jen ho do `next`/`StatusBlock` neprotahuje; detail nese `senior_role` → `genderFromSeniorRole` ho opraví zdarma. `StatusBlock.tsx:111`; `memory-card.tsx:63`; `memory-feed-async.tsx:24,88`; `memories-archive.tsx:201`; `memory-detail.tsx:434`; `prompts/page.tsx:88,103,112,177`; **M**
- **Sticky book-progress bar ukazuje rodinný součet vzpomínek / 52** — může přesáhnout 52 a míchá víc seniorů/dílů. Scopovat na aktuální díl (počet zodpovězených assignmentů), clampovat, sjednotit na jeden helper. `components/app/BookProgressBar.tsx:37-46`; `lib/family/stats.ts:143`; **M**
- **Senior karta zobrazuje SMS-doručovaného seniora jako „E-mail"** (label má jen WhatsApp). Triviální ternary pro všechny tři kanály. `app/(app)/family/[familyId]/rodina/senior-card.tsx:360`; **S**
- **Senior muted text ~5:1 (jen AA)** přes deklaraci AAA pro 65+ (action podtitulky, datumy vzpomínek). Ztmavit `--ink-mute` k `--ink-soft` v senior scope, nebo opravit deklaraci na AA. `app/globals.css:4327-4332,4485-4494,215`; **S**
- **App mobilní drawer (`AppMobileMenu`) není přístupný modal** — bez `role=dialog`/`aria-modal`, bez Escape/focus-trap, a zavřený zůstává v DOM tabovatelný. Zrcadlit `HomeMobileMenu`. `components/app/AppMobileMenu.tsx:83-91,105-213`; **S**
- **„Dvakrát týdně" je volitelné, ale nikdy nevyhonorováno** (viz §4 corr-06) — buď wire, nebo skrýt volbu. `senior-card.tsx:207-214`; `add-senior-panel.tsx`; **M** *(už tracked)*

**Polish:**

- Owner password help stále „alespoň 10 znaků" (senior má 8) — sjednotit. `settings/page.tsx:107`; **S**
- Memory karty mají hover-shadow, ale klikací je jen malý link — buď celá karta link, nebo zrušit shadow. `memories-archive.tsx:190-254`; `memory-card.tsx:48,125-130`; **S**
- Senior „…" menu je holý `<details>` bez click-outside/Escape. `senior-card.tsx:377-405`; **S**
- Foto stránka nemá `MemoryWhenHint`, co mají audio/text. `photo/page.tsx:43-45`; **S**
- Replay tour Step 1 ukazuje irelevantní spotlight, když rodina už má seniora. `DashboardTour.tsx:32-37`; `dashboard/page.tsx:120`; **S**
- Tour popover bez `max-height`/scroll na nízkých viewportech. `DashboardTour.tsx:160-196`; `globals.css:5890-5898`; **S**
- Aktivní nav položky bez `aria-current="page"`. `AppSidebar.tsx:103`; `AppMobileMenu.tsx:190`; **S**
- `/v/[token]` veřejné fotky mají prázdný `alt` — použít caption. `app/v/[token]/page.tsx:147-152`; **S**
- Redundantní `-mt`/`pt` indirekce v senior layoutech (ruší se navzájem). `(senior)/layout.tsx:45`; `home/layout.tsx:7`; **S**

### FUNNEL (konfigurátor + checkouty)

**Vysoká priorita:**

- **Custom dárkový checkout (899 Kč) nedostal reassurance row, lead-time ani consent line** — asymetrie vůči levnějším checkoutům, které pass upgradoval. Zrcadlit `standard-order.tsx`. `app/kniha/sestavit/order-form.tsx:135-282`; **S** *(už tracked)*
- **Konfigurátor top bar nemá mobilní reflow** — 5 skupin ovládání se na 360–390 px láme nepořádně (`.kc-top-cta` min-width:196px, žádné `@media`). Přidat ≤720/≤480 px reflow: schovat title, zkrátit CTA na „Objednat", gender toggle do těla, zvážit sticky bottom nav. `app/globals.css:2253-2345`; `configurator.tsx:230-268`; **M** *(P1-10, už tracked)*
- **`/darek` stále zahazuje `gift=1`** — stránka slibuje dárkový flow, který další obrazovky nedoručí (build půlka P0-1). `signUpOwner` flag nečte, `redirect("/onboarding")` nepodmíněně. Buď postavit gift branch (recipient oslovení + věnování + datum), nebo minimálně sladit očekávání. `app/darek/page.tsx:122,249`; `signup-form.tsx:64`; `lib/auth/actions.ts:46-50,94`; **L** *(už tracked)*

**Střední:**

- **Configurator→Stripe cancel handoff tichý** — `cancel_url=…?cancelled=1`, ale nikdo param nečte ani nezobrazí recovery banner (platba to dělá správně). `sestavit/page.tsx` má číst `searchParams.cancelled` a skočit na recap s klidným bannerem. `lib/shop/order-actions.ts:225`; **M** *(P1-1, už tracked)*
- **Recipient gender defaultuje na null** → každá genderovaná otázka se na první pohled vykreslí jako „vyrůstal/a" na obou dárkových plochách. Udělat gender-first mikrokrok („Pro koho? Ženu / Muže") před editorem; přeznačit toggle na „Příjemce:". `configurator.tsx:71`; `standard-order.tsx:51`; `lib/gender.ts:11`; **S** *(P1-9, už tracked)*
- **Editace otázky v konfigurátoru zničí `{masc|fem}` token** (a zapeče slash, když gender není zvolen). Držet raw token jako source of truth. `configurator.tsx:176-180,559-561`; **M** *(už tracked)*
- **Dva dárkové checkouty vizuálně divergují** — radius (4px inputy vs 8px), CTA verb („Závazně objednat" vs „Pokračovat k platbě"), pole. Sjednotit. `globals.css:4645,2983,3064,3072`; `order-form.tsx:275`; `standard-order.tsx:340`; **M** *(už tracked)*
- **`/kniha/hotovo` ignoruje `?order=<id>`** — žádná účtenka/cover/timeline po nákupu za 599–899 Kč. Načíst order, zobrazit reálnou potvrzovací kartu. `app/kniha/hotovo/page.tsx:20-49`; **M** *(P2-8, už tracked)*
- **Osiřelý `/onboarding/credentials` stále tvrdí „Krok druhý ze tří"** s 3-segmentovým barem v 2-krokovém flow. Odstranit z flow nebo přeznačit „Hotovo · nepovinné". `app/onboarding/credentials/page.tsx:46-53`; **S** *(P2-1, už tracked)*
- **Gift checkouty bez Podmínky/Soukromí consent line** v momentě platby (jen platba ji dostala). `standard-order.tsx`, `order-form.tsx`; **S** *(P2-11, už tracked)*

**Polish (vše už tracked):**

- Konfigurátor bez first-run intro („Knihu jsme předvyplnili… můžete rovnou objednat") + „Doporučeno" chip. `configurator.tsx:51-59`; **S** (P1-8)
- Textarea otázky `rows={2}` + `resize:none` → dlouhé otázky se ořežou; přidat `field-sizing:content`. `configurator.tsx:556-562`; `globals.css:2558-2568`; **S** (P2-14)
- `.kc-book-remove` 30 px + `.kc-book-move-btn` 38×34 pod 44px i na coarse pointeru. `globals.css:2579-2583,2690-2693`; **S** (P1-11)
- Platba CTA porušuje brand gold-pill systém (`buttonVariants primary` + ruční arrow vs `.btn-gold`). `platba/page.tsx:155-166`; **M** (P2-7)
- `.kc-recap-card align-items:center` — vysoký cover preview mis-leveled. `globals.css:2765-2773`; **S**
- Standard checkout `justify-content:center` ořezává delší formulář na nízkých viewportech. `globals.css:4870-4876`; **S**
- Cover-preview title text se liší napříč 3 plochami („Zajímá mě tvůj příběh." vs „Vzpomínkář" vs nic). `configurator.tsx:322-323`; `platba/page.tsx:275-283`; `standard-order.tsx:136-141`; **S**
- Standard reassurance row je inline-styled v TSX místo `.co-` třídy. `standard-order.tsx:346-381`; **S**
- Mrtvé CSS `/darek/certifikat` (~115 řádků `.cert-preview*`) zůstalo po sloučení certifikát stránky. `globals.css:3225-3343`; **S**

---

## 4) 🐛 Korektnost a bezpečnost (nové)

> Potvrzené nové nálezy mimo dříve trackované dokumenty. K1 a K2 z §2 jsou nejzávažnější; zde doplňující.

**Vysoká:**

- **Auto-planner bootstrapuje jen PRVNÍHO seniora.** Druhý/třetí senior přidaný do existující rodiny nikdy nedostane otázky (popup i guard jsou per-family). Buď naplánovat 1 opener v `createSeniorAccount` pro každého seniora, nebo udělat guard per-senior. `lib/prompts/schedule.ts:57-91,117`; `dashboard/page.tsx:77-81`; `lib/auth/actions.ts:311-440`; **M** *(už tracked)*
- **Print page nepředává `coverBg`/`coverText` do `BookDocument`** — barva desek se v finálním PDF tiše zahodí. `app/print/book/[token]/page.tsx:44-51`; `lib/book/load.ts:101-106`; `BookDocument.tsx:55-61`; **S** *(už tracked)*

**Střední:**

- **Per-IP rate-limiting je obejitelný přes `x-forwarded-for`** (bere `split(',')[0]`, který útočník prefixuje) — týká se auth brute-force, leads, print. Na Vercelu brát pravý (poslední) segment, který Vercel garantuje. Přidat per-account cap na owner-login/reset (senior už ho má). `lib/rate-limit.ts:121-125`; **S**
- **CSP `script-src 'unsafe-inline'`** vypíná hlavní XSS ochranu. Přejít na nonce-based CSP (`'strict-dynamic'`), nebo aspoň dokumentovat jako akceptované reziduum (uživatelský obsah je dnes renderovaný jako text). `next.config.ts:18,67-73`; **M**
- **`prompt_frequency=2` (dvakrát týdně) se sbírá a ukládá, ale nikdy nehonoruje.** `planWeeklyQueue` ho nečte, cron běží jen v pondělí (`0 9 * * 1`), přesto UI slibuje „po + čt". Truthfulness problém. Buď wire (čtvrteční cron + skip freq=1 na čtvrtek), nebo odebrat volbu. `lib/prompts/schedule.ts:68-154`; `vercel.json`; **M** *(corr-06, už tracked)*

**Nízká:**

- `placeBookOrder` linkuje tisk k nejnovější knize podle `created_at` — u vícedílného seniora prázdný Díl 2. Vybírat podle stavu/počtu zodpovězených. `lib/book/actions.ts:66-72`; **S** *(už tracked)*
- `prompt_delivery_log` RLS pustí seniora číst vlastní telefon + delivery metadata přes REST. Zúžit na owner-only. `supabase/migrations/20260605160000_multichannel_delivery.sql:48,74-76`; **S**
- `families` INSERT policy pustí libovolného autentizovaného uživatele (i seniora) vytvořit rodinu, kterou vlastní. Přidat `role = 'owner'` check. Také prověřit `profiles_update_self` (umožní si nastavit libovolné `family_id`). `20260504141500_rls_and_storage.sql:70-72`; **S**
- Stripe webhook věří `metadata.familyId/bookId` bez ověření, že patří k sobě. Před `markBookPaid` ověřit `book.family_id === meta.familyId`. `app/api/webhooks/stripe/route.ts:81-126`; **S**
- Auth rate-limit fail-open v prod, když KV není provisioned (tichá ztráta brute-force ochrany) — přidat startup/health assertion. `lib/rate-limit.ts:45-58`; **S** (páruje E4) *(už tracked)*
- `newMemoryNotificationEmail` count natvrdo `1` — nikdy reálný postup. `lib/memories/actions.ts:56-62`; **S** *(už tracked)*
- `transcribe-backfill` cron doplní transkript, ale nespustí znovu extrakci roku. `app/api/cron/transcribe-backfill/route.ts:52-55`; **S**
- smsbrana segments/price přes `Number()` — comma-decimal zapíše `NaN`. `lib/messaging/providers/smsbrana.ts:285-294`; **S** *(už tracked)*
- Dárková vyplňovací kniha (`shop_orders`) nemá žádný print/fulfilment path. `lib/shop/order-actions.ts`; `lib/book/load.ts:30-33`; **M**
- Hardcoded e-maily `ahoj@vzpominkar.cz` / `resend.dev` fallback necentralizované. `lib/email/provider.ts:78`; `lib/email/templates.ts:113`; **S** *(už tracked)*

---

## 5) ✅ Co je hotové (od posledních auditů)

> Reconciliace našla tyto dříve trackované body jako **DONE** — dokumenty (PRE-LAUNCH/AUDIT/CRO) jsou v těchto bodech zastaralé.

**CRO / funnel:**
- **P0-2** Cenová past na deskách opravena — „hnědá se zlatým písmem je v ceně", „+ 99 Kč" sedí s `isPremiumCover`. `cenik/page.tsx:42`
- **P0-3** Sticky CTA na `/kniha` míří na správný (levnější) produkt `/kniha/sestavit`. `Shell.tsx:27-31`; `kniha/page.tsx:146-150`
- **P0-4** Reorder v konfigurátoru funguje na touch — vždy viditelná ▲▼ tlačítka, grip skryt na coarse pointeru. `configurator.tsx:206-218,499-553`
- **P1-3** Reassurance stack (pravdivá tvrzení) na platbě + standard checkout. `platba/page.tsx:172-186`; `standard-order.tsx:350-381`
- **P1-4** „Tisk je v ceně" bullet na platbě. `platba/page.tsx:18`
- **P1-6** Homepage sticky mobile CTA + safe-area padding. `app/page.tsx:847-856,153`
- **P1-7** Hero H1 overflow na úzkých telefonech opraven (scoped clamp). `app/page.tsx:119-123,158-163`
- **P2-13** Placeholder social proof na platbě nahrazen čestným „Co se stane po zaplacení". `platba/page.tsx:198-221`

**Multichannel / messaging:**
- **corr-01 (jádro)** Noop SMS/WhatsApp už tiše neztrácí otázku — dispatch padá na e-mail fallback přes `isLive` gate. *(Reziduum: UI stále nabízí SMS/WhatsApp i s noop providerem — viz níže.)* `dispatch.ts:320`
- **corr-02/03/04** Stale opt-in se nereaktivuje bez fresh consent; re-consent maže `*_opt_out_at`; smsbrana posílá diakritiku přes `data_code=ucs2`. `senior-actions.ts:81-83,160-161`; `smsbrana.ts:219`
- **sec-01/perf-01** Provider fetch má `AbortSignal.timeout(8000)` — hung socket už nezastaví celou dávku. `smsbrana.ts:235`; `whatsapp.ts:127`
- **cq-01** Idempotency-gate sjednocena do `upsertPendingLog`/`sendAndConfirm`. `dispatch.ts:111,215`
- **legal-reframe** Opt-out link v SMS/e-mailu, route `/odhlasit`, čl. 14 GDPR notice na `/soukromi` — vše wired. `dispatch.ts:386-389`; `app/odhlasit/[token]/page.tsx`; `soukromi/page.tsx:274-333`

**Launch-blockery z předchozího auditu:**
- **BL-P0-2** Placeholder transkript se v produkci už neukládá (vrací `null`, cron retry). `lib/memories/transcribe.ts:22`
- **BL-P0-3** Checkout origin už není localhost — vše z `SITE_URL`. `lib/stripe/checkout.ts:10`
- **BL-P1-1** `/q/{token}` magic-link route hotová a volaná z dispatch. `app/q/[token]/route.ts`; `dispatch.ts:374-376`
- **BL-P1-4** Leads se ukládají do tabulky `leads` (ne jen e-mailem). `app/api/leads/route.ts:51-57` *(pozor: stále neposílá leadovi nic — viz K3)*
- **PL-3/PL-13 (kódová část)** SITE_URL centralizace + book-PDF render (`@sparticuz/chromium`) hotové; zbývá ENV/deploy. `lib/site.ts`; `app/api/print/book/route.ts`

> **Reziduum corr-01:** owner-facing UI (`add-senior-panel.tsx:350-351`, `delivery-form.tsx:118-119`) stále nabízí SMS/WhatsApp i když je provider noop → owner věří, že jde SMS, ale jde e-mail. Skrýt volby dokud provider není live (předat `isLive` flag). **S**

---

## 6) Doporučené pořadí (PR-sized)

### PŘED SPUŠTĚNÍM (musí být hotové, než se účtuje)

**Sprint A — kódové blockery (1 PR each):**
1. **PR: Reconciliace placeného výtisku** (K1) — webhook povýší `book_orders` draft→paid + payment intent. **M**
2. **PR: Zamknout `magic_token`/PII v RLS** (K2) — přesun secret/PII sloupců do service-role-only tabulky nebo column-level revoke + view. Rotovat existující tokeny. **M**
3. **PR: Lead-magnet honesty** (K3) — buď autoresponder + Stripe coupon, nebo stáhnout slib 3 e-mailů + 200 Kč z homepage/Promo. (Rychlá varianta: stáhnout copy = **S**.)
4. **PR: Free-path price assertion + label** (K4/K5) — dev/prod guard + odvození `isFree` ze serverové ceny. **S**
5. **PR: `/auth/confirm` cross-device verify** (K5). **M**
6. **PR: Mrtvá mobilní navigace** — sjednotit `HomeMobileMenu` na reálné routy + přidat `/darek`. **S**
7. **PR: Foto z galerie u seniora** — zahodit `capture` nebo dvě tlačítka. **S**
8. **PR: Rate-limit IP + KV health assertion** (bezpečnost) — pravý segment `x-forwarded-for` + per-account cap. **S**
9. **PR: Honesty sweep marketingu** — Forbes/press reference, `/o-nas` osoby, vykání na `/kniha`, uvozovky. **S–M**

**Sprint B — ENV/dashboard/právní (paralelně, mimo kód):**
- E1 doména → E2 Resend SMTP → E6 prod URL switch (řetězec).
- E3 Stripe live + webhook (+ ověřit E5 cenu end-to-end po K4).
- E4 KV, E7 leaked-password, E8 OpenAI cap.
- E9 fakturační údaje + IČO/DIČ, E11 LIA + právní sign-off SMS/WhatsApp.
- E10 QR gate (poslední — až je doména živá).

### PO SPUŠTĚNÍ / NICE-TO-HAVE

1. **Auto-planner per-senior** (corr) + `coverBg/coverText` do PDF — datová korektnost. **M + S**
2. **Gender threading do owner app** — odstranit „vyrůstal/a" slash všude. **M**
3. **Gift branch P0-1** (recipient + věnování) — pokud `/darek` má reálně doručit dárkový mechanismus, jinak držet copy čestnou. **L**
4. **Funnel kosmetika** — custom checkout reassurance/consent/lead-time, cancel handoff banner, gender-first mikrokrok, `/kniha/hotovo` účtenka, konfigurátor mobilní reflow + first-run intro. (Skupina S/M PR.)
5. **Twice-weekly cadence** — wire nebo odebrat volbu „po + čt". **M**
6. **A11y dluh** — `AppMobileMenu` modal, `aria-current`, senior kontrast, tap-targety, `/v/[token]` alt. **S each**
7. **CSP nonce**, `prompt_delivery_log`/`families` RLS zúžení, webhook metadata cross-check. **S–M**
8. **Build hygiena** — mrtvé `.cert-*` CSS, `_channel` lint, Node engine, `moudro` chapter mapping. **S each**
9. **PL-9 abandoned-onboarding e-mail**, PL-12 Resend batch (až při objemu), PL-8 reálná fotka knihy. **M / M / S**

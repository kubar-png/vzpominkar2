# Kniha vzpomínek — fyzická vyplňovací kniha (design spec)

**Datum:** 2026-06-03 · **Branch:** `feat/kniha-vzpominek` · **Stav:** k odsouhlasení

## Cíl

Přidat **fyzickou vyplňovací knihu** jako samostatný doplňkový produkt vedle hlavní appky — pro lidi, kterým digitální model nevyhovuje. Koncept 1:1 jako Booktora.cz („Chci znát tvůj příběh"): obdarovaný píše odpovědi **rukou** do tištěné knihy s otázkami v 6 životních fázích. **Naše přidaná hodnota:** kupující si může otázky v knize navolit přes naše UI.

Nahrazuje dosavadní `/babybook` (ten byl jen variantou appky; tohle je fyzický prodej).

## Produkt & ceny

- Kniha „Kniha vzpomínek", ~300 otázek v **6 životních fázích**: Dětství, Školní léta, Dospívání, Rodina, Kariéra, Důchod (zralý věk).
- Obdarovaný píše rukou. Kupující ji dává jako dárek.
- **Dvě cesty / ceny** (jedna kniha na objednávku):
  - **A) Standardní** — 300 předpřipravených otázek — **599 Kč**.
  - **B) Vlastní otázky** — kupující si otázky upraví v konfigurátoru — **1 099 Kč**.
- **Poštovné zdarma** (v ceně). Země: **CZ + SK**.
- Guest nákup (bez registrace), nezávislý na appce.
- *Odloženo na v2:* množstevní balíčky (2–5 ks) — s per-objednávku custom knihami se komplikují.

## Routy & stránky

| Routa | Účel |
|---|---|
| `/kniha` | Produktová/marketing stránka (editorial styl jako ostatní marketing přes `Shell`). 2 CTA: „Koupit (599)" a „Sestavit vlastní (1099)". |
| `/kniha/sestavit` | Konfigurátor (cesta B) — wizard po 6 fázích. |
| `/kniha/hotovo` | Success stránka po zaplacení (Stripe `success_url`). |
| `/babybook` | → **301 redirect** na `/kniha` (v `next.config.ts`). |

Stránka `/kniha` sekce: hero (kniha + claim + 2 CTA), proč fyzická kniha vs appka, 6 fází s ukázkovými otázkami, jak to funguje (daruješ → vyplní rukou → kronika), recenze, ceník (599 / 1099), FAQ, závěrečná CTA karta (`FinalCta`).

## Konfigurátor (cesta B)

Krok = **jedna životní fáze** (postupně 1→6, ať v tom není zmatek), na konci rekapitulace.

- Každá fáze předvyplněná **doporučenou default sadou** otázek (~50).
- U každé otázky: **přepsat** (edit textu), **odebrat**; tlačítko **„přidat vlastní otázku"**.
- Meze na fázi: rozsah **10–60** otázek (drží knihu „knihou" a tisk předvídatelný). Validace + nenásilné upozornění.
- Postaveno nad **stávající knihovnou otázek z appky** (reuse `prompts`/`library-picker` + vlastní otázky), v guest variantě (žádné DB čtení per-uživatel — knihovna se servíruje jako data).
- **Persistence (guest):** výběr žije client-side v React state + zrcadlí se do `localStorage` (přežije refresh). Při „Koupit" se finální sada pošle do server akce, která založí objednávku a Stripe session.

## Objednávkový flow

1. **Cesta A:** `/kniha` → „Koupit" → server akce `createBookShopCheckout({ variant: "default" })` → Stripe Checkout. Sada otázek = kanonický default (uložen referencí + verzí).
2. **Cesta B:** konfigurátor → „Koupit" → `createBookShopCheckout({ variant: "custom", questions })` → založí `shop_orders` (status `pending`, uloží `questions` JSON) → Stripe Checkout (`metadata.orderId`).
3. **Stripe Checkout** (`mode: payment`, guest): `shipping_address_collection` (CZ, SK), e-mail kupujícího. Poštovné zdarma (žádná shipping line / shipping option = 0).
4. Po zaplacení → `success_url = /kniha/hotovo`.

## Data model

Nová tabulka **`public.shop_orders`** (nezávislá na účtech):

```
id                        uuid pk
email                     text not null            -- z Checkout customer_details
variant                   text not null check (variant in ('default','custom'))
questions                 jsonb not null           -- finální sada (viz níže)
amount_czk                int  not null check (amount_czk >= 0)
status                    text not null default 'pending'
                            check (status in ('pending','paid','pdf_ready','shipped','cancelled'))
shipping_name             text
shipping_address          jsonb                    -- {line1,line2,city,postal_code,country}
stripe_session_id         text
stripe_payment_intent_id  text unique              -- idempotence (jako books)
pdf_path                  text                     -- Supabase Storage cesta k tiskovému PDF
created_at / updated_at   timestamptz
```

`questions` JSON tvar (liší se dle variant — bez nejednoznačnosti):
```json
// default — jen reference na verzi; PDF generátor rozbalí kanonickou sadu:
{ "variant": "default", "default_version": "v1" }

// custom — plná editovaná sada (6 fází):
{
  "variant": "custom",
  "phases": [
    { "key": "detstvi", "title": "Dětství", "questions": ["…", "…"] },
    "… 6 fází"
  ]
}
```

- **RLS:** zapnout, **žádné policy pro anon/authenticated** → přístup jen přes service-role (guesti nemají účet; appka tabulku nečte z klienta).
- Default sada: `lib/book-shop/default-questions.ts` — verzovaná konstanta (6 fází × ~50), kurátorováno ze stávající `prompts` knihovny + doplnění. `default_version` umožní pozdější změny bez rozbití starých objednávek.
- Nové úložiště: Supabase Storage bucket **`shop-book-pdfs`** (private), čteno jen service-role.

## Webhook & idempotence

Rozšířit `app/api/webhooks/stripe/route.ts` o `productType: "shop_book"`:
- `checkout.session.completed` → najdi `shop_orders` dle `metadata.orderId` (custom) nebo založ z metadata (default), zapiš `shipping_*`, `stripe_payment_intent_id`, přepni `pending → paid` **atomicky** (`update … where status='pending'`, 0 řádků = duplicitní doručení → no-op), styl jako `markBookPaid`. 23505 na PI = už zpracováno.
- Po `paid` → naplánuj generování PDF (`after()` nebo navazující krok).

## Auto-generování tiskového PDF

- **Knihovna:** `@react-pdf/renderer` (čisté JS, žádný headless browser → spolehlivé na Vercel Fluid Compute). Nová dev/runtime dependency.
- **Trigger:** po `paid` (v webhooku přes `after()`), aby se neblokovala odpověď Stripu. Idempotentní (přeskoč, když `pdf_path` už je).
- **Šablona** (`lib/book-shop/pdf/`): A5, titulní strana, 6 kapitolových předělů, u každé otázky text + linkovaný prostor na ruční psaní. Stránkování dle počtu otázek. v1 = funkční čistá typografie; grafika iterativně.
- **Výstup:** PDF nahrát do `shop-book-pdfs`, uložit `pdf_path`, přepnout `status → pdf_ready`.

## Fulfilment (v1) & e-maily

- Po `pdf_ready`: **e-mail tobě** (Resend, `LEADS_NOTIFY_TO`/`EMAIL_FROM`) s adresou + odkazem na PDF → ty/tiskárna vytisknete a pošlete.
- **Potvrzovací e-mail kupujícímu** (Resend) hned po `paid`.
- `status → shipped` zatím ručně (DB). Admin přehled objednávek = v2.

## Co nahrazujeme (babybook footprint)

Smazat/přesměrovat (zmapováno):
- `app/babybook/page.tsx` → smazat (obsah nahrazen `/kniha`).
- `next.config.ts` redirects → přidat `/babybook` → `/kniha` (301).
- `app/page.tsx` companion karta (ř. 573) + footer odkaz (ř. 754) → cílit na `/kniha`, text „Kniha vzpomínek".
- `components/landing/SiteFooter.tsx` (ř. 89) → `/kniha`.
- `app/sitemap.ts` / `app/robots.ts` → `/babybook` → `/kniha`.
- `app/(auth)/signup/page.tsx` — odstranit `?product=babybook` větev (`isBabybook`, badge, `SignupForm product`); nový produkt nejde přes signup.
- `components/marketing/SmoothScroll.tsx` path list → `/kniha`.
- `components/landing/PrimaryCta.tsx` / `FinalCta.tsx` komentáře → aktualizovat.
- `babybook-*` CSS třídy v `globals.css` → přejmenovat/nahradit třídami nové stránky (případně přesunout potřebné styly).

## Mimo rozsah / závislosti / rizika

- **Obsah default 300 otázek** — kurátorováno ze stávající knihovny + doplnění; finální znění je iterativní content task (struktura 6×~50 je fixní).
- **Grafika interiéru/obálky** — v1 čistá funkční šablona, „luxusní" sazba později.
- **Ostré platby** = živý Stripe (stejný blocker jako hlavní produkt — teď „free path"). Stavíme v **test mode**, naživo až bude Stripe připojený. (`priceForProductCzk`-style: 0 → free path i tady? Pro fyzický produkt 0 nedává smysl → v test mode použít test klíče.)
- `@react-pdf/renderer` — nová závislost; ověřit velikost bundlu (jen server-side, nemělo by zatížit klienta).

## Testy

- Unit: cena dle variant (599/default, 1099/custom); validace konfigurátoru (meze 10–60/fáze, prázdné/dlouhé otázky); webhook idempotence pro `shop_book` (mock admin client, styl `mark-book-paid.test.ts`); tvar `questions` JSON.
- PDF generátor: smoke test, že z dané sady vznikne neprázdné validní PDF.
- e2e: `/kniha` se vyrenderuje, obě CTA viditelná; konfigurátor projde 6 fází.

## Otevřené (k potvrzení při review)

- Default 300 otázek: zdroj/kurátorování ze stávající `prompts` — kolik jich knihovna reálně má (doplnit na ~300?).
- Formát knihy (A5?) + orientační rozsah stran pro tisk.
- Zda potvrzovací e-mail kupujícímu obsahuje i náhled vybraných otázek.

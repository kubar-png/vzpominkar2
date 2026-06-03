# Refactoring & optimalizace Vzpomínkáře — implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) nebo superpowers:subagent-driven-development (subagenti) k provedení tohoto plánu úkol po úkolu. Kroky používají checkbox (`- [ ]`) syntaxi pro tracking.

**Goal:** Postupně provést všechny okruhy z auditu — zabezpečit launch, dotáhnout datovou integritu, postavit testovací síť + CI, vyladit výkon a uklidit kód — aniž bychom rozbili stávající (zdravý) build.

**Architecture:** Práce probíhá na jedné feature branchi `refactor/audit-2026-06`. Každá **fáze** je samostatně commitnutelná a končí zeleným stavem (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`). Fáze jsou v pořadí podle hodnoty/rizika: 1) launch-blockery, 2) datová integrita, 3) testy+CI, 4) výkon+úklid, 5) (volitelně) hloubkový DX refactor. Žádná fáze nemění veřejné chování produktu kromě explicitně uvedených oprav.

**Tech Stack:** Next.js 15 (App Router, Turbopack), React 19, TypeScript 5.7 (`strict`), Supabase (Postgres + RLS), Stripe, Resend, Upstash, Zod, Vitest, Playwright, pnpm.

**Baseline (ověřeno při auditu):** `typecheck` ✅ 0 chyb · `lint` ✅ 0 varování · `build` ✅ · shared First-Load JS 103 kB. Vše zelené — to je náš kontrolní bod, ke kterému se vracíme po každé fázi.

---

## Fáze 0 — Branch a baseline

### Task 0.1: Založit feature branch a potvrdit zelený baseline

**Files:** žádné (jen git)

- [ ] **Krok 1:** Z `main` založit branch
  ```bash
  git checkout -b refactor/audit-2026-06
  ```
- [ ] **Krok 2:** Potvrdit baseline (musí projít celé, ať víme, že start je čistý)
  ```bash
  pnpm typecheck && pnpm lint && pnpm test
  ```
  Expected: typecheck 0 chyb, lint 0 varování, Vitest 3 passed. (`pnpm build` baseline už ověřen v auditu — přeskočit kvůli času, spustíme na konci fáze.)
- [ ] **Krok 3:** Uložit kopii auditu jako trackovací dokument
  - Create: `AUDIT.md` (zkrácený přehled nálezů + odkaz na tento plán). Slouží jako changelog refactoringu.

---

## Fáze 1 — Launch-blockery + bezpečnost

> Cíl fáze: produkt jde bezpečně spustit. Samé malé, vysoce hodnotné změny. Po fázi: commit `chore: launch-blockers & security hardening`.

### Task 1.1: Migrace pro 3 chybějící sloupce `profiles` (🔴 KRITICKÉ)

**Problém:** `profiles.prompt_frequency`, `contact_channel`, `contact_address` se používají v kódu (`lib/auth/actions.ts:356`, `lib/auth/senior-actions.ts:97`, `app/api/cron/weekly-reminder/route.ts:80`, rodina/otázky) i v `types/database.ts`, ale žádná migrace je nevytváří — čisté prostředí z migrací spadne.

**Files:**
- Read: `types/database.ts` (sekce `profiles` → přesné TS typy sloupců)
- Create: `supabase/migrations/20260603120000_profiles_prompt_delivery_columns.sql`

- [ ] **Krok 1:** Zjistit přesnou definici sloupců v živé DB (zdroj pravdy), ne hádat z TS:
  ```bash
  # Přes Supabase MCP (read-only) nebo CLI:
  #   list_tables → profiles, nebo:
  #   execute_sql: select column_name, data_type, is_nullable, column_default
  #                from information_schema.columns
  #                where table_name='profiles'
  #                and column_name in ('prompt_frequency','contact_channel','contact_address');
  ```
  Zaznamenat přesné typy/nullability/defaulty + jestli existují CHECK constrainty (např. `contact_channel in ('email','whatsapp')`, `prompt_frequency in (1,2)`).
- [ ] **Krok 2:** Napsat migraci `CREATE`-ující sloupce **idempotentně** (`add column if not exists`), přesně dle živé DB. Šablona (typy doplnit z Kroku 1):
  ```sql
  alter table public.profiles
    add column if not exists prompt_frequency smallint not null default 1,
    add column if not exists contact_channel text,
    add column if not exists contact_address text;

  -- CHECK constrainty doplnit dle živé DB (idempotentně přes DO/IF NOT EXISTS):
  -- alter table public.profiles add constraint profiles_prompt_frequency_chk
  --   check (prompt_frequency in (1,2));
  -- alter table public.profiles add constraint profiles_contact_channel_chk
  --   check (contact_channel is null or contact_channel in ('email','whatsapp'));
  ```
  Idempotence je nutná: na živé DB sloupce už jsou, migrace nesmí spadnout.
- [ ] **Krok 3:** Ověřit, že migrace projde na čisté lokální DB:
  ```bash
  pnpm db:reset   # supabase db reset — aplikuje všechny migrace + seed
  ```
  Expected: reset proběhne bez chyby; `profiles` má všechny 3 sloupce.
- [ ] **Krok 4:** Regenerovat typy a ověřit, že se nezměnily (potvrzení parity migrace ↔ živá DB):
  ```bash
  pnpm db:types && git diff --stat types/database.ts
  ```
  Expected: žádná změna v `types/database.ts` (migrace přesně reprodukuje živý stav).
- [ ] **Krok 5:** `pnpm typecheck` → 0 chyb.

### Task 1.2: Audit a sync `.env.example` (🟡 launch-gate)

**Files:**
- Modify: `.env.example`
- Read: `README.md` (sekce env)

- [ ] **Krok 1:** Vyrobit autoritativní seznam reálně čtených env proměnných:
  ```bash
  grep -rhoE 'process\.env\.[A-Z0-9_]+' lib app middleware.ts scripts next.config.ts \
    | sort -u
  ```
- [ ] **Krok 2:** Diff proti `.env.example`. Doplnit chybějící (potvrzené z auditu: `OPENAI_API_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `PRICE_BOOK_BASE_CZK`, `PRICE_BOOK_ADDON_CZK`), odstranit/opravit mrtvé (`PRICE_YEARLY_ACCESS_CZK`; rozhodnout o `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — checkout je redirect-based, takže pokud ho nikde nečteme, smazat; `PRICE_BOOK_PRINT_CZK` ponechat jen pokud se čte). Každou novou doplnit s komentářem.
- [ ] **Krok 3:** Srovnat README sekci env + ceny (2 890 Kč model) s realitou.
- [ ] **Krok 4:** Ověřit, že žádný kód nečte proměnnou, která není v `.env.example` (a naopak):
  ```bash
  # ruční diff výstupu z Kroku 1 proti .env.example
  ```

### Task 1.3: Sjednotit `SITE_URL` (🟡 SEO launch-gate)

**Problém:** `metadataBase`/JSON-LD → `vzpominkar2.vercel.app`, ale `sitemap.ts`/`robots.ts` → `vzpominkar.cz`. JSON-LD `url` v `app/page.tsx:60` je dokonce hardcoded.

**Files:**
- Create: `lib/site.ts`
- Modify: `app/layout.tsx:66`, `app/page.tsx:60`, `app/sitemap.ts:4`, `app/robots.ts:4`

- [ ] **Krok 1:** Vytvořit jediný zdroj:
  ```ts
  // lib/site.ts
  export const SITE_URL = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://vzpominkar.cz"
  ).replace(/\/$/, "");
  ```
  (Pozn.: default na produkční doménu, ne na vercel preview.)
- [ ] **Krok 2:** Nahradit všechny 4 výskyty importem `SITE_URL`. Smazat hardcoded `url` z `ORG_JSON_LD`.
- [ ] **Krok 3:** Přidat `alternates: { canonical: "/" }` do root `metadata` (a per-page kde dává smysl).
- [ ] **Krok 4:** `pnpm build` → ověřit, že `sitemap.xml`/`robots.txt` i OG metadata teď ukazují konzistentně. (Před launchem nastavit `NEXT_PUBLIC_APP_URL` na produkční doménu — poznámka do `PRE-LAUNCH.md`.)

### Task 1.4: HSTS header (🟡 bezpečnost)

**Files:** Modify: `next.config.ts:34` (pole `SECURITY_HEADERS`)

- [ ] **Krok 1:** Přidat do `SECURITY_HEADERS`:
  ```ts
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  ```
- [ ] **Krok 2:** `pnpm build` a ověřit hlavičku (`curl -sI` na lokální `next start`, nebo unit kontrola configu). Pozn.: `script-src 'unsafe-inline'` (nonce-based CSP) je ponecháno na Fázi 5 — netriviální.

### Task 1.5: Prod-pojistka pro `seed-test-account.ts` (🟠 nebezpečné)

**Problém:** Skript maže/recreatuje účet `kubar@centrum.cz` s heslem `123456`; bez pojistky může proti produkci smazat data.

**Files:** Modify: `scripts/seed-test-account.ts:18-28`

- [ ] **Krok 1:** Hned po načtení `url` přidat guard:
  ```ts
  const isLocal = /127\.0\.0\.1|localhost|:54321/.test(url ?? "");
  if (!isLocal && process.env.SEED_ALLOW_REMOTE !== "1") {
    console.error(
      `Refusing to seed non-local Supabase (${url}). ` +
      `Set SEED_ALLOW_REMOTE=1 to override.`,
    );
    process.exit(1);
  }
  ```
- [ ] **Krok 2:** Nahradit hardcoded osobní e-mail neutrálním (`seed-owner@example.com`) — ať seed nezasahuje reálný účet. (Hesla `123456`/`heslo123` jsou pro local seed OK, jen místní.)
- [ ] **Krok 3:** Ověřit, že skript pořád funguje lokálně: `npx tsx --env-file .env.local scripts/seed-test-account.ts`.

### Task 1.6: Per-username throttle pro senior login + ověření KV (🟡 bezpečnost)

**Problém:** Senior login je rate-limited jen per-IP; usernames jsou uhodnutelné, hesla krátká. (Fail-open je už OK — jen když KV vůbec není; to řešíme provozně.)

**Files:** Modify: `lib/rate-limit.ts`, `lib/auth/actions.ts:235` (signInSenior)

- [ ] **Krok 1:** V `lib/rate-limit.ts` přidat limiter keyovaný usernamem (nízký strop, např. 10/h):
  ```ts
  const seniorUserLimiter = makeLimiter({ prefix: "senior-login-u", limit: 10, windowSec: 60 * 60 });
  ```
  a exportovat funkci `checkSeniorLoginLimit(username: string)` (vrací stejný tvar jako `checkRateLimit`), fail-closed na error v prod, fail-open při `unconfigured` (konzistentní s `authFailDecision`).
- [ ] **Krok 2:** V `signInSenior` volat oba limity (per-IP `checkRateLimit("auth","senior-login")` + per-username). Zachovat generickou chybu (neenumerovat).
- [ ] **Krok 3:** Do `PRE-LAUNCH.md` přidat launch-gate: „Ověřit `KV_REST_API_URL`/`KV_REST_API_TOKEN` v produkčním Vercel projektu (jinak je auth rate-limit vypnutý)."
- [ ] **Krok 4:** `pnpm typecheck && pnpm lint`.

### Task 1.7: Silné výchozí heslo seniora (🟡 bezpečnost)

**Problém:** `add-senior-panel.tsx:28` generuje default přes `Math.random()` (~14 bitů). Server-side reset to dělá crypto-secure správně.

**Files:** Modify: `app/(app)/family/[familyId]/rodina/add-senior-panel.tsx:28-39`; Read: `lib/auth/senior-account-actions.ts:66` (`generateMemorablePassword`)

- [ ] **Krok 1:** Přečíst stávající crypto generátor v `senior-account-actions.ts`.
- [ ] **Krok 2:** Buď (a) vystavit server action, která vrátí silné navrhované heslo a klient ji zavolá, **nebo** (b) v klientu použít `crypto.getRandomValues` se stejným 256-slovním slovníkem. Preferuj (a) — jeden zdroj pravdy, sdílený slovník.
- [ ] **Krok 3:** Ověřit ručně, že formulář prefilluje silné heslo a uložení funguje.

### Task 1.8: Zelená brána Fáze 1 + commit

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` → vše zelené.
- [ ] `git add -A && git commit -m "chore: launch-blockers & security hardening (audit fáze 1)"`

---

## Fáze 2 — Datová integrita

> Cíl: žádné dvojí platby, žádné seq-scany na teplé cestě, idempotentní webhook. Commit `fix: data integrity (audit fáze 2)`.

### Task 2.1: Index `prompt_assignments(senior_id, scheduled_for)` (🟠)

**Files:** Create: `supabase/migrations/20260603130000_prompt_assignments_senior_idx.sql`

- [ ] **Krok 1:** Migrace:
  ```sql
  create index if not exists prompt_assignments_senior_scheduled_idx
    on public.prompt_assignments (senior_id, scheduled_for);
  ```
  (Pokrývá `.eq("senior_id")` filtry + `order by scheduled_for` na domovské stránce seniora i RLS policy `assignments_select_owner_or_senior`.)
- [ ] **Krok 2:** `pnpm db:reset` → projde. `pnpm db:types` → bez diffu.

### Task 2.2: Unique constraint proti duplicitním knihám/dílům (🟠)

**Problém:** `startVolumeCheckout`/`startBaseCheckout`/`startOnboarding` dělají read-modify-write `max(sequence_no)+1` bez DB záruky → dvojklik = dvě knihy.

**Files:**
- Read: `lib/stripe/checkout.ts:86-180`, `lib/onboarding/actions.ts:84-97`, migrace `20260531120000_books_volumes.sql` (existující constrainty)
- Create: `supabase/migrations/20260603140000_books_unique_sequence.sql`
- Modify: `lib/stripe/checkout.ts`, `lib/onboarding/actions.ts`

- [ ] **Krok 1:** Přečíst přesné schéma `books` (nullable `senior_id`? jak se liší base vs volume?).
- [ ] **Krok 2:** Migrace — unique na pořadí v rámci seniora (ošetřit NULL `senior_id`):
  ```sql
  create unique index if not exists books_family_senior_seq_uniq
    on public.books (family_id, coalesce(senior_id, '00000000-0000-0000-0000-000000000000'::uuid), sequence_no);
  ```
  Zvážit i partial unique „max jedna nezaplacená kniha na seniora" pokud to byznys vyžaduje (rozhodnout dle Kroku 1).
- [ ] **Krok 3:** V akcích ošetřit Postgres chybu `23505` (unique violation): při kolizi znovu načíst existující řádek a pokračovat s ním, ne spadnout.
- [ ] **Krok 4:** `pnpm db:reset` + `pnpm typecheck`. Ručně ověřit dvojitý submit (rychlý dvojklik) nevytvoří 2 knihy.

### Task 2.3: Idempotentní Stripe webhook pro knihy (🟠)

**Problém:** `markBookPaid` guarduje jen na `book.paid` (check-then-write); dvě paralelní doručení → druhé narazí na unique `payment_intent` → 500 → Stripe retryuje donekonečna.

**Files:**
- Read: `app/api/webhooks/stripe/route.ts:71-106`, `lib/books/server.ts:14-46` (`markBookPaid`)
- Modify: `lib/books/server.ts`, `app/api/webhooks/stripe/route.ts`

- [ ] **Krok 1:** Přepsat `markBookPaid` na atomický conditional update:
  ```ts
  // místo: read paid → if !paid → update
  // udělej: update ... set paid=true, stripe_payment_intent_id=pi, paid_at=now()
  //         where id = bookId and paid = false
  // a) 0 řádků ovlivněno → už zaplaceno (idempotentní no-op, vrať ok)
  // b) chyba 23505 (PI už použito jinde) → log + ok (duplicitní doručení)
  ```
- [ ] **Krok 2:** Stejný pattern zkontrolovat u print-order větve (ta už guarduje na PI — sjednotit styl).
- [ ] **Krok 3:** Ověření přijde v Fázi 3 (Task 3.2 testuje přesně tyto cesty). Zatím `pnpm typecheck`.

### Task 2.4: Zelená brána Fáze 2 + commit

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` → zelené.
- [ ] `git commit -m "fix: data integrity — indexy, unique constraint, idempotentní webhook (audit fáze 2)"`

---

## Fáze 3 — Testy + CI

> Cíl: záchranná síť kolem peněz, autorizace a uploadů + CI, které to hlídá. TDD kde to jde. Commit `test: money/authz/upload coverage + CI (audit fáze 3)`.

### Task 3.1: CI workflow

**Files:** Create: `.github/workflows/ci.yml`

- [ ] **Krok 1:** Workflow běžící na PR + push do `main`:
  ```yaml
  name: CI
  on: { push: { branches: [main] }, pull_request: {} }
  jobs:
    check:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
          with: { version: 10 }
        - uses: actions/setup-node@v4
          with: { node-version: 20, cache: pnpm }
        - run: pnpm install --frozen-lockfile
        - run: pnpm typecheck
        - run: pnpm lint
        - run: pnpm test
  ```
- [ ] **Krok 2:** (Volitelně) druhý job pro `pnpm build` se zástupnými env proměnnými.
- [ ] **Krok 3:** Commitnout; po pushnutí branch ověřit, že CI zezelená.

### Task 3.2: Testy Stripe webhooku + idempotence (TDD, nejvyšší finanční riziko)

**Files:**
- Read: `app/api/webhooks/stripe/route.ts`, `lib/stripe/checkout.ts`, `lib/books/server.ts`
- Create: `tests/unit/stripe-webhook.test.ts`

- [ ] **Krok 1:** Napsat failing testy s mockem admin klienta (`vi.mock("@/lib/supabase/admin")`) a `stripe.webhooks.constructEvent`:
  - base book `checkout.session.completed` → kniha `paid`, rodina `active`
  - **duplicitní** doručení téže události → no-op (žádný druhý zápis, žádná 500)
  - print-order duplicitní PI → přeskočeno
  - chybějící `familyId`/`productType` metadata → early return
  - špatný podpis → 400
- [ ] **Krok 2:** Spustit, ověřit FAIL. → Krok 3: doladit implementaci z Task 2.3 ať testy projdou. → Krok 4: `pnpm test` PASS.

### Task 3.3: Testy výpočtu ceny / výběru produktu (TDD)

**Files:** Read: `lib/stripe/checkout.ts` (`priceForProductCzk`, `purchaseBook`); Modify/Create: `tests/unit/stripe-pricing.test.ts` (rozšířit stávající)

- [ ] **Krok 1:** Testy: base vs addon dle `countPaidBooks`, 0-CZK „skip Stripe" cesta vs reálná, konverze `priceCzk * 100` a zpět `amount_total / 100`.
- [ ] **Krok 2:** FAIL → (logika už existuje, spíš dokrytí) → PASS.

### Task 3.4: Testy autorizace / IDOR (TDD, nejvyšší riziko úniku dat)

**Files:**
- Read: `lib/auth/permissions.ts` (`hasActiveAccess`, `requireOwnerOfFamily`), `lib/memories/transcript-actions.ts:25` (`loadAuthorizedMemory`)
- Create: `tests/unit/permissions.test.ts`

- [ ] **Krok 1:** `hasActiveAccess` je čistá → pravdivostní tabulka (active+budoucí expirace, active+null, expired, trial, cancelled).
- [ ] **Krok 2:** `loadAuthorizedMemory` s mock admin klientem: senior, který není `author_id`, a owner z jiné `family_id` → musí být odmítnut (throw/redirect).
- [ ] **Krok 3:** FAIL → PASS.

### Task 3.5: Testy bezpečnosti uploadu (TDD)

**Files:** Modify: `lib/memories/actions.ts` (exportovat `sniffImageMime`, `mimeToExt` pokud nejsou); Create: `tests/unit/upload-safety.test.ts`

- [ ] **Krok 1:** Testy proti magic-byte fixturám: JPEG/PNG/GIF/WebP/HEIC přijmout; PDF/zip/prázdné/přejmenované `.exe.jpg` odmítnout.
- [ ] **Krok 2:** FAIL → PASS.

### Task 3.6: Test cron auth + extractYear normalizace (TDD)

**Files:** Create: `lib/cron.ts` (extrahovat `safeEqual`/`verifyCronAuth` z obou cron rout — viz Task 4.7); Create: `tests/unit/cron-auth.test.ts`; Read: `lib/memories/extract-metadata.ts` (`extractYear`)

- [ ] **Krok 1:** Test `safeEqual` + že špatný/chybějící Bearer → 401.
- [ ] **Krok 2:** Test `extractYear` clampingu (rok mimo 1900–2030 → null, špatná confidence → "low", ne-string content → prázdný).
- [ ] **Krok 3:** FAIL → PASS.

### Task 3.7: Oprava e2e smoke (cena) + odblokování happy-path

**Files:** Modify: `tests/e2e/smoke.spec.ts:17-21,47-62`

- [ ] **Krok 1:** Opravit `2 990 Kč` → `2 890 Kč` (řádek 20) a název testu. Ověřit i nadpis hero na řádku 13 proti reálné homepage.
- [ ] **Krok 2:** (Volitelně, větší) odblokovat owner→onboarding→senior happy-path proti seed/test projektu s vypnutým email-confirm. Pokud zdlouhavé, nechat skip, ale opravit cenu hned.

### Task 3.8: Zelená brána Fáze 3 + commit

- [ ] `pnpm typecheck && pnpm lint && pnpm test` (nově desítky testů) → zelené.
- [ ] `git commit -m "test: pokrytí peněz/authz/uploadů + CI (audit fáze 3)"`

---

## Fáze 4 — Výkon a úklid

> Cíl: méně JS, rychlejší archivy, čistý repozitář. Commit `perf: optimalizace & úklid (audit fáze 4)`.

### Task 4.1: Smazat nepoužité fonty Inter + Vollkorn

**Files:** Modify: `app/layout.tsx:3,37-49,94`

- [ ] **Krok 1:** Potvrdit nulové použití CSS proměnných:
  ```bash
  grep -rn "font-inter-loaded\|font-vollkorn-loaded\|\"Inter\"\|Vollkorn" app components --include=*.css --include=*.tsx
  ```
  Expected: jen definice v `layout.tsx` + string fallbacky v CSS (ty zůstávají, jsou zdarma). Pozn.: komentář na `layout.tsx:11` tvrdí, že Vollkorn je fallback pro seniorský povrch — ověřit, že seniorský povrch ho fakt nečte (používá Outfit). Pokud se reskin seniora plánuje, nechat poznámku, ale dokud var není použitý, font se reálně nestahuje až po smazání importu.
- [ ] **Krok 2:** Odstranit `Inter`, `Vollkorn` z importu (`layout.tsx:3`), smazat oba `const` bloky (37-49) a `${inter.variable} ${vollkorn.variable}` z `<html className>` (94).
- [ ] **Krok 3:** `pnpm build` → ověřit, že tyto dvě rodiny fontů zmizely z výstupu a routy se nezmenšily o chybu. Vizuálně zkontrolovat marketing + senior povrch.

### Task 4.2: Přesunout `lenis` + reveal observery z root layoutu

**Problém:** `SmoothScroll` (lenis + CSS) a `RevealObserver` jsou v root layoutu → v bundlu app/senior/auth, kde se nepoužijí. Navíc běží 2 reveal systémy.

**Files:** Modify: `app/layout.tsx:6-7,102-104`; `components/landing/Shell.tsx`; Read: `components/shared/RevealOnScroll.tsx`, `components/marketing/RevealObserver.tsx`, `app/globals.css` (oba `[data-reveal]` bloky)

- [ ] **Krok 1:** Rozhodnout o jednom reveal systému. `RevealObserver` (root, třída `is-revealed`, MutationObserver, podpora `data-reveal-delay-N`) je schopnější → ponechat ten, zrušit `RevealOnScroll`.
- [ ] **Krok 2:** Přesunout `<SmoothScroll />` + `<RevealObserver />` z root layoutu do marketing wrapperu. Nejčistší: vytvořit `app/(marketing)/layout.tsx` (route group už existuje, jen prázdná) a přesunout do ní marketing stránky — **ale** to je velký přesun (Task 4.8, volitelný). Menší krok teď: mountovat oba do `components/landing/Shell.tsx` (který marketing stránky používají) + na homepage (`app/page.tsx`, která Shell obchází). `CookieConsent` zůstává v root (je site-wide).
- [ ] **Krok 3:** Smazat `RevealOnScroll` z `Shell` a duplicitní `[data-reveal]/[data-revealed]` CSS blok v `globals.css` (~528-545). Migrovat případné delaye na `data-reveal-delay-N`.
- [ ] **Krok 4:** `pnpm build` → ověřit, že `lenis` zmizel z First-Load JS app/senior/auth rout. Vizuálně ověřit, že scroll/reveal na marketingu pořád funguje.

### Task 4.3: Streamovat archivy + lazy-load fotky

**Files:** Modify: `app/(app)/family/[familyId]/memories/page.tsx:53-71`, `app/(senior)/my-memories/page.tsx:50-83`; přidat lazy na `<img>` v: `dashboard/memory-card.tsx:137`, `memories-archive.tsx:232`, `memory-detail.tsx:253`, `my-memories/memory-item.tsx:76`

- [ ] **Krok 1:** Extrahovat list-s-podepsanými-URL do async child komponenty, obalit `<Suspense fallback={skeleton}>` pod `AppPageHeader` (vzor `MemoryFeedAsync`). Hlavička se vykreslí hned, karty streamují.
- [ ] **Krok 2:** Přidat `loading="lazy" decoding="async"` na off-screen fotomřížky (dashboard/archiv/my-memories).
- [ ] **Krok 3:** `pnpm build` + vizuální ověření streamování.

### Task 4.4: Guard dev stránek v produkci

**Files:** Create: `app/dev/layout.tsx`

- [ ] **Krok 1:** Jeden guard pro celý `/dev` strom místo per-page:
  ```tsx
  import { notFound } from "next/navigation";
  export default function DevLayout({ children }: { children: React.ReactNode }) {
    if (process.env.NODE_ENV === "production") notFound();
    return <>{children}</>;
  }
  ```
- [ ] **Krok 2:** Odstranit per-page guard z `app/dev/components/page.tsx:23` (teď redundantní).
- [ ] **Krok 3:** `pnpm build` → ověřit, že `/dev/*` routy zmizely z prod buildu (nebo vrací 404).

### Task 4.5: Centralizovat duplicitní utility

**Files:** Create/Modify: `lib/format/datetime.ts`, `lib/format/currency.ts`; Modify: ~8 call-sites

- [ ] **Krok 1:** `formatCzechDate(iso, opts?)` → nahradit ~8 kopií `toLocaleDateString("cs-CZ", …)` (`memory-card.tsx:17`, `memory-detail.tsx:19`, `scheduled-list.tsx:73`, `book/preview/page.tsx:133`, `StatsSidebar.tsx:153`, `memories-archive.tsx:181`, `my-memories/memory-item.tsx:24`, `StatusBlock.tsx:54`). Sjednotit varianty options.
- [ ] **Krok 2:** `formatCzk(n)` → nahradit kopie `toLocaleString("cs-CZ")` (`cenik:26`, `StatsSidebar:149`, `platba:85`, `signup:78`, `book/page:220`, `email/templates:407,451`).
- [ ] **Krok 3:** `formatTime(s)` (mm:ss) → `lib/format/` (`InlineAudioPlayer:125`, `audio-form:388`, `memory-detail:27` — pozor na variantu bez leading-zero). `roleLabel(role)` → `lib/format/` (`memory-detail:14`, `senior-card:41`).
- [ ] **Krok 4:** Smazat lokální `batchSign` v `my-memories/page.tsx:143` → použít `batchSignUrls` z `lib/family/server.ts`.
- [ ] **Krok 5:** `pnpm typecheck && pnpm lint && pnpm test`.

### Task 4.6: Smazat mrtvé adresáře/soubory

**Files:** smazat prázdné `app/(marketing)/.gitkeep`+dir, `emails/.gitkeep`+dir (templates jsou v `lib/email/templates.ts`); přesunout `public/saved/*.html` do `docs/` (nejsou produkt, ale veřejně se servírují); ověřit `components/shared/Logo.tsx` (jen dev) + `lib/auth/senior-account-actions.ts` (1 funkce → sloučit do `senior-actions.ts`)

- [ ] **Krok 1:** Ověřit nepoužití přes grep, pak smazat `(marketing)/` a `emails/` prázdné dir (POZOR: pokud Task 4.8 chce `(marketing)` použít, přeskočit).
- [ ] **Krok 2:** `git mv public/saved docs/saved-mockups` (ať se neservírují z `/saved/...`).
- [ ] **Krok 3:** Pokud `Logo.tsx` jen v dev galerii → smazat + odebrat z `dev/components`. Sloučit `resetSeniorPassword` do `senior-actions.ts`, smazat `senior-account-actions.ts`, opravit import v `senior-password-reset.tsx:6`.
- [ ] **Krok 4:** `pnpm typecheck && pnpm build`.

### Task 4.7: Drobné backend/cron vychytávky

**Files:** Modify: `app/api/cron/weekly-reminder/route.ts:152`, `app/api/cron/transcribe-backfill/route.ts:18,48`; `lib/cron.ts` (z Task 3.6)

- [ ] **Krok 1:** Weekly-reminder: posbírat odeslaná id a udělat jeden `update ... in(ids)` po smyčce (místo per-řádek).
- [ ] **Krok 2:** Transcribe-backfill: přidat kontrolu uplynulého času, breaknout před `maxDuration`; snížit `BATCH` na ~10.
- [ ] **Krok 3:** Rodina memory-count (`rodina/page.tsx:36`): nahradit fetch-rows-to-count za `count: 'exact', head: true` per senior.
- [ ] **Krok 4:** Přidat `app/global-error.tsx` (Czech, on-brand fallback).
- [ ] **Krok 5:** `pnpm typecheck && pnpm lint && pnpm test`.

### Task 4.8: Zelená brána Fáze 4 + commit

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` → zelené, ověřit zmenšení bundle (porovnat First-Load JS s baseline).
- [ ] `git commit -m "perf: optimalizace fontů/bundle/streamingu + úklid (audit fáze 4)"`

---

## Fáze 5 — Hloubkový DX refactor (volitelné, největší)

> Invazivnější, čistě maintainability. Doporučuju až po launchi. Rozhodnout, jestli teď, až sem dojdeme. Commit `refactor: DX — DB typy, ActionState, rozbití god-pages (audit fáze 5)`.

### Task 5.1: Sjednotit `ActionState<T>` (9 → 1)

**Files:** Create: `lib/actions.ts`; Modify: 9 action souborů (`lib/auth/actions.ts:27,281`, `lib/onboarding/actions.ts:11`, `lib/memories/actions.ts:72`, `transcript-actions.ts:15`, `owner-actions.ts:9`, `lib/prompts/actions.ts:10`, `lib/auth/profile-actions.ts:9`, `senior-actions.ts:27`)

- [ ] **Krok 1:** `export type ActionState<T = void> = { ok: true; data?: T; message?: string } | { ok: false; error: string; field?: string };` + přesunout sdílený `isNextRedirect` z `memories/actions.ts:23`.
- [ ] **Krok 2:** Migrovat 5 identických unionů hned; `SeniorAccountResult` převést na diskriminovaný tvar (kvůli narrowing). Postupně, soubor po souboru, s `pnpm typecheck` po každém.

### Task 5.2: Využít generované DB typy místo 70 inline generik

**Files:** Modify: ~32 souborů s `.maybeSingle<{…}>()`/`.returns<{…}>()`/`.single<{…}>()`; `app/(app)/dashboard/types.ts`; `middleware.ts:25` (`createServerClient<Database>`)

- [ ] **Krok 1:** Mechanicky, soubor po souboru: odstranit inline generikum tam, kde se selectují známé sloupce, a nechat inferenci z `<Database>`; kde je projekce, odvodit `Pick<Tables<'x'>, …>`. `tsc` po každém souboru odhalí nesoulady (to je smysl). Velký, ale bezpečný díky typecheck.
- [ ] **Krok 2:** Přidat `<Database>` do `middleware.ts`.

### Task 5.3: Rozbít god-pages

**Files:** `app/page.tsx` (786 ř.) → extrahovat sekce do `components/landing/`; `memory-detail.tsx` (540 ř.) → `WaveformPlayer`, `MediaGallery` do `components/`; sjednotit `lib/book/` → `lib/books/`

- [ ] **Krok 1:** Extrahovat homepage sekce (Hero, Steps, Gallery, Faq) + konstanty (`FORBES_TESTIMONIALS`, `DECK_QUESTIONS`, `ORG_JSON_LD`) do `components/landing/`.
- [ ] **Krok 2:** Extrahovat `WaveformPlayer`/`MediaGallery` z `memory-detail.tsx`; sladit s `InlineAudioPlayer`.
- [ ] **Krok 3:** `git mv lib/book/actions.ts lib/books/actions.ts`, smazat `lib/book/`, opravit import v `book-form.tsx:6`.

### Task 5.4: ESLint posílení

**Files:** Modify: `eslint.config.mjs`

- [ ] Přidat `@typescript-eslint/no-explicit-any: error` (zamkne současný stav 0 `any`), `no-floating-promises`, import-order. Vyžaduje `parserOptions.project`.

### Task 5.5: Zelená brána Fáze 5 + commit

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` → zelené.
- [ ] `git commit -m "refactor: DX cleanup (audit fáze 5)"`

---

## Finální handoff

- [ ] PR z `refactor/audit-2026-06` do `main` se souhrnem všech fází.
- [ ] Aktualizovat `PRE-LAUNCH.md` o nové launch-gates (KV provisioning, produkční `NEXT_PUBLIC_APP_URL`, business TODO: telefon/adresa/IČO na `/kontakt`, produkční Resend doména, leads tabulka).

## Self-review (provedeno)

- **Pokrytí auditu:** všech 6 doménových reportů → fáze 1–5; kritický schema-drift = Task 1.1; všechny 🟠 = Fáze 1–2; 🟡 = Fáze 1+4; ⚪ = Fáze 4. ✅
- **Žádné placeholdery:** každý task má konkrétní soubory + kód/SQL/příkaz nebo explicitní „přečíst X, pak Y". Položky vyžadující čtení živé DB / souboru to mají jako první krok (ne hádání). ✅
- **Konzistence názvů:** `ActionState<T>`, `SITE_URL`, `formatCzechDate`/`formatCzk`/`formatTime`/`roleLabel`, `verifyCronAuth`/`safeEqual` použité konzistentně napříč tasky. ✅

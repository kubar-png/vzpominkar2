# Vzpomínkář

Webová aplikace pro zaznamenávání rodinných vzpomínek seniorů a jejich tisk do knihy.

> **Status:** MVP prototyp v aktivním vývoji. Neprodukční.

## Tech stack

- **Next.js 15** (App Router, Server Actions, Turbopack) + TypeScript + React 19
- **Supabase** — Postgres, Auth, Storage, RLS (cloud, region eu-central-1)
- **Tailwind CSS v4** s vlastním tokenovým systémem (`app/globals.css`)
- **Stripe** SDK (test mode; v MVP cesta s 0 CZK přeskakuje Stripe úplně)
- **Resend** + react-email šablony (Czech HTML)
- **Vitest** (unit) + **Playwright** (e2e smoke)
- **Vercel** (hosting + Cron)

## Quick start

Vyžaduje **Node 20+** a **pnpm 10+**.

```bash
# 1. Závislosti
pnpm install

# 2. Env soubor — Supabase URL + publishable klíč už jsou předvyplněné v M1
cp .env.example .env.local
#   Doplnit:
#   - SUPABASE_SERVICE_ROLE_KEY (z Supabase dashboard → Settings → API → Secret keys)
#   - STRIPE_*               (volitelné, pokud chcete testovat platby > 0 CZK)
#   - RESEND_API_KEY         (volitelné — bez něho běží NoopProvider)
#   - CRON_SECRET            (libovolný náhodný řetězec)

# 3. Dev server
pnpm dev    # http://localhost:3000

# 4. Spustit testy
pnpm test            # Vitest unit
pnpm test:e2e        # Playwright (vyžaduje běžící dev server nebo PLAYWRIGHT_BASE_URL)
```

## Skripty

| Skript | Co dělá |
|---|---|
| `pnpm dev` | Vývojový server (Turbopack) |
| `pnpm build` | Produkční build |
| `pnpm start` | Spustí produkční build lokálně |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` / `format:check` | Prettier |
| `pnpm test` | Vitest unit testy |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:e2e` | Playwright |
| `pnpm test:e2e:install` | Stáhne Playwright prohlížeče |
| `pnpm db:types` | Vygeneruje `types/database.ts` přes `supabase gen types` |

## Architektura

### Adresářová struktura

```
app/
├── (auth)/                 # /login, /signup, /senior-login + check-email
├── (app)/                  # owner-only po přihlášení (requireOwner v layoutu)
│   ├── dashboard/
│   ├── family/[familyId]/
│   │   ├── memories/
│   │   ├── prompts/
│   │   ├── senior/
│   │   └── book/
│   └── settings/
├── (senior)/               # senior-only (data-surface="senior" + bigger primitives)
│   ├── home/
│   ├── new-memory/{text,audio,photo}/
│   └── my-memories/
├── onboarding/             # owner se sem dostane když nemá family_id
│   └── credentials/
├── api/
│   ├── webhooks/stripe/
│   └── cron/weekly-reminder/
├── auth/callback/          # Supabase email confirmation handler
├── cenik/, faq/            # marketing
├── dev/components/         # design system gallery (NODE_ENV !== production)
├── globals.css             # všechny tokens (Tailwind v4 @theme)
├── layout.tsx              # OG, fonts (Inter + Fraunces)
├── page.tsx                # landing
├── sitemap.ts, robots.ts
components/
├── ui/                     # owner / marketing primitives (Button, Card, Input, Badge)
├── senior/                 # větší + klidnější varianty pro senior surface
└── shared/                 # cross-surface (Logo)
lib/
├── supabase/               # client / server / admin
├── auth/                   # actions, permissions, senior-auth, profile-actions
├── memories/, prompts/, book/, family/, onboarding/, stripe/, email/
└── validations/            # Zod schémata
emails/                     # (zatím prázdné — šablony jsou v lib/email/templates.ts)
supabase/
├── migrations/             # SQL zrcadlo cloudového projektu (informativní)
└── seed.sql                # 34 systémových promptů
tests/
├── unit/                   # Vitest
└── e2e/                    # Playwright
types/database.ts           # generované Supabase typy
docs/UI_GUIDE.md            # design tokens, kdy použít co
```

### Dva uživatelé, dva povrchy

- **Owner** (rodič / dítě seniora) — login emailem, Supabase Auth, plný CRUD nad rodinou.
- **Senior** — login uživatelským jménem + heslem. Nemá email; interně používáme `senior-{uuid}@vzpominkar.internal` jako synthetic email pro `signInWithPassword`.
- Middleware refreshuje Supabase session, blokuje cross-surface přístup, přesměrovává podle role.
- Page-level guardy (`requireOwner`, `requireSenior`, `requireOwnerOfFamily`) v `lib/auth/permissions.ts`.

### Design system

Plně dokumentovaný v [`docs/UI_GUIDE.md`](./docs/UI_GUIDE.md). Brand barvy (navy `#0e3b64`, red `#d00000`) jsou extrahovány přímo z loga sample-pixelováním. Senior povrch používá větší primitivy z `components/senior/` — **nikdy** neimportuj z `components/ui/` v `(senior)/` rotách.

## Supabase

Projekt používá **hostovaný Supabase** v EU-central-1.

- 8 tabulek se zapnutou RLS, pomocné funkce v privátním schématu `private.*` (mimo PostgREST).
- Storage buckety: `memory-audio` (privátní), `memory-attachments` (privátní), `avatars` (veřejné čtení přes přímou URL bez listování).
- 34 systémových promptů v 8 kategoriích (česky), seed v `supabase/seed.sql`.

V `.env.local` musí být vyplněno:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    # nezbytné pro admin operace (vytvoření seniora apod.)
```

## Platební model (Stripe)

V MVP je `PRICE_YEARLY_ACCESS_CZK=0` a `PRICE_BOOK_PRINT_CZK=0`. Při ceně 0 `createCheckout` Stripe **vůbec nevolá** — provede přímou změnu v DB (subscription_status='active' nebo book_orders.status='paid').

Pokud nastavíte cenu > 0:

1. Vyplnit `STRIPE_SECRET_KEY` (test mode), `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. V dev používat `stripe listen --forward-to localhost:3000/api/webhooks/stripe` a webhook secret z `stripe listen` výstupu.
3. Webhook ověřuje signaturu, je idempotentní podle `stripe_payment_intent_id`.

## Email (Resend)

Šablony v `lib/email/templates.ts` (Czech, inline-styled HTML, mobile-first).

- Welcome email se posílá z `signUpOwner` Server Action.
- Týdenní připomínka pro seniora — Vercel Cron na pondělí 09:00 UTC (`vercel.json`).
- Pokud `RESEND_API_KEY` není vyplněno, používá se NoopProvider — sendy se zalogují do konzole bez odeslání.

## Vercel deploy

Projekt je propojený s Vercel teamem `kubar-6446s-projects/vzpominkar-project`.

```bash
vercel        # preview deployment
vercel --prod # produkční (jen po revizi)
```

Vercel Cron běží automaticky na pondělí 09:00 UTC (≈ 10:00 v Praze v zimě, 11:00 v létě).

V Vercel dashboardu nastavte stejné environment variables jako v `.env.local` (kromě `NEXT_PUBLIC_APP_URL` — ten by měl být produkční URL).

## Testing

### Unit (Vitest)

```bash
pnpm test
```

Pokrývá:
- `senior-auth` — username validace, synth email mapping
- `stripe-pricing` — `priceForProductCzk` env-driven logika

### E2E (Playwright)

```bash
pnpm test:e2e:install   # jednou
pnpm dev                # v jednom terminálu
pnpm test:e2e           # v druhém terminálu
```

Smoke testy běží na public surfaces (landing / cenik / faq / login / senior-login). Plný authed flow je `test.skip` — vyžaduje:

1. Vypnout email confirmation v Supabase (Dashboard → Auth → Providers → Email → uncheck "Confirm email") **nebo**
2. Implementovat programatické potvrzení přes admin API před voláním signup formu.

## Bezpečnost

Checklist pro každou změnu:

- [ ] Service role key je jen v `lib/supabase/admin.ts` (server-only marker).
- [ ] Stripe webhook ověřuje podpis.
- [ ] Cron endpointy chráněné `Authorization: Bearer ${CRON_SECRET}`.
- [ ] Hesla a synth emaily se nikam nelogují.
- [ ] Storage signed URLs mají krátkou expiraci (15 min).
- [ ] Validace inputu na serveru přes Zod.
- [ ] RLS politiky v Supabase advisorech čisté.

## Open questions / další milníky

- Whisper transkripce audio (`memories.text_content` z audio nahrávek)
- Náhled rozložení knihy (HTML preview)
- Sdílení vzpomínek read-only odkazem
- Více seniorů na rodinu (zatím 1:1 v MVP)
- Lokalizace (zatím jen Čeština)

Plán: viz [`implementation_plan.md`](./implementation_plan.md). Checklist: [`task.md`](./task.md).

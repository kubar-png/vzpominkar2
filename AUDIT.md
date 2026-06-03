# Audit & refactoring — Vzpomínkář (2026-06)

Kompletní audit kódu (6 paralelních doménových analýz + build/lint/typecheck) proveden **2026-06-03**. Tento dokument je krátký přehled + tracking; **detailní plán** je v [`docs/superpowers/plans/2026-06-03-refactor-optimalizace.md`](docs/superpowers/plans/2026-06-03-refactor-optimalizace.md).

## Verdikt

Kód je na pre-launch produkt v **nadprůměrném stavu**: `typecheck`/`lint`/`build` čisté, **0 `any`**, zapnutý `strict` + `noUncheckedIndexedAccess`, ukázkové RSC/client rozdělení, kompletní RLS, disciplinované použití service-role klienta (**žádné IDOR**), dobrý caching/streaming/code-splitting, shared First-Load JS jen 103 kB. Refactoring = **vyladit, zabezpečit launch, odstranit duplicity** — ne přepisovat.

## Postup

Vše na branchi `refactor/audit-2026-06`. Každá fáze = samostatný commit + Vercel **preview** k review. **Merge do `main` až po výslovném schválení.**

| Fáze | Obsah | Stav |
|---|---|---|
| 0 | Branch, baseline, tento dokument + plán | ✅ hotovo |
| 1 | Launch-blockery + bezpečnost | ✅ hotovo (preview) |
| 2 | Datová integrita (index, unique constraint, idempotence webhooku) | ⏳ čeká |
| 3 | Testy + CI | ⏳ čeká |
| 4 | Výkon + úklid | ⏳ čeká |
| 5 | Hloubkový DX (volitelné, po launchi) | ⏳ čeká |

## Fáze 1 — co se změnilo

- 🔴 **Migrace 3 sloupců** `profiles.{prompt_frequency,contact_channel,contact_address}` (`supabase/migrations/20260603120000_*`) — dosud chyběly v migracích (jen v živé DB) → čisté prostředí padalo.
- **`lib/site.ts`** — jeden zdroj `SITE_URL`/`SITE_HOST`; sjednoceno 10 míst (metadataBase, JSON-LD, sitemap, robots, e-maily, cron, onboarding). Konec rozporu `vercel.app` × `vzpominkar.cz`.
- **HSTS** header (`next.config.ts`).
- **Pojistka `seed-test-account.ts`** — odmítne běžet proti ne-lokální DB (nemůže smazat prod).
- **Senior login: per-username throttle** (`lib/rate-limit.ts`) + **silné výchozí heslo** seniora přes crypto generátor (konec `Math.random()`).
- **`.env.example` sync** — doplněny `OPENAI_API_KEY`, `KV_REST_API_*`, `PRICE_BOOK_BASE/ADDON_CZK`; odstraněny mrtvé.
- `PRE-LAUNCH.md` aktualizován (URL centralizace, KV launch-gate).

Gate: typecheck ✅ · lint ✅ · build ✅ · test ✅ 22/22.

## Odloženo / poznámky

- `lib/stripe/checkout.ts:13` (origin pro Stripe redirect, default `localhost:3000`) — centralizace do `SITE_URL` až ve Fázi 2 (platební cesta), ať se nemění fallback v launch-blocker fázi.
- 7 pre-existing lint **warnings** (nepoužité `cn`/`Link`/`FOOTER_BG`, FlipBook výraz, unused eslint-disable) → úklid ve Fázi 4.

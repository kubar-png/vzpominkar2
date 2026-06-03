# Status — tykání + rod příjemce (2026-06-03)

Branch `feat/kniha-vzpominek` @ `94e3be7`. Build + typecheck zelené. **Nemergnuto na main** (viz blocker).

## ✅ Hotovo a funkční

### Kniha vzpomínek (B5 šablona, `components/book-pdf/`)
- 11pt **Georgia** body, nadpisy **PP Pangaia**, nadpisy navy / text černý, **bez pozadí** (tisk na barevný papír).
- Dlouhé příběhy se zalamují přes víc B5 stránek; zápatí: číslo stránky + QR.
- Ručně psaná verze: vyšší (12 mm) ztmavené řádky, první linka odsazená o řádek.
- Všechny otázky **tykací** + gender tokeny; preview přepínač **Žena / Muž / Neuvedeno** (`/dev/book-preview`).

### Tykání + rod napříč aplikací
- **Engine** `lib/gender.ts`: text kóduje obě varianty tokenem `{mužský|ženský}`, `resolveGender()` → muž / žena / „/a" fallback. `genderFromSeniorRole()` předvyplní rod z role.
- **`profiles.gender`** sloupec (migrace `20260603150000`) + backfill z `senior_role`. Sběr ve formuláři **přidání seniora** i **editace karty** (předvyplní se z role, editovatelné).
- **Senior** vidí otázky ve svém rodě: domů, moje vzpomínky, nahrát/napsat/přidat fotku.
- **Týdenní e-mail** s otázkou ogenderovaný podle seniora.
- **Owner UI** (knihovna otázek, naplánované, archiv + detail vzpomínek, dashboard karta, digitální náhled knihy) — tokeny vyřešené (rod autora / „/a").
- **Prompty v aplikaci** (`supabase/seed.sql` + data-migrace) převedené na tykání + tokeny.
- Pravidlo: **otázky seniorovi vždy tykají; firma/UI uživateli vyká** (beze změny).

## ⚠️ Blocker před deployem
Nový kód čte `profiles.gender` napříč appkou (přes `currentUser`), takže **migrace `supabase/migrations/20260603150000_profile_gender_and_tykani_prompts.sql` musí být v prod DB dřív, než se kód nasadí** — jinak se přihlášená aplikace rozbije (500).

Supabase MCP token **vypršel** → nemůžu migraci aplikovat ani inspektovat prod DB, a proto ani bezpečně mergnout na main.

**Možnosti:** A) re-auth Supabase → aplikuju migraci do prod + mergnu na main; B) aplikuješ migraci sám (`supabase db push` nebo SQL v dashboardu) → potvrdíš → mergnu.

## 🔜 Zbývá dodělat
- **Konfigurátor** (dárková kniha): volba „Pro koho? žena / muž", uložení k objednávce; teď ukazuje „/a". Napojí se na Phase 2.
- **E-mail „přidal(a) novou vzpomínku"** — ponecháno jako „(a)" (drobnost; není to otázka seniorovi).
- **Phase 2**: objednávkový flow knihy (guest checkout, Stripe, webhook, `shop_orders`) — nezačato.
- **Phase 4**: render celé knihy do jednoho PDF přes headless Chromium (Puppeteer footerTemplate) + napojení na fulfilment — nezačato.
- **Deferred z auditu**: aplikovat refactor migrace Phase 1–2 do prod, ověřit KV v prod, refactor Phase 5 (DX).

## Návrh dalšího pořadí
1. Vyřešit blocker (migrace) → merge + deploy.
2. Phase 2 (objednávka knihy) — odemkne reálný prodej + dořeší konfigurátor gender volbu.
3. Phase 4 (PDF render) — z aplikace i ruční knihy.

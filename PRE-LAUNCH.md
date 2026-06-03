# PRE-LAUNCH — co dodělat před ostrým spuštěním

Živý seznam věcí, které **teď nejdou udělat** (typicky kvůli chybějící vlastní
doméně) nebo se mají udělat až těsně před spuštěním. Před launchem tímto
souborem projdeme a všechno odškrtneme. Nové blokované položky sem přibývají
průběžně.

> Stav projektu: web běží na **`vzpominkar2.vercel.app`** (Vercel), **vlastní
> doménu zatím nemáme**. Supabase projekt: `wgqpumxgvaamvpaguvdf`.

---

## 🚫 Blokováno chybějící doménou

### 1. Koupit a nasměrovat vlastní doménu
- [ ] Zaregistrovat doménu (zvažovaná: `vzpominkar.cz`).
- [ ] Nasměrovat na Vercel (A/CNAME záznamy), přidat doménu ve Vercel → projekt → Settings → Domains.
- **Tohle je kořenový blokátor** — odemkne body 2–4 níže.

### 2. Resend custom SMTP v Supabase (e-maily reálným uživatelům)
> Bez tohohle posílá maily vestavěné Supabase SMTP = **limit pár e-mailů/hodinu,
> často jen na členy projektu**. Reset hesla i ověřovací e-mail by reálným lidem
> nedorazily. Na testování s vlastním e-mailem to zatím stačí.
- [ ] V **Resendu → Domains → Add Domain** přidat vlastní doménu, vyplnit vypsané DNS záznamy (SPF/DKIM) u registrátora, počkat na ověření.
- [ ] V Supabase → **Authentication → Emails → SMTP Settings** → *Enable Custom SMTP*:
  - Host: `smtp.resend.com` · Port: `465` · Username: `resend`
  - Password: **Resend API key** (`RESEND_API_KEY` už v projektu je)
  - Sender: `noreply@<vlastní-doména>`
- Souvisí s: reset hesla (už nasazeno) + ověření e-mailu (feature „A").

### 3. Přepnout produkční URL z `vercel.app` na vlastní doménu
- [ ] **Vercel env** `NEXT_PUBLIC_APP_URL` → `https://<vlastní-doména>` (Settings → Environment Variables, Production).
- [ ] **Supabase → Authentication → URL Configuration** → Site URL + Redirect URLs (`/auth/callback`) na novou doménu.
- [ ] **Vercel env** `EMAIL_FROM` → adresa na nové doméně.
- [x] ~~Natvrdo zadané odkazy v kódu~~ — **vyřešeno (refactor 2026-06):** všechny URL teď čtou jeden zdroj `lib/site.ts` (`SITE_URL` / `SITE_HOST`), který bere `NEXT_PUBLIC_APP_URL`. Přepnutí domény = jen nastavit env, žádné hledání v kódu. (Kontaktní e-mail `ahoj@vzpominkar.cz` zatím centralizovaný není — samostatná drobnost.)

### 4. Napojit Stripe (platby naostro)
> Odloženo, dokud nemáme doménu. Teď je „free path" (cena 0) → kniha se aktivuje
> okamžitě bez platby.
- [ ] Live klíče Stripe do Vercel env.
- [ ] Webhook endpoint na produkční doméně + ověření podpisu.
- [ ] Ověřit ceny: base 2000 Kč, add-on 1790 Kč, tisk dle nastavení.
- [ ] Embedded checkout (`ui_mode: 'embedded'`) ve vlastním UI místo přesměrování.

---

## ⚙️ Hardening / dashboard (nejde přes MCP, jen ručně)

### 5. Supabase — Leaked password protection
- [ ] Authentication → **zapnout ochranu prolomených hesel** (advisor L3). Nešlo přes MCP, jen v dashboardu.

### 6. Supabase — české šablony e-mailů (kosmetika)
- [ ] Authentication → Emails → Templates: přepsat **Magic Link** (použijeme jako „Ověřte svůj e-mail"), Confirm signup, Reset password do češtiny.

### 7. Ověřovací odkaz spolehlivě i z mobilu (cross-device)
> Teď ověřovací / reset odkaz míří na `/auth/callback` a vyměňuje PKCE `code`.
> To spolehlivě funguje jen ve **stejném prohlížeči**, kde flow začal (PKCE
> `code_verifier` je v cookie). Když uživatel otevře e-mail na **jiném zařízení**
> (typicky registrace na PC, klik z mobilu), výměna selže.
- [ ] Přepnout ověřovací e-mail na **token_hash flow**: šablona „Magic Link" →
  odkaz na `/auth/confirm?token_hash={{ .TokenHash }}&type=email` a přidat route
  `app/auth/confirm/route.ts`, která volá `verifyOtp({ token_hash, type })`
  (nepotřebuje cookie → funguje cross-device). Pak nastaví `email_verified=true`.
- Pozn.: pro testování ve stejném prohlížeči to teď funguje i bez téhle úpravy.

---

### 7b. Ověřit Upstash/KV v produkci (auth rate-limit) ⚠️
- [ ] Zkontroluj, že `KV_REST_API_URL` + `KV_REST_API_TOKEN` jsou ve Vercel **Production** env. Bez nich je auth rate-limiting (login/signup/reset/senior-login) **vypnutý** (fail-open) — `lib/rate-limit.ts` to jen zaloguje. Senior-login má teď i per-username strop (refactor 2026-06), který taky potřebuje KV.

## 📈 Konverze (až po spuštění / až bude obsah)

### 8. Reálná fotka knihy na paywallu
- [ ] Na `/onboarding/platba` je teď **CSS mockup** kožené knihy (komponenta `BookCover`). Až bude fotka skutečné tištěné knihy, vyměnit za `next/image` (WebP, `priority`/lazy dle pozice).

### 9. Záchrana opuštěného onboardingu
> Když owner zaplatí účet, projde krok 1, ale nedojde k platbě, nemáme follow-up.
- [ ] Po SMTP (bod 2): naplánovaný **e-mail „dokončete nastavení"** ~pár hodin po opuštění (rodina ve stavu `trial` bez platby). Pozor na frekvenci/odhlášení.

## 🚀 Škálování (uděláš v dashboardech / až poroste provoz)

> Z auditu na 10 000 rodin. Kód-část (index, batch cronu, přepis mimo request,
> backfill cron, menší nahrávky, limity) je **hotová a nasazená**. Tyhle zbývají
> na tebe v dashboardech, nebo až bude doména/objem.

### 10. OpenAI — tvrdý měsíční budget cap + alert  ⚠️ důležité
- [ ] V **OpenAI dashboardu** nastav **monthly budget limit** + e-mail alert. Limity v kódu (`lib/rate-limit.ts`) jsou **fail-open** (při výpadku Redis se neuplatní) → dashboardový cap je jediná skutečná pojistka proti runaway účtu.

### 11. Alerty (Vercel + Supabase)
- [ ] Vercel: alert na **error rate** funkcí.
- [ ] Supabase: alert na **velikost storage** (audio kumuluje navždy — jediný náklad, co pomalu roste) a na DB velikost.
- [ ] (Volitelně) denní přehled OpenAI spend.

### 12. Resend batch send v týdenním cronu (až bude doména + objem)
- [ ] Cron `weekly-reminder` už má zbatchované DB dotazy + `maxDuration=300`. Při skutečně velkém objemu (tisíce e-mailů/běh) přepnout odesílání na **Resend batch API** (`/emails/batch`, 100/volání) místo sekvenčního `sendEmail` — jinak ~10 e-mailů/s limit prodlužuje běh. Párovat s bodem 2 (custom SMTP/doména).

## 📕 Fyzická kniha (Kniha vzpomínek) — před prodejem knihy

### 13. Render celé knihy do jednoho tiskového PDF (Phase 4)
- [ ] Z HTML šablony (`components/book-pdf/BookDocument.tsx`, B5) vyrenderovat celou knihu do **jednoho PDF** přes headless Chromium (Puppeteer) — opakující se patička + skutečné číslování (`footerTemplate`) + QR kódy. Napojit na fulfilment po platbě. Použít pro ruční i z aplikace generovanou knihu.

### 14. Konfigurátor dárkové knihy — dokončení
- [ ] Volba **„Pro koho? (žena / muž)"** v konfigurátoru (`/kniha/sestavit`) → uloží se k objednávce a prožene otázky správným rodem (teď ukazuje „/a").
- [ ] Napojit konfigurátor na reálný objednávkový flow (guest checkout + Stripe + `shop_orders`) — viz Phase 2.

### 15. QR u vzpomínek → veřejné přehrání nahrávky — ⚠️ POVINNÉ při přechodu na doménu
Návrh odsouhlasen (2026-06-03): privátní bucket + **signed URL on-demand** · sdílení **trvalé** (token navždy, žádný vypínač) · trvanlivost = závazek služby + **nepřímost** (QR → náš `/v/{token}` → aktuální úložiště, takže úložiště lze migrovat bez přetisku QR). Veřejná stránka `/v/{token}` + tokeny se staví teď na `vercel.app`; audio se podepisuje on-demand (bucket `memory-audio` zůstává privátní).
- [ ] **Při spuštění na `vzpominkar.cz`:** ověřit, že `NEXT_PUBLIC_APP_URL` = `https://vzpominkar.cz` **DŘÍV, než se vygeneruje/vytiskne jakýkoliv QR** — QR berou doménu ze `SITE_URL`, takže na špatné doméně odkazují do prázdna. Tokeny jsou na doméně nezávislé (stabilní), mění se jen prefix URL. **Netisknout žádnou knihu s QR před finální doménou.**

## ✅ Hotovo (kontext)
- Supabase „Confirm email" (zeď před onboardingem) **vypnuto** — vlastník se po registraci přihlásí hned. *(uděláno 2026-06-01)*
